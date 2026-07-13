import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { platforms, forceRefresh } = body; // Array of selected platforms, and bypass cache flag

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: "Please select at least one platform" }, { status: 400 });
    }

    // 1. Check database for jobs fetched within the last 6 hours
    const { data: existingJobs, error: fetchError } = await (supabase
      .from("jobs" as any)
      .select("*")
      .eq("user_id", user.id) as any);

    if (fetchError) {
      console.error("Error checking existing jobs:", fetchError);
    }

    // Filter jobs that match the currently selected platforms
    const platformFilteredJobs = existingJobs?.filter((job: any) => platforms.includes(job.platform)) || [];

    // Check if we have cached results that are less than 6 hours old (only if not forcing refresh)
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    const isCacheValid = !forceRefresh && platformFilteredJobs.length > 0 && platformFilteredJobs.every((job: any) => {
      const fetchedTime = new Date(job.fetched_at).getTime();
      return (Date.now() - fetchedTime) < SIX_HOURS_MS;
    });

    if (isCacheValid) {
      console.log("Returning cached jobs from database...");
      return NextResponse.json({ jobs: platformFilteredJobs, cached: true });
    }

    // 2. Cache is invalid or empty. Fetch fresh jobs using Serper.dev Search API
    const serperApiKey = process.env.SERPER_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Get user profile details to build search query
    const { data: profileRaw, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const profile = profileRaw as any;

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile information not found. Please upload a resume first." }, { status: 400 });
    }

    // Heuristics to build search terms
    const role = profile.current_job_title || (profile.work_experience?.[0]?.jobTitle) || "Developer";
    const location = profile.location || "Remote";
    const primarySkills = (profile.skills || []).slice(0, 3).join(" ");
    const searchTerms = `${primarySkills} ${role} ${location}`.trim();

    // If Serper API Key is missing, return mock jobs so the user can test the app
    if (!serperApiKey) {
      console.warn("SERPER_API_KEY is missing. Generating high-quality mock matches based on profile...");
      const mockJobs = generateMockJobs(user.id, platforms, searchTerms, profile);
      
      // Keep saved or applied jobs, delete other old jobs
      await supabase
        .from("jobs" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("saved_status", false)
        .eq("applied_status", "not_applied")
        .in("platform", platforms);

      const { data: insertedJobs, error: insertError } = await supabase
        .from("jobs" as any)
        .insert(mockJobs as any)
        .select();

      if (insertError) {
        console.error("Error inserting mock jobs:", insertError);
      }

      // Fetch all user jobs to return combined state (including saved ones)
      const { data: finalJobs } = await (supabase
        .from("jobs" as any)
        .select("*")
        .eq("user_id", user.id)
        .in("platform", platforms) as any);

      return NextResponse.json({ 
        jobs: finalJobs || [], 
        warning: "Serper.dev Search API key is missing. Displaying simulated matches based on your profile.",
        cached: false 
      });
    }

    // Fetch from Serper Search API for each platform
    const rawResults: any[] = [];
    
    for (const platform of platforms) {
      let siteDomain = "";
      if (platform === "greenhouse") siteDomain = "greenhouse.io/jobs";
      else if (platform === "lever") siteDomain = "lever.co";
      else if (platform === "workable") siteDomain = "workable.com/jobs";
      else if (platform === "wellfound") siteDomain = "wellfound.com/jobs";

      const query = `site:${siteDomain} ${searchTerms}`;
      console.log(`Serper Search query for ${platform}: "${query}"`);

      try {
        const serperResponse = await fetch(
          "https://google.serper.dev/search",
          {
            method: "POST",
            headers: {
              "X-API-KEY": serperApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ q: query }),
          }
        );

        if (!serperResponse.ok) {
          console.error(`Serper API responded with ${serperResponse.status} for ${platform}`);
          continue;
        }

        const data = await serperResponse.json();
        const results = data.organic || [];
        
        results.forEach((item: any) => {
          rawResults.push({
            platform,
            title: item.title,
            url: item.link,
            description: item.snippet || "",
          });
        });
      } catch (err) {
        console.error(`Error calling Serper API for ${platform}:`, err);
      }
    }

    if (rawResults.length === 0) {
      return NextResponse.json({ jobs: [], message: "No search results returned from Serper Search." });
    }

    // 3. Use Gemini API to clean, normalize, and score raw results
    let normalizedJobs: any[] = [];

    if (geminiApiKey) {
      try {
        console.log("Using Google Gemini to normalize search results...");
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-flash-latest",
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const prompt = `
You are an expert ATS parser and job matcher.
We ran web searches on job boards for a candidate.
Candidate Profile:
- Name: ${profile.full_name || "N/A"}
- Skills: ${(profile.skills || []).join(", ")}
- Location: ${profile.location || "Remote"}
- Summary: ${profile.summary || "N/A"}
- Work Experience: ${JSON.stringify(profile.work_experience || [])}

Here are raw search result snippets from job sites:
${JSON.stringify(rawResults)}

Normalize these snippets into a JSON array of structured job listings matching the schema below.
Only keep actual job postings (filter out general company pages or blog posts).
Assign a "match_score" (an integer from 0 to 100) representing how well the candidate's skills and experience match the job requirements.

Schema:
[
  {
    "platform": "greenhouse" | "lever" | "workable" | "wellfound",
    "title": "Clean Job Title",
    "company": "Company Name",
    "location": "e.g., Remote or San Francisco, CA",
    "salary": "e.g. $120k - $150k or null if not found",
    "job_type": "e.g. Full-time, Contract, or Remote",
    "experience_level": "e.g. Senior, Mid, Junior, or Entry",
    "description": "Brief summary of the description snippet (1-2 sentences)",
    "tags": ["React", "TypeScript", ...],
    "match_score": 85,
    "job_url": "original url from search result"
  }
]

Return ONLY the JSON array.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        if (text) {
          const cleanText = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed)) {
            normalizedJobs = parsed.map(job => ({
              user_id: user.id,
              platform: job.platform || "greenhouse",
              title: job.title || "Software Engineer",
              company: job.company || "Company",
              company_logo: `https://logo.clearbit.com/${(job.company || "").toLowerCase().replace(/\s+/g, "")}.com`,
              location: job.location || "Remote",
              salary: job.salary || "Not specified",
              job_type: job.job_type || "Full-time",
              experience_level: job.experience_level || "Mid-level",
              description: job.description || "",
              tags: Array.isArray(job.tags) ? job.tags : [],
              match_score: job.match_score || 70,
              job_url: job.job_url,
              source_url: job.job_url,
              applied_status: "not_applied",
              saved_status: false,
              fetched_at: new Date().toISOString(),
            }));
          }
        }
      } catch (err) {
        console.error("Error normalizing with Gemini:", err);
      }
    }

    // Fallback normalization if Gemini fails
    if (normalizedJobs.length === 0) {
      console.log("Using fallback normalization for search results...");
      normalizedJobs = rawResults.map(res => {
        const titleWords = res.title.split(" - ");
        const title = titleWords[0] || "Software Engineer";
        const company = titleWords[1]?.split(" at ")[0] || "Featured Company";
        
        return {
          user_id: user.id,
          platform: res.platform,
          title,
          company,
          company_logo: `https://logo.clearbit.com/${company.toLowerCase().replace(/\s+/g, "")}.com`,
          location: "Remote",
          salary: "Not specified",
          job_type: "Full-time",
          experience_level: "Mid-level",
          description: res.description,
          tags: ["React", "JavaScript", "Frontend"],
          match_score: 75,
          job_url: res.url,
          source_url: res.url,
          applied_status: "not_applied",
          saved_status: false,
          fetched_at: new Date().toISOString(),
        };
      });
    }

    // 4. Save to Database: Keep saved or applied jobs, delete other old jobs matching selected platforms
    await supabase
      .from("jobs" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("saved_status", false)
      .eq("applied_status", "not_applied")
      .in("platform", platforms);

    if (normalizedJobs.length > 0) {
      const { error: insertError } = await supabase
        .from("jobs" as any)
        .insert(normalizedJobs);

      if (insertError) {
        console.error("Error saving fetched jobs:", insertError);
      }
    }

    // 5. Fetch and return all platform jobs (including previously saved ones)
    const { data: finalJobs } = await (supabase
      .from("jobs" as any)
      .select("*")
      .eq("user_id", user.id)
      .in("platform", platforms)
      .order("match_score", { ascending: false }) as any);

    return NextResponse.json({ jobs: finalJobs || [], cached: false });
  } catch (error) {
    console.error("Fetch jobs endpoint error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Function to generate high-quality mock matches based on profile details
function generateMockJobs(userId: string, platforms: string[], searchTerms: string, profile: any) {
  const roles = [
    profile.current_job_title || "Full Stack Developer",
    "Senior React Engineer",
    "Frontend Developer",
    "Software Engineer",
  ];
  const companies = ["Vercel", "Supabase", "Stripe", "Clerk", "Linear", "Airbnb"];
  const locations = [profile.location || "Remote", "San Francisco, CA", "New York, NY", "Remote (US/Canada)"];
  const jobTypes = ["Full-time", "Contract", "Part-time"];
  const levels = ["Senior", "Mid-level", "Junior"];
  const salaries = ["$130k - $160k", "$150k - $180k", "$90k - $125k", "$140k - $170k"];

  const jobs: any[] = [];
  const numJobs = Math.max(platforms.length * 2, 6);

  for (let i = 0; i < numJobs; i++) {
    const platform = platforms[i % platforms.length];
    const company = companies[i % companies.length];
    const title = roles[i % roles.length];
    const loc = locations[i % locations.length];
    const salary = salaries[i % salaries.length];
    
    // Compute a pseudo-random matching score between 75 and 98
    const match_score = Math.floor(Math.random() * (98 - 75 + 1)) + 75;

    // Use clean logo URL based on company name
    const company_logo = `https://logo.clearbit.com/${company.toLowerCase()}.com`;

    jobs.push({
      user_id: userId,
      platform,
      title,
      company,
      company_logo,
      location: loc,
      salary,
      job_type: jobTypes[i % jobTypes.length],
      experience_level: levels[i % levels.length],
      description: `We are looking for a skilled ${title} to join our engineering team. You will design, build, and maintain features using ${profile.skills?.[0] || "React"} and ${profile.skills?.[1] || "TypeScript"}, working closely with product stakeholders.`,
      tags: (profile.skills || []).slice(0, 3),
      match_score,
      job_url: `https://boards.${platform}.io/${company.toLowerCase()}/jobs/${Math.floor(Math.random() * 100000)}`,
      source_url: `https://${platform}.com`,
      applied_status: "not_applied",
      saved_status: false,
      fetched_at: new Date().toISOString(),
    });
  }

  return jobs;
}

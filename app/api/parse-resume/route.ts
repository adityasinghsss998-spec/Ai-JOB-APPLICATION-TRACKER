import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";

// We create a Promise wrapper for pdf2json to make it work with modern async/await
const extractTextFromPDF = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    // The true tells the parser we only want raw text, not structural data
    const pdfParser = new PDFParser(null, true); 
    
    pdfParser.on("pdfParser_dataError", (errData) => {
      const errMsg = errData instanceof Error 
        ? errData.message 
        : (errData && typeof errData === "object" && "parserError" in errData 
            ? String((errData as any).parserError) 
            : JSON.stringify(errData));
      reject(new Error(errMsg || "PDF parsing failed"));
    });
    
    pdfParser.on("pdfParser_dataReady", () => {
      const rawText = pdfParser.getRawTextContent();
      if (!rawText) {
        reject(new Error("No text content could be extracted from the PDF"));
      } else {
        resolve(rawText);
      }
    });
    
    pdfParser.parseBuffer(buffer);
  });
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File;

    if (!resumeFile) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    // 1. Upload and save the resume file to Supabase Storage
    const fileExtension = resumeFile.name.split(".").pop();
    const fileName = `${user.id}/${uuidv4()}.${fileExtension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, resumeFile, { upsert: false });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 });
    }

    const resumeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/${fileName}`;

    // 2. Parse the uploaded resume using pdf2json
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // We await our custom wrapper function here
    const resumeText = await extractTextFromPDF(buffer); 

    // 3. Extract important details from the resume
    const extractedData = await extractResumeDetails(resumeText);

    // 4. Save extracted details and resume URL in the database
    const { data: resumeDbData, error: resumeDbError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: resumeFile.name,
        file_path: fileName,
        file_url: resumeUrl,
        parsed_data: extractedData,
      })
      .select()
      .single();

    if (resumeDbError) {
      console.error("Supabase DB Insert Error:", resumeDbError);
      return NextResponse.json({ error: "Failed to save resume data" }, { status: 500 });
    }

    // 5. Automatically populate the Profile section form
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        full_name: extractedData.fullName,
        email: extractedData.email,
        phone: extractedData.phone,
        location: extractedData.location,
        summary: extractedData.summary,
        skills: extractedData.skills,
        current_company: extractedData.workExperience?.[0]?.company,
        current_job_title: extractedData.workExperience?.[0]?.jobTitle,
        projects: extractedData.projects,
      } as any)
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("Supabase Profile Update Error:", profileUpdateError);
    }

    return NextResponse.json({ message: "Resume uploaded and parsed successfully", data: resumeDbData });
  } catch (error: any) {
    console.error("Resume processing error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

interface ExtractedResumeData {
  [key: string]: any;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  workExperience?: Array<{
    company: string;
    jobTitle: string;
    duration?: string;
    responsibilities?: string[];
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    fieldOfStudy?: string;
    duration?: string;
  }>;
  projects?: Array<{
    title: string;
    description?: string;
    technologies?: string[];
  }>;
  certifications?: string[];
  links?: string[];
}

// Function to extract resume details using Gemini API (if available) or robust fallback heuristics
async function extractResumeDetails(resumeText: string): Promise<ExtractedResumeData> {
  let decodedText = "";
  try {
    decodedText = decodeURIComponent(resumeText);
  } catch (e) {
    decodedText = resumeText;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      console.log("Using Gemini API to parse resume...");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert ATS (Applicant Tracking System) parser. Analyze the following raw text extracted from a resume and extract the key information into a structured JSON format. 
                    
Return ONLY a valid JSON object matching the schema below. Do not wrap the response in markdown blocks (like \`\`\`json), do not include any explanatory text or prefix, just return the JSON object itself.

Schema:
{
  "fullName": "Full name of the candidate",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, State/Country",
  "summary": "Short professional summary",
  "skills": ["Skill 1", "Skill 2", ...],
  "workExperience": [
    {
      "company": "Company Name",
      "jobTitle": "Job Title",
      "duration": "e.g., June 2021 - Present or 2019-2021",
      "responsibilities": ["Responsibility 1", "Responsibility 2", ...]
    }
  ],
  "education": [
    {
      "school": "University/School Name",
      "degree": "e.g., B.S., M.S., Ph.D.",
      "fieldOfStudy": "e.g., Computer Science",
      "duration": "e.g., 2016 - 2020"
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Short description of the project",
      "technologies": ["React", "Node.js", ...]
    }
  ],
  "certifications": ["Certification name 1", ...],
  "links": ["Portfolio URL", "GitHub URL", "LinkedIn URL", ...]
}

Raw Resume Text:
${decodedText}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const responseData = await response.json();
      const rawJsonText = responseData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (rawJsonText) {
        const cleanJsonText = rawJsonText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(cleanJsonText);
        return {
          fullName: parsed.fullName || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          location: parsed.location || "",
          summary: parsed.summary || "",
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          workExperience: Array.isArray(parsed.workExperience) ? parsed.workExperience : [],
          education: Array.isArray(parsed.education) ? parsed.education : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
          links: Array.isArray(parsed.links) ? parsed.links : [],
        };
      }
    } catch (apiError) {
      console.error("Gemini API resume parsing error, falling back to heuristics:", apiError);
    }
  } else {
    console.log("GEMINI_API_KEY is not defined. Using fallback heuristic parser.");
  }

  // Fallback heuristic extraction
  return extractResumeDetailsFallback(decodedText);
}

// Fallback regex/heuristic-based extractor
function extractResumeDetailsFallback(text: string): ExtractedResumeData {
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i);
  const phoneMatch = text.match(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  
  // Extract Name (heuristics: look at the top lines for capitalized letter sequences)
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0);
  let fullName = "";
  if (lines.length > 0) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (
        !line.includes("@") &&
        !line.includes("http") &&
        !/^[0-9]/.test(line) &&
        line.split(/\s+/).length >= 2 &&
        line.split(/\s+/).length <= 4 &&
        /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/.test(line)
      ) {
        fullName = line;
        break;
      }
    }
  }
  
  if (!fullName && lines.length > 0) {
    fullName = lines[0]; // fallback to first line
  }

  // Extract skills by searching for common keywords
  const commonSkills = [
    "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular", "HTML", "CSS", "Tailwind",
    "Node.js", "Express", "Python", "Django", "Flask", "Java", "Spring", "C++", "C#", "Go", "Rust",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Supabase", "Firebase", "AWS", "Docker", "Git"
  ];
  const skills: string[] = [];
  commonSkills.forEach(skill => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // For skills with special characters (like C++, C#), don't use strict word boundaries \b
    // because \b only matches between a word character (\w) and a non-word character (\W).
    let regex;
    if (/[^a-zA-Z0-9]/.test(skill)) {
      regex = new RegExp(escapedSkill, "i");
    } else {
      regex = new RegExp(`\\b${escapedSkill}\\b`, "i");
    }
    
    if (regex.test(text)) {
      skills.push(skill);
    }
  });

  // Extract location (city, state/country regex)
  const locationMatch = text.match(/\b([A-Z][a-zA-Z\s.]+),\s([A-Z]{2}|[A-Z][a-zA-Z\s]+)\b/);
  const location = locationMatch ? locationMatch[0] : "";

  // Summary extraction
  let summary = "Highly motivated professional.";
  const summaryIndex = text.search(/summary|objective|profile/i);
  if (summaryIndex !== -1) {
    const textAfter = text.substring(summaryIndex).split(/[\r\n]+/).slice(1, 5).join(" ").trim();
    if (textAfter.length > 20) {
      summary = textAfter.substring(0, 300);
    }
  }

  // Work experience fallback guess
  const workExperience: Array<{ company: string; jobTitle: string; duration?: string; responsibilities?: string[] }> = [];
  
  // Try to find job title candidates
  const jobTitleRegex = /(?:Software Engineer|Developer|Manager|Analyst|Consultant|Designer|Intern|Specialist|Coordinator)/i;
  const matchJob = text.match(jobTitleRegex);
  if (matchJob) {
    workExperience.push({
      company: "Company from Resume",
      jobTitle: matchJob[0],
      duration: "Duration from Resume",
      responsibilities: ["Extracted from resume fallback parser."]
    });
  } else {
    workExperience.push({
      company: "Company",
      jobTitle: "Professional",
      duration: "",
      responsibilities: []
    });
  }

  return {
    fullName: fullName || "Extracted Candidate",
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    location: location,
    summary: summary,
    skills: skills.length > 0 ? skills : ["React", "JavaScript", "TypeScript"],
    workExperience,
    education: [],
    projects: [],
    certifications: [],
    links: []
  };
}
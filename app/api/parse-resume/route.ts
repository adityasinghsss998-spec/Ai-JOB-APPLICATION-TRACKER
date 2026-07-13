import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkExperience {
  company: string;
  jobTitle: string;
  duration?: string;
  responsibilities?: string[];
}

interface Education {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  duration?: string;
}

interface Project {
  title: string;
  description?: string;
  technologies?: string[];
}

interface ExtractedResumeData {
  [key: string]: unknown;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  certifications: string[];
  links: string[];
}

// ─── Main POST Handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File;

    if (!resumeFile) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    if (!resumeFile.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    // 1. Read file into buffer
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Upload to Supabase Storage
    const fileExtension = resumeFile.name.split(".").pop();
    const fileName = `${user.id}/${uuidv4()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, resumeFile, { upsert: false });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 });
    }

    const resumeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/${fileName}`;

    // 3. Parse resume using Gemini's native PDF multimodal understanding
    // No PDF parsing library needed — Gemini reads the PDF directly as binary
    const extractedData = await extractResumeWithGemini(buffer);

    // 4. Save the resume record
    const { data: resumeDbData, error: resumeDbError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: resumeFile.name,
        file_path: fileName,
        file_url: resumeUrl,
        parsed_data: extractedData as any,
      })
      .select()
      .single();

    if (resumeDbError) {
      console.error("Supabase DB Insert Error:", resumeDbError);
      return NextResponse.json({ error: "Failed to save resume data" }, { status: 500 });
    }

    // 5. Selectively update profile — only overwrite fields that were actually found
    const profilePatch: Record<string, unknown> = {};

    if (extractedData.fullName) profilePatch.full_name = extractedData.fullName;
    if (extractedData.email) profilePatch.email = extractedData.email;
    if (extractedData.phone) profilePatch.phone = extractedData.phone;
    if (extractedData.location) profilePatch.location = extractedData.location;
    if (extractedData.summary) profilePatch.summary = extractedData.summary;
    if (extractedData.skills?.length) profilePatch.skills = extractedData.skills;
    if (extractedData.workExperience?.length) {
      profilePatch.work_experience = extractedData.workExperience;
      profilePatch.current_company = extractedData.workExperience[0]?.company;
      profilePatch.current_job_title = extractedData.workExperience[0]?.jobTitle;
    }
    if (extractedData.projects?.length) profilePatch.projects = extractedData.projects;
    if (extractedData.education?.length) profilePatch.education = extractedData.education;
    if (extractedData.certifications?.length) profilePatch.certifications = extractedData.certifications;
    if (extractedData.links?.length) profilePatch.links = extractedData.links;

    if (Object.keys(profilePatch).length > 0) {
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update(profilePatch as any)
        .eq("id", user.id);

      if (profileUpdateError) {
        console.error("Profile update error (non-fatal):", profileUpdateError);
      }
    }

    const fieldsExtracted = Object.keys(profilePatch);
    console.log(`Resume parsed. Fields extracted: ${fieldsExtracted.join(", ")}`);

    return NextResponse.json({
      message: "Resume uploaded and parsed successfully",
      data: resumeDbData,
      fieldsExtracted,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Resume processing error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── Gemini Multimodal Resume Parser ─────────────────────────────────────────
// Sends the raw PDF bytes directly to Gemini — no PDF lib needed.
// Gemini reads the layout, headings, and formatting natively.
async function extractResumeWithGemini(pdfBuffer: Buffer): Promise<ExtractedResumeData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY not set — returning empty extracted data");
    return emptyData();
  }

  const prompt = `You are an expert resume parser. The attached file is a candidate's resume PDF.

Extract ALL information from this resume and return it as a single raw JSON object.

CRITICAL RULES:
- Return ONLY the JSON object — no markdown fences (\`\`\`), no explanation text, no prefix
- Extract ACTUAL values from the resume — do NOT invent, guess, or use placeholders
- If something is not present in the resume, use "" or []
- fullName: the person's name, usually at the very top in large text
- skills: list every technology, tool, framework, language, and methodology you see
- workExperience: all jobs listed, most recent first
- projects: ALL projects including personal, academic, and side projects
- links: any URLs (GitHub, LinkedIn, Portfolio, etc.)

Return this exact JSON shape:
{
  "fullName": "...",
  "email": "...",
  "phone": "...",
  "location": "City, Country",
  "summary": "Professional summary in 1-3 sentences",
  "skills": ["Skill1", "Skill2"],
  "workExperience": [
    {
      "company": "Company Name",
      "jobTitle": "Job Title",
      "duration": "Month Year – Month Year",
      "responsibilities": ["did X", "built Y"]
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "B.S. / M.Tech / etc.",
      "fieldOfStudy": "Computer Science",
      "duration": "2018 – 2022"
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "What it does in 1-2 sentences",
      "technologies": ["React", "Node.js"]
    }
  ],
  "certifications": ["AWS Certified Solutions Architect"],
  "links": ["https://github.com/...", "https://linkedin.com/in/..."]
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,      // low temperature = factual, deterministic
        maxOutputTokens: 4096,
      },
    });

    // Pass the PDF as raw base64 inline data — Gemini reads it natively
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBuffer.toString("base64"),
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    let rawText = response.text().trim();

    // Strip any accidental markdown code fences
    rawText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    console.log("Gemini response preview:", rawText.slice(0, 300));

    const parsed = JSON.parse(rawText);
    return sanitize(parsed);
  } catch (err) {
    console.error("Gemini resume parsing error:", err);
    // Return empty data so the resume is still saved even if AI parsing fails
    return emptyData();
  }
}

// ─── Sanitize + type-safe output ─────────────────────────────────────────────
function sanitize(parsed: Record<string, unknown>): ExtractedResumeData {
  return {
    fullName: str(parsed.fullName),
    email: str(parsed.email),
    phone: str(parsed.phone),
    location: str(parsed.location),
    summary: str(parsed.summary).slice(0, 600),
    skills: strArr(parsed.skills),
    workExperience: Array.isArray(parsed.workExperience)
      ? (parsed.workExperience as any[])
          .map((w) => ({
            company: str(w.company),
            jobTitle: str(w.jobTitle),
            duration: str(w.duration),
            responsibilities: strArr(w.responsibilities),
          }))
          .filter((w) => w.company || w.jobTitle)
      : [],
    education: Array.isArray(parsed.education)
      ? (parsed.education as any[])
          .map((e) => ({
            school: str(e.school),
            degree: str(e.degree),
            fieldOfStudy: str(e.fieldOfStudy),
            duration: str(e.duration),
          }))
          .filter((e) => e.school)
      : [],
    projects: Array.isArray(parsed.projects)
      ? (parsed.projects as any[])
          .map((p) => ({
            title: str(p.title),
            description: str(p.description),
            technologies: strArr(p.technologies),
          }))
          .filter((p) => p.title)
      : [],
    certifications: strArr(parsed.certifications),
    links: strArr(parsed.links).filter((l) => l.startsWith("http")),
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter(Boolean).map((x) => String(x).trim());
}

function emptyData(): ExtractedResumeData {
  return {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: [],
    workExperience: [],
    education: [],
    projects: [],
    certifications: [],
    links: [],
  };
}
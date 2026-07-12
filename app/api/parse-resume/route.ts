import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";

// We create a Promise wrapper for pdf2json to make it work with modern async/await
const extractTextFromPDF = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    // The true tells the parser we only want raw text, not structural data
    const pdfParser = new PDFParser(null, true); 
    
    pdfParser.on("pdfParser_dataError", (errData) => reject(errData instanceof Error ? errData : errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
      resolve(pdfParser.getRawTextContent());
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
    const extractedData = extractResumeDetails(resumeText);

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
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("Supabase Profile Update Error:", profileUpdateError);
    }

    return NextResponse.json({ message: "Resume uploaded and parsed successfully", data: resumeDbData });
  } catch (error) {
    console.error("Resume processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Dummy function to extract resume details
function extractResumeDetails(resumeText: string) {
  const emailMatch = resumeText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  const phoneMatch = resumeText.match(/\b(\d{3}[-.\s]?){2}\d{4}\b/);
  const nameMatch = resumeText.match(/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2}/);

  return {
    fullName: nameMatch ? nameMatch[0] : "",
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    location: "", 
    summary: "Highly motivated individual seeking new opportunities.", 
    skills: ["JavaScript", "React", "TypeScript", "Supabase"], 
    workExperience: [
      { company: "Example Corp", jobTitle: "Software Engineer", duration: "2020-Present", responsibilities: [] },
    ], 
    education: [],
    projects: [],
    certifications: [],
    links: [],
  };
}
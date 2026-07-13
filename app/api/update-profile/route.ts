import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      full_name,
      email,
      phone,
      location,
      summary,
      skills,
      current_company,
      current_job_title,
      projects,
      work_experience,
      education,
      certifications,
      links,
    } = body;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name,
        email,
        phone,
        location,
        summary,
        skills,
        current_company,
        current_job_title,
        projects,
        work_experience,
        education,
        certifications,
        links,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", user.id);

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: "Failed to update profile details" }, { status: 500 });
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile endpoint error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

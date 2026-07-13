import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { resumeId, filePath } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
    }

    // 1. Delete file from storage if filePath is provided
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from("resumes")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        // We continue with database record deletion even if storage fails or file was already deleted
      }
    }

    // 2. Delete the record from resumes table
    const { error: dbError } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId)
      .eq("user_id", user.id); // Ensure user owns the record

    if (dbError) {
      console.error("Database deletion error:", dbError);
      return NextResponse.json({ error: "Failed to delete database record" }, { status: 500 });
    }

    // 3. Clear profile fields associated with the resume
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: null,
        email: null,
        phone: null,
        location: null,
        summary: null,
        skills: null,
        current_company: null,
        current_job_title: null,
        projects: null,
      } as any)
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile clear error on resume deletion:", profileError);
    }

    return NextResponse.json({ message: "Resume deleted successfully" });
  } catch (error) {
    console.error("Delete resume endpoint error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

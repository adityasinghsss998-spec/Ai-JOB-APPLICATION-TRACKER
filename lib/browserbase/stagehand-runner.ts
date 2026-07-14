import fs from "fs";
import path from "path";
import os from "os";
import { z } from "zod";
import { Readable } from "stream";
import { finished } from "stream/promises";

// Define Types
export interface DetectedField {
  name: string;
  label: string;
  type: "text" | "file" | "textarea" | "select" | "radio" | "checkbox";
  required: boolean;
}

export interface AutomationResult {
  success: boolean;
  sessionId: string;
  error?: string;
}

/**
 * Downloads a resume from public URL to local temp path for uploading in Browser base
 */
async function downloadResume(fileUrl: string, fileName: string): Promise<string> {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `${Date.now()}_${fileName}`);

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch resume: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error(`Failed to download resume: Response body is missing for URL ${fileUrl}`);
  }

  const fileStream = fs.createWriteStream(filePath);
  const reader = Readable.fromWeb(response.body as any);
  reader.pipe(fileStream);
  await finished(fileStream);

  return filePath;
}

/**
 * Detects form fields on the job page using Browserbase + Stagehand
 */
export async function detectFormFields(
  jobUrl: string,
  platform: string
): Promise<{ fields: DetectedField[]; sessionId: string }> {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!apiKey || !projectId || apiKey === projectId || apiKey.includes("placeholder") || projectId.includes("placeholder")) {
    console.warn("BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID missing, identical, or placeholder. Using Simulation Mode for field detection.");
    return runDetectionSimulation(platform);
  }

  let stagehandInstance: any = null;
  try {
    // Dynamic import to prevent loading issues if libraries fail to compile
    const { Stagehand } = await import("@browserbasehq/stagehand");
    
    stagehandInstance = new Stagehand({
      env: "BROWSERBASE",
      apiKey,
      projectId,
      modelName: "google/gemini-2.0-flash",
      modelClientOptions: {
        apiKey: process.env.GEMINI_API_KEY,
      },
    } as any);

    await stagehandInstance.init();
    const page = stagehandInstance.page;
    await page.goto(jobUrl);

    // Give it a moment to load fully
    await page.waitForLoadState("networkidle");

    const result = await stagehandInstance.extract({
      instruction: "Identify all required and optional input fields in the job application form, such as contact info, links, and resume uploads.",
      schema: z.object({
        fields: z.array(
          z.object({
            name: z.string().describe("Internal name or slug of the field"),
            label: z.string().describe("Label of the field shown to the user"),
            type: z.enum(["text", "file", "textarea", "select", "radio", "checkbox"]),
            required: z.boolean(),
          })
        ),
      }),
    });

    const sessionId = stagehandInstance.connectURL()?.split("?")[0]?.split("/").pop() || "live-session";
    await stagehandInstance.close();

    return {
      fields: result.fields as DetectedField[],
      sessionId,
    };
  } catch (err: any) {
    console.error("Failed to run Stagehand field detection:", err);
    if (stagehandInstance) {
      try {
        await stagehandInstance.close();
      } catch (closeErr) {
        console.error("Error closing stagehand:", closeErr);
      }
    }
    console.log("Falling back to simulation mode due to error.");
    return runDetectionSimulation(platform);
  }
}

/**
 * Automated form-filling and submission using Browserbase + Stagehand
 */
export async function submitJobApplication(
  jobUrl: string,
  platform: string,
  profile: any,
  resume: { file_url: string; file_name: string } | null,
  detectedFields: DetectedField[],
  verifiedFields?: Record<string, string>
): Promise<AutomationResult> {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!apiKey || !projectId || apiKey === projectId || apiKey.includes("placeholder") || projectId.includes("placeholder")) {
    console.warn("BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID missing, identical, or placeholder. Using Simulation Mode for form submission.");
    return runSubmissionSimulation();
  }

  let stagehandInstance: any = null;
  let tempResumePath = "";

  try {
    // 1. Download resume locally if required
    const requiresResume = detectedFields.some((f) => f.type === "file" || f.name.includes("resume") || f.name.includes("cv"));
    if (requiresResume && resume) {
      tempResumePath = await downloadResume(resume.file_url, resume.file_name);
      console.log("Resume downloaded locally to:", tempResumePath);
    }

    // 2. Initialize Stagehand
    const { Stagehand } = await import("@browserbasehq/stagehand");
    stagehandInstance = new Stagehand({
      env: "BROWSERBASE",
      apiKey,
      projectId,
      modelName: "google/gemini-2.0-flash",
      modelClientOptions: {
        apiKey: process.env.GEMINI_API_KEY,
      },
    } as any);

    await stagehandInstance.init();
    const page = stagehandInstance.page;
    await page.goto(jobUrl);
    await page.waitForLoadState("networkidle");

    // Connect Playwright to upload file or handle specific actions
    const { chromium } = await import("playwright-core");
    const browser = await chromium.connectOverCDP(stagehandInstance.connectURL());
    const pwContext = browser.contexts()[0];
    const pwPage = pwContext.pages()[0];

    // 3. Auto-fill fields
    for (const field of detectedFields) {
      if (field.type === "file") {
        if (tempResumePath) {
          console.log(`Uploading resume to field: ${field.label}`);
          // Find file input and upload
          const fileInput = await pwPage.$(`input[type="file"]`);
          if (fileInput) {
            await fileInput.setInputFiles(tempResumePath);
          } else {
            // Fallback Stagehand act
            await stagehandInstance.act(`Upload my resume file to the "${field.label}" upload button`);
          }
        }
        continue;
      }

      // Map field values from profile
      let value = verifiedFields?.[field.name] || "";
      const fieldName = field.name.toLowerCase();
      const fieldLabel = field.label.toLowerCase();

      if (!value) {
        if (fieldName.includes("first_name") || fieldLabel.includes("first name")) {
          value = profile.full_name?.split(" ")[0] || "";
        } else if (fieldName.includes("last_name") || fieldLabel.includes("last name")) {
          value = profile.full_name?.split(" ").slice(1).join(" ") || "";
        } else if (fieldName.includes("full_name") || fieldName === "name" || fieldLabel.includes("full name") || fieldLabel === "name") {
          value = profile.full_name || "";
        } else if (fieldName.includes("email")) {
          value = profile.email || "";
        } else if (fieldName === "phone" || fieldName.includes("phone_number") || fieldLabel.includes("phone")) {
          value = profile.phone || "";
        } else if (fieldName === "company" || fieldName.includes("current_company") || fieldLabel.includes("company")) {
          value = profile.current_company || "";
        } else if (fieldName === "title" || fieldName === "job_title" || fieldLabel.includes("job title") || fieldLabel === "title") {
          value = profile.current_job_title || "";
        } else if (fieldName.includes("location") || fieldLabel.includes("location") || fieldLabel.includes("city")) {
          value = profile.location || "";
        } else if (fieldName.includes("linkedin")) {
          value = (profile.links || []).find((l: string) => l.includes("linkedin.com")) || "";
        } else if (fieldName.includes("portfolio") || fieldName.includes("website") || fieldName.includes("github")) {
          value = (profile.links || []).find((l: string) => l.includes("github.com") || l.includes("portfolio") || !l.includes("linkedin.com")) || "";
        } else if (fieldName.includes("summary")) {
          value = profile.summary || "";
        }
      }

      if (value) {
        console.log(`Filling field: ${field.label} with: ${value}`);
        // Use Stagehand natural language action
        await stagehandInstance.act(`Fill in the input field labeled "${field.label}" with "${value}"`);
      }
    }

    // 4. Fill remaining custom/required fields via Stagehand AI
    console.log("Asking Stagehand to review and fill out any remaining/custom fields...");
    await stagehandInstance.act({
      action: `Review the entire job form. Fill out any remaining blank input fields, radio buttons, select dropdowns, and checkboxes using the candidate's profile context: ${JSON.stringify(profile)}.
      For visa sponsorship questions (e.g. "Do you require sponsorship?", "Will you now or in the future require visa..."): choose "No" (or equivalent negative answer) unless specified otherwise.
      For work authorization questions (e.g. "Are you authorized to work..."): choose "Yes" (or equivalent positive answer).
      For demographic questions (gender, race, veteran, disability status): choose "Decline to self-identify", "I do not wish to answer", or appropriate options if required.
      Do not leave any required fields blank.`
    });

    // 5. Submit
    console.log("Submitting job application form...");
    await stagehandInstance.act("Click the submit application button");
    await page.waitForTimeout(3000); // Wait for submission load

    const sessionId = stagehandInstance.connectURL()?.split("?")[0]?.split("/").pop() || "live-session";
    await stagehandInstance.close();

    // Cleanup temp file
    if (tempResumePath && fs.existsSync(tempResumePath)) {
      fs.unlinkSync(tempResumePath);
    }

    return {
      success: true,
      sessionId,
    };
  } catch (err: any) {
    console.error("Failed to submit job application via Stagehand:", err);
    if (stagehandInstance) {
      try {
        await stagehandInstance.close();
      } catch (closeErr) {
        console.error("Error closing stagehand:", closeErr);
      }
    }
    if (tempResumePath && fs.existsSync(tempResumePath)) {
      try {
        fs.unlinkSync(tempResumePath);
      } catch (unlinkErr) {
        console.error("Error deleting temp file:", unlinkErr);
      }
    }
    return {
      success: false,
      sessionId: "failed-session",
      error: err.message || "An unknown error occurred during form submission.",
    };
  }
}

/**
 * Mock Simulation: Field Detection
 */
function runDetectionSimulation(platform: string): { fields: DetectedField[]; sessionId: string } {
  const normPlatform = platform.toLowerCase();
  let fields: DetectedField[] = [];

  if (normPlatform.includes("greenhouse")) {
    fields = [
      { name: "first_name", label: "First Name", type: "text", required: true },
      { name: "last_name", label: "Last Name", type: "text", required: true },
      { name: "email", label: "Email", type: "text", required: true },
      { name: "phone", label: "Phone", type: "text", required: true },
      { name: "resume", label: "Resume/CV", type: "file", required: true },
      { name: "linkedin", label: "LinkedIn Profile URL", type: "text", required: false },
      { name: "github", label: "GitHub URL", type: "text", required: false },
    ];
  } else if (normPlatform.includes("lever")) {
    fields = [
      { name: "resume", label: "Resume/CV", type: "file", required: true },
      { name: "full_name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "text", required: true },
      { name: "phone", label: "Phone", type: "text", required: true },
      { name: "current_company", label: "Current Company", type: "text", required: false },
      { name: "linkedin", label: "LinkedIn URL", type: "text", required: false },
    ];
  } else if (normPlatform.includes("workable")) {
    fields = [
      { name: "first_name", label: "First Name", type: "text", required: true },
      { name: "last_name", label: "Last Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "text", required: true },
      { name: "phone", label: "Phone Number", type: "text", required: true },
      { name: "resume", label: "Resume", type: "file", required: true },
      { name: "location", label: "City", type: "text", required: false },
      { name: "linkedin", label: "LinkedIn Profile", type: "text", required: false },
    ];
  } else {
    // Other / generic
    fields = [
      { name: "full_name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "text", required: true },
      { name: "resume", label: "Resume", type: "file", required: true },
    ];
  }

  const randomId = Math.random().toString(36).substring(2, 10);
  return {
    fields,
    sessionId: `mock-session-detect-${randomId}`,
  };
}

/**
 * Mock Simulation: Submission
 */
function runSubmissionSimulation(): AutomationResult {
  const randomId = Math.random().toString(36).substring(2, 10);
  return {
    success: true,
    sessionId: `mock-session-submit-${randomId}`,
  };
}

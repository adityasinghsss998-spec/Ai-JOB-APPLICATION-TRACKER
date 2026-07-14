import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

async function main() {
  const testUrl = "https://boards.greenhouse.io/openai/jobs/4237785007";
  console.log("Initializing Stagehand for testing...");
  
  const stagehand = new Stagehand({
    env: "LOCAL",
    localBrowserLaunchOptions: {
      headless: false,
    },
    model: {
      modelName: "google/gemini-2.0-flash",
      apiKey: process.env.GEMINI_API_KEY,
    }
  });
  
  try {
    await stagehand.init();
    const page = stagehand.context.activePage();
    if (!page) throw new Error("No page");
    
    console.log("Navigating to:", testUrl);
    await page.goto(testUrl);
    await page.waitForLoadState("networkidle");
    
    console.log("Extracting fields...");
    const result = await stagehand.extract(
      "Identify all required and optional input fields in the job application form, such as contact info, links, and resume uploads.",
      z.object({
        fields: z.array(
          z.object({
            name: z.string().describe("Internal name or slug of the field"),
            label: z.string().describe("Label of the field shown to the user"),
            type: z.enum(["text", "file", "textarea", "select", "radio", "checkbox"]),
            required: z.boolean(),
          })
        ),
      })
    );
    
    console.log("Raw extraction result type:", typeof result);
    console.log("Raw extraction result:", JSON.stringify(result, null, 2));
    
    await stagehand.close();
  } catch (err) {
    console.error("Stagehand error:", err);
  }
}

main();

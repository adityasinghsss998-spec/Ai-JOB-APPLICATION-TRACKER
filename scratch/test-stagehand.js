const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function main() {
  console.log("Loading Stagehand...");
  try {
    const { Stagehand } = await import("@browserbasehq/stagehand");
    console.log("Stagehand loaded successfully. Initializing local instance...");
    
    const stagehand = new Stagehand({
      env: "LOCAL",
      headless: true,
      modelName: "google/gemini-2.0-flash",
      modelClientOptions: {
        apiKey: process.env.GEMINI_API_KEY,
      },
    });
    
    await stagehand.init();
    console.log("Stagehand initialized successfully!");
    
    const connectUrl = stagehand.connectURL();
    console.log("Connect URL is:", connectUrl);
    
    const { chromium } = await import("playwright-core");
    console.log("Connecting Playwright over CDP...");
    const browser = await chromium.connectOverCDP(connectUrl);
    console.log("Connected successfully!");
    
    const context = browser.contexts()[0];
    const pwPage = context.pages()[0];
    
    console.log("Navigating to example.com via Playwright...");
    await pwPage.goto("https://example.com");
    console.log("Playwright Page Title is:", await pwPage.title());
    
    await browser.close();
    await stagehand.close();
    console.log("Stagehand closed successfully!");
  } catch (err) {
    console.error("Failed to run Stagehand:", err);
  }
}

main();

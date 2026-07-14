const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const { detectFormFields } = require("../lib/browserbase/stagehand-runner");

async function main() {
  // Use a real greenhouse or lever job url to test
  const testUrl = "https://boards.greenhouse.io/openai/jobs/4237785007"; // example OpenAI job
  console.log("Testing detectFormFields with URL:", testUrl);
  
  try {
    const result = await detectFormFields(testUrl, "greenhouse");
    console.log("Result of detection:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error running detection:", err);
  }
}

main();

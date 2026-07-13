import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.argv[2];
if (!apiKey) { console.error("Pass API key as arg"); process.exit(1); }

const candidates = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

async function test() {
  const genAI = new GoogleGenerativeAI(apiKey);
  for (const modelName of candidates) {
    process.stdout.write(`Testing ${modelName}... `);
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      });
      const result = await model.generateContent(`Return this exact JSON: {"ok": true}`);
      const text = result.response.text().trim();
      console.log("✅ OK:", text.slice(0, 60));
    } catch (e: any) {
      const status = e.message?.match(/\[(\d+) /)?.[1] || "?";
      console.log(`❌ ${status}: ${e.message?.split("\n")[0]?.slice(0, 80)}`);
    }
  }
}

test();

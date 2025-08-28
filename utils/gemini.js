import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from "../config/envConfig.js";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

async function generateText(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt, // prompt
  });
  return response.text;
}

export default generateText;
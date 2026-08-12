import { GoogleGenAI } from "@google/genai";

let cachedApiKey: string | undefined;
let cachedClient: GoogleGenAI | undefined;

export const getGeminiClient = (apiKey: string): GoogleGenAI => {
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
};

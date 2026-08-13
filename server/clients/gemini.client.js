import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

let genAI = null;
let aiModel = null;

if (config.geminiApiKey && config.geminiApiKey !== "" && config.geminiApiKey !== "MOCK_GEMINI_KEY") {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), ms))
    ]);
};

export const generateText = async (prompt, timeoutMs = 15000) => {
    if (!aiModel) {
        throw new Error('Gemini API is not configured.');
    }
    const result = await withTimeout(aiModel.generateContent(prompt), timeoutMs);
    const response = await result.response;
    return response.text();
};

export const generateStream = async (prompt) => {
    if (!aiModel) {
        throw new Error('Gemini API is not configured.');
    }
    const result = await aiModel.generateContentStream(prompt);
    return result.stream;
};

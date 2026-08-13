import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

let genAI = null;
let aiModel = null;

if (config.geminiApiKey && config.geminiApiKey !== "" && config.geminiApiKey !== "MOCK_GEMINI_KEY") {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export const getModel = () => aiModel;

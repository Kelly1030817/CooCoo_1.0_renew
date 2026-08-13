import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  geminiApiKey: process.env.GEMINI_API_KEY,
  env: process.env.NODE_ENV || 'development'
};

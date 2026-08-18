import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testSDK() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  console.log('Testing @google/genai SDK...');
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello from Nagpur! What is the zero mile stone?',
    });
    console.log('GoogleGenAI Response:', response.text);
  } catch (e: any) {
    console.error('GoogleGenAI Error:', e.message || e);
  }
}

testSDK();

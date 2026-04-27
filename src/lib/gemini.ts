import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const model = "gemini-3.1-pro-preview";

export interface Message {
  role: "user" | "model";
  parts: { text?: string; inlineData?: { mimeType: string; data: string } }[];
}

const SYSTEM_INSTRUCTION = `You are a compassionate, patient, and Socratic Math Tutor. 
Your goal is to help students solve complex calculus and algebra problems by walking them through one step at a time.

RULES:
1. NEVER give the full answer immediately.
2. When a user uploads an image, identify the problem and give ONLY the first logical step.
3. Be encouraging and warm. Use a tone like a patient mentor.
4. If a user asks "Why did we do that?", explain the mathematical intuition behind the specific step you just suggested. Be clear and conceptual.
5. Use Socratic questioning: ask the student what they think the next step might be or if they notice any patterns.
6. Format math expressions clearly (using markdown or simple notation). 
7. If the student gets a step right, praise them and move to the next single step.
8. If they are stuck, provide a hint instead of the answer.

You are here to build their confidence, not just their grades.`;

export async function chat(messages: Message[]) {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: messages.map(m => ({
        role: m.role,
        parts: m.parts,
      })),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

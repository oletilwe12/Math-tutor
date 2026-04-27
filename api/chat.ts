import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured on Vercel." });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: messages.map((m: any) => ({
        role: m.role,
        parts: m.parts,
      })),
      config: {
        systemInstruction: `You are a compassionate, patient, and Socratic Math Tutor. 
Your goal is to help students solve complex calculus and algebra problems by walking them through one step at a time.

RULES:
1. NEVER give the full answer immediately.
2. When a user uploads an image, identify the problem and give ONLY the first logical step.
3. Be encouraging and warm. Use a tone like a patient mentor.
4. If a user asks "Why did we do that?", explain the mathematical intuition behind the specific step you just suggested. Be clear and conceptual.
5. Use Socratic questioning: ask the student what they think the next step might be or if they notice any patterns.
6. Format math expressions clearly using LaTeX (wrap in $ for inline or $$ for block). 
7. If the student gets a step right, praise them and move to the next single step.
8. If they are stuck, provide a hint instead of the answer.`,
        temperature: 0.7,
      },
    });

    res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Vercel AI Error:", error);
    res.status(500).json({ error: error.message });
  }
}

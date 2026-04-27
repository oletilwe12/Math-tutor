import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // AI Endpoint: This keeps the API key on the server
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "API key not configured on server." });
      }

      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
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
8. If they are stuck, provide a hint instead of the answer.`
      });

      const response = await model.generateContent({
        contents: messages.map((m: any) => ({
          role: m.role,
          parts: m.parts,
        })),
        generationConfig: {
          temperature: 0.7,
        },
      });

      res.json({ text: response.response.text() });
    } catch (error: any) {
      console.error("Server AI Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export interface Message {
  role: "user" | "model";
  parts: { text?: string; inlineData?: { mimeType: string; data: string } }[];
}

export async function chat(messages: Message[]) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch from tutor server");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Client AI Error:", error);
    throw error;
  }
}

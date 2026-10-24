import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, target } = await req.json();
    if (!text || !target) {
      return NextResponse.json({ error: "Missing text or target" }, { status: 400 });
    }
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ translated: text, fallback: true });
    }
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following text to ${target}. Return only the translated text, no explanations.`,
          },
          { role: "user", content: text },
        ],
      }),
    });
    const data = await res.json();
    const translated = data?.choices?.[0]?.message?.content?.trim() || text;
    return NextResponse.json({ translated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
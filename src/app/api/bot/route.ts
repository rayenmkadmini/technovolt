import { NextRequest, NextResponse } from "next/server";
import { executeBotQuery, checkRateLimit, BotChatMessage } from "@/lib/bot/provider";

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const { allowed, remaining } = checkRateLimit(clientIp);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Trop de requêtes. Veuillez patienter une minute avant de poser une nouvelle question.",
          code: "RATE_LIMITED",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2. Body parsing and validation
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Corps de requête JSON invalide.", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const { messages, locale } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Le tableau de messages est requis et ne peut être vide.", code: "EMPTY_MESSAGES" },
        { status: 400 }
      );
    }

    // Check size limit: max 15 messages in context
    const sanitizedMessages: BotChatMessage[] = messages.slice(-15).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content.trim().slice(0, 1000) : "",
    }));

    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return NextResponse.json(
        { error: "Votre message ne peut pas être vide.", code: "EMPTY_CONTENT" },
        { status: 400 }
      );
    }

    // 3. Execution
    const result = await executeBotQuery(sanitizedMessages, locale);

    return NextResponse.json(
      {
        success: true,
        reply: result.reply,
        provider: result.provider,
        isSafetyAlert: result.isSafetyAlert || false,
        isPriceEstimate: result.isPriceEstimate || false,
        priceDisclaimer: result.priceDisclaimer || null,
        quoteCta: result.quoteCta || false,
        suggestedFollowUps: result.suggestedFollowUps || [],
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
        },
      }
    );
  } catch (err: any) {
    console.error("TechnoVolt Bot API error:", err);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors du traitement de votre demande.",
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

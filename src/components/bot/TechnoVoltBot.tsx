"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  Zap,
  X,
  Minus,
  Send,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
  isSafetyAlert?: boolean;
  isPriceEstimate?: boolean;
  priceDisclaimer?: string | null;
  quoteCta?: boolean;
  suggestedFollowUps?: string[];
}

export function TechnoVoltBot() {
  const t = useTranslations("bot");
  const locale = useLocale();
  const pathname = usePathname();
  const isRtl = locale === "ar";

  // Hide on admin routes to prevent overlapping administrative controls
  const isAdminPage = typeof pathname === "string" && pathname.startsWith("/admin");

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize welcome message once
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: "welcome-msg",
          role: "assistant",
          content: t("welcomeMessage"),
          timestamp: new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
          suggestedFollowUps: [
            t("suggestedQuestions.0"),
            t("suggestedQuestions.1"),
            t("suggestedQuestions.5"),
          ],
        },
      ];
    });
  }, [locale, t]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  if (isAdminPage) {
    return null;
  }

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
      setHasUnread(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    if (text.length > 1000) {
      setError(t("characterLimit"));
      return;
    }

    setError(null);
    setInput("");

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const payload = {
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        locale,
      };

      let data: any;

      // Strategy 1: Standard fetch
      try {
        const response = await fetch("/api/bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || t("errorGeneric"));
        }

        data = await response.json();
      } catch (fetchErr: any) {
        // Strategy 2: XMLHttpRequest fallback (bypasses browser extensions monkey-patching fetch, e.g. Urban VPN)
        console.warn("Fetch failed, falling back to XMLHttpRequest:", fetchErr?.message);

        data = await new Promise((resolve, reject) => {
          try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/bot", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = () => {
              try {
                const parsed = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve(parsed);
                } else {
                  reject(new Error(parsed.error || t("errorGeneric")));
                }
              } catch {
                reject(new Error("Réponse serveur invalide."));
              }
            };
            xhr.onerror = () => {
              reject(new Error("Erreur de connexion réseau. Si une extension VPN est active, désactivez-la pour localhost."));
            };
            xhr.ontimeout = () => reject(new Error("Délai d'attente réseau dépassé."));
            xhr.timeout = 25000;
            xhr.send(JSON.stringify(payload));
          } catch {
            reject(fetchErr);
          }
        });
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
        isSafetyAlert: data.isSafetyAlert,
        isPriceEstimate: data.isPriceEstimate,
        priceDisclaimer: data.priceDisclaimer,
        quoteCta: data.quoteCta,
        suggestedFollowUps: data.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (!isOpen || isMinimized) {
        setHasUnread(true);
      }
    } catch (err: any) {
      console.error("Bot error:", err);
      setError(err?.message || t("errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: t("welcomeMessage"),
        timestamp: new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
        suggestedFollowUps: [
          t("suggestedQuestions.0"),
          t("suggestedQuestions.1"),
          t("suggestedQuestions.5"),
        ],
      },
    ]);
    setError(null);
  };

  // Safe markdown-like parser (headers, blockquotes, bullets, dividers, bold, code)
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-extrabold text-[#0B69FF] text-base mt-2 mb-1">
            {line.replace("## ", "")}
          </h3>
        );
      }

      if (line.startsWith("> ")) {
        return (
          <blockquote
            key={idx}
            className="border-s-2 border-[#F5A623] bg-amber-50/60 ps-2.5 py-1 my-1 text-xs text-slate-700 italic rounded-e"
          >
            {line.replace("> ", "")}
          </blockquote>
        );
      }

      if (line.startsWith("- ") || line.startsWith("* ")) {
        const itemText = line.substring(2);
        return (
          <li key={idx} className="ms-4 list-disc text-xs leading-relaxed text-slate-800 my-0.5">
            {parseInlineFormatting(itemText)}
          </li>
        );
      }

      if (line === "---") {
        return <hr key={idx} className="my-2 border-slate-200" />;
      }

      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-800 my-1">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-blue-700 border border-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="print:hidden" suppressHydrationWarning>
      {/* 1. CHAT DRAWER / WINDOW (Positioned directly above the launcher at bottom-right) */}
      {isOpen && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          suppressHydrationWarning
          className={`fixed z-50 transition-all duration-200 ease-out ${
            isMinimized
              ? "right-4 sm:right-6 bottom-20 sm:bottom-24 w-72 rounded-2xl bg-white border border-slate-300 shadow-xl overflow-hidden"
              : "right-3 sm:right-6 bottom-[76px] sm:bottom-[92px] inset-x-3 sm:inset-x-auto sm:w-[420px] h-[580px] sm:h-[600px] max-h-[calc(100dvh-95px)] sm:max-h-[calc(100vh-110px)] rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0B69FF] text-white select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/20 text-[#F5A623]">
                <Zap className="h-4 w-4 fill-[#F5A623]" />
                <span className="absolute bottom-0 end-0 h-2 w-2 rounded-full bg-emerald-400 border border-[#0B69FF]" />
              </div>
              <div className="text-start">
                <div className="text-xs font-extrabold flex items-center gap-1.5">
                  <span>{t("title")}</span>
                  <span className="text-[9px] font-bold bg-[#F5A623] text-slate-900 px-1.5 py-0.2 rounded-full uppercase">
                    AI
                  </span>
                </div>
                <div className="text-[10px] text-blue-200 truncate max-w-[190px]">
                  {t("subtitle")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-blue-200">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                title={t("newChat")}
                aria-label={t("newChat")}
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                title={t("minimize")}
                aria-label={t("minimize")}
              >
                {isMinimized ? <Sparkles className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                title={t("close")}
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body when not minimized */}
          {!isMinimized && (
            <>
              {/* Message Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
                {/* Security and Domain Shield Banner */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-2.5 text-[11px] text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0B69FF] shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    {t("disclaimer")}
                  </p>
                </div>

                {/* Message List */}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                        m.role === "user"
                          ? "bg-[#0B69FF] text-white rounded-br-none"
                          : m.isSafetyAlert
                          ? "bg-rose-50 text-slate-900 border border-rose-300 rounded-bl-none"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                      }`}
                    >
                      {/* Safety Banner Inside Message */}
                      {m.isSafetyAlert && (
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold mb-1.5 pb-1 border-b border-rose-200">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Alerte Sécurité Électrique</span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="space-y-1">{renderFormattedContent(m.content)}</div>

                      {/* Price Disclaimer Badge if applicable */}
                      {m.isPriceEstimate && m.priceDisclaimer && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-amber-700 font-medium">
                          ⚠️ {m.priceDisclaimer}
                        </div>
                      )}

                      {/* Official Quotation CTA Button */}
                      {m.quoteCta && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <Link
                            href="/quote"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5A623] hover:bg-[#e0961f] text-slate-900 font-bold text-[11px] transition-colors shadow-xs"
                          >
                            <span>{t("quoteCta")}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                      <span>{m.timestamp}</span>

                      {m.role === "assistant" && (
                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          className="hover:text-slate-600 transition-colors flex items-center gap-1"
                          title={t("copy")}
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">{t("copied")}</span>
                            </>
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Suggested follow-up chips */}
                    {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                        {m.suggestedFollowUps.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => handleSendMessage(chip)}
                            className="text-[11px] font-medium text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 px-2.5 py-1 rounded-full transition-colors text-start"
                          >
                            ⚡ {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading / Typing indicator */}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-bl-none w-fit shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-[#0B69FF] animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-[#0E67FF] animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-[#F5A623] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] ps-1">{t("typing")}</span>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                    <button
                      onClick={() => handleSendMessage()}
                      className="text-xs font-bold underline hover:text-rose-900"
                    >
                      {t("retry")}
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("inputPlaceholder")}
                    rows={1}
                    maxLength={1000}
                    className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0B69FF] focus:outline-none focus:ring-1 focus:ring-[#0B69FF] max-h-24 min-h-[38px] placeholder:text-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B69FF] text-white hover:bg-[#0E67FF] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors shadow-xs"
                    title={t("send")}
                    aria-label={t("send")}
                  >
                    <Send className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Enter ↵ pour envoyer</span>
                  <span>{input.length}/1000</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. PROFESSIONAL FLOATING CHATBOT LAUNCHER (FIXED TO BOTTOM-RIGHT CORNER) */}
      <button
        onClick={handleToggle}
        suppressHydrationWarning
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
        }}
        className="z-50 group flex h-[54px] w-[54px] sm:h-[60px] sm:w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-[#0B69FF] via-[#0E67FF] to-[#0A47B8] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ease-out border-2 border-white/30 focus:outline-none focus:ring-4 focus:ring-blue-300/80 focus:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none"
        aria-label={isOpen ? t("close") : t("launcherLabel")}
        title={isOpen ? t("close") : t("launcherLabel")}
      >
        <div className="relative flex items-center justify-center" suppressHydrationWarning>
          {isOpen ? (
            <X className="h-6 w-6 sm:h-7 sm:w-7 text-white transition-transform duration-200 group-hover:rotate-90 motion-reduce:transition-none motion-reduce:transform-none" />
          ) : (
            <>
              {/* Bot / Message Icon with Amber Lightning Bolt detail */}
              <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-white fill-white/10" />
              <Zap className="absolute -top-1.5 -end-1.5 h-4 w-4 text-[#F5A623] fill-[#F5A623] animate-pulse drop-shadow-xs motion-reduce:animate-none" />
            </>
          )}

          {/* Online Indicator Badge (Active when closed) */}
          {!isOpen && (
            <span
              className="absolute -top-3.5 -end-3.5 flex h-3.5 w-3.5 items-center justify-center"
              title={t("statusOnline")}
            >
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping motion-reduce:animate-none" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0B69FF]" />
            </span>
          )}

          {/* Unread Message Counter Badge */}
          {hasUnread && !isOpen && (
            <span className="absolute -bottom-2 -start-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md border-2 border-white">
              1
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

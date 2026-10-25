"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface FloatConfig {
  enabled: boolean;
  prefix: string;
  value: number;
  label: string;
  side: "left" | "right";
  bottom: number;
}

const DEFAULT: FloatConfig = {
  enabled: true,
  prefix: "+",
  value: 500,
  label: "Clients",
  side: "left",
  bottom: 24,
};

const STORAGE_KEY = "technovolt_floating_counter";

function load(): FloatConfig {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

export function FloatingClientCounter() {
  const pathname = usePathname();
  const [config, setConfig] = useState<FloatConfig>(DEFAULT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConfig(load());
    const onStorage = () => setConfig(load());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Hide on admin and login pages
  if (!mounted) return null;
  if (pathname?.includes("/admin")) return null;
  if (!config.enabled) return null;

  const sideClass = config.side === "right" ? "right-4 sm:right-6" : "left-4 sm:left-6";

  return (
    <div
      className={`fixed ${sideClass} z-40`}
      style={{ bottom: `${config.bottom}px` }}
      aria-label="Client counter"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0B69FF] text-white shadow-lg border border-white/20 backdrop-blur-sm">
        <span className="text-lg font-black tracking-tight">
          {config.prefix}
          {Number(config.value || 0).toLocaleString("fr-FR")}
        </span>
        <span className="text-xs font-semibold text-white/90">{config.label}</span>
      </div>
    </div>
  );
}
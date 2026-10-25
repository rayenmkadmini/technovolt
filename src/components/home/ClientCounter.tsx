"use client";

import { useEffect, useRef, useState } from "react";

interface CounterConfig {
  enabled: boolean;
  prefix: string;
  value: number;
  label: string;
  title: string;
  description: string;
  animated: boolean;
}

const DEFAULT_CONFIG: CounterConfig = {
  enabled: true,
  prefix: "+",
  value: 500,
  label: "Clients",
  title: "",
  description: "",
  animated: true,
};

const STORAGE_KEY = "technovolt_client_counter";

function loadConfig(): CounterConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function ClientCounter() {
  const [config, setConfig] = useState<CounterConfig>(DEFAULT_CONFIG);
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConfig(loadConfig());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!config.enabled || !config.animated) {
      const timer = setTimeout(() => {
        setDisplayValue(config.value);
      }, 0);
      return () => clearTimeout(timer);
    }
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animatedRef.current) {
            animatedRef.current = true;
            const duration = 1500;
            const start = performance.now();
            const animate = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              setDisplayValue(Math.floor(progress * config.value));
              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [config]);

  if (!config.enabled) return null;

  return (
    <section ref={ref} className="py-16 bg-[#0B69FF] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        {config.title && (
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{config.title}</h2>
        )}
        <div className="text-5xl sm:text-7xl font-black tracking-tight">
          {config.prefix}
          {displayValue.toLocaleString("fr-FR")}
        </div>
        <div className="text-lg sm:text-xl font-medium text-white/90">{config.label}</div>
        {config.description && (
          <p className="text-sm text-white/80 max-w-2xl mx-auto">{config.description}</p>
        )}
      </div>
    </section>
  );
}
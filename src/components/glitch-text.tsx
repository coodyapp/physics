import { useEffect, useState } from "react";

import { cn } from "@/utils/tailwind";

const WORD_SHADES = [
  "hsl(0 0% 100%)",
  "hsl(0 0% 88%)",
  "hsl(0 0% 75%)",
  "hsl(0 0% 95%)",
  "hsl(0 0% 82%)",
  "hsl(0 0% 70%)",
  "hsl(0 0% 92%)",
  "hsl(0 0% 78%)",
  "hsl(0 0% 85%)",
  "hsl(0 0% 65%)",
] as const;

interface GlitchTextProps {
  words: string[];
  className?: string;
  glitchInterval?: number;
}

export function GlitchText({ words, className, glitchInterval = 3000 }: GlitchTextProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;

    let wordTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let resetTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const intervalId = setInterval(() => {
      setIsGlitching(true);

      wordTimeoutId = setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);

        resetTimeoutId = setTimeout(() => {
          setIsGlitching(false);
        }, 500);
      }, 200);
    }, glitchInterval);

    return () => {
      clearInterval(intervalId);

      if (wordTimeoutId) clearTimeout(wordTimeoutId);
      if (resetTimeoutId) clearTimeout(resetTimeoutId);
    };
  }, [words.length, glitchInterval]);

  if (words.length === 0) return null;

  const currentWord = words[currentWordIndex] ?? words[0];
  const currentColor = WORD_SHADES[currentWordIndex % WORD_SHADES.length];

  return (
    <span className={cn("relative inline-block", className)} style={{ color: currentColor }}>
      <span
        className={cn(
          "absolute top-0 left-0 size-full transition-opacity duration-200",
          isGlitching ? "opacity-100" : "opacity-0",
        )}
      >
        <span
          className="absolute inset-0 before:absolute before:top-0 before:left-0 before:h-[45%] before:w-full before:animate-glitch-top before:bg-background before:content-['']"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)" }}
        >
          {currentWord}
        </span>
        <span
          className="absolute inset-0 before:absolute before:bottom-0 before:left-0 before:h-[45%] before:w-full before:animate-glitch-bottom before:bg-background before:content-['']"
          style={{ clipPath: "polygon(0 55%, 100% 55%, 100% 100%, 0 100%)" }}
        >
          {currentWord}
        </span>
      </span>
      <span className={cn(isGlitching && "opacity-80")}>{currentWord}</span>
    </span>
  );
}

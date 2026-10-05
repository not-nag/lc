"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type AutoPlay = { on: boolean; seconds: number };

/**
 * Slide position, the 0→1 transition that plays on each move, and optional
 * auto-advance. Nothing here knows about frames — a slide lasts until you move on.
 */
export function useDeck(total: number, transitionMs = 480) {
  const [index, setIndex] = useState(0);
  const [t, setT] = useState(1);
  const [auto, setAuto] = useState<AutoPlay>({ on: false, seconds: 5 });
  const raf = useRef<number | null>(null);

  const animate = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / transitionMs);
      setT(p);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    setT(0);
    raf.current = requestAnimationFrame(step);
  }, [transitionMs]);

  const goto = useCallback((i: number) => {
    const n = Math.max(0, Math.min(total - 1, i));
    setIndex((cur) => { if (n !== cur) animate(); return n; });
  }, [total, animate]);

  const next = useCallback(() => goto(indexRef.current + 1), [goto]);
  const back = useCallback(() => goto(indexRef.current - 1), [goto]);
  const replay = useCallback(() => animate(), [animate]);

  // keep a ref so the keyboard handler never closes over a stale index
  const indexRef = useRef(0);
  useEffect(() => { indexRef.current = index; }, [index]);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  useEffect(() => {
    if (!auto.on) return;
    const id = setInterval(() => {
      if (indexRef.current >= total - 1) setAuto((a) => ({ ...a, on: false }));
      else goto(indexRef.current + 1);
    }, Math.max(500, auto.seconds * 1000));
    return () => clearInterval(id);
  }, [auto.on, auto.seconds, total, goto]);

  return { index, t, goto, next, back, replay, auto, setAuto, atEnd: index >= total - 1 };
}

export type DeckApi = ReturnType<typeof useDeck>;

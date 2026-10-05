"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Deck as DeckT } from "@/schema";
import { flatten, STAGE } from "@/schema/deck";
import { Stage } from "@/primitives";
import { palette, stageBackground, grainTexture } from "@/theme";
import { SlideView } from "./SlideView";
import type { DeckApi } from "./useDeck";

/** The deck: a fixed 16:9 stage scaled to fit, driven by clicks rather than a clock. */
/** `api` comes from useDeck() in the parent, so the slide list and the deck stay in step. */
export const Deck: React.FC<{
  deck: DeckT;
  api: DeckApi;
  controls?: (api: DeckApi & { total: number }) => React.ReactNode;
}> = ({ deck, api, controls }) => {
  const { w: W, h: H } = STAGE[deck.meta.format];
  const total = useMemo(() => flatten(deck).length, [deck]);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [fullscreen, setFullscreen] = useState(false);

  // in fullscreen the deck is the whole screen: slide only, no controls
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const fit = () => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // the box measures 0 before first layout — keep the last good scale until it doesn't
      if (r.width < 2 || r.height < 2) return;
      setScale(Math.max(0.05, Math.min(r.width / W, r.height / H)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [W, H]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.isContentEditable || el?.tagName === "INPUT" || el?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); api.next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); api.back(); }
      else if (e.key === "r" || e.key === "R") api.replay();
      else if (e.key === "Home") api.goto(0);
      else if (e.key === "End") api.goto(total - 1);
      else if (e.key === "a" || e.key === "A") api.setAuto((x) => ({ ...x, on: !x.on }));
      else if (e.key === "f" || e.key === "F") {
        const el = box.current?.closest("[data-deck-root]") as HTMLElement | null;
        if (!document.fullscreenElement) el?.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api, total]);

  return (
    <div data-deck-root style={{
      position: "relative",
      display: "flex", flexDirection: "column", gap: fullscreen ? 0 : 14,
      minHeight: 0, background: fullscreen ? stageBackground : palette.bg,
      ...(fullscreen ? { width: "100vw", height: "100vh" } : { height: "100%" }),
    }}>
      {fullscreen && (
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          opacity: 0.045, mixBlendMode: "multiply",
          backgroundImage: grainTexture, backgroundSize: "180px 180px",
        }} />
      )}
      <div ref={box} style={{
        flex: 1, minHeight: 0, display: "grid", placeItems: "center",
        padding: fullscreen ? 0 : undefined,
      }}>
        {/* transform does not shrink layout size, so the scaled stage needs a sized wrapper */}
        <div style={{
          width: W * scale, height: H * scale, position: "relative", overflow: "hidden",
          borderRadius: fullscreen ? 0 : 18,
          boxShadow: fullscreen ? "none" : "0 18px 50px -20px rgba(62,44,35,.45)",
        }}>
          <div style={{
            width: W, height: H, position: "absolute", top: 0, left: 0,
            transform: `scale(${scale})`, transformOrigin: "top left",
          }}>
            <Stage>
              <SlideView deck={deck} index={api.index} t={api.t} width={W} height={H} />
            </Stage>
          </div>
        </div>
      </div>
      {!fullscreen && controls?.({ ...api, total })}
    </div>
  );
};

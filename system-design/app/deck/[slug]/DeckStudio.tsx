"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Deck as DeckT } from "@/schema";
import { flatten } from "@/schema/deck";
import { Deck } from "@/deck/Deck";
import { useDeck } from "@/deck/useDeck";

/**
 * Two controls, deliberately. Write the line shown at the bottom of a slide, or
 * delete the slide. Everything else comes from the trace and changes by asking.
 */
export function DeckStudio({ initial }: { initial: DeckT }) {
  const [deck, setDeck] = useState<DeckT>(initial);
  const [saved, setSaved] = useState<"clean" | "dirty" | "saving">("clean");
  const [confirm, setConfirm] = useState(false);
  const cursors = flatten(deck);
  const api = useDeck(cursors.length);
  const index = Math.min(api.index, cursors.length - 1);
  const cur = cursors[index];
  const slide = cur ? deck.sections[cur.section].slides[cur.slide] : undefined;

  useEffect(() => { setConfirm(false); }, [index]);

  const setLabel = useCallback((at: number, value: string) => {
    setDeck((d) => {
      const next = structuredClone(d);
      const c = flatten(next)[at];
      if (!c) return d;
      next.sections[c.section].slides[c.slide].label = value.trim() ? value : undefined;
      return next;
    });
    setSaved("dirty");
  }, []);

  /** Deleting a section's last slide removes the section — none may be empty. */
  const deleteSlide = useCallback((at: number) => {
    setDeck((d) => {
      const next = structuredClone(d);
      if (flatten(next).length <= 1) return d;
      const c = flatten(next)[at];
      if (!c) return d;
      const sec = next.sections[c.section];
      sec.slides.splice(c.slide, 1);
      if (sec.slides.length === 0) next.sections.splice(c.section, 1);
      return next;
    });
    setSaved("dirty");
    setConfirm(false);
    api.goto(Math.max(0, at - 1));
  }, [api]);

  useEffect(() => {
    if (saved !== "dirty") return;
    const id = setTimeout(async () => {
      setSaved("saving");
      const r = await fetch("/api/deck", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: deck.meta.slug, deck }),
      });
      setSaved(r.ok ? "clean" : "dirty");
    }, 500);
    return () => clearTimeout(id);
  }, [saved, deck]);

  return (
    <div className="h-screen flex flex-col">
      <header className="px-5 py-2.5 flex items-center justify-between border-b-2" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-baseline gap-3">
          <Link href="/" className="font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            System design <span style={{ color: "var(--terracotta)" }}>Slides</span>
          </Link>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {deck.meta.number ? `#${deck.meta.number} · ` : ""}{deck.meta.title}
          </span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: saved === "clean" ? "var(--sage)" : "var(--terracotta)" }}>
          {saved === "clean" ? "saved" : saved === "saving" ? "saving…" : "unsaved"}
        </span>
      </header>

      <div className="flex-1 min-h-0 p-4">
        <Deck deck={deck} api={api}
          controls={(a) => (
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2">
                <button className="btn-ghost !py-1.5 !px-4" onClick={a.back} disabled={a.index === 0}>←</button>
                <span className="mono text-sm w-20 text-center" style={{ color: "var(--muted)" }}>
                  {a.index + 1} / {a.total}
                </span>
                <button className="btn !py-1.5 !px-4" onClick={a.next} disabled={a.atEnd}>→</button>
                <button className="btn-ghost !py-1.5 !px-3 text-sm" onClick={a.replay} title="replay (R)">↻</button>
                <span className="w-4" />
                <button className="btn-ghost !py-1 !px-3 text-xs"
                  onClick={() => a.setAuto((x) => ({ ...x, on: !x.on }))}>
                  {a.auto.on ? "⏸" : "▶"} auto
                </button>
                <input type="number" min={1} max={600} value={a.auto.seconds}
                  onChange={(e) => a.setAuto((x) => ({ ...x, seconds: Number(e.target.value) || 1 }))}
                  className="!w-16 !py-1 !px-2 text-center mono text-xs" />
                <span className="text-xs" style={{ color: "var(--muted)" }}>sec</span>
              </div>

              <input type="range" min={0} max={Math.max(0, a.total - 1)} value={a.index}
                onChange={(e) => a.goto(Number(e.target.value))} className="w-full" />

              <div className="flex gap-3 items-start">
                <textarea
                  value={slide?.label ?? ""}
                  onChange={(e) => setLabel(index, e.target.value)}
                  placeholder="text shown at the bottom of this slide — leave empty for none"
                  rows={2}
                  className="text-sm flex-1"
                  style={{ resize: "vertical", minHeight: 62 }} />
                <button
                  onClick={() => (confirm ? deleteSlide(index) : setConfirm(true))}
                  onBlur={() => setConfirm(false)}
                  disabled={cursors.length <= 1}
                  className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg shrink-0"
                  style={confirm
                    ? { background: "var(--clay)", color: "#fff" }
                    : { color: "var(--clay)", border: "2px solid var(--line)" }}>
                  {confirm ? "sure?" : "delete"}
                </button>
              </div>
              {confirm && slide?.structural && (
                <p className="text-[11px] -mt-1" style={{ color: "var(--clay)" }}>
                  This slide changes the design — the ones after it build on what it does.
                </p>
              )}
            </div>
          )} />
      </div>
    </div>
  );
}

"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Deck as DeckT } from "@/schema";
import { flatten } from "@/schema/deck";
import { Deck } from "@/deck/Deck";
import { useDeck } from "@/deck/useDeck";

/**
 * Present the deck, write the line shown at the bottom of a slide, and delete slides
 * you don't want. Everything else comes from the trace and is changed by asking.
 */
export function DeckStudio({ initial }: { initial: DeckT }) {
  const [deck, setDeck] = useState<DeckT>(initial);
  const [saved, setSaved] = useState<"clean" | "dirty" | "saving">("clean");
  const [confirm, setConfirm] = useState<number | null>(null);
  const cursors = flatten(deck);
  const api = useDeck(cursors.length);
  const index = api.index;
  const cur = cursors[Math.min(index, cursors.length - 1)];
  const slide = cur ? deck.sections[cur.section].slides[cur.slide] : undefined;

  /** The one thing written by hand: the line under the slide. Empty shows nothing. */
  const setLabel = useCallback((at: number, value: string) => {
    setDeck((d) => {
      const next = structuredClone(d);
      const c = flatten(next)[at];
      if (!c) return d;
      next.sections[c.section].slides[c.slide].label = value.trim() || undefined;
      return next;
    });
    setSaved("dirty");
  }, []);

  /**
   * Remove a slide. If it was the last one in its section, the section goes too —
   * every section must keep at least one slide.
   */
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
    setConfirm(null);
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
      <header className="px-5 py-3 flex items-center justify-between border-b-2" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-baseline gap-3">
          <Link href="/" className="font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            LeetCode <span style={{ color: "var(--terracotta)" }}>Slides</span>
          </Link>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            #{deck.meta.number} · {deck.meta.title}
          </span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: saved === "clean" ? "var(--sage)" : "var(--terracotta)" }}>
          {saved === "clean" ? "saved" : saved === "saving" ? "saving…" : "unsaved"}
        </span>
      </header>

      <div className="flex-1 min-h-0 grid lg:grid-cols-[1fr_300px]">
        <div className="min-h-0 p-4">
          <Deck deck={deck} api={api}
            controls={(a) => (
              <div className="flex flex-col gap-3 items-center">
                <div className="flex items-center gap-2">
                  <button className="btn-ghost !py-1.5 !px-4" onClick={a.back} disabled={a.index === 0}>←</button>
                  <span className="mono text-sm w-24 text-center" style={{ color: "var(--muted)" }}>
                    {a.index + 1} / {a.total}
                  </span>
                  <button className="btn !py-1.5 !px-4" onClick={a.next} disabled={a.atEnd}>→</button>
                  <button className="btn-ghost !py-1.5 !px-3 text-sm" onClick={a.replay} title="replay the transition (R)">↻</button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <button className="btn-ghost !py-1 !px-3 text-xs"
                    onClick={() => a.setAuto((x) => ({ ...x, on: !x.on }))}>
                    {a.auto.on ? "⏸ stop auto" : "▶ auto-advance"}
                  </button>
                  <input type="number" min={1} max={600} value={a.auto.seconds}
                    onChange={(e) => a.setAuto((x) => ({ ...x, seconds: Number(e.target.value) || 1 }))}
                    className="!w-20 !py-1 !px-2 text-center mono text-xs" />
                  <span style={{ color: "var(--muted)" }}>sec / slide</span>
                </div>
                <input type="range" min={0} max={Math.max(0, a.total - 1)} value={a.index}
                  onChange={(e) => a.goto(Number(e.target.value))} className="w-full max-w-lg" />
              </div>
            )} />
        </div>

        <aside className="border-l-2 flex flex-col min-h-0" style={{ borderColor: "var(--line)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--line)" }}>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "var(--muted)" }}>
              slide text
            </div>
            <input
              value={slide?.label ?? ""}
              onChange={(e) => setLabel(index, e.target.value)}
              placeholder="empty = nothing shown"
              className="text-sm" />
            {slide?.note && (
              <p className="text-[11px] leading-snug mt-2.5" style={{ color: "var(--muted)" }}>
                <span className="font-bold uppercase tracking-wider mr-1">say</span>{slide.note}
              </p>
            )}
          </div>

          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              {cursors.length} slides
            </span>
            <button
              onClick={() => (confirm === index ? deleteSlide(index) : setConfirm(index))}
              onBlur={() => setConfirm(null)}
              disabled={cursors.length <= 1}
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
              style={confirm === index
                ? { background: "var(--clay)", color: "#fff" }
                : { color: "var(--clay)", border: "1.5px solid var(--line)" }}>
              {confirm === index ? "sure?" : "delete this slide"}
            </button>
          </div>
          {confirm === index && slide?.structural && (
            <p className="px-4 pb-2 text-[11px]" style={{ color: "var(--clay)" }}>
              This one advances the algorithm — the slides after it depend on what it does.
            </p>
          )}

          <ol className="flex-1 overflow-auto px-2 pb-4">
            {cursors.map((c, i) => {
              const s = deck.sections[c.section].slides[c.slide];
              return (
                <li key={s.id}>
                  {c.slide === 0 && (
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] mt-3 mb-1 px-2"
                      style={{ color: "var(--terracotta)" }}>
                      {deck.sections[c.section].kind}
                    </div>
                  )}
                  <button onClick={() => api.goto(i)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs flex gap-2 items-baseline"
                    style={{
                      background: i === index ? "var(--surface)" : "transparent",
                      border: `2px solid ${i === index ? "var(--terracotta)" : "transparent"}`,
                    }}>
                    <span className="mono opacity-50 w-6 shrink-0">{i + 1}</span>
                    <span className="truncate flex-1">{s.label || <em style={{ color: "var(--muted)" }}>silent</em>}</span>
                    {s.structural && <span title="advances the algorithm" style={{ color: "var(--muted)" }}>⚙</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}

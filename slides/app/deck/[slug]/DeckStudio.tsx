"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Deck as DeckT } from "@/schema";
import { flatten } from "@/schema/deck";
import { Deck } from "@/deck/Deck";
import { useDeck } from "@/deck/useDeck";
import type { EditPath } from "@/deck/SlideView";
import { DataPanel } from "./DataPanel";
import type { ViewDecl } from "@/schema";

export function DeckStudio({ initial }: { initial: DeckT }) {
  const [deck, setDeck] = useState<DeckT>(initial);
  const [saved, setSaved] = useState<"clean" | "dirty" | "saving">("clean");
  const cursors = flatten(deck);
  const api = useDeck(cursors.length);
  const index = api.index;
  const [tab, setTab] = useState<"slide" | "data">("slide");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const cur = cursors[Math.min(index, cursors.length - 1)];
  const slide = cur ? deck.sections[cur.section].slides[cur.slide] : undefined;

  /** Text edits replace one field on one slide; structure is never touched here. */
  const applyEdit = useCallback((path: EditPath, value: string) => {
    setDeck((d) => {
      const next = structuredClone(d);
      const cs = flatten(next);
      const c = cs[path.index];
      if (!c) return d;
      const s = next.sections[c.section].slides[c.slide];
      if (path.kind === "label") s.label = value || undefined;
      if (path.kind === "note") s.note = value || undefined;
      return next;
    });
    setSaved("dirty");
  }, []);

  const uid = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  /**
   * Remove a slide. If it was the last one in its section, the section goes too —
   * the schema requires every section to have at least one slide.
   */
  const deleteSlide = useCallback((at: number) => {
    setDeck((d) => {
      const next = structuredClone(d);
      const c = flatten(next)[at];
      if (!c) return d;
      if (flatten(next).length <= 1) return d;          // never empty the deck
      const sec = next.sections[c.section];
      sec.slides.splice(c.slide, 1);
      if (sec.slides.length === 0) next.sections.splice(c.section, 1);
      return next;
    });
    setSaved("dirty");
    setConfirmDelete(null);
    api.goto(Math.max(0, at - 1));
  }, [api]);

  const duplicateSlide = useCallback((at: number) => {
    setDeck((d) => {
      const next = structuredClone(d);
      const c = flatten(next)[at];
      if (!c) return d;
      const sec = next.sections[c.section];
      sec.slides.splice(c.slide + 1, 0, { ...structuredClone(sec.slides[c.slide]), id: uid() });
      return next;
    });
    setSaved("dirty");
    api.goto(at + 1);
  }, [api]);

  /** A blank slide holds the picture exactly as it is — a pause to talk over. */
  const insertBlank = useCallback((at: number) => {
    setDeck((d) => {
      const next = structuredClone(d);
      const c = flatten(next)[at];
      if (!c) return d;
      next.sections[c.section].slides.splice(c.slide + 1, 0,
        { id: uid(), ops: [], label: "", structural: false });
      return next;
    });
    setSaved("dirty");
    api.goto(at + 1);
  }, [api]);

  /** Edit the data a view is built from — values, source, copy. */
  const editView = useCallback((id: string, patch: Partial<ViewDecl>) => {
    setDeck((d) => {
      const next = structuredClone(d);
      const i = next.views.findIndex((v) => v.id === id);
      if (i < 0) return d;
      next.views[i] = { ...next.views[i], ...patch } as ViewDecl;
      return next;
    });
    setSaved("dirty");
  }, []);

  // autosave shortly after you stop typing
  useEffect(() => {
    if (saved !== "dirty") return;
    const id = setTimeout(async () => {
      setSaved("saving");
      const r = await fetch("/api/deck", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: deck.meta.slug, deck }),
      });
      setSaved(r.ok ? "clean" : "dirty");
    }, 700);
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

      <div className="flex-1 min-h-0 grid lg:grid-cols-[1fr_340px]">
        <div className="min-h-0 p-4">
          <Deck deck={deck} api={api} editable onEdit={applyEdit}
            controls={(api) => (
              <div className="flex flex-col gap-3 items-center">
                <div className="flex items-center gap-2">
                  <button className="btn-ghost !py-1.5 !px-4" onClick={api.back} disabled={api.index === 0}>←</button>
                  <span className="mono text-sm w-24 text-center" style={{ color: "var(--muted)" }}>
                    {api.index + 1} / {api.total}
                  </span>
                  <button className="btn !py-1.5 !px-4" onClick={api.next} disabled={api.atEnd}>→</button>
                  <button className="btn-ghost !py-1.5 !px-3 text-sm" onClick={api.replay} title="replay the transition (R)">↻</button>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <button className="btn-ghost !py-1 !px-3 text-xs"
                    onClick={() => api.setAuto((a) => ({ ...a, on: !a.on }))}>
                    {api.auto.on ? "⏸ stop auto" : "▶ auto-advance"}
                  </button>
                  <input type="number" min={1} max={600} value={api.auto.seconds}
                    onChange={(e) => api.setAuto((a) => ({ ...a, seconds: Number(e.target.value) || 1 }))}
                    className="!w-20 !py-1 !px-2 text-center mono text-xs" />
                  <span style={{ color: "var(--muted)" }}>sec / slide</span>
                </div>

                <input type="range" min={0} max={Math.max(0, api.total - 1)} value={api.index}
                  onChange={(e) => api.goto(Number(e.target.value))} className="w-full max-w-lg" />
              </div>
            )} />
        </div>

        <aside className="border-l-2 p-4 overflow-auto min-h-0" style={{ borderColor: "var(--line)" }}>
          <div className="flex gap-1 mb-4">
            {(["slide", "data"] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)}
                className="flex-1 text-xs font-bold uppercase tracking-wider py-1.5 rounded-lg"
                style={{
                  background: tab === k ? "var(--terracotta)" : "transparent",
                  color: tab === k ? "#FFF6EC" : "var(--muted)",
                  border: `2px solid ${tab === k ? "var(--terracotta)" : "var(--line)"}`,
                }}>{k === "slide" ? "This slide" : "Data"}</button>
            ))}
          </div>

          {tab === "data" ? <DataPanel deck={deck} onChange={editView} /> : <>
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            <button className="btn-ghost !py-1 !px-1 text-[11px] whitespace-nowrap" onClick={() => duplicateSlide(index)}>
              Duplicate
            </button>
            <button className="btn-ghost !py-1 !px-1 text-[11px] whitespace-nowrap" onClick={() => insertBlank(index)}
              title="a slide that changes nothing — a pause to talk over">
              + Blank
            </button>
            <button
              className="btn-ghost !py-1 !px-1 text-[11px] whitespace-nowrap"
              style={confirmDelete === index
                ? { borderColor: "var(--clay)", color: "#FFF", background: "var(--clay)" }
                : { borderColor: "var(--line)", color: "var(--clay)" }}
              onClick={() => (confirmDelete === index ? deleteSlide(index) : setConfirmDelete(index))}
              onBlur={() => setConfirmDelete(null)}
              disabled={cursors.length <= 1}>
              {confirmDelete === index ? "Sure?" : "Delete"}
            </button>
          </div>
          {confirmDelete === index && slide?.structural && (
            <p className="text-[11px] mb-3" style={{ color: "var(--clay)" }}>
              This slide advances the algorithm — every slide after it depends on what it does.
              Deleting it will make the rest of the walkthrough wrong.
            </p>
          )}

          <h2 className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--muted)" }}>
            Presenter note
          </h2>
          <textarea
            value={slide?.note ?? ""}
            onChange={(e) => applyEdit({ kind: "note", index }, e.target.value)}
            placeholder="What you'll say over this slide…"
            className="text-sm" style={{ minHeight: 140, resize: "vertical" }} />

          <h2 className="text-xs font-bold uppercase tracking-[0.18em] mt-6 mb-2" style={{ color: "var(--muted)" }}>
            Slides
          </h2>
          <ol className="space-y-1">
            {cursors.map((c, i) => {
              const s = deck.sections[c.section].slides[c.slide];
              const first = c.slide === 0;
              return (
                <li key={s.id}>
                  {first && (
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] mt-3 mb-1" style={{ color: "var(--terracotta)" }}>
                      {deck.sections[c.section].kind}
                    </div>
                  )}
                  <button onClick={() => api.goto(i)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs flex gap-2"
                    style={{
                      background: i === index ? "var(--surface)" : "transparent",
                      border: `2px solid ${i === index ? "var(--terracotta)" : "transparent"}`,
                    }}>
                    <span className="mono opacity-50 w-6 shrink-0">{i + 1}</span>
                    <span className="truncate">{s.label || <em style={{ color: "var(--muted)" }}>—</em>}</span>
                    {s.structural && <span title="advances the algorithm — don't reorder" style={{ color: "var(--muted)" }}>⚙</span>}
                  </button>
                </li>
              );
            })}
          </ol>
          </>}
        </aside>
      </div>
    </div>
  );
}

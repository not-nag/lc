"use client";
import React from "react";
import type { Deck as DeckT, ViewDecl } from "@/schema";

const parseVals = (s: string) =>
  s.split(",").map((x) => x.trim()).filter((x) => x !== "")
   .map((x) => (x !== "" && !Number.isNaN(Number(x)) ? Number(x) : x));

/**
 * Do any slides act on this view? Then its ops AND the labels around them were
 * derived from the current values, and editing those values desyncs both.
 */
function isDriven(deck: DeckT, id: string) {
  return deck.sections.some((s) => s.slides.some((sl) =>
    (sl.ops as any[]).some((o) => o.view === id)));
}

const Field: React.FC<{ label: string; children: React.ReactNode; warn?: string }> = ({ label, children, warn }) => (
  <label className="block mb-3">
    <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>{label}</span>
    <div className="mt-1">{children}</div>
    {warn && <p className="text-[11px] mt-1" style={{ color: "var(--clay)" }}>{warn}</p>}
  </label>
);

/**
 * Edit the data the slides are built from — array values, the code snippet, panel copy.
 * Ops are recorded from a real algorithm run, so changing values a slide *acts on*
 * will not re-run that algorithm. The panel says so where it matters.
 */
export const DataPanel: React.FC<{
  deck: DeckT;
  onChange: (id: string, patch: Partial<ViewDecl>) => void;
}> = ({ deck, onChange }) => (
  <div>
    {deck.views.map((v) => {
      const driven = isDriven(deck, v.id);
      const warn = driven
        ? "slides act on these — editing them won't re-run the algorithm or update the slide text"
        : undefined;
      return (
        <section key={v.id} className="mb-5 pb-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-baseline justify-between mb-2">
            <span className="mono text-xs font-bold" style={{ color: "var(--terracotta)" }}>{v.id}</span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{v.kind}</span>
          </div>

          {"label" in v && (
            <Field label="caption">
              <input className="text-sm" value={(v as any).label ?? ""}
                onChange={(e) => onChange(v.id, { label: e.target.value } as any)} />
            </Field>
          )}

          {(v.kind === "array" || v.kind === "bars") && (
            <Field label="values" warn={warn}>
              <input className="text-sm mono" value={(v as any).values.join(", ")}
                onChange={(e) => onChange(v.id, { values: parseVals(e.target.value) } as any)} />
            </Field>
          )}

          {v.kind === "string" && (
            <Field label="text" warn={warn}>
              <input className="text-sm mono" value={v.value}
                onChange={(e) => onChange(v.id, { value: e.target.value } as any)} />
            </Field>
          )}

          {(v.kind === "stack" || v.kind === "queue") && (
            <Field label="initial values" warn={warn}>
              <input className="text-sm mono" value={v.values.join(", ")}
                onChange={(e) => onChange(v.id, { values: parseVals(e.target.value) } as any)} />
            </Field>
          )}

          {v.kind === "grid" && (
            <Field label="rows — one per line" warn={warn}>
              <textarea className="text-sm mono" style={{ minHeight: 90 }}
                value={v.cells.map((r) => r.join(", ")).join("\n")}
                onChange={(e) => onChange(v.id, { cells: e.target.value.split("\n").map(parseVals) } as any)} />
            </Field>
          )}

          {v.kind === "code" && (
            <Field label="source">
              <textarea className="text-xs mono" style={{ minHeight: 150 }} value={v.source}
                onChange={(e) => onChange(v.id, { source: e.target.value } as any)} />
            </Field>
          )}

          {v.kind === "text" && (
            <>
              <Field label="heading">
                <input className="text-sm" value={v.title ?? ""}
                  onChange={(e) => onChange(v.id, { title: e.target.value || undefined } as any)} />
              </Field>
              <Field label="lines — one per line">
                <textarea className="text-sm" style={{ minHeight: 80 }} value={v.body.join("\n")}
                  onChange={(e) => onChange(v.id, { body: e.target.value.split("\n").filter((x) => x !== "") } as any)} />
              </Field>
            </>
          )}
        </section>
      );
    })}
  </div>
);

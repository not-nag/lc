"use client";
import { useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Video } from "@/remotion/Video";
import { compile } from "@/engine/compile";
import { validate } from "@/lib/validate";
import type { Storyboard } from "@/schema";

export function StudioClient({ storyboard }: { storyboard: Storyboard }) {
  const [text, setText] = useState(() => JSON.stringify(storyboard, null, 2));
  const [applied, setApplied] = useState<Storyboard>(storyboard);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const player = useRef<PlayerRef>(null);

  const tl = useMemo(() => compile(applied), [applied]);

  function apply() {
    let raw: unknown;
    try { raw = JSON.parse(text); }
    catch (e: any) { setMsg(`JSON error: ${e.message}`); return; }
    const v = validate(raw);
    if (!v.ok) { setMsg(v.report || "invalid storyboard"); return; }
    setApplied(v.storyboard!);
    setMsg(v.issues.length ? v.report : `✓ valid · ${v.stats!.seconds.toFixed(1)}s`);
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch("/api/storyboard", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: applied.meta.slug, storyboard: JSON.parse(text) }),
      });
      const j = await r.json();
      setMsg(j.ok ? `✓ saved storyboards/${applied.meta.slug}.json` : `save failed: ${j.error}`);
    } catch (e: any) { setMsg(String(e.message)); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-7 items-start">
      <div className="lg:sticky lg:top-6">
        <div className="card p-3 overflow-hidden">
          <Player
            ref={player}
            component={Video as any}
            inputProps={{ storyboard: applied } as any}
            durationInFrames={tl.totalFrames}
            fps={tl.fps}
            compositionWidth={tl.width}
            compositionHeight={tl.height}
            style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
            controls loop acknowledgeRemotionLicense
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm" style={{ color: "var(--muted)" }}>
          <span className="mono">{tl.seconds.toFixed(1)}s</span><span>·</span>
          <span>{tl.totalFrames} frames</span><span>·</span>
          <span>{applied.scenes.length} scenes</span>
        </div>
        <div className="mt-4 space-y-1.5">
          {tl.scenes.map((s) => (
            <button key={s.id} onClick={() => player.current?.seekTo(s.from)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between hover:brightness-95"
              style={{ background: "var(--surface)", border: "2px solid var(--line)" }}>
              <span className="font-semibold">{s.kind}</span>
              <span className="mono" style={{ color: "var(--muted)" }}>
                {(s.from / tl.fps).toFixed(1)}s · {s.steps.length} steps
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {applied.meta.title}
          </h1>
          <div className="flex gap-2">
            <button className="btn-ghost !py-2 !px-4 text-sm" onClick={apply}>Apply</button>
            <button className="btn !py-2 !px-4 text-sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save to disk"}
            </button>
          </div>
        </div>
        {msg && (
          <pre className="mono text-xs p-3 rounded-lg mb-3 whitespace-pre-wrap"
            style={{ background: msg.startsWith("✓") ? "#E4EFDC" : "#F7DFD8",
              color: msg.startsWith("✓") ? "var(--sage)" : "var(--clay)" }}>{msg}</pre>
        )}
        <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false}
          className="mono text-xs leading-relaxed" style={{ height: "70vh", resize: "vertical" }} />
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Edit, Apply to preview, Save to write it back. Patch rather than regenerate — manual pacing fixes are the point.
        </p>
      </div>
    </div>
  );
}

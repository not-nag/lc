import Link from "next/link";
import { Shell } from "./components/Shell";
import { ALL_STORYBOARDS } from "@/lib/storyboards";
import { compile } from "@/engine/compile";
import { renderInfo } from "@/lib/renders";

export const dynamic = "force-dynamic";

export default function Home() {
  const rows = ALL_STORYBOARDS.map((sb) => ({ sb, tl: compile(sb), r: renderInfo(sb.meta.slug) }));
  const rendered = rows.filter((x) => x.r.exists).length;

  return (
    <Shell>
      <div className="flex items-baseline justify-between mb-7">
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Videos
        </h1>
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          {rendered} of {rows.length} rendered
        </span>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {rows.map(({ sb, tl, r }) => (
          <article key={sb.meta.slug} className="card p-4">
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--paper-deep)", aspectRatio: "9/16" }}>
              {r.exists ? (
                <video src={`/api/video/${sb.meta.slug}`} controls playsInline preload="metadata"
                  className="w-full h-full object-contain" style={{ background: "var(--paper-deep)" }} />
              ) : (
                <div className="w-full h-full grid place-items-center text-center px-6 text-sm"
                  style={{ color: "var(--muted)" }}>
                  not rendered yet
                  <br />
                  <code className="text-xs mt-2 inline-block">npm run render -- {sb.meta.slug}</code>
                </div>
              )}
            </div>

            <header className="mt-4 flex items-baseline justify-between gap-3">
              <h2 className="font-bold text-xl leading-tight">
                <span className="mono text-sm mr-2" style={{ color: "var(--terracotta)" }}>#{sb.meta.number ?? "—"}</span>
                {sb.meta.title}
              </h2>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
                style={{ background: "var(--paper-deep)", color: "var(--ink-soft)" }}>{sb.meta.difficulty}</span>
            </header>

            <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-sm" style={{ color: "var(--muted)" }}>
              <dt>Runtime</dt><dd className="mono text-right">{tl.seconds.toFixed(1)}s</dd>
              <dt>Steps</dt><dd className="mono text-right">{sb.scenes.reduce((n, s) => n + s.steps.length, 0)}</dd>
              <dt>Pattern</dt><dd className="mono text-right truncate">{sb.meta.pattern ?? "—"}</dd>
              {r.exists && (<><dt>File</dt><dd className="mono text-right">{r.mb!.toFixed(1)} MB</dd></>)}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link href={`/studio/${sb.meta.slug}`} className="btn-ghost !py-1.5 !px-3">Preview & edit</Link>
              {r.exists && (
                <a href={`/api/video/${sb.meta.slug}`} download={`${sb.meta.slug}.mp4`} className="btn-ghost !py-1.5 !px-3">
                  Download
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      {rows.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          No storyboards yet. Ask Claude Code to generate one, then <code>npm run traces</code>.
        </p>
      )}
    </Shell>
  );
}

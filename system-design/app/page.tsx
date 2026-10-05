import Link from "next/link";
import { listDecks } from "@/lib/decks";
import { flatten } from "@/schema/deck";

export const dynamic = "force-dynamic";

export default function Home() {
  const decks = listDecks();
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        System design <span style={{ color: "var(--terracotta)" }}>Slides</span>
      </h1>
      <p className="mt-2 mb-8" style={{ color: "var(--ink-soft)" }}>
        Self-paced design decks: start simple, break it with a number, fix exactly that. Arrow keys to move, <span className="mono">R</span> to replay a transition,
        <span className="mono"> A</span> for auto-advance. Click any label to edit it.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((d) => (
          <Link key={d.meta.slug} href={`/deck/${d.meta.slug}`} className="card p-5 block hover:-translate-y-0.5 transition-transform">
            <div className="flex items-baseline justify-between">
              <span className="mono text-sm" style={{ color: "var(--terracotta)" }}>{d.meta.number ? `#${d.meta.number}` : "system"}</span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: "var(--paper-deep)", color: "var(--ink-soft)" }}>{d.meta.difficulty}</span>
            </div>
            <div className="font-bold text-xl mt-1.5">{d.meta.title}</div>
            <div className="text-sm mt-3 flex gap-2" style={{ color: "var(--muted)" }}>
              <span>{flatten(d).length} slides</span><span>·</span>
              <span className="mono">{d.meta.pattern ?? "—"}</span>
            </div>
          </Link>
        ))}
        {decks.length === 0 && (
          <p style={{ color: "var(--muted)" }}>No decks yet. Add a trace and run <code>npm run decks</code>.</p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto px-6 py-7 flex items-center justify-between">
        <Link href="/" className="text-[1.5rem] font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}>
          LeetCode <span style={{ color: "var(--terracotta)" }}>in 100s</span>
        </Link>
        <span className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "var(--muted)" }}>
          internal
        </span>
      </header>
      <main className="max-w-6xl mx-auto px-6 pb-24">{children}</main>
      <footer className="max-w-6xl mx-auto px-6 py-8 text-sm border-t-2"
        style={{ color: "var(--muted)", borderColor: "var(--line)" }}>
        Generate from Claude Code. <code>npm run traces</code> → <code>npm run render -- &lt;slug&gt;</code>
      </footer>
    </div>
  );
}

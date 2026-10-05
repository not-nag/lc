import type { ArchState } from "@/engine/state";

/** A laid-out box, by its centre. */
export type Box = { x: number; y: number; w: number; h: number };
export type ArchLayout = { boxes: Map<string, Box>; columns: Map<number, number> };

export const ARCH_PAD = { x: 56, top: 70, bottom: 76 };

/**
 * Tiers become columns, left to right — only the tiers in use, so a three-box first build
 * fills the pane and the columns slide apart when a new tier arrives. Within a column, boxes
 * stack top to bottom by `row` (explicit) or arrival order. `x`/`y` (0..1) override both.
 */
export function layoutArch(s: ArchState, W: number, H: number): ArchLayout {
  const free = s.nodes.filter((n) => n.x === undefined || n.y === undefined);
  const tiers = [...new Set(free.map((n) => n.tier))].sort((a, b) => a - b);
  const C = Math.max(1, tiers.length);
  const innerW = W - ARCH_PAD.x * 2, innerH = H - ARCH_PAD.top - ARCH_PAD.bottom;
  const colW = innerW / Math.max(C, 2);
  const x0 = ARCH_PAD.x + (innerW - colW * C) / 2;

  const slotOf = new Map<string, number>();
  const slotsIn = new Map<number, number>();
  for (const tier of tiers) {
    const inTier = free.filter((n) => n.tier === tier);
    const used = new Set<number>();
    for (const n of inTier) if (n.row !== undefined) { slotOf.set(n.id, n.row); used.add(Math.floor(n.row)); }
    let k = 0;
    for (const n of inTier) if (n.row === undefined) { while (used.has(k)) k++; slotOf.set(n.id, k); used.add(k); }
    slotsIn.set(tier, Math.max(inTier.length, ...[...used].map((r) => r + 1)));
  }
  const maxSlots = Math.max(1, ...slotsIn.values());

  const bw = Math.min(320, colW * 0.56);
  const bh = Math.max(84, Math.min(132, (innerH / maxSlots) * 0.58));

  const boxes = new Map<string, Box>();
  const columns = new Map<number, number>();
  tiers.forEach((tier, ci) => columns.set(tier, x0 + colW * (ci + 0.5)));
  for (const n of s.nodes) {
    if (n.x !== undefined && n.y !== undefined) { boxes.set(n.id, { x: n.x * W, y: n.y * H, w: bw, h: bh }); continue; }
    const slots = slotsIn.get(n.tier) ?? 1;
    const slot = slotOf.get(n.id) ?? 0;
    boxes.set(n.id, {
      x: columns.get(n.tier)!,
      y: ARCH_PAD.top + ((slot + 0.5) / slots) * innerH,
      w: bw, h: bh,
    });
  }
  return { boxes, columns };
}

export const lerpBox = (a: Box | undefined, b: Box, t: number): Box => a
  ? { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t }
  : b;

/** Where the line from a box's centre towards (dx, dy) leaves the box, plus a margin. */
export function exitPoint(b: Box, dx: number, dy: number, margin = 0) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const tx = ux === 0 ? Infinity : (b.w / 2) / Math.abs(ux);
  const ty = uy === 0 ? Infinity : (b.h / 2) / Math.abs(uy);
  const d = Math.min(tx, ty) + margin;
  return { x: b.x + ux * d, y: b.y + uy * d };
}

/** The visible segment of an arrow between two boxes. */
export function edgeSegment(a: Box, b: Box, tipMargin = 10) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const p = exitPoint(a, dx, dy, 4);
  const q = exitPoint(b, -dx, -dy, tipMargin);
  return { x1: p.x, y1: p.y, x2: q.x, y2: q.y };
}

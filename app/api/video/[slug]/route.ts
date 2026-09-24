import { createReadStream, statSync, existsSync } from "node:fs";
import { Readable } from "node:stream";

export const runtime = "nodejs";

/** Serves renders/<slug>.mp4 with Range support so the browser can seek. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) return new Response("bad slug", { status: 400 });

  const file = `renders/${slug}.mp4`;
  if (!existsSync(file)) return new Response("not rendered yet", { status: 404 });

  const size = statSync(file).size;
  const range = req.headers.get("range");
  const base = { "Content-Type": "video/mp4", "Accept-Ranges": "bytes" };

  if (!range) {
    const s = createReadStream(file);
    return new Response(Readable.toWeb(s) as ReadableStream, {
      headers: { ...base, "Content-Length": String(size) },
    });
  }

  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const start = m?.[1] ? Number(m[1]) : 0;
  const end = m?.[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });

  const s = createReadStream(file, { start, end });
  return new Response(Readable.toWeb(s) as ReadableStream, {
    status: 206,
    headers: { ...base, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${size}` },
  });
}

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Problem = {
  number: number; slug: string; title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  statement: string; example?: string; topics: string[];
};

const CACHE = ".cache/problems";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36";

const cached = (k: string) => {
  const f = join(CACHE, `${k}.json`);
  return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as Problem) : null;
};
const store = (k: string, p: Problem) => {
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(join(CACHE, `${k}.json`), JSON.stringify(p, null, 2));
};

/** number → slug, via the public problem index (cached on disk after the first call). */
async function slugForNumber(n: number): Promise<string> {
  const idx = join(CACHE, "_index.json");
  let map: Record<string, string>;
  if (existsSync(idx)) map = JSON.parse(readFileSync(idx, "utf8"));
  else {
    const r = await fetch("https://leetcode.com/api/problems/all/", { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error(`leetcode index HTTP ${r.status}`);
    const j = (await r.json()) as any;
    map = {};
    for (const p of j.stat_status_pairs) map[String(p.stat.frontend_question_id)] = p.stat.question__title_slug;
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(idx, JSON.stringify(map));
  }
  const slug = map[String(n)];
  if (!slug) throw new Error(`no LeetCode problem with number ${n}`);
  return slug;
}

const html2text = (h: string) =>
  h.replace(/<sup>(\d+)<\/sup>/g, "^$1")
   .replace(/<[^>]+>/g, "")
   .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
   .replace(/\n{3,}/g, "\n\n").trim();

export async function fetchProblem(ref: number | string): Promise<Problem> {
  const key = String(ref);
  const hit = cached(key);
  if (hit) return hit;

  const slug = typeof ref === "number" ? await slugForNumber(ref) : ref;
  const r = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA, Referer: `https://leetcode.com/problems/${slug}/` },
    body: JSON.stringify({
      operationName: "questionData",
      variables: { titleSlug: slug },
      query: `query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) {
        questionFrontendId title titleSlug difficulty content topicTags { name } } }`,
    }),
  });
  if (!r.ok) throw new Error(`leetcode graphql HTTP ${r.status}`);
  const q = (await r.json())?.data?.question;
  if (!q) throw new Error(`problem "${slug}" not found`);

  const text = html2text(q.content ?? "");
  const exIdx = text.search(/Example\s*1/i);
  const conIdx = text.search(/Constraints:/i);
  const problem: Problem = {
    number: Number(q.questionFrontendId), slug: q.titleSlug, title: q.title,
    difficulty: q.difficulty,
    statement: (exIdx > 0 ? text.slice(0, exIdx) : text).trim(),
    example: exIdx > 0 ? text.slice(exIdx, conIdx > exIdx ? conIdx : undefined).trim().slice(0, 700) : undefined,
    topics: (q.topicTags ?? []).map((t: any) => t.name),
  };
  store(key, problem); store(problem.slug, problem);
  return problem;
}

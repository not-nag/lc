import { si, rate, bytes, commas, DAY, type Tracer } from "@/tracer/tracer";
import type { MetaInput } from "@/schema";

export const meta: MetaInput = {
  slug: "url-shortener", title: "Design a URL shortener", difficulty: "Medium",
  pattern: "read-heavy",
  tagline: "long links, short attention spans",
};

const API = `POST /urls   {"long_url": "https://…"}
  → 201  {"code": "x7Kp2Qa"}

GET  /x7Kp2Qa
  → 302  Location: https://…`;

const SCHEMA = `CREATE TABLE urls (
  code        CHAR(7) PRIMARY KEY,
  long_url    TEXT NOT NULL,
  created_at  TIMESTAMP
);`;

export function trace(t: Tracer) {
  /**
   * Every figure on screen is computed from these. Change an assumption and the whole deck
   * re-derives — the numbers can't drift out of step with each other.
   */
  const NEW_PER_DAY = 100e6;
  const READS_PER_WRITE = 100;
  const ROW = 500;              // bytes: 7 code + ~400 url + 8 timestamp + index overhead
  const YEARS = 5;
  const APP_LIMIT = 20_000;     // redirects/s one app server serves
  const DB_LIMIT = 20_000;      // point reads/s one database serves
  const HIT = 0.9;              // cache hit rate — clicks are heavily skewed to hot links
  const DISK = 10e12;           // what one database node comfortably holds
  const RANGE = 1000;           // ids a key-service call reserves

  const writes = NEW_PER_DAY / DAY;
  const reads = writes * READS_PER_WRITE;
  const links = NEW_PER_DAY * 365 * YEARS;
  const storage = links * ROW;
  const keyspace = 62 ** 7;
  const servers = Math.ceil(reads / APP_LIMIT);
  const dbReads = reads * (1 - HIT);
  const shards = Math.ceil(storage / DISK);

  /* ── hook ───────────────────────────────────────────── */
  t.section("hook");
  t.say("Paste a long link, get seven characters back — and those seven characters have to work for years.");
  t.slide("7 characters. Any link. For years.");

  /* ── the problem ────────────────────────────────────── */
  t.spec("api", API, "http", "the API");
  t.section("problem", { show: ["api"] });
  t.line(1, 2);
  t.say("Two endpoints. You hand us a long link, we hand you back a seven-character code.");
  t.slide("long link in, 7-char code out");
  t.line(4, 5);
  t.say("Anyone who visits the code gets bounced to the long link. That's the whole product.");
  t.slide("code in, redirect out");

  t.text("reqs", "Three requirements drive everything", [
    "Redirects are fast — someone is waiting on a click",
    "A code never collides and never changes",
    `Links live for ${YEARS} years`,
  ], "bullets");
  t.section("problem", { show: ["reqs"] });
  t.say("Three requirements drive every decision from here. Redirects are fast, because a person is waiting. A code never collides or changes. And links live for five years.");
  t.slide();

  /* ── the estimate: the numbers that make the rest non-arbitrary ── */
  t.spec("schema", SCHEMA, "sql", "one table");
  t.numbers("est");
  t.section("estimate", { show: [["schema", "est"]] });

  t.number("new links / day", si(NEW_PER_DAY), "the one assumption");
  t.say("Assume a hundred million new links a day. Everything else falls out of that one guess.");
  t.slide("assume 100M new links a day");

  t.number("writes / s", rate(writes), `100M ÷ ${commas(DAY)} s`);
  t.say("A day is eighty-six thousand four hundred seconds, so that's about twelve hundred writes a second. Not much.");
  t.slide(`100M ÷ ${commas(DAY)} ≈ ${rate(writes)}`);

  t.number("reads : writes", `${READS_PER_WRITE} : 1`, "made once, clicked often");
  t.say("But a link is made once and clicked over and over. Call it a hundred clicks per link.");
  t.slide(`each link is clicked ~${READS_PER_WRITE}×`);

  t.number("reads / s", rate(reads), `${rate(writes)} × ${READS_PER_WRITE}`);
  t.say("So redirects run at about a hundred and sixteen thousand a second. That's the number that shapes this design.");
  t.slide(`${si(writes)} × ${READS_PER_WRITE} ≈ ${rate(reads)}`);

  t.line(2, 3, 4);
  t.number("row size", `~${ROW} B`, "7 + ~400 + 8 + index");
  t.say("Each row is a code, a long URL, and a timestamp. Around five hundred bytes with the index.");
  t.slide(`one row ≈ ${ROW} bytes`);

  t.number(`storage, ${YEARS} yrs`, bytes(storage), `${si(links)} links × ${ROW} B`);
  t.say("Five years of links is a hundred and eighty billion rows. Ninety-one terabytes.");
  t.slide(`${si(links)} links × ${ROW} B ≈ ${bytes(storage)}`);

  t.line(2);
  t.number("7-char codes", si(keyspace), `62⁷ ≫ ${si(links)} links`);
  t.say("And is seven characters enough? Sixty-two symbols, seven places: three and a half trillion codes. Plenty.");
  t.slide(`62⁷ = ${si(keyspace)} codes — plenty`);

  t.callout("Reads outnumber writes 100 to 1 — design for the read", "insight");
  t.say("If you remember one number from this slide: a hundred reads for every write. Design for the read.");
  t.slide();

  /* ── the walkthrough: start naive, break it, fix exactly that ── */
  const s = t.system("arch");
  const load = t.numbers("load");
  t.section("walkthrough", { show: ["arch", "load"] });

  s.node("client", "Client", { tier: 0, kind: "client", sub: "browser" });
  t.say("Start with the simplest thing that could possibly work. A browser…");
  t.slide("a browser");

  s.node("app", "App server", { tier: 2 });
  s.edge("client", "app");
  t.say("…one app server…");
  t.slide("one app server");

  s.node("db", "Database", { tier: 3, kind: "store", sub: "Postgres" });
  s.edge("app", "db");
  t.say("…and one database with that single table.");
  t.slide("one database");

  const naive = s.request("GET /x7Kp2Qa", ["client", "app", "db", "app", "client"]);
  t.say("Follow one click through it.");
  t.slide("one click: GET /x7Kp2Qa");
  naive.step();
  t.say("The app server gets the code…");
  t.slide("the app server gets the code");
  naive.step();
  t.say("…and looks it up by primary key. One row.");
  t.slide("look up x7Kp2Qa by primary key");
  naive.step(2, "302");
  t.say("The long URL comes back, and the browser is redirected.");
  t.slide("302 → the long URL");

  naive.done();
  t.aside("Ships Friday. Fine until Monday.");
  t.say("Three boxes, and it works. For about one user.");
  t.slide();

  /* round 1 — the app server */
  s.label("client", "app", rate(reads));
  t.say("Now bring in the estimate: a hundred and sixteen thousand redirects a second, all landing on this one box.");
  t.slide(`${rate(reads)} arrive at one box`);

  load.set("one app server", `~${rate(APP_LIMIT)}`, "benchmarked");
  t.say("A decent app server does maybe twenty thousand of these a second.");
  t.slide(`one server handles ~${rate(APP_LIMIT)}`);

  s.bottleneck("app", `${si(reads)} vs ${si(APP_LIMIT)}/s`);
  t.say("So it's six times over. CPU pins at a hundred percent and requests start queueing. First bottleneck.");
  t.slide(`${si(reads)} ÷ ${si(APP_LIMIT)} ≈ ${servers}× over`);

  s.replicas("app", servers);
  t.say("The app server holds no state of its own — every answer comes from the database — so just run six of them.");
  t.slide(`run ${servers} app servers`);

  s.resolve(`${rate(reads / servers)} each`);
  t.say("Six servers, about nineteen thousand each. Under the limit.");
  t.slide(`${si(reads)} ÷ ${servers} ≈ ${si(reads / servers)} each ✓`);

  s.bottleneck("client", `${servers} servers · 1 address`);
  t.say("But the browser only knows one hostname. Which of the six does it call? And when one dies, who stops sending it traffic?");
  t.slide(`which of the ${servers}?`);

  s.insert("lb", "Load balancer", ["client", "app"], { tier: 1, kind: "edge", labelOut: `÷ ${servers}` });
  t.say("A load balancer owns the one address and spreads requests across all six, skipping any that fail a health check.");
  t.slide("a load balancer spreads the load");

  s.resolve(`1 address · ${servers} servers`);
  t.say("One address outside, six servers inside.");
  t.slide(`one address, ${servers} servers ✓`);

  /* round 2 — database reads */
  s.label("app", "db", rate(reads));
  t.say("But every one of those redirects still does a lookup in the one database.");
  t.slide("every redirect reads the database");

  load.set("one database", `~${rate(DB_LIMIT)}`, "point reads");
  t.say("And one database manages about twenty thousand point reads a second.");
  t.slide(`one database: ~${si(DB_LIMIT)} reads/s`);

  s.bottleneck("db", `${si(reads)} vs ${si(DB_LIMIT)}/s`);
  t.say("Same problem, one tier down. We could copy the database six times — but that's six full copies of everything, to serve clicks that are mostly for the same few links.");
  t.slide(`${si(reads)} vs ${si(DB_LIMIT)} — ${servers}× over again`);

  t.callout("A few links get most of the clicks", "insight");
  t.say("Because that's the thing about links. A small number of them get almost all the clicks — the same codes, looked up over and over.");
  t.slide("the same codes, over and over");

  s.node("cache", "Cache", { tier: 3, row: 0, kind: "cache", sub: "Redis · memory" });
  s.edge("app", "cache", rate(reads));
  t.say("So keep the hot ones in memory. The app checks the cache first and only goes to the database on a miss.");
  t.slide("check a cache first");

  load.set("cache hit rate", `${HIT * 100}%`, "hot links stay in memory");
  t.say("With clicks that skewed, nine lookups in ten find the code already in the cache.");
  t.slide("9 in 10 lookups hit the cache");

  s.label("app", "db", rate(dbReads));
  t.say("Only the misses reach the database. Ten percent of a hundred and sixteen thousand.");
  t.slide(`${si(reads)} × ${Math.round((1 - HIT) * 100)}% = ${rate(dbReads)}`);

  s.resolve(`${si(dbReads)} < ${si(DB_LIMIT)}/s`);
  t.say("Eleven and a half thousand. Comfortably under twenty.");
  t.slide(`${si(dbReads)} < ${si(DB_LIMIT)} ✓`);

  /* round 3 — storage */
  load.set(`storage, ${YEARS} yrs`, bytes(storage), "from the estimate");
  t.say("Now the other number from the estimate. Five years of links is ninety-one terabytes, and all of it lives in that one database.");
  t.slide(`${YEARS} years of links: ${bytes(storage)}`);

  load.set("one node holds", `~${bytes(DISK)}`, "comfortably");
  t.say("One database node comfortably holds maybe ten.");
  t.slide(`one node holds ~${bytes(DISK)}`);

  s.bottleneck("db", `${bytes(storage)} vs ${bytes(DISK)}`);
  t.say("Nine times over. It doesn't fit.");
  t.slide(`${bytes(storage)} won't fit on one node`);

  s.replicas("db", shards, "shards");
  t.say("So split it. Shard by code: hash the code to pick one of ten databases. A lookup still touches exactly one of them.");
  t.slide(`shard by code: hash(code) % ${shards}`);

  s.resolve(`${bytes(storage / shards)} each`);
  t.say("About nine terabytes each. It fits.");
  t.slide(`${bytes(storage)} ÷ ${shards} ≈ ${bytes(storage / shards)} each ✓`);

  /* round 4 — where codes come from */
  t.say("One thing we skipped: where do codes come from? So far, the database's auto-increment id, written in base sixty-two.");
  t.hold("code = base62(next id)");

  s.bottleneck("db", `${shards} shards · ${shards} counters`);
  t.say("With ten shards there are ten counters. Shard three and shard seven both hand out id one thousand — the same code for two different links.");
  t.slide(`${shards} counters → duplicate codes`);

  s.node("keys", "Key service", { tier: 2, row: 1, sub: "hands out ranges" });
  s.edge("app", "keys", `${si(writes / RANGE)} calls/s`);
  t.say("One small service owns the counter. Each app server reserves a block of a thousand ids at a time and hands them out locally.");
  t.slide(`reserve ids ${commas(RANGE)} at a time`);

  s.resolve("ranges never overlap");
  t.say("Blocks never overlap, so codes never collide. And at twelve hundred writes a second that's about one call a second — this box will never be the bottleneck.");
  t.slide(`${rate(writes)} ÷ ${commas(RANGE)} ≈ 1 call/s ✓`);

  /* the same click, through the finished design */
  const click = s.request("GET /x7Kp2Qa", ["client", "lb", "app", "cache", "app", "lb", "client"]);
  t.say("Now follow the same click through what we built.");
  t.slide("the same click, again");
  click.to("lb");
  t.say("The load balancer picks one of the six app servers…");
  t.slide(`load balancer picks 1 of ${servers}`);
  click.to("app");
  t.say("…which asks the cache for x7Kp2Qa…");
  t.slide("app asks the cache");
  click.to("cache");
  t.say("…and nine times out of ten, it's there.");
  t.slide("cache hit — 9 in 10");
  click.to("client", "302");
  t.say("Straight back to the browser. The database never heard about it.");
  t.slide("302 — the database never knew");

  click.done();
  t.say("Six boxes. Every one of them is there because a number said so.");
  t.slide("every box answered a number");

  /* ── trade-offs: where you'd choose differently ─────── */
  const codes = t.compare("codes", [
    { id: "hash", title: "Hash the URL", sub: "md5(url)[:7]" },
    { id: "counter", title: "One counter", sub: "base62(id)" },
    { id: "ranges", title: "Key ranges", sub: "1,000 at a time" },
  ], { label: "where codes come from" });
  t.section("tradeoffs", { show: ["codes"] });

  codes.row("Collisions", { hash: ["possible — retry", "bad"], counter: ["never", "good"], ranges: ["never", "good"] });
  t.say("Three ways to mint a code. Hashing the URL can collide — seven characters of a hash isn't unique — so every write has to check and retry.");
  t.slide("7 chars of a hash can collide");

  codes.row("Coordination", { hash: ["none", "good"], counter: ["every write", "bad"], ranges: [`1 call / ${commas(RANGE)}`, "good"] });
  t.say("A single counter never collides, but every write in the system waits on the same row.");
  t.slide("one counter: every write, one row");

  codes.row("Same URL → same code", { hash: ["free", "good"], counter: ["no", "meh"], ranges: ["no", "meh"] });
  t.say("Hashing does give you something for free: shorten the same URL twice and you get the same code.");
  t.slide("a hash dedupes for free");

  codes.row("Guessable", { hash: ["no", "good"], counter: ["sequential", "bad"], ranges: ["within a block", "meh"] });
  t.say("And counters are guessable. Anyone can walk the codes in order and scrape every link.");
  t.slide("counters can be walked in order");

  codes.pick("ranges", "our pick");
  t.say("At our numbers — ten shards, twelve hundred writes a second — ranges win. No collisions, almost no coordination.");
  t.slide("ranges: no collisions, ~no coordination");

  codes.pick("hash", "if duplicates cost you");
  t.say("But if the same few URLs get shortened millions of times — a marketing platform, say — hashing's free dedupe is worth the collision checks.");
  t.slide("dedupe matters more? hash instead");

  const redirect = t.compare("redirect", [
    { id: "perm", title: "301", sub: "Moved Permanently" },
    { id: "temp", title: "302", sub: "Found" },
  ], { label: "which redirect" });
  t.section("tradeoffs", { show: ["redirect"] });

  redirect.row("Browser caches it", { perm: ["yes, forever", "good"], temp: ["no", "bad"] });
  t.say("The last choice is the redirect itself. A 301 gets cached by the browser; a 302 doesn't.");
  t.slide("a 301 is cached by the browser");

  redirect.row("Load on us", { perm: ["first click only", "good"], temp: ["every click", "bad"] });
  t.say("So with a 302, every click comes back to us. That's the hundred and sixteen thousand a second.");
  t.slide("302: every click comes back to us");

  redirect.row("Click analytics", { perm: ["lost", "bad"], temp: ["every click", "good"] });
  t.say("Which is exactly how you count clicks.");
  t.slide("…which is how you count clicks");

  redirect.row("Change the target", { perm: ["too late", "bad"], temp: ["any time", "good"] });
  t.aside("301: a promise browsers take literally.");
  t.say("And a 301 can't be taken back. Point it somewhere wrong and browsers remember.");
  t.slide("a 301 can't be taken back");

  redirect.pick("temp", "clicks are the product");
  t.say("If clicks are the product, it's a 302 — and that's why we built for every click.");
  t.slide("counting clicks? 302");

  /* ── intuition ──────────────────────────────────────── */
  t.text("otext", "Intuition", [
    "It's one lookup, read 100× per write.",
    "Cache the lookup, shard the table, and never let two servers mint the same code.",
  ], "big");
  t.section("intuition", { show: ["otext"] });
  t.say("It's one lookup, read a hundred times for every write. Cache the lookup, shard the table, and never let two servers mint the same code.");
  t.slide();
  t.say("That's a URL shortener.");
  t.slide("cache · shard · hand out ranges");
}

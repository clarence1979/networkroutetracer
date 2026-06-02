import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROUPS: Array<{ name: string; category: string; limit: number }> = [
  { name: "stations",           category: "station",       limit: 15 },
  { name: "gps-ops",            category: "navigation",    limit: 35 },
  { name: "glonass-ops",        category: "navigation",    limit: 30 },
  { name: "galileo",            category: "navigation",    limit: 30 },
  { name: "starlink",           category: "communication", limit: 60 },
  { name: "weather",            category: "weather",       limit: 25 },
  { name: "cosmos-2251-debris", category: "debris",        limit: 70 },
  { name: "fengyun-1c-debris",  category: "debris",        limit: 70 },
  { name: "iridium-33-debris",  category: "debris",        limit: 50 },
];

const FRESH_TTL  = 4  * 60 * 60 * 1000; // don't re-fetch if under 4 h old
const FETCH_TIMEOUT = 8_000;

// ── TLE parsing ───────────────────────────────────────────────────

function parseTLEText(text: string, limit: number): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").split("\n").map(l => l.trim()).filter(Boolean);
  const records: Record<string, string>[] = [];
  let i = 0;
  while (i < lines.length && records.length < limit) {
    if (
      !lines[i].startsWith("1 ") && !lines[i].startsWith("2 ") &&
      i + 2 < lines.length && lines[i + 1].startsWith("1 ") && lines[i + 2].startsWith("2 ")
    ) {
      records.push({ name: lines[i], line1: lines[i + 1], line2: lines[i + 2] });
      i += 3;
    } else if (lines[i].startsWith("1 ") && i + 1 < lines.length && lines[i + 1].startsWith("2 ")) {
      records.push({ name: `OBJECT ${lines[i].substring(2, 7).trim()}`, line1: lines[i], line2: lines[i + 1] });
      i += 2;
    } else {
      i++;
    }
  }
  return records;
}

function tle2params(tle: Record<string, string>) {
  const l2         = tle.line2;
  const meanMotion = parseFloat(l2.substring(52, 63));
  const nRad       = meanMotion * 2 * Math.PI / 86400;
  const a          = Math.cbrt(398600.4418 / (nRad * nRad));
  return {
    norad_id:    l2.substring(2, 7).trim(),
    name:        tle.name.trim(),
    line1:       tle.line1,
    line2:       tle.line2,
    inclination: Math.round(parseFloat(l2.substring(8, 16))  * 10) / 10,
    raan:        Math.round(parseFloat(l2.substring(17, 25)) * 10) / 10,
    period:      Math.round(1440 / meanMotion                * 10) / 10,
    altitude:    Math.round(a - 6371),
    velocity:    Math.round(Math.sqrt(398600.4418 / a)       * 10) / 10,
  };
}

// ── Supabase client ───────────────────────────────────────────────

function db() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

// ── Background refresh ────────────────────────────────────────────
// Fetch all stale groups from CelesTrak in parallel and update the cache.

async function refreshStaleGroups(
  supabase: ReturnType<typeof db>,
  staleNames: string[],
) {
  const staleGroups = GROUPS.filter(g => staleNames.includes(g.name));
  await Promise.allSettled(
    staleGroups.map(async g => {
      try {
        const res = await fetch(
          `https://celestrak.org/gp.php?GROUP=${g.name}&FORMAT=tle`,
          { signal: AbortSignal.timeout(FETCH_TIMEOUT) },
        );
        if (!res.ok) return;
        const records = parseTLEText(await res.text(), g.limit);
        await supabase.from("satellite_tle_cache").upsert({
          group_name: g.name,
          records,
          fetched_at: new Date().toISOString(),
        });
      } catch (_) {/* ignore — next request will retry */}
    }),
  );
}

// ── Handler ───────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = db();
    const now = Date.now();

    // 1. Load whatever is cached in the DB (single fast query)
    const { data: rows } = await supabase
      .from("satellite_tle_cache")
      .select("group_name, records, fetched_at");

    const cacheMap = new Map<string, { records: Record<string, string>[]; age: number }>();
    for (const row of rows ?? []) {
      cacheMap.set(row.group_name, {
        records: row.records as Record<string, string>[],
        age: now - new Date(row.fetched_at).getTime(),
      });
    }

    // 2. Identify groups that need refreshing (missing or stale)
    const staleNames = GROUPS
      .filter(g => {
        const e = cacheMap.get(g.name);
        return !e || e.age > FRESH_TTL;
      })
      .map(g => g.name);

    const hasCachedData = cacheMap.size > 0;

    if (hasCachedData) {
      // ── Fast path: serve from DB immediately, refresh in background ──
      if (staleNames.length > 0) {
        EdgeRuntime.waitUntil(refreshStaleGroups(supabase, staleNames));
      }

      const satellites: Record<string, unknown>[] = [];
      for (const g of GROUPS) {
        const entry = cacheMap.get(g.name);
        const records = (entry?.records ?? []).slice(0, g.limit);
        for (const raw of records) {
          try { satellites.push({ ...tle2params(raw), category: g.category }); }
          catch (_) {/* skip malformed */}
        }
      }

      return new Response(
        JSON.stringify({ satellites, count: satellites.length, fetched_at: new Date().toISOString(), source: "cache" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Cold path (empty DB): fetch from CelesTrak now, then return ──
    await refreshStaleGroups(supabase, GROUPS.map(g => g.name));

    // Re-read the freshly populated cache
    const { data: freshRows } = await supabase
      .from("satellite_tle_cache")
      .select("group_name, records");

    const freshMap = new Map<string, Record<string, string>[]>();
    for (const row of freshRows ?? []) {
      freshMap.set(row.group_name, row.records as Record<string, string>[]);
    }

    const satellites: Record<string, unknown>[] = [];
    for (const g of GROUPS) {
      for (const raw of (freshMap.get(g.name) ?? []).slice(0, g.limit)) {
        try { satellites.push({ ...tle2params(raw), category: g.category }); }
        catch (_) {/* skip */}
      }
    }

    return new Response(
      JSON.stringify({ satellites, count: satellites.length, fetched_at: new Date().toISOString(), source: "live" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

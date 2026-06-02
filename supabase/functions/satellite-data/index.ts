import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROUPS: Array<{ name: string; category: string; limit: number }> = [
  { name: "stations",            category: "station",       limit: 15  },
  { name: "gps-ops",             category: "navigation",    limit: 35  },
  { name: "glonass-ops",         category: "navigation",    limit: 30  },
  { name: "galileo",             category: "navigation",    limit: 30  },
  { name: "beidou",              category: "navigation",    limit: 30  },
  { name: "starlink",            category: "communication", limit: 60  },
  { name: "weather",             category: "weather",       limit: 25  },
  { name: "science",             category: "scientific",    limit: 20  },
  { name: "cosmos-2251-debris",  category: "debris",        limit: 70  },
  { name: "fengyun-1c-debris",   category: "debris",        limit: 70  },
  { name: "iridium-33-debris",   category: "debris",        limit: 50  },
];

const CACHE_TTL_MS  = 4 * 60 * 60 * 1000; // serve fresh for 4 hours
const STALE_TTL_MS  = 24 * 60 * 60 * 1000; // serve stale (while revalidating) for up to 24 h
const FETCH_TIMEOUT = 8_000; // ms per CelesTrak request

// ── TLE parsing ──────────────────────────────────────────────────

function parseTLEText(text: string, limit: number): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").split("\n").map(l => l.trim()).filter(Boolean);
  const records: Record<string, string>[] = [];
  let i = 0;
  while (i < lines.length && records.length < limit) {
    if (!lines[i].startsWith("1 ") && !lines[i].startsWith("2 ") &&
        i + 2 < lines.length && lines[i + 1].startsWith("1 ") && lines[i + 2].startsWith("2 ")) {
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
  const line2       = tle.line2;
  const norad_id    = line2.substring(2, 7).trim();
  const inclination = parseFloat(line2.substring(8, 16));
  const raan        = parseFloat(line2.substring(17, 25));
  const meanMotion  = parseFloat(line2.substring(52, 63)); // rev/day
  const periodMin   = 1440 / meanMotion;
  const nRad        = meanMotion * 2 * Math.PI / 86400;
  const a           = Math.cbrt(398600.4418 / (nRad * nRad));
  return {
    norad_id,
    name:        tle.name.trim(),
    line1:       tle.line1,
    line2:       tle.line2,
    inclination: Math.round(inclination * 10) / 10,
    raan:        Math.round(raan * 10) / 10,
    period:      Math.round(periodMin * 10) / 10,
    altitude:    Math.round(a - 6371),
    velocity:    Math.round(Math.sqrt(398600.4418 / a) * 10) / 10,
  };
}

// ── Fetch one group from CelesTrak (with timeout) ────────────────

async function fetchGroup(name: string, limit: number): Promise<Record<string, string>[]> {
  const url = `https://celestrak.org/gp.php?GROUP=${name}&FORMAT=tle`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for group ${name}`);
  return parseTLEText(await res.text(), limit);
}

// ── Supabase client ───────────────────────────────────────────────

function makeSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

// ── Handler ───────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = makeSupabase();
    const now = Date.now();

    // 1. Load entire cache in one query
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

    // 2. Determine which groups need a live fetch (missing or expired)
    const staleGroups  = GROUPS.filter(g => {
      const entry = cacheMap.get(g.name);
      return !entry || entry.age > CACHE_TTL_MS;
    });
    const fresheGroups = GROUPS.filter(g => {
      const entry = cacheMap.get(g.name);
      return entry && entry.age <= CACHE_TTL_MS;
    });

    // 3a. Groups we already have fresh data for — use immediately
    const freshRecords = new Map<string, Record<string, string>[]>();
    for (const g of fresheGroups) {
      freshRecords.set(g.name, cacheMap.get(g.name)!.records.slice(0, g.limit));
    }

    // 3b. Check if we have *any* stale (old but not yet re-fetched) data we can serve now
    const hasUsableStale = staleGroups.some(g => {
      const entry = cacheMap.get(g.name);
      return entry && entry.age <= STALE_TTL_MS;
    });

    // 4. Fetch ALL stale groups in parallel
    const fetchResults = await Promise.allSettled(
      staleGroups.map(async g => {
        const records = await fetchGroup(g.name, g.limit);
        // Persist to cache (best-effort, non-blocking via waitUntil)
        EdgeRuntime.waitUntil(
          supabase.from("satellite_tle_cache").upsert({
            group_name: g.name,
            records,
            fetched_at: new Date().toISOString(),
          })
        );
        return { name: g.name, records };
      })
    );

    // 5. Collect results — fall back to stale cache if a fetch failed
    const liveRecords = new Map<string, Record<string, string>[]>();
    staleGroups.forEach((g, idx) => {
      const result = fetchResults[idx];
      if (result.status === "fulfilled") {
        liveRecords.set(g.name, result.value.records);
      } else {
        // Use stale cache if available
        const stale = cacheMap.get(g.name);
        if (stale && stale.age <= STALE_TTL_MS) {
          liveRecords.set(g.name, stale.records.slice(0, g.limit));
        }
      }
    });

    // 6. Build final satellite list
    const allSatellites: Record<string, unknown>[] = [];
    for (const g of GROUPS) {
      const records = freshRecords.get(g.name) ?? liveRecords.get(g.name) ?? [];
      for (const raw of records) {
        try {
          allSatellites.push({ ...tle2params(raw), category: g.category });
        } catch (_) {/* skip malformed */}
      }
    }

    return new Response(
      JSON.stringify({ satellites: allSatellites, count: allSatellites.length, fetched_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

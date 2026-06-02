import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// CelesTrak GP API – each entry has a display limit so we don't return thousands of Starlinks
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

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// ── TLE parsing ──────────────────────────────────────────────────

function parseTLEText(text: string, limit: number): Record<string, string>[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const records: Record<string, string>[] = [];
  let i = 0;

  while (i < lines.length && records.length < limit) {
    // 3-line format: name, line1, line2
    if (
      !lines[i].startsWith("1 ") &&
      !lines[i].startsWith("2 ") &&
      i + 2 < lines.length &&
      lines[i + 1].startsWith("1 ") &&
      lines[i + 2].startsWith("2 ")
    ) {
      records.push({ name: lines[i], line1: lines[i + 1], line2: lines[i + 2] });
      i += 3;
    // 2-line format
    } else if (lines[i].startsWith("1 ") && i + 1 < lines.length && lines[i + 1].startsWith("2 ")) {
      records.push({ name: `OBJECT ${lines[i].substring(2, 7).trim()}`, line1: lines[i], line2: lines[i + 1] });
      i += 2;
    } else {
      i++;
    }
  }

  return records;
}

// Compute orbital parameters from TLE without external libraries
function tle2params(tle: Record<string, string>) {
  const line2 = tle.line2;
  const norad_id    = tle.line2.substring(2, 7).trim();
  const inclination = parseFloat(line2.substring(8, 16));
  const raan        = parseFloat(line2.substring(17, 25));
  const meanMotion  = parseFloat(line2.substring(52, 63)); // rev/day

  const periodMin = 1440 / meanMotion;
  const nRad      = meanMotion * 2 * Math.PI / 86400;          // rad/s
  const a         = Math.cbrt(398600.4418 / (nRad * nRad));    // km
  const altitude  = Math.round(a - 6371);
  const velocity  = Math.round(Math.sqrt(398600.4418 / a) * 10) / 10;

  return {
    norad_id,
    name:        tle.name.trim(),
    line1:       tle.line1,
    line2:       tle.line2,
    inclination: Math.round(inclination * 10) / 10,
    raan:        Math.round(raan * 10) / 10,
    period:      Math.round(periodMin * 10) / 10,
    altitude,
    velocity,
  };
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

    // Determine which groups need a refresh
    const { data: cached } = await supabase
      .from("satellite_tle_cache")
      .select("group_name, records, fetched_at");

    const now = Date.now();
    const cacheMap = new Map<string, { records: unknown[]; fetched_at: string }>();
    for (const row of cached ?? []) {
      cacheMap.set(row.group_name, { records: row.records, fetched_at: row.fetched_at });
    }

    const allSatellites: Record<string, unknown>[] = [];

    for (const group of GROUPS) {
      const entry = cacheMap.get(group.name);
      const isFresh =
        entry && now - new Date(entry.fetched_at).getTime() < CACHE_TTL_MS;

      let records: Record<string, string>[];

      if (isFresh) {
        records = (entry.records as Record<string, string>[]).slice(0, group.limit);
      } else {
        // Fetch from CelesTrak
        try {
          const url = `https://celestrak.org/gp.php?GROUP=${group.name}&FORMAT=tle`;
          const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          records = parseTLEText(text, group.limit);

          // Update cache (best-effort)
          await supabase.from("satellite_tle_cache").upsert({
            group_name: group.name,
            records,
            fetched_at: new Date().toISOString(),
          });
        } catch (_err) {
          // Fall back to stale cache if available
          records = entry
            ? (entry.records as Record<string, string>[]).slice(0, group.limit)
            : [];
        }
      }

      for (const raw of records) {
        try {
          const params = tle2params(raw);
          allSatellites.push({ ...params, category: group.category });
        } catch (_e) {
          // skip malformed TLE
        }
      }
    }

    return new Response(
      JSON.stringify({
        satellites: allSatellites,
        count: allSatellites.length,
        fetched_at: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

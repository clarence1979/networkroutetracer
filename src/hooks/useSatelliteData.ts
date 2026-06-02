import { useState, useEffect } from 'react';
import * as satellite from 'satellite.js';
import { SatelliteType } from '../types/satellite';

export interface LiveSatellite {
  noradId: string;
  name: string;
  category: SatelliteType;
  satrec: satellite.SatRec;
  altitude: number;    // km
  inclination: number; // degrees
  period: number;      // minutes
  velocity: number;    // km/s
}

interface RawSatellite {
  norad_id: string;
  name: string;
  category: string;
  line1: string;
  line2: string;
  altitude: number;
  inclination: number;
  period: number;
  velocity: number;
}

const SESSION_KEY = 'satellite_tle_v2';
const SESSION_TTL = 4 * 60 * 60 * 1000; // 4 hours

export function useSatelliteData() {
  const [satellites, setSatellites] = useState<LiveSatellite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try session storage first to avoid hitting the edge function repeatedly
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: RawSatellite[]; ts: number };
        if (Date.now() - ts < SESSION_TTL) {
          setSatellites(parse(data));
          return;
        }
      }
    } catch (_) {/* ignore corrupt session data */}

    setLoading(true);
    setError(null);

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/satellite-data`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((body: { satellites: RawSatellite[] }) => {
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ data: body.satellites, ts: Date.now() }));
        } catch (_) {/* quota exceeded – skip cache */}
        setSatellites(parse(body.satellites));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { satellites, loading, error };
}

function parse(raw: RawSatellite[]): LiveSatellite[] {
  const out: LiveSatellite[] = [];
  for (const r of raw) {
    try {
      const satrec = satellite.twoline2satrec(r.line1, r.line2);
      if (satrec.error !== 0) continue;
      out.push({
        noradId: r.norad_id,
        name: r.name,
        category: r.category as SatelliteType,
        satrec,
        altitude: r.altitude,
        inclination: r.inclination,
        period: r.period,
        velocity: r.velocity,
      });
    } catch (_) {/* skip invalid TLE */}
  }
  return out;
}

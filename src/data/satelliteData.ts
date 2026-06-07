import { SatelliteType } from '../types/satellite';

export interface OrbitalElements {
  noradId: string;
  name: string;
  category: SatelliteType;
  a: number;    // semi-major axis (km)
  e: number;    // eccentricity
  i: number;    // inclination (degrees)
  raan: number; // right ascension of ascending node (degrees)
  argp: number; // argument of perigee (degrees)
  M0: number;   // mean anomaly at epoch (degrees)
  epoch: number; // Unix timestamp ms
}

const MU    = 398600.4418; // km³ s⁻²
const R_E   = 6371;        // km
const EPOCH = 1749254400000; // 2026-06-07T00:00:00Z

function normalize(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Derived scalar properties from orbital elements */
export function derivedProps(el: OrbitalElements) {
  const n     = Math.sqrt(MU / (el.a * el.a * el.a)); // rad/s
  const period  = (2 * Math.PI / n) / 60;               // minutes
  const velocity = Math.round(Math.sqrt(MU / el.a) * 10) / 10;
  const altitude = Math.round(el.a - R_E);
  return { n, period, velocity, altitude };
}

/**
 * Generate a Walker-like constellation.
 * Planes are spaced 360/planes degrees apart.
 * Satellites within each plane are equally spaced.
 * An inter-plane phasing offset is applied so no two planes share the same slot.
 */
function constellation(
  prefix: string,
  category: SatelliteType,
  a: number,
  e: number,
  inc: number,
  planes: number,
  satsPerPlane: number,
  raanStart = 0,
  argp = 0,
): OrbitalElements[] {
  const out: OrbitalElements[] = [];
  const raanStep = 360 / planes;
  const slotStep = 360 / satsPerPlane;
  // Walker phasing: shift mean anomaly per plane so the full constellation
  // is spread rather than forming parallel bands
  const phaseShift = slotStep / planes;

  for (let p = 0; p < planes; p++) {
    const raan = raanStart + raanStep * p;
    for (let s = 0; s < satsPerPlane; s++) {
      const M0 = normalize(slotStep * s + phaseShift * p);
      out.push({
        noradId: `${prefix}-${String(p * satsPerPlane + s + 1).padStart(3, '0')}`,
        name:    `${prefix} ${p + 1}-${s + 1}`,
        category,
        a, e,
        i: inc,
        raan: normalize(raan),
        argp,
        M0,
        epoch: EPOCH,
      });
    }
  }
  return out;
}

// ── Static satellite catalogue ────────────────────────────────────

export const STATIC_SATELLITES: OrbitalElements[] = [

  // ── Space Stations ──────────────────────────────────────────────
  { noradId: '25544',  name: 'ISS (ZARYA)',          category: 'station',       a: 6787,    e: 0.0007, i: 51.6,  raan: 248, argp: 45,  M0: 22,  epoch: EPOCH },
  { noradId: '48274',  name: 'CSS (Tiangong)',        category: 'station',       a: 6740,    e: 0.0005, i: 41.5,  raan: 135, argp: 30,  M0: 164, epoch: EPOCH },

  // ── GPS (6 planes × 5 = 30 sats, MEO ~20 200 km, i=55°) ────────
  ...constellation('GPS',     'navigation', 26559.8, 0.005, 55.0, 6, 5, 272),

  // ── GLONASS (3 planes × 8 = 24 sats, MEO ~19 100 km, i=64.8°) ──
  ...constellation('GLONASS', 'navigation', 25507.6, 0.001, 64.8, 3, 8,  10),

  // ── Galileo (3 planes × 8 = 24 sats, MEO ~23 200 km, i=56°) ────
  ...constellation('GALILEO', 'navigation', 29600.0, 0.001, 56.0, 3, 8,  56),

  // ── BeiDou MEO (3 planes × 8 = 24 sats, ~21 500 km, i=55°) ─────
  ...constellation('BEIDOU',  'navigation', 27907.3, 0.001, 55.0, 3, 8,  30),

  // ── Starlink sample (5 planes × 6 = 30 sats, ~550 km, i=53°) ───
  ...constellation('STARLINK','communication', 6921.0, 0.0005, 53.0, 5, 6,  0),

  // ── OneWeb sample (6 planes × 4 = 24 sats, ~1200 km, i=87.9°) ──
  ...constellation('ONEWEB',  'communication', 7571.0, 0.001, 87.9, 6, 4, 15),

  // ── NOAA polar weather (Sun-synchronous) ─────────────────────────
  { noradId: 'NOAA-15', name: 'NOAA-15',   category: 'weather', a: 7206, e: 0.001, i: 98.7, raan: 15,  argp: 90, M0: 0,   epoch: EPOCH },
  { noradId: 'NOAA-18', name: 'NOAA-18',   category: 'weather', a: 7212, e: 0.001, i: 98.8, raan: 75,  argp: 90, M0: 90,  epoch: EPOCH },
  { noradId: 'NOAA-19', name: 'NOAA-19',   category: 'weather', a: 7215, e: 0.001, i: 98.7, raan: 165, argp: 90, M0: 180, epoch: EPOCH },
  { noradId: 'NOAA-20', name: 'NOAA-20',   category: 'weather', a: 7248, e: 0.001, i: 98.7, raan: 255, argp: 90, M0: 270, epoch: EPOCH },
  { noradId: 'METOP-A', name: 'MetOp-A',   category: 'weather', a: 7255, e: 0.001, i: 98.5, raan: 330, argp: 90, M0: 0,   epoch: EPOCH },
  { noradId: 'METOP-B', name: 'MetOp-B',   category: 'weather', a: 7257, e: 0.001, i: 98.5, raan: 110, argp: 90, M0: 120, epoch: EPOCH },
  { noradId: 'METOP-C', name: 'MetOp-C',   category: 'weather', a: 7260, e: 0.001, i: 98.5, raan: 225, argp: 90, M0: 240, epoch: EPOCH },

  // ── Science ──────────────────────────────────────────────────────
  { noradId: '20580',     name: 'Hubble Space Telescope', category: 'scientific', a: 6918, e: 0.0003, i: 28.5, raan: 185, argp: 60,  M0: 90,  epoch: EPOCH },
  { noradId: 'TERRA',     name: 'Terra (EOS AM-1)',        category: 'scientific', a: 7077, e: 0.001,  i: 98.2, raan: 200, argp: 90,  M0: 0,   epoch: EPOCH },
  { noradId: 'AQUA',      name: 'Aqua (EOS PM-1)',         category: 'scientific', a: 7077, e: 0.001,  i: 98.2, raan: 20,  argp: 90,  M0: 180, epoch: EPOCH },
  { noradId: 'S1A',       name: 'Sentinel-1A',             category: 'scientific', a: 7073, e: 0.001,  i: 98.2, raan: 50,  argp: 90,  M0: 270, epoch: EPOCH },
  { noradId: 'S2A',       name: 'Sentinel-2A',             category: 'scientific', a: 7160, e: 0.001,  i: 98.6, raan: 130, argp: 90,  M0: 45,  epoch: EPOCH },
  { noradId: 'S2B',       name: 'Sentinel-2B',             category: 'scientific', a: 7160, e: 0.001,  i: 98.6, raan: 310, argp: 90,  M0: 225, epoch: EPOCH },
  { noradId: 'ENVISAT',   name: 'Envisat',                 category: 'scientific', a: 7143, e: 0.001,  i: 98.5, raan: 260, argp: 90,  M0: 135, epoch: EPOCH },
  { noradId: 'ICESAT2',   name: 'ICESat-2',                category: 'scientific', a: 7066, e: 0.001,  i: 92.0, raan: 340, argp: 90,  M0: 60,  epoch: EPOCH },
];

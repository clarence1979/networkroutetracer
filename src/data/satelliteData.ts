import { SatelliteOrbit, SatelliteType } from '../types/satellite';

const GM = 3.986e14;        // m³/s²
const EARTH_RADIUS = 6371;  // km

function orbitParams(altKm: number): { period: number; velocity: number; visualRadius: number } {
  const rM = (EARTH_RADIUS + altKm) * 1000;
  const period = 2 * Math.PI * Math.sqrt(Math.pow(rM, 3) / GM);
  const velocity = Math.sqrt(GM / rM) / 1000;
  // Log-scale visual radius keeps all orbits visible within camera range
  const visualRadius = 2 + Math.log10(1 + altKm / 200) * 0.38;
  return { period, velocity, visualRadius };
}

function mkSat(
  id: string,
  name: string,
  type: SatelliteType,
  altKm: number,
  inclination: number,
  raan: number,
  initialAngle: number
): SatelliteOrbit {
  const { period, velocity, visualRadius } = orbitParams(altKm);
  return { id, name, type, altitude: altKm, velocity: Math.round(velocity * 10) / 10, inclination, raan, initialAngle, period, visualRadius };
}

// ──────────────────────────────────────────────
// Named satellites — real orbital parameters
// ──────────────────────────────────────────────
export const NAMED_SATELLITES: SatelliteOrbit[] = [
  mkSat('iss',         'ISS',              'station',       408,   51.6,  82,   0),
  mkSat('tiangong',    'Tiangong CSS',     'station',       389,   41.5, 160,  55),
  mkSat('hubble',      'Hubble',           'scientific',    540,   28.5, 210,  90),
  mkSat('landsat8',    'Landsat 8',        'scientific',    705,   98.2,  44, 140),
  mkSat('sentinel2a',  'Sentinel-2A',      'scientific',    786,   98.6, 308, 200),
  mkSat('terrasar',    'TerraSAR-X',       'scientific',    514,   97.4, 198, 270),
  mkSat('metop',       'MetOp-A',          'weather',       817,   98.7, 330,  30),
  mkSat('noaa20',      'NOAA-20',          'weather',       833,   98.7,  90, 180),
  mkSat('goes16',      'GOES-East',        'weather',     35786,    0.1,  75,  75),
  mkSat('goes18',      'GOES-West',        'weather',     35786,    0.1, 137, 137),
  mkSat('sl1',         'Starlink-1007',    'communication', 550,   53.0,  12,  22),
  mkSat('sl2',         'Starlink-1008',    'communication', 550,   53.0,  72, 100),
  mkSat('sl3',         'Starlink-1009',    'communication', 550,   53.0, 132, 200),
  mkSat('sl4',         'Starlink-1010',    'communication', 550,   53.0, 192, 300),
  mkSat('sl5',         'Starlink-1011',    'communication', 550,   53.0, 252,  40),
  mkSat('gps1',        'GPS IIF-2',        'navigation',  20200,   55.0,  22,  66),
  mkSat('gps2',        'GPS IIF-5',        'navigation',  20200,   55.0, 142, 186),
  mkSat('gps3',        'GPS IIF-8',        'navigation',  20200,   55.0, 262, 306),
  mkSat('galileo1',    'Galileo FOC-1',    'navigation',  23222,   56.0,  55, 120),
  mkSat('glonass1',    'GLONASS-M',        'navigation',  19100,   64.8, 100, 250),
  mkSat('iridium1',    'Iridium-101',      'communication', 780,   86.4,  10,  10),
  mkSat('iridium2',    'Iridium-102',      'communication', 780,   86.4, 120, 130),
  mkSat('iridium3',    'Iridium-103',      'communication', 780,   86.4, 240, 250),
];

// ──────────────────────────────────────────────
// Space debris — procedurally generated
// ──────────────────────────────────────────────
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

export function generateDebris(count = 160): SatelliteOrbit[] {
  const debris: SatelliteOrbit[] = [];
  for (let i = 0; i < count; i++) {
    const altKm = 300 + seededRand(i * 7 + 1) * 1400;
    const inclination = seededRand(i * 13 + 2) * 100;
    const raan = seededRand(i * 17 + 3) * 360;
    const initialAngle = seededRand(i * 19 + 4) * 360;
    const { period, velocity, visualRadius } = orbitParams(altKm);
    debris.push({
      id: `debris-${i}`,
      name: `Debris ${i + 1}`,
      type: 'debris',
      altitude: Math.round(altKm),
      velocity: Math.round(velocity * 10) / 10,
      inclination,
      raan,
      initialAngle,
      period,
      visualRadius,
    });
  }
  return debris;
}

export const DEBRIS = generateDebris(160);

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SatelliteType } from '../../types/satellite';
import { LiveSatellite, useSatelliteData } from '../../hooks/useSatelliteData';

// ── Kepler propagator ─────────────────────────────────────────────

const DEG = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

function solveKepler(M: number, e: number): number {
  // Newton-Raphson, converges in ~5 iterations for e < 0.3
  let E = M;
  for (let i = 0; i < 15; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

/**
 * Propagate orbital elements to time `nowMs`.
 * Returns position in Three.js (Y-up) coordinate space.
 * ECI axes: X=vernal equinox, Y=90°E, Z=north pole.
 * Three.js mapping: x_3js = x_eci, y_3js = z_eci, z_3js = -y_eci.
 * Visual radius uses log-scale so MEO/GEO are visible: r = 2 + log10(1+alt/200)*0.4
 */
function propagate(sat: LiveSatellite, nowMs: number): THREE.Vector3 | null {
  const dt = (nowMs - sat.epoch) / 1000; // seconds since epoch

  let M = (sat.M0 * DEG + sat.n_rads * dt) % TWO_PI;
  if (M < 0) M += TWO_PI;

  const E = solveKepler(M, sat.e);

  // Perifocal position
  const xP = sat.a * (Math.cos(E) - sat.e);
  const yP = sat.a * Math.sqrt(1 - sat.e * sat.e) * Math.sin(E);

  // Rotation matrix components (standard Euler ZXZ)
  const O  = sat.raan * DEG;
  const w  = sat.argp * DEG;
  const I  = sat.i    * DEG;
  const cosO = Math.cos(O), sinO = Math.sin(O);
  const cosW = Math.cos(w), sinW = Math.sin(w);
  const cosI = Math.cos(I), sinI = Math.sin(I);

  // Perifocal to ECI direction cosines
  const Px =  cosO * cosW - sinO * sinW * cosI;
  const Py =  sinO * cosW + cosO * sinW * cosI;
  const Pz =  sinW * sinI;
  const Qx = -cosO * sinW - sinO * cosW * cosI;
  const Qy = -sinO * sinW + cosO * cosW * cosI;
  const Qz =  cosW * sinI;

  const x = xP * Px + yP * Qx;
  const y = xP * Py + yP * Qy;
  const z = xP * Pz + yP * Qz;

  const r = Math.sqrt(x * x + y * y + z * z);
  if (r < 100) return null;

  const visualR = 2.05 + Math.log10(1 + Math.max(0, sat.altitude) / 200) * 0.42;
  const s = visualR / r;

  return new THREE.Vector3(x * s, z * s, -y * s);
}

// ── Appearance ────────────────────────────────────────────────────

const TYPE_COLOR: Record<SatelliteType, string> = {
  station:       '#00E5FF',
  navigation:    '#FFD700',
  communication: '#4ADE80',
  scientific:    '#F472B6',
  weather:       '#60A5FA',
  military:      '#9CA3AF',
  debris:        '#EF4444',
};

const TYPE_SIZE: Record<SatelliteType, number> = {
  station:       0.030,
  navigation:    0.018,
  communication: 0.014,
  scientific:    0.018,
  weather:       0.018,
  military:      0.014,
  debris:        0.008,
};

// ── Orbital ring (drawn once per satellite at mount time) ─────────

const RING_CATEGORIES = new Set<SatelliteType>(['station', 'scientific']);

function buildRingPoints(sat: LiveSatellite, steps = 128): THREE.Vector3[] {
  const now  = Date.now();
  const full = sat.period * 60 * 1000; // ms per orbit
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const pt = propagate(sat, now + (i / steps) * full);
    if (pt) pts.push(pt);
  }
  return pts;
}

const OrbitalRing: React.FC<{ sat: LiveSatellite }> = React.memo(({ sat }) => {
  const pts = useMemo(() => buildRingPoints(sat), [sat.noradId]);
  const geo  = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setFromPoints(pts);
    return g;
  }, [pts]);
  if (pts.length < 8) return null;
  return (
    <line geometry={geo}>
      <lineBasicMaterial color={TYPE_COLOR[sat.category]} transparent opacity={0.22} />
    </line>
  );
});

// ── Named-satellite mesh (one per non-LEO-comm/debris sat) ────────

const SatDot: React.FC<{
  sat: LiveSatellite;
  onHover: (s: LiveSatellite | null) => void;
}> = React.memo(({ sat, onHover }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const pos = propagate(sat, Date.now());
    if (pos) ref.current.position.copy(pos);
  });

  return (
    <mesh
      ref={ref}
      onPointerEnter={e => { e.stopPropagation(); onHover(sat); }}
      onPointerLeave={() => onHover(null)}
    >
      <sphereGeometry args={[TYPE_SIZE[sat.category], 8, 8]} />
      <meshBasicMaterial color={TYPE_COLOR[sat.category]} />
    </mesh>
  );
});

// ── Main component ────────────────────────────────────────────────

interface Props {
  onHover: (sat: LiveSatellite | null) => void;
  onCount: (n: number) => void;
}

export const SatelliteVisualization: React.FC<Props> = ({ onHover, onCount }) => {
  const { satellites } = useSatelliteData();

  useEffect(() => { onCount(satellites.length); }, [satellites.length]);

  const rings     = useMemo(() => satellites.filter(s => RING_CATEGORIES.has(s.category)), [satellites]);
  const dots      = useMemo(() => satellites.filter(s => s.category !== 'debris'),         [satellites]);

  return (
    <group>
      {rings.map(s => <OrbitalRing key={s.noradId} sat={s} />)}
      {dots.map(s  => <SatDot     key={s.noradId} sat={s} onHover={onHover} />)}
    </group>
  );
};

// ── Info panel ────────────────────────────────────────────────────

const TYPE_LABEL: Record<SatelliteType, string> = {
  station:       'Space Station',
  navigation:    'Navigation',
  communication: 'Communication',
  scientific:    'Scientific',
  weather:       'Weather',
  military:      'Military',
  debris:        'Space Debris',
};

function fmtPeriod(minutes: number): string {
  if (minutes < 60)   return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hr`;
  return `${(minutes / 1440).toFixed(1)} d`;
}

export const SatelliteInfoPanel: React.FC<{ satellite: LiveSatellite }> = ({ satellite: sat }) => (
  <div
    className="absolute top-3 right-3 z-10 rounded-lg border border-gray-600 bg-gray-900/90 backdrop-blur-sm p-3 text-xs text-white shadow-xl pointer-events-none"
    style={{ minWidth: 200 }}
  >
    <div className="flex items-center gap-2 mb-2">
      <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLOR[sat.category] }} />
      <span className="font-semibold text-sm leading-tight truncate">{sat.name}</span>
    </div>
    <div className="text-gray-400 mb-2 text-[11px]">{TYPE_LABEL[sat.category]}</div>
    <div className="space-y-1">
      {([
        ['Altitude',    `${sat.altitude.toLocaleString()} km`],
        ['Velocity',    `${sat.velocity} km/s`],
        ['Inclination', `${sat.i.toFixed(1)}°`],
        ['Period',      fmtPeriod(sat.period)],
        ['RAAN',        `${sat.raan.toFixed(1)}°`],
      ] as [string, string][]).map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <span className="text-gray-400">{label}</span>
          <span className="font-mono">{value}</span>
        </div>
      ))}
    </div>
    <div className="mt-2 pt-2 border-t border-gray-700 text-gray-500 text-[10px]">
      Kepler propagation · Static orbital catalogue
    </div>
  </div>
);

// ── Legend ────────────────────────────────────────────────────────

export const SatelliteLegend: React.FC<{ count: number }> = ({ count }) => (
  <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-gray-600 bg-gray-900/90 backdrop-blur-sm px-3 py-2 text-[11px] text-white shadow-xl pointer-events-none">
    <div className="font-semibold text-xs mb-1.5 text-gray-300">Satellite Catalogue</div>
    <div className="space-y-1">
      {([
        ['station',       '#00E5FF', 'Space Stations (ISS, Tiangong)'],
        ['navigation',    '#FFD700', 'Navigation (GPS · GLONASS · Galileo · BeiDou)'],
        ['communication', '#4ADE80', 'Communication (Starlink, OneWeb)'],
        ['scientific',    '#F472B6', 'Scientific (Hubble, Sentinel, etc.)'],
        ['weather',       '#60A5FA', 'Weather (NOAA, MetOp)'],
      ] as [string, string, string][]).map(([, color, label]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-gray-300">{label}</span>
        </div>
      ))}
    </div>
    <div className="mt-1.5 pt-1.5 border-t border-gray-700 text-gray-500">
      {count} objects · Kepler propagation
    </div>
  </div>
);

import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SatelliteType } from '../../types/satellite';
import { LiveSatellite, useSatelliteData } from '../../hooks/useSatelliteData';

// ── Kepler propagator ─────────────────────────────────────────────

const DEG    = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 15; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

/**
 * ECI (X = vernal equinox, Y = 90°E, Z = north) → Three.js Y-up:
 *   x_3 = x_eci,  y_3 = z_eci,  z_3 = -y_eci
 * Visual radius: log-scaled so MEO/GEO are visible (Earth = 2 units).
 */
function propagate(sat: LiveSatellite, nowMs: number, out: THREE.Vector3): boolean {
  const dt = (nowMs - sat.epoch) / 1000;
  let M = (sat.M0 * DEG + sat.n_rads * dt) % TWO_PI;
  if (M < 0) M += TWO_PI;

  const E  = solveKepler(M, sat.e);
  const xP = sat.a * (Math.cos(E) - sat.e);
  const yP = sat.a * Math.sqrt(1 - sat.e * sat.e) * Math.sin(E);

  const O = sat.raan * DEG, w = sat.argp * DEG, I = sat.i * DEG;
  const cO = Math.cos(O), sO = Math.sin(O);
  const cW = Math.cos(w), sW = Math.sin(w);
  const cI = Math.cos(I), sI = Math.sin(I);

  const Px =  cO * cW - sO * sW * cI,  Qx = -cO * sW - sO * cW * cI;
  const Py =  sO * cW + cO * sW * cI,  Qy = -sO * sW + cO * cW * cI;
  const Pz =  sW * sI,                  Qz =  cW * sI;

  const x = xP * Px + yP * Qx;
  const y = xP * Py + yP * Qy;
  const z = xP * Pz + yP * Qz;

  const r = Math.sqrt(x * x + y * y + z * z);
  if (r < 100) return false;

  const vR = 2.05 + Math.log10(1 + Math.max(0, sat.altitude) / 200) * 0.42;
  const s  = vR / r;
  out.set(x * s, z * s, -y * s);
  return true;
}

// ── Colours / sizes ───────────────────────────────────────────────

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
  navigation:    0.016,
  communication: 0.012,
  scientific:    0.018,
  weather:       0.018,
  military:      0.014,
  debris:        0.008,
};

// ── Orbital rings ─────────────────────────────────────────────────

const RING_CATEGORIES = new Set<SatelliteType>(['station', 'scientific']);

const OrbitalRing: React.FC<{ sat: LiveSatellite }> = React.memo(({ sat }) => {
  const geo = useMemo(() => {
    const now   = Date.now();
    const steps = 128;
    const full  = sat.period * 60 * 1000;
    const pts: THREE.Vector3[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i <= steps; i++) {
      if (propagate(sat, now + (i / steps) * full, v)) pts.push(v.clone());
    }
    if (pts.length < 8) return null;
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [sat.noradId]);

  if (!geo) return null;
  return (
    <line geometry={geo}>
      <lineBasicMaterial color={TYPE_COLOR[sat.category]} transparent opacity={0.20} />
    </line>
  );
});

// ── Main visualization ────────────────────────────────────────────

export interface Props {
  onHover:  (sat: LiveSatellite | null) => void;
  onCount:  (n: number) => void;
  simSpeed: number; // time multiplier (1 = real-time, 60 = 60× faster)
}

export const SatelliteVisualization: React.FC<Props> = ({ onHover, onCount, simSpeed }) => {
  const { satellites } = useSatelliteData();
  useEffect(() => { onCount(satellites.length); }, [satellites.length]);

  const rings = useMemo(() => satellites.filter(s => RING_CATEGORIES.has(s.category)), [satellites]);
  const dots  = useMemo(() => satellites,                                               [satellites]);

  // ── Simulation clock ─────────────────────────────────────────
  // Accumulates simulated time independently of React renders.
  const simBaseMs   = useRef(Date.now());          // simulated time at last speed change
  const realBaseMs  = useRef(performance.now());   // real time at last speed change
  const simNowMs    = useRef(Date.now());          // current simulated time (updated each frame)
  const simSpeedRef = useRef(simSpeed);

  // When simSpeed changes, anchor the accumulated time so there's no jump
  useEffect(() => {
    simBaseMs.current  = simNowMs.current;
    realBaseMs.current = performance.now();
    simSpeedRef.current = simSpeed;
  }, [simSpeed]);

  // ── Mesh refs (one per dot) ───────────────────────────────────
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tmp      = useMemo(() => new THREE.Vector3(), []);

  // ── Single frame loop: advance clock + update all positions ──
  useFrame(() => {
    const realNow = performance.now();
    simNowMs.current = simBaseMs.current + (realNow - realBaseMs.current) * simSpeedRef.current;

    const nowMs = simNowMs.current;
    dots.forEach((sat, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      if (propagate(sat, nowMs, tmp)) mesh.position.copy(tmp);
    });
  });

  // ── Hover detection helper ────────────────────────────────────
  const makePointerHandlers = useCallback((sat: LiveSatellite) => ({
    onPointerEnter: (e: THREE.Event) => { (e as any).stopPropagation(); onHover(sat); },
    onPointerLeave: () => onHover(null),
  }), [onHover]);

  return (
    <group>
      {rings.map(s => <OrbitalRing key={s.noradId} sat={s} />)}

      {dots.map((sat, i) => (
        <mesh
          key={sat.noradId}
          ref={el => { meshRefs.current[i] = el; }}
          {...makePointerHandlers(sat)}
        >
          <sphereGeometry args={[TYPE_SIZE[sat.category], 8, 8]} />
          <meshBasicMaterial color={TYPE_COLOR[sat.category]} />
        </mesh>
      ))}
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

function fmtPeriod(min: number) {
  return min < 60 ? `${Math.round(min)} min`
    : min < 1440  ? `${(min / 60).toFixed(1)} hr`
    : `${(min / 1440).toFixed(1)} d`;
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
      ] as [string, string][]).map(([l, v]) => (
        <div key={l} className="flex justify-between gap-4">
          <span className="text-gray-400">{l}</span>
          <span className="font-mono">{v}</span>
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
        ['scientific',    '#F472B6', 'Scientific (Hubble, Sentinel…)'],
        ['weather',       '#60A5FA', 'Weather (NOAA, MetOp)'],
      ] as [string, string, string][]).map(([, c, l]) => (
        <div key={l} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
          <span className="text-gray-300">{l}</span>
        </div>
      ))}
    </div>
    <div className="mt-1.5 pt-1.5 border-t border-gray-700 text-gray-500">
      {count} objects · Kepler propagation
    </div>
  </div>
);

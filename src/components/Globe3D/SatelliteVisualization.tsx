import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { SatelliteType } from '../../types/satellite';
import { LiveSatellite, useSatelliteData } from '../../hooks/useSatelliteData';

// ── ECI → Three.js coordinate conversion ─────────────────────────
// ECI uses Z=north, X=vernal equinox, Y completes right-hand system.
// Three.js uses Y=up. Mapping: x_3js = x_eci, y_3js = z_eci, z_3js = -y_eci
//
// Visual log-scale: brings GEO (~35 786 km) into view while preserving
// relative altitude ordering. Earth globe radius = 2 Three.js units.

function eciToVec3(pos: satellite.EciVec3<number>, altKm: number): THREE.Vector3 {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  if (r === 0) return new THREE.Vector3();
  const visualR = 2 + Math.log10(1 + Math.max(0, altKm) / 200) * 0.38;
  const s = visualR / r;
  return new THREE.Vector3(pos.x * s, pos.z * s, -pos.y * s);
}

// ── Colour / size by category ────────────────────────────────────

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
  station:       0.032,
  navigation:    0.022,
  communication: 0.018,
  scientific:    0.020,
  weather:       0.020,
  military:      0.016,
  debris:        0.009,
};

// ── Orbital ring (precomputed from TLE propagation) ───────────────

const RING_CATEGORIES = new Set<SatelliteType>(['station', 'scientific', 'weather']);

function buildRingGeometry(sat: LiveSatellite): THREE.BufferGeometry | null {
  const steps = 120;
  const periodMs = sat.period * 60 * 1000;
  const now = Date.now();
  const pts: THREE.Vector3[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = new Date(now + (i / steps) * periodMs);
    try {
      const pv = satellite.propagate(sat.satrec, t);
      if (!pv.position || typeof pv.position === 'boolean') continue;
      pts.push(eciToVec3(pv.position, sat.altitude));
    } catch (_) {/* skip */}
  }

  if (pts.length < 10) return null;
  return new THREE.BufferGeometry().setFromPoints(pts);
}

// ── Orbital ring component ────────────────────────────────────────

const OrbitalRing: React.FC<{ sat: LiveSatellite }> = ({ sat }) => {
  const geometry = useMemo(() => buildRingGeometry(sat), [sat.noradId]);
  if (!geometry) return null;
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={TYPE_COLOR[sat.category]} transparent opacity={0.20} />
    </line>
  );
};

// ── Main visualization ────────────────────────────────────────────

interface Props {
  onHover: (sat: LiveSatellite | null) => void;
}

export const SatelliteVisualization: React.FC<Props> = ({ onHover }) => {
  const { satellites, loading, error } = useSatelliteData();

  const named = useMemo(() => satellites.filter(s => s.category !== 'debris'), [satellites]);
  const debris = useMemo(() => satellites.filter(s => s.category === 'debris'), [satellites]);

  const satRefs  = useRef<(THREE.Mesh | null)[]>([]);
  const debrisIM = useRef<THREE.InstancedMesh | null>(null);
  const dummy    = useMemo(() => new THREE.Object3D(), []);

  // Resize ref arrays when data changes
  useEffect(() => {
    satRefs.current = satRefs.current.slice(0, named.length);
  }, [named.length]);

  useFrame(() => {
    if (!satellites.length) return;
    const now = new Date();

    // Named satellites – individual meshes
    named.forEach((sat, i) => {
      const mesh = satRefs.current[i];
      if (!mesh) return;
      try {
        const pv = satellite.propagate(sat.satrec, now);
        if (!pv.position || typeof pv.position === 'boolean') return;
        mesh.position.copy(eciToVec3(pv.position, sat.altitude));
      } catch (_) {/* invalid TLE epoch */}
    });

    // Debris – instanced mesh
    const im = debrisIM.current;
    if (im && debris.length) {
      debris.forEach((sat, i) => {
        try {
          const pv = satellite.propagate(sat.satrec, now);
          if (!pv.position || typeof pv.position === 'boolean') return;
          dummy.position.copy(eciToVec3(pv.position, sat.altitude));
          dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix);
        } catch (_) {/* skip */}
      });
      im.instanceMatrix.needsUpdate = true;
    }
  });

  if (loading || error || !satellites.length) return null;

  return (
    <group>
      {/* Orbital rings for stations, scientific, weather */}
      {named
        .filter(s => RING_CATEGORIES.has(s.category))
        .map(s => <OrbitalRing key={s.noradId} sat={s} />)}

      {/* Named satellite markers */}
      {named.map((sat, i) => (
        <mesh
          key={sat.noradId}
          ref={el => { satRefs.current[i] = el; }}
          onPointerEnter={e => { e.stopPropagation(); onHover(sat); }}
          onPointerLeave={() => onHover(null)}
        >
          <sphereGeometry args={[TYPE_SIZE[sat.category], 10, 10]} />
          <meshBasicMaterial color={TYPE_COLOR[sat.category]} />
        </mesh>
      ))}

      {/* Space debris – instanced for performance */}
      {debris.length > 0 && (
        <instancedMesh
          ref={debrisIM}
          args={[undefined, undefined, debris.length]}
          onPointerEnter={e => {
            e.stopPropagation();
            const idx = e.instanceId ?? -1;
            if (idx >= 0 && idx < debris.length) onHover(debris[idx]);
          }}
          onPointerLeave={() => onHover(null)}
        >
          <sphereGeometry args={[0.009, 4, 4]} />
          <meshBasicMaterial color="#EF4444" transparent opacity={0.75} />
        </instancedMesh>
      )}
    </group>
  );
};

// ── HTML overlays (rendered outside Canvas) ───────────────────────

const TYPE_LABEL: Record<SatelliteType, string> = {
  station:       'Space Station',
  navigation:    'Navigation',
  communication: 'Communication',
  scientific:    'Scientific',
  weather:       'Weather',
  military:      'Military',
  debris:        'Space Debris',
};

export const SatelliteInfoPanel: React.FC<{ satellite: LiveSatellite }> = ({ satellite: sat }) => (
  <div
    className="absolute top-3 right-3 z-10 rounded-lg border border-gray-600 bg-gray-900/90 backdrop-blur-sm p-3 text-xs text-white shadow-xl pointer-events-none"
    style={{ minWidth: 190 }}
  >
    <div className="flex items-center gap-2 mb-2">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: TYPE_COLOR[sat.category] }}
      />
      <span className="font-semibold text-sm leading-tight truncate">{sat.name}</span>
    </div>
    <div className="text-gray-400 mb-2 text-[11px]">{TYPE_LABEL[sat.category]}</div>
    <div className="space-y-1">
      <Row label="NORAD ID"    value={sat.noradId} />
      <Row label="Altitude"    value={`${sat.altitude.toLocaleString()} km`} />
      <Row label="Velocity"    value={`${sat.velocity} km/s`} />
      <Row label="Inclination" value={`${sat.inclination.toFixed(1)}°`} />
      <Row label="Period"      value={formatPeriod(sat.period)} />
    </div>
    <div className="mt-2 pt-2 border-t border-gray-700 text-gray-500 text-[10px]">
      Live SGP4 position
    </div>
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <span className="text-gray-400">{label}</span>
    <span className="text-white font-mono">{value}</span>
  </div>
);

function formatPeriod(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hr`;
  return `${(minutes / 1440).toFixed(1)} day`;
}

// ── Legend ────────────────────────────────────────────────────────

const LEGEND_ENTRIES: { type: SatelliteType; label: string }[] = [
  { type: 'station',       label: 'Space Station' },
  { type: 'navigation',    label: 'Navigation (GPS/GLONASS/Galileo/BeiDou)' },
  { type: 'communication', label: 'Communication (Starlink)' },
  { type: 'scientific',    label: 'Scientific' },
  { type: 'weather',       label: 'Weather' },
  { type: 'debris',        label: 'Space Debris' },
];

export const SatelliteLegend: React.FC<{ count: number }> = ({ count }) => (
  <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-gray-600 bg-gray-900/90 backdrop-blur-sm px-3 py-2 text-[11px] text-white shadow-xl pointer-events-none">
    <div className="font-semibold text-xs mb-1.5 text-gray-300">Live Satellite Data</div>
    <div className="space-y-1">
      {LEGEND_ENTRIES.map(({ type, label }) => (
        <div key={type} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: TYPE_COLOR[type] }}
          />
          <span className="text-gray-300">{label}</span>
        </div>
      ))}
    </div>
    <div className="mt-1.5 pt-1.5 border-t border-gray-700 text-gray-500">
      {count} objects · TLE via CelesTrak
    </div>
  </div>
);

// Satisfy existing import in Globe3DContainer
export const SpaceObjects = SatelliteVisualization;

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SatelliteOrbit, SatelliteType } from '../../types/satellite';
import { NAMED_SATELLITES, DEBRIS } from '../../data/satelliteData';

const DEG2RAD = Math.PI / 180;
const SPEED = 250; // 250× real-time

// ──────────────────────────────────────────────
// Orbital mechanics
// ──────────────────────────────────────────────

/**
 * Converts orbital elements to a Three.js position.
 * Uses a Y-up coordinate system where XZ is the equatorial plane.
 */
function orbitPosition(
  theta: number,   // current angle in orbit (radians)
  incl: number,    // inclination (radians)
  raan: number,    // RAAN (radians)
  radius: number
): THREE.Vector3 {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosI = Math.cos(incl);
  const sinI = Math.sin(incl);
  const cosR = Math.cos(raan);
  const sinR = Math.sin(raan);

  // Position in inclined orbital plane (ascending node at +X)
  const xi = cosT;
  const yi = sinT * sinI;
  const zi = -sinT * cosI;

  // Apply RAAN rotation around Y axis
  return new THREE.Vector3(
    radius * (xi * cosR + zi * sinR),
    radius * yi,
    radius * (-xi * sinR + zi * cosR)
  );
}

// ──────────────────────────────────────────────
// Visual helpers
// ──────────────────────────────────────────────

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
  navigation:    0.020,
  communication: 0.018,
  scientific:    0.018,
  weather:       0.018,
  military:      0.016,
  debris:        0.009,
};

// ──────────────────────────────────────────────
// Orbital ring (pre-computed, static)
// ──────────────────────────────────────────────

const OrbitalRing: React.FC<{ satellite: SatelliteOrbit }> = ({ satellite }) => {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const incl = satellite.inclination * DEG2RAD;
    const raan = satellite.raan * DEG2RAD;
    for (let i = 0; i <= 128; i++) {
      pts.push(orbitPosition((i / 128) * 2 * Math.PI, incl, raan, satellite.visualRadius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [satellite]);

  const color = TYPE_COLOR[satellite.type];

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.22} />
    </line>
  );
};

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

interface Props {
  onHover: (sat: SatelliteOrbit | null) => void;
}

export const SatelliteVisualization: React.FC<Props> = ({ onHover }) => {
  const elapsed = useRef(0);
  const satRefs = useRef<(THREE.Mesh | null)[]>([]);
  const debrisRef = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-compute inclination/raan in radians once
  const satRad = useMemo(() =>
    NAMED_SATELLITES.map(s => ({
      incl: s.inclination * DEG2RAD,
      raan: s.raan * DEG2RAD,
    })), []);

  const debrisRad = useMemo(() =>
    DEBRIS.map(d => ({
      incl: d.inclination * DEG2RAD,
      raan: d.raan * DEG2RAD,
    })), []);

  useFrame((_, delta) => {
    elapsed.current += delta * SPEED;

    // Named satellites
    NAMED_SATELLITES.forEach((sat, i) => {
      const mesh = satRefs.current[i];
      if (!mesh) return;
      const theta = sat.initialAngle * DEG2RAD + (2 * Math.PI * elapsed.current) / sat.period;
      const pos = orbitPosition(theta, satRad[i].incl, satRad[i].raan, sat.visualRadius);
      mesh.position.copy(pos);
    });

    // Debris instanced mesh
    const im = debrisRef.current;
    if (im) {
      DEBRIS.forEach((d, i) => {
        const theta = d.initialAngle * DEG2RAD + (2 * Math.PI * elapsed.current) / d.period;
        const pos = orbitPosition(theta, debrisRad[i].incl, debrisRad[i].raan, d.visualRadius);
        dummy.position.copy(pos);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Orbital rings for named satellites */}
      {NAMED_SATELLITES.map(sat => (
        <OrbitalRing key={sat.id} satellite={sat} />
      ))}

      {/* Named satellite markers */}
      {NAMED_SATELLITES.map((sat, i) => (
        <mesh
          key={sat.id}
          ref={el => { satRefs.current[i] = el; }}
          onPointerEnter={e => { e.stopPropagation(); onHover(sat); }}
          onPointerLeave={() => onHover(null)}
        >
          <sphereGeometry args={[TYPE_SIZE[sat.type], 10, 10]} />
          <meshBasicMaterial color={TYPE_COLOR[sat.type]} />
        </mesh>
      ))}

      {/* Space debris — instanced for performance */}
      <instancedMesh
        ref={debrisRef}
        args={[undefined, undefined, DEBRIS.length]}
        onPointerEnter={e => {
          e.stopPropagation();
          const idx = e.instanceId ?? -1;
          if (idx >= 0) onHover(DEBRIS[idx]);
        }}
        onPointerLeave={() => onHover(null)}
      >
        <sphereGeometry args={[0.009, 4, 4]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.75} />
      </instancedMesh>
    </group>
  );
};

// ──────────────────────────────────────────────
// HTML info panel (rendered outside Canvas)
// ──────────────────────────────────────────────

const TYPE_LABEL: Record<SatelliteType, string> = {
  station:       'Space Station',
  navigation:    'Navigation',
  communication: 'Communication',
  scientific:    'Scientific',
  weather:       'Weather',
  military:      'Military',
  debris:        'Space Debris',
};

export const SatelliteInfoPanel: React.FC<{ satellite: SatelliteOrbit }> = ({ satellite }) => {
  const color = TYPE_COLOR[satellite.type];
  return (
    <div
      className="absolute top-3 right-3 z-10 rounded-lg border border-gray-600 bg-gray-900/90 backdrop-blur-sm p-3 text-xs text-white shadow-xl"
      style={{ minWidth: 180 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="font-semibold text-sm leading-tight">{satellite.name}</span>
      </div>
      <div className="text-gray-400 mb-2 text-[11px]">{TYPE_LABEL[satellite.type]}</div>
      <div className="space-y-1">
        <Row label="Altitude"  value={`${satellite.altitude.toLocaleString()} km`} />
        <Row label="Velocity"  value={`${satellite.velocity} km/s`} />
        <Row label="Inclination" value={`${satellite.inclination.toFixed(1)}°`} />
        <Row label="Period"    value={formatPeriod(satellite.period)} />
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <span className="text-gray-400">{label}</span>
    <span className="text-white font-mono">{value}</span>
  </div>
);

function formatPeriod(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hr`;
  return `${(seconds / 86400).toFixed(1)} day`;
}

// ──────────────────────────────────────────────
// Legend (rendered outside Canvas)
// ──────────────────────────────────────────────

const LEGEND_TYPES: { type: SatelliteType; label: string }[] = [
  { type: 'station',       label: 'Space Station' },
  { type: 'navigation',    label: 'Navigation' },
  { type: 'communication', label: 'Communication' },
  { type: 'scientific',    label: 'Scientific' },
  { type: 'weather',       label: 'Weather' },
  { type: 'debris',        label: 'Space Debris' },
];

export const SatelliteLegend: React.FC = () => (
  <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-gray-600 bg-gray-900/90 backdrop-blur-sm px-3 py-2 text-[11px] text-white shadow-xl">
    <div className="font-semibold text-xs mb-1.5 text-gray-300">Satellite Types</div>
    <div className="space-y-1">
      {LEGEND_TYPES.map(({ type, label }) => (
        <div key={type} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLOR[type] }} />
          <span className="text-gray-300">{label}</span>
        </div>
      ))}
    </div>
    <div className="mt-1.5 pt-1.5 border-t border-gray-700 text-gray-500">
      {NAMED_SATELLITES.length} satellites · {DEBRIS.length} debris
    </div>
  </div>
);

// Re-export unused stub to satisfy existing import in Globe3DContainer
export const SpaceObjects = SatelliteVisualization;

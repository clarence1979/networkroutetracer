import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Earth } from './Earth';
import {
  SatelliteVisualization,
  SatelliteInfoPanel,
  SatelliteLegend,
} from './SatelliteVisualization';
import { NetworkHop } from '../../types/networking';
import { LiveSatellite } from '../../hooks/useSatelliteData';

interface Globe3DContainerProps {
  route?: NetworkHop[];
  onHopClick?: (hop: NetworkHop) => void;
  showSatellites?: boolean;
  className?: string;
}

const SPEED_OPTIONS: { label: string; value: number }[] = [
  { label: '1×',    value: 1     },
  { label: '30×',   value: 30    },
  { label: '60×',   value: 60    },
  { label: '300×',  value: 300   },
  { label: '1000×', value: 1000  },
];

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full bg-gray-900 text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p>Loading Earth…</p>
    </div>
  </div>
);

export const Globe3DContainer: React.FC<Globe3DContainerProps> = ({
  route,
  onHopClick,
  showSatellites = false,
  className = '',
}) => {
  const [hoveredSat, setHoveredSat]   = useState<LiveSatellite | null>(null);
  const [satCount,   setSatCount]     = useState(0);
  const [simSpeed,   setSimSpeed]     = useState(60); // default 60× so motion is visible

  return (
    <div className={`relative w-full h-full bg-gray-900 ${className}`}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, -5, -5]} intensity={0.5} />
          <Environment preset="night" />

          <Earth onHopClick={onHopClick} route={route} />

          {showSatellites && (
            <SatelliteVisualization
              onHover={setHoveredSat}
              onCount={setSatCount}
              simSpeed={simSpeed}
            />
          )}

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            zoomSpeed={0.6}
            panSpeed={0.8}
            rotateSpeed={0.4}
            minDistance={3}
            maxDistance={10}
          />
        </Canvas>
      </Suspense>

      {/* Satellite hover info */}
      {showSatellites && hoveredSat && (
        <SatelliteInfoPanel satellite={hoveredSat} />
      )}

      {/* Satellite legend */}
      {showSatellites && satCount > 0 && (
        <SatelliteLegend count={satCount} />
      )}

      {/* Simulation speed control */}
      {showSatellites && satCount > 0 && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-lg border border-gray-600 bg-gray-900/90 backdrop-blur-sm px-2 py-1.5 shadow-xl">
          <span className="text-[10px] text-gray-400 mr-1 select-none">Speed</span>
          {SPEED_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSimSpeed(opt.value)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                simSpeed === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

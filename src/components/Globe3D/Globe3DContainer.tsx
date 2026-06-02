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

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full bg-gray-900 text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p>Loading Earth...</p>
    </div>
  </div>
);

export const Globe3DContainer: React.FC<Globe3DContainerProps> = ({
  route,
  onHopClick,
  showSatellites = false,
  className = '',
}) => {
  const [hoveredSat, setHoveredSat] = useState<LiveSatellite | null>(null);
  const [satCount, setSatCount] = useState(0);

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

      {showSatellites && hoveredSat && (
        <SatelliteInfoPanel satellite={hoveredSat} />
      )}

      {showSatellites && satCount > 0 && (
        <SatelliteLegend count={satCount} />
      )}

      {showSatellites && satCount === 0 && (
        <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-gray-600 bg-gray-900/90 backdrop-blur-sm px-3 py-2 text-xs text-gray-300 shadow-xl pointer-events-none flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400" />
          Fetching live TLE data from CelesTrak…
        </div>
      )}
    </div>
  );
};

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
import { SatelliteOrbit } from '../../types/satellite';

interface Globe3DContainerProps {
  route?: NetworkHop[];
  onHopClick?: (hop: NetworkHop) => void;
  showSatellites?: boolean;
  className?: string;
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full bg-gray-900 text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
  const [hoveredSat, setHoveredSat] = useState<SatelliteOrbit | null>(null);

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
            <SatelliteVisualization onHover={setHoveredSat} />
          )}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
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

      {showSatellites && (
        <SatelliteLegend />
      )}
    </div>
  );
};

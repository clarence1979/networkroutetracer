import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Earth } from './Earth';
import { RouteVisualization } from './RouteVisualization';
import { SpaceObjects } from './SpaceObjects';
import { NetworkHop } from '../../types/networking';

interface Globe3DContainerProps {
  route?: NetworkHop[];
  onHopClick?: (hop: NetworkHop) => void;
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
  className = ""
}) => {
  return (
    <div className={`w-full h-full bg-gray-900 ${className}`}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, -5, -5]} intensity={0.5} />

          {/* Environment for reflections */}
          <Environment preset="night" />

          {/* Earth */}
          <Earth onHopClick={onHopClick} route={route} />


          {/* Camera controls */}
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
    </div>
  );
};
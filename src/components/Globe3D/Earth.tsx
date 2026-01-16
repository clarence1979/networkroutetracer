import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import { NetworkHop } from '../../types/networking';
import { RouteVisualization } from './RouteVisualization';

interface EarthProps {
  onHopClick?: (hop: NetworkHop) => void;
  route?: NetworkHop[];
}

export const Earth: React.FC<EarthProps> = ({ onHopClick, route }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Load earth textures
  const [colorMap, bumpMap] = useLoader(TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'
  ]);

  // Slow earth rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  const earthGeometry = useMemo(() => new THREE.SphereGeometry(2, 64, 64), []);
  
  const earthMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: bumpMap,
      normalScale: new THREE.Vector2(0.05, 0.05),
    });
  }, [colorMap, bumpMap]);

  return (
    <mesh ref={meshRef} geometry={earthGeometry} material={earthMaterial}>
      {/* Route visualization as child of Earth mesh so it rotates with it */}
      {route && route.length > 0 && (
        <RouteVisualization hops={route} onHopClick={onHopClick} />
      )}
      
      {/* Add atmosphere glow effect */}
      <mesh scale={1.01}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#87CEEB"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </mesh>
  );
};
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NetworkHop } from '../../types/networking';

interface RouteVisualizationProps {
  hops: NetworkHop[];
  animated?: boolean;
  onHopClick?: (hop: NetworkHop) => void;
}

export const RouteVisualization: React.FC<RouteVisualizationProps> = ({ 
  hops, 
  animated = true,
  onHopClick
}) => {
  // Convert lat/lng to 3D coordinates on sphere
  const latLngToVector3 = (lat: number, lng: number, radius: number = 2.01) => {
    const phi = (lat) * (Math.PI / 180);
    const theta = (lng) * (Math.PI / 180);
    
    return new THREE.Vector3(
      radius * Math.cos(phi) * Math.cos(theta),
      radius * Math.sin(phi),
      -radius * Math.cos(phi) * Math.sin(theta)
    );
  };

  // Calculate great circle distance between two points
  const greatCircleDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Create intermediate points for long routes to prevent going through Earth
  const createRoutePoints = (start: THREE.Vector3, end: THREE.Vector3, startHop: NetworkHop, endHop: NetworkHop) => {
    const distance = greatCircleDistance(
      startHop.location.lat, startHop.location.lng,
      endHop.location.lat, endHop.location.lng
    );
    
    // For very long distances (> 8000km), create intermediate points
    if (distance > 8000) {
      const points = [];
      const numSegments = Math.ceil(distance / 4000); // Create segments of ~4000km
      
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        const lat = startHop.location.lat + t * (endHop.location.lat - startHop.location.lat);
        const lng = startHop.location.lng + t * (endHop.location.lng - startHop.location.lng);
        
        // Handle longitude wrapping for trans-Pacific routes
        let adjustedLng = lng;
        if (Math.abs(endHop.location.lng - startHop.location.lng) > 180) {
          if (startHop.location.lng > endHop.location.lng) {
            adjustedLng = startHop.location.lng + t * (endHop.location.lng + 360 - startHop.location.lng);
            if (adjustedLng > 180) adjustedLng -= 360;
          } else {
            adjustedLng = startHop.location.lng + t * (endHop.location.lng - 360 - startHop.location.lng);
            if (adjustedLng < -180) adjustedLng += 360;
          }
        }
        
        const point = latLngToVector3(lat, adjustedLng, 2.1 + Math.sin(t * Math.PI) * 0.3);
        points.push(point);
      }
      return points;
    } else {
      // For shorter routes, use simple arc
      const midpoint = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(2.3);
      return [start, midpoint, end];
    }
  };

  // Generate route points and curves
  const { points, curves } = useMemo(() => {
    const routePoints = hops.map(hop => 
      latLngToVector3(hop.location.lat, hop.location.lng)
    );

    const routeCurves = [];
    for (let i = 0; i < routePoints.length - 1; i++) {
      const start = routePoints[i];
      const end = routePoints[i + 1];
      const currentHop = hops[i];
      const nextHop = hops[i + 1];
      
      // Create route points (handles long distances)
      const routeSegmentPoints = createRoutePoints(start, end, currentHop, nextHop);
      const curve = new THREE.CatmullRomCurve3(routeSegmentPoints, false, 'centripetal');
      
      routeCurves.push({
        curve,
        color: currentHop.latency < 50 ? '#10B981' : currentHop.latency < 150 ? '#F59E0B' : '#EF4444'
      });
    }

    return { points: routePoints, curves: routeCurves };
  }, [hops]);

  const getHopColor = (hop: NetworkHop) => {
    switch (hop.type) {
      case 'router': return '#8B5CF6';
      case 'isp': return '#3B82F6';
      case 'backbone': return '#F59E0B';
      case 'cdn': return '#10B981';
      case 'destination': return '#EF4444';
      default: return '#6B7280';
    }
  };
  const openGoogleMapsStreetView = (hop: NetworkHop) => {
    const { lat, lng } = hop.location;
    // Google Maps Street View URL format
    const streetViewUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,0h,90t/data=!3m7!1e1!3m5!1s0x0:0x0!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fpanoid%3D0%26cb_client%3Dmaps_sv.tactile.gps%26w%3D203%26h%3D100%26yaw%3D0%26pitch%3D0%26thumbfov%3D100!7i16384!8i8192`;
    
    // Fallback to regular Google Maps if Street View isn't available
    const mapsUrl = `https://www.google.com/maps/place/${lat},${lng}/@${lat},${lng},15z`;
    
    // Try Street View first, fallback to regular maps
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    
    // Also trigger the onHopClick callback if provided
    if (onHopClick) {
      onHopClick(hop);
    }
  };

  return (
    <group>
      {/* Render hop markers */}
      {points.map((point, index) => {
        const hop = hops[index];
        return (
          <group key={hop.id} position={point}>
            <mesh 
              onClick={(e) => {
                e.stopPropagation();
                openGoogleMapsStreetView(hop);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'default';
              }}
            >
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color={getHopColor(hop)} />
            </mesh>
            
            {/* Pulsing ring animation */}
            {animated && (
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  openGoogleMapsStreetView(hop);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'default';
                }}
              >
                <ringGeometry args={[0.06, 0.09, 16]} />
                <meshBasicMaterial
                  color={getHopColor(hop)}
                  transparent
                  opacity={0.6}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Render route curves */}
      {curves.map((curveData, index) => {
        const curvePoints = curveData.curve.getPoints(200);
        const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        
        return (
          <line key={index} geometry={geometry}>
            <lineBasicMaterial color={curveData.color} linewidth={4} />
          </line>
        );
      })}
    </group>
  );
};
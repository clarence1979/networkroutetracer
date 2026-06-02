export type SatelliteType =
  | 'station'
  | 'navigation'
  | 'communication'
  | 'scientific'
  | 'weather'
  | 'military'
  | 'debris';

export interface SatelliteOrbit {
  id: string;
  name: string;
  type: SatelliteType;
  altitude: number;     // km above surface
  velocity: number;     // km/s
  inclination: number;  // degrees
  raan: number;         // Right Ascension of Ascending Node, degrees
  initialAngle: number; // starting true anomaly, degrees
  period: number;       // real orbital period, seconds
  visualRadius: number; // Three.js radius for display
}

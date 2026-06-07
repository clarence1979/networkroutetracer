import { SatelliteType } from '../types/satellite';
import { STATIC_SATELLITES, OrbitalElements, derivedProps } from '../data/satelliteData';

export interface LiveSatellite extends OrbitalElements {
  altitude:    number; // km
  period:      number; // minutes
  velocity:    number; // km/s
  n_rads:      number; // mean motion (rad/s)
}

function build(): LiveSatellite[] {
  return STATIC_SATELLITES.map(el => {
    const { n, period, velocity, altitude } = derivedProps(el);
    return { ...el, altitude, period, velocity, n_rads: n };
  });
}

const SATELLITES = build();

export function useSatelliteData() {
  return { satellites: SATELLITES, loading: false, error: null };
}

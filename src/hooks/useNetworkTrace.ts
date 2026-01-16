import { useState } from 'react';
import { RouteData, DomainInfo, NetworkHop } from '../types/networking';
import { generateSampleRoute, sampleDomainInfo } from '../data/sampleData';

export const useNetworkTrace = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);

  const calculateDistance = (hops: NetworkHop[]): number => {
    let totalDistance = 0;
    for (let i = 0; i < hops.length - 1; i++) {
      const hop1 = hops[i];
      const hop2 = hops[i + 1];
      
      // Simple distance calculation using Haversine formula approximation
      const lat1 = hop1.location.lat * Math.PI / 180;
      const lat2 = hop2.location.lat * Math.PI / 180;
      const deltaLat = (hop2.location.lat - hop1.location.lat) * Math.PI / 180;
      const deltaLng = (hop2.location.lng - hop1.location.lng) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371 * c; // Earth's radius in kilometers

      totalDistance += distance;
    }
    return Math.round(totalDistance);
  };

  const traceRoute = async (domain: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Validate domain
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        throw new Error('Please enter a valid domain name (e.g., google.com)');
      }

      // Generate sample data
      const hops = generateSampleRoute(domain);
      const domainData = sampleDomainInfo(domain);
      
      const totalDistance = calculateDistance(hops);
      const averageLatency = hops.reduce((sum, hop) => sum + hop.latency, 0) / hops.length;

      const route: RouteData = {
        domain,
        totalDistance,
        totalHops: hops.length,
        averageLatency,
        hops,
        timestamp: new Date()
      };

      setRouteData(route);
      setDomainInfo(domainData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trace route';
      setError(errorMessage);
      setRouteData(null);
      setDomainInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
    setDomainInfo(null);
    setError(null);
  };

  return {
    loading,
    error,
    routeData,
    domainInfo,
    traceRoute,
    clearRoute
  };
};
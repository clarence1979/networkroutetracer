import React from 'react';
import { useState } from 'react';
import { RouteData, NetworkHop } from '../types/networking';
import { OpenAIService } from '../services/openaiService';
import { ApiKeyCache } from '../services/apiKeyCache';

export const useAINetworkTrace = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [apiKey, setApiKey] = useState<string>(ApiKeyCache.apiKey);
  const [isInitialized, setIsInitialized] = useState(false);

  // Subscribe to global API key changes
  React.useEffect(() => {
    const unsubscribe = ApiKeyCache.subscribe((newApiKey) => {
      setApiKey(newApiKey);
      setIsInitialized(true);
    });

    return unsubscribe;
  }, []);

  const calculateDistance = (hops: NetworkHop[]): number => {
    let totalDistance = 0;
    for (let i = 0; i < hops.length - 1; i++) {
      const hop1 = hops[i];
      const hop2 = hops[i + 1];
      
      // Haversine formula for distance calculation
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
    if (!apiKey) {
      setError('Please enter your OpenAI API key first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate domain
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
      if (!domainRegex.test(domain)) {
        throw new Error('Please enter a valid domain name (e.g., google.com, bbc.co.uk)');
      }

      const openaiService = new OpenAIService(apiKey);

      // Step 1: Get user's location
      console.log('Getting user location...');
      const userLocation = await openaiService.getUserLocation();

      // Step 2: Resolve target domain location
      console.log('Resolving target location...');
      const targetLocation = await openaiService.resolveTargetLocation(domain);

      // Step 3: Perform AI-powered traceroute
      console.log('Performing traceroute...');
      const hops = await openaiService.performTraceroute(userLocation, domain);

      // Convert to our NetworkHop format
      const networkHops: NetworkHop[] = hops.map(hop => ({
        id: hop.hop,
        ip: hop.ip,
        hostname: hop.hostname,
        location: hop.location,
        latency: hop.latency,
        organization: hop.organization,
        type: hop.type
      }));

      const totalDistance = calculateDistance(networkHops);
      const averageLatency = networkHops.reduce((sum, hop) => sum + hop.latency, 0) / networkHops.length;

      const route: RouteData = {
        domain,
        totalDistance,
        totalHops: networkHops.length,
        averageLatency,
        hops: networkHops,
        timestamp: new Date()
      };

      setRouteData(route);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trace route';
      setError(errorMessage);
      setRouteData(null);
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
    setError(null);
  };

  const updateAPIKey = (newApiKey: string) => {
    ApiKeyCache.apiKey = newApiKey;
    setError(null);
  };

  return {
    loading,
    error,
    routeData,
    traceRoute,
    clearRoute,
    updateAPIKey,
    hasAPIKey: ApiKeyCache.hasApiKey(),
    isInitialized
  };
};
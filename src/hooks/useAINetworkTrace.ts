import React, { useState } from 'react';
import { RouteData, NetworkHop } from '../types/networking';
import { OpenAIService, fetchLatestModel } from '../services/openaiService';
import { ApiKeyCache } from '../services/apiKeyCache';

export const useAINetworkTrace = () => {
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [routeData,    setRouteData]    = useState<RouteData | null>(null);
  const [apiKey,       setApiKey]       = useState<string>(ApiKeyCache.apiKey);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentModel, setCurrentModel] = useState<string | null>(null);

  // Subscribe to global API key changes and pre-fetch the latest model
  React.useEffect(() => {
    const unsubscribe = ApiKeyCache.subscribe((newApiKey) => {
      setApiKey(newApiKey);
      setIsInitialized(true);
      if (newApiKey) {
        fetchLatestModel(newApiKey).then(setCurrentModel).catch(() => {/* ignore */});
      }
    });
    return unsubscribe;
  }, []);

  const calculateDistance = (hops: NetworkHop[]): number => {
    let total = 0;
    for (let i = 0; i < hops.length - 1; i++) {
      const { lat: lat1, lng: lng1 } = hops[i].location;
      const { lat: lat2, lng: lng2 } = hops[i + 1].location;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      total += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return Math.round(total);
  };

  const traceRoute = async (domain: string): Promise<void> => {
    if (!apiKey) {
      setError('Please enter your OpenAI API key first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
      if (!domainRegex.test(domain)) {
        throw new Error('Please enter a valid domain name (e.g., google.com, bbc.co.uk)');
      }

      const service = new OpenAIService(apiKey);

      const [userLocation, targetLocation] = await Promise.all([
        service.getUserLocation(),
        service.resolveTargetLocation(domain),
      ]);

      // Update displayed model after first request resolves it
      service.getModel().then(setCurrentModel);

      const hops = await service.performTraceroute(userLocation, domain);

      const networkHops: NetworkHop[] = hops.map(h => ({
        id:           h.hop,
        ip:           h.ip,
        hostname:     h.hostname,
        location:     h.location,
        latency:      h.latency,
        organization: h.organization,
        type:         h.type,
      }));

      setRouteData({
        domain,
        totalDistance:  calculateDistance(networkHops),
        totalHops:      networkHops.length,
        averageLatency: networkHops.reduce((s, h) => s + h.latency, 0) / networkHops.length,
        hops:           networkHops,
        timestamp:      new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trace route');
      setRouteData(null);
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => { setRouteData(null); setError(null); };

  const updateAPIKey = (newApiKey: string) => {
    ApiKeyCache.apiKey = newApiKey;
    setError(null);
  };

  return {
    loading,
    error,
    routeData,
    currentModel,
    traceRoute,
    clearRoute,
    updateAPIKey,
    hasAPIKey:      ApiKeyCache.hasApiKey(),
    isInitialized,
  };
};

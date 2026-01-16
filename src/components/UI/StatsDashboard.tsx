import React from 'react';
import { BarChart3, TrendingUp, Gauge, MapPin } from 'lucide-react';
import { RouteData } from '../../types/networking';

interface StatsDashboardProps {
  routeData?: RouteData;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ routeData }) => {
  if (!routeData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Route Statistics</h2>
        </div>
        <div className="text-center text-gray-500">
          <Gauge className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Statistics will appear after tracing a route</p>
        </div>
      </div>
    );
  }

  const fastestHop = routeData.hops.reduce((fastest, hop) => 
    hop.latency < fastest.latency ? hop : fastest
  );
  
  const slowestHop = routeData.hops.reduce((slowest, hop) => 
    hop.latency > slowest.latency ? hop : slowest
  );

  const domesticHops = routeData.hops.filter(hop => 
    hop.location.country === 'Australia'
  ).length;

  const internationalHops = routeData.hops.length - domesticHops;

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return 'text-green-600';
    if (latency < 150) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLatencyBg = (latency: number) => {
    if (latency < 50) return 'bg-green-50 border-green-200';
    if (latency < 150) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <BarChart3 className="h-6 w-6 text-green-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Route Statistics</h2>
      </div>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Total Distance</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {routeData.totalDistance.toLocaleString()} km
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Estimated cable/fiber distance
            </p>
          </div>

          <div className={`border p-4 rounded-lg ${getLatencyBg(routeData.averageLatency)}`}>
            <div className="flex items-center mb-2">
              <Gauge className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Average Latency</span>
            </div>
            <p className={`text-2xl font-bold ${getLatencyColor(routeData.averageLatency)}`}>
              {routeData.averageLatency.toFixed(0)}ms
            </p>
            <p className="text-xs mt-1 opacity-75">
              Round-trip response time
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <MapPin className="h-4 w-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-800">Network Hops</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {routeData.totalHops}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Intermediate network nodes
            </p>
          </div>
        </div>

        {/* Hop Analysis */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hop Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Geographic Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Domestic (Australia):</span>
                  <span className="font-semibold text-green-600">{domesticHops} hops</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">International:</span>
                  <span className="font-semibold text-blue-600">{internationalHops} hops</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(domesticHops / routeData.totalHops) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Performance Analysis</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Fastest Hop:</span>
                    <span className={`text-sm font-semibold ${getLatencyColor(fastestHop.latency)}`}>
                      {fastestHop.latency}ms
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {fastestHop.location.city}, {fastestHop.location.country}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Slowest Hop:</span>
                    <span className={`text-sm font-semibold ${getLatencyColor(slowestHop.latency)}`}>
                      {slowestHop.latency}ms
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {slowestHop.location.city}, {slowestHop.location.country}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Insights */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">💡 Educational Insights</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            {domesticHops > internationalHops && (
              <p>• Most hops are within Australia, showing efficient domestic routing.</p>
            )}
            {routeData.averageLatency > 200 && (
              <p>• High latency suggests international routing through submarine cables.</p>
            )}
            {routeData.totalHops < 8 && (
              <p>• Relatively few hops indicate efficient network infrastructure.</p>
            )}
            <p>• Each hop represents a router or server that forwards your data closer to its destination.</p>
            {internationalHops > 0 && (
              <p>• International hops show how data crosses continents through fiber optic cables.</p>
            )}
          </div>
        </div>

        {/* Comparison Context */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📊 How This Compares</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Typical domestic Australian site: 20-50ms latency</p>
            <p>• Sydney to USA West Coast: 150-180ms latency</p>
            <p>• Sydney to Europe: 280-320ms latency</p>
            <p>• Physical limit (speed of light): ~1ms per 200km</p>
          </div>
        </div>
      </div>
    </div>
  );
};
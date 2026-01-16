import React from 'react';
import { Clock, MapPin, Server, Zap, Globe } from 'lucide-react';
import { RouteData, NetworkHop } from '../../types/networking';

interface RouteInfoPanelProps {
  routeData?: RouteData;
  selectedHop?: NetworkHop;
  onHopSelect?: (hop: NetworkHop) => void;
}

export const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({
  routeData,
  selectedHop,
  onHopSelect
}) => {
  if (!routeData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Enter a domain to trace its network route</p>
        </div>
      </div>
    );
  }

  const getHopTypeIcon = (type: string) => {
    switch (type) {
      case 'router': return '🏠';
      case 'isp': return '🏢';
      case 'backbone': return '🌐';
      case 'cdn': return '⚡';
      case 'destination': return '🎯';
      default: return '📍';
    }
  };

  const getHopTypeDescription = (type: string) => {
    switch (type) {
      case 'router': return 'Home/Local Router';
      case 'isp': return 'Internet Service Provider';
      case 'backbone': return 'Internet Backbone';
      case 'cdn': return 'Content Delivery Network';
      case 'destination': return 'Destination Server';
      default: return 'Network Node';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Route Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Route to {routeData.domain}
        </h3>
        
        {/* Display destination IP */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Destination IP:</span>
            <span className="font-mono text-sm font-semibold text-gray-900">
              {routeData.hops[routeData.hops.length - 1]?.ip}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">Total Time</span>
            </div>
            <p className="text-lg font-semibold text-blue-900">
              {routeData.averageLatency.toFixed(0)}ms
            </p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center">
              <Zap className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm text-green-800">Total Hops</span>
            </div>
            <p className="text-lg font-semibold text-green-900">
              {routeData.totalHops}
            </p>
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Server className="h-4 w-4 text-purple-600 mr-2" />
            <span className="text-sm text-purple-800">Estimated Distance</span>
          </div>
          <p className="text-lg font-semibold text-purple-900">
            {routeData.totalDistance.toLocaleString()} km
          </p>
        </div>
      </div>

      {/* Network Hops */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Network Hops</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {routeData.hops.map((hop, index) => (
            <div
              key={hop.id}
              onClick={() => onHopSelect?.(hop)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedHop?.id === hop.id
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{getHopTypeIcon(hop.type)}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      Hop {index + 1}: {getHopTypeDescription(hop.type)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {hop.location.city}, {hop.location.country}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    hop.latency < 50 ? 'text-green-600' : 
                    hop.latency < 150 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {hop.latency}ms
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                <div>{hop.ip}</div>
                {hop.hostname && <div>{hop.hostname}</div>}
                <div>{hop.organization}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Hop Details */}
      {selectedHop && (
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Hop Details: {getHopTypeDescription(selectedHop.type)}
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-700">
                💡 <strong>Tip:</strong> Click on any node in the 3D globe to view its location on Google Maps!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">IP Address:</span>
              <span className="font-mono">{selectedHop.ip}</span>
              
              <span className="text-gray-600">Location:</span>
              <span>{selectedHop.location.city}, {selectedHop.location.country}</span>
              
              <span className="text-gray-600">Organization:</span>
              <span>{selectedHop.organization}</span>
              
              <span className="text-gray-600">Response Time:</span>
              <span className={
                selectedHop.latency < 50 ? 'text-green-600' : 
                selectedHop.latency < 150 ? 'text-yellow-600' : 'text-red-600'
              }>
                {selectedHop.latency}ms
              </span>
            </div>
            
            {selectedHop.hostname && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600 text-sm">Hostname:</span>
                <div className="font-mono text-sm break-all">{selectedHop.hostname}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
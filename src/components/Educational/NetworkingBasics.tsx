import React, { useState } from 'react';
import { BookOpen, HelpCircle, Wifi, Globe, Server, Zap } from 'lucide-react';

interface ConceptCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
  australianContext?: string;
}

export const NetworkingBasics: React.FC = () => {
  const [selectedConcept, setSelectedConcept] = useState<string>('ip-address');

  const concepts: ConceptCard[] = [
    {
      id: 'ip-address',
      icon: <Server className="h-6 w-6" />,
      title: 'IP Addresses',
      description: 'Every device on the internet has a unique address, like a postal address.',
      details: [
        'IP stands for Internet Protocol',
        'IPv4 addresses look like: 192.168.1.1',
        'IPv6 addresses look like: 2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        'Think of it like your home address - it tells data where to go!'
      ],
      australianContext: 'In Australia, APNIC (Asia-Pacific Network Information Centre) manages IP address allocation for the region.'
    },
    {
      id: 'dns',
      icon: <Globe className="h-6 w-6" />,
      title: 'Domain Names (DNS)',
      description: 'DNS translates website names into IP addresses that computers understand.',
      details: [
        'DNS stands for Domain Name System',
        'Translates google.com → 142.250.66.206',
        'Like a phone book for the internet',
        'Without DNS, you\'d need to remember IP addresses for every website!'
      ],
      australianContext: 'Australia has its own country code top-level domain (.au) managed by auDA (Australian Domain Administration).'
    },
    {
      id: 'isp',
      icon: <Wifi className="h-6 w-6" />,
      title: 'Internet Service Providers',
      description: 'ISPs connect your home to the global internet through their network infrastructure.',
      details: [
        'ISP stands for Internet Service Provider',
        'Examples: Telstra, Optus, TPG, Aussie Broadband',
        'They maintain cables, routers, and data centers',
        'Your data travels through multiple ISPs to reach its destination'
      ],
      australianContext: 'Major Australian ISPs include Telstra (owns most infrastructure), Optus, and many smaller providers that use the NBN network.'
    },
    {
      id: 'latency',
      icon: <Zap className="h-6 w-6" />,
      title: 'Latency & Distance',
      description: 'The time it takes for data to travel from your device to a server and back.',
      details: [
        'Measured in milliseconds (ms)',
        'Distance matters - data travels at light speed through cables',
        'Sydney to New York: ~180ms minimum due to physical distance',
        'Submarine cables cross oceans to connect continents'
      ],
      australianContext: 'Australia is geographically isolated, so accessing overseas content typically has higher latency. This is why many services have Australian data centers.'
    }
  ];

  const selectedCard = concepts.find(c => c.id === selectedConcept);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">
          Networking Basics for Year 9
        </h2>
      </div>

      {/* Concept Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {concepts.map((concept) => (
          <button
            key={concept.id}
            onClick={() => setSelectedConcept(concept.id)}
            className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
              selectedConcept === concept.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {concept.icon}
              <span className="text-xs sm:text-sm font-medium mt-1">{concept.title}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Concept Details */}
      {selectedCard && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {selectedCard.title}
            </h3>
            <p className="text-blue-800">{selectedCard.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Key Points:</h4>
            <ul className="space-y-2">
              {selectedCard.details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {selectedCard.australianContext && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Australian Context</h4>
                  <p className="text-green-800">{selectedCard.australianContext}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NBN Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Australia's NBN (National Broadband Network)</h4>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800 mb-3">
            The NBN is Australia's national wholesale broadband infrastructure, designed to provide high-speed internet access to all Australians.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold text-yellow-900 mb-2">NBN Technologies:</h5>
              <ul className="space-y-1 text-yellow-800">
                <li>• Fiber to the Premises (FTTP)</li>
                <li>• Fiber to the Node (FTTN)</li>
                <li>• Fixed Wireless</li>
                <li>• Satellite (for remote areas)</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-yellow-900 mb-2">Impact on Routing:</h5>
              <ul className="space-y-1 text-yellow-800">
                <li>• Faster domestic connections</li>
                <li>• Better quality for streaming</li>
                <li>• Reduced latency within Australia</li>
                <li>• More reliable internet access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
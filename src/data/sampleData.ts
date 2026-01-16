import { NetworkHop, DomainInfo, QuizQuestion } from '../types/networking';

// Sample Australian infrastructure data
export const australianInfrastructure = [
  { name: 'Sydney Internet Exchange', lat: -33.8688, lng: 151.2093, type: 'exchange' },
  { name: 'Melbourne Internet Exchange', lat: -37.8136, lng: 144.9631, type: 'exchange' },
  { name: 'Perth Internet Exchange', lat: -31.9505, lng: 115.8605, type: 'exchange' },
  { name: 'Brisbane Internet Exchange', lat: -27.4698, lng: 153.0251, type: 'exchange' },
];

// Sample submarine cable data
export const submarineCables = [
  { 
    name: 'Southern Cross Cable', 
    points: [
      { lat: -33.8688, lng: 151.2093 }, // Sydney
      { lat: 36.8485, lng: -74.4194 }, // New York
    ]
  },
  {
    name: 'PIPE Pacific Cable',
    points: [
      { lat: -33.8688, lng: 151.2093 }, // Sydney
      { lat: 21.3099, lng: -157.8581 }, // Hawaii
    ]
  },
];

export const generateSampleRoute = (domain: string): NetworkHop[] => {
  const baseHops: NetworkHop[] = [
    {
      id: 1,
      ip: '192.168.1.1',
      hostname: 'home-router.local',
      location: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
      latency: 1,
      organization: 'Home Network',
      type: 'router'
    },
    {
      id: 2,
      ip: '203.50.2.1',
      hostname: 'gateway.telstra.net.au',
      location: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
      latency: 15,
      organization: 'Telstra Corporation',
      type: 'isp'
    },
    {
      id: 3,
      ip: '203.50.11.25',
      hostname: 'core.sydney.telstra.net.au',
      location: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
      latency: 22,
      organization: 'Telstra Corporation',
      type: 'backbone'
    }
  ];

  // Add different destination hops based on domain
  if (domain.includes('google')) {
    baseHops.push(
      {
        id: 4,
        ip: '64.233.181.1',
        hostname: 'google-gw.sydney.net.au',
        location: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
        latency: 28,
        organization: 'Google LLC',
        type: 'backbone'
      },
      {
        id: 5,
        ip: '142.250.66.206',
        hostname: 'syd15s02-in-f14.1e100.net',
        location: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
        latency: 35,
        organization: 'Google LLC',
        type: 'destination'
      }
    );
  } else if (domain.includes('github')) {
    baseHops.push(
      {
        id: 4,
        ip: '203.50.77.25',
        hostname: 'international.sydney.telstra.net.au',
        location: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
        latency: 35,
        organization: 'Telstra Corporation',
        type: 'backbone'
      },
      {
        id: 5,
        ip: '124.108.60.11',
        hostname: 'pipe-cable.sydney.net.au',
        location: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
        latency: 42,
        organization: 'PIPE Networks',
        type: 'backbone'
      },
      {
        id: 6,
        ip: '140.82.112.4',
        hostname: 'lb-140-82-112-4-sea.github.com',
        location: { city: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194 },
        latency: 180,
        organization: 'GitHub Inc',
        type: 'destination'
      }
    );
  } else if (domain.includes('yahoo')) {
    baseHops.push(
      {
        id: 4,
        ip: '45.132.225.1',
        hostname: 'Local ISP Gateway',
        location: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
        latency: 6,
        organization: 'Local ISP Gateway',
        type: 'isp'
      },
      {
        id: 5,
        ip: '206.148.24.203',
        hostname: 'e23.mel-eqxmel-cr3.globalsecurelayer.com',
        location: { city: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
        latency: 8,
        organization: 'Global Secure Layer',
        type: 'backbone'
      },
      {
        id: 6,
        ip: '206.148.24.01',
        hostname: 'po3.mel-eqxmel-bb1.globalsecurelayer.com',
        location: { city: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
        latency: 7,
        organization: 'Global Secure Layer',
        type: 'backbone'
      },
      {
        id: 7,
        ip: '206.148.24.56',
        hostname: 'e53.adl-eqxadl-bb1.globalsecurelayer.com',
        location: { city: 'Perth', country: 'Australia', lat: -31.9505, lng: 115.8605 },
        latency: 19,
        organization: 'PIPE Networks',
        type: 'backbone'
      },
      {
        id: 8,
        ip: '98.137.11.164',
        hostname: 'media-router-fp74.prod.media.vip.ne1.yahoo.com',
        location: { city: 'Sunnyvale', country: 'United States', lat: 37.3688, lng: -122.0363 },
        latency: 165,
        organization: 'Yahoo Inc',
        type: 'destination'
      }
    );
  } else {
    // Generic international route
    baseHops.push(
      {
        id: 4,
        ip: '203.50.77.25',
        hostname: 'po7.per-eqxper-bb5.globalsecurelayer.com',
        location: { city: 'Buffalo', country: 'United States', lat: 42.8864, lng: -78.8784 },
        latency: 35,
        organization: 'Telstra Corporation',
        type: 'backbone'
      },
      {
        id: 5,
        ip: '209.191.112.17',
        hostname: 'ae-3.pat1.frz.yahoo.com',
        location: { city: 'Buffalo', country: 'United States', lat: 42.8864, lng: -78.8784 },
        latency: 258,
        organization: 'Yahoo Inc',
        type: 'backbone'
      },
      {
        id: 6,
        ip: '72.14.215.85',
        hostname: 'destination.example.com',
        location: { city: 'Sunnyvale', country: 'United States', lat: 37.3688, lng: -122.0363 },
        latency: 320,
        organization: 'Example Hosting',
        type: 'destination'
      }
    );
  }

  return baseHops;
};

export const sampleDomainInfo = (domain: string): DomainInfo => ({
  domain,
  primaryIP: domain.includes('google') ? '142.250.66.206' : 
            domain.includes('github') ? '140.82.112.4' : 
            domain.includes('yahoo') ? '74.6.143.26' : '93.184.216.34',
  alternateIPs: ['93.184.216.35', '93.184.216.36'],
  location: {
    city: domain.includes('google') ? 'Sydney' : 
          domain.includes('github') ? 'San Francisco' : 
          domain.includes('yahoo') ? 'Sunnyvale' : 'London',
    country: domain.includes('google') ? 'Australia' : 
             domain.includes('github') ? 'United States' : 
             domain.includes('yahoo') ? 'United States' : 'United Kingdom',
    lat: domain.includes('google') ? -33.8688 : 
         domain.includes('github') ? 37.7749 : 
         domain.includes('yahoo') ? 37.3688 : 51.5074,
    lng: domain.includes('google') ? 151.2093 : 
         domain.includes('github') ? -122.4194 : 
         domain.includes('yahoo') ? -122.0363 : -0.1278,
  },
  hostingProvider: domain.includes('google') ? 'Google LLC' : 
                   domain.includes('github') ? 'GitHub Inc' : 
                   domain.includes('yahoo') ? 'Yahoo Inc' : 'Cloudflare',
  responseTime: domain.includes('yahoo') ? 295 : Math.random() * 200 + 50,
  subdomains: [`www.${domain}`, `api.${domain}`, `cdn.${domain}`]
});

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What does IP stand for?",
    options: ["Internet Protocol", "Internal Process", "Information Package", "Internet Package"],
    correctAnswer: 0,
    explanation: "IP stands for Internet Protocol, which is the set of rules that govern how data is sent across networks."
  },
  {
    id: 2,
    question: "What is the purpose of DNS?",
    options: [
      "To encrypt internet traffic",
      "To translate domain names to IP addresses", 
      "To speed up internet connections",
      "To block malicious websites"
    ],
    correctAnswer: 1,
    explanation: "DNS (Domain Name System) translates human-readable domain names like google.com into IP addresses that computers can understand."
  },
  {
    id: 3,
    question: "What does NBN stand for in Australia?",
    options: [
      "National Broadband Network",
      "New Broadcasting Network",
      "Network Building Network",
      "National Business Network"
    ],
    correctAnswer: 0,
    explanation: "NBN stands for National Broadband Network, Australia's national wholesale broadband infrastructure."
  },
  {
    id: 4,
    question: "Why might a website in the USA load slower than one in Australia?",
    options: [
      "American servers are slower",
      "Physical distance increases latency",
      "Australian internet is faster",
      "Time zone differences"
    ],
    correctAnswer: 1,
    explanation: "Physical distance is a major factor in latency. Data traveling from Australia to the USA must cross submarine cables, which takes time."
  }
];
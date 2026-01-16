export interface NetworkHop {
  id: number;
  ip: string;
  hostname?: string;
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  latency: number;
  organization: string;
  type: 'router' | 'isp' | 'backbone' | 'cdn' | 'destination';
}

export interface DomainInfo {
  domain: string;
  primaryIP: string;
  alternateIPs: string[];
  location: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  hostingProvider: string;
  responseTime: number;
  subdomains: string[];
}

export interface RouteData {
  domain: string;
  totalDistance: number;
  totalHops: number;
  averageLatency: number;
  hops: NetworkHop[];
  timestamp: Date;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
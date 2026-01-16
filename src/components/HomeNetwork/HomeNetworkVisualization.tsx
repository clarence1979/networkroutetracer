import React, { useState, useEffect } from 'react';
import { Wifi, Smartphone, Laptop, Monitor, Router, Server, Play, Pause, RotateCcw, Settings, Network } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: 'laptop' | 'phone' | 'netflix' | 'router' | 'modem' | 'server' | 'hub' | 'switch';
  position: { x: number; y: number };
  icon: React.ReactNode;
  description: string;
  isActive?: boolean;
}

interface DataPacket {
  id: string;
  fromDevice: string;
  toDevice: string;
  progress: number;
  color: string;
  data: string;
}

type NetworkDevice = 'hub' | 'switch';
type NetworkTopology = 'star' | 'mesh' | 'bus' | 'ring';
type ConnectionType = 'wired' | 'wireless';
type WiFiFrequency = '2.4GHz' | '5GHz' | '6GHz';
type WiFiStandard = '802.11a' | '802.11b' | '802.11g' | '802.11n' | '802.11ac' | '802.11ax' | '802.11be';

export const HomeNetworkVisualization: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [packets, setPackets] = useState<DataPacket[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [networkDevice, setNetworkDevice] = useState<NetworkDevice>('switch');
  const [topology, setTopology] = useState<NetworkTopology>('star');
  const [activeClients, setActiveClients] = useState<string[]>(['laptop', 'phone', 'netflix']);
  const [ispSpeed, setIspSpeed] = useState(100); // Mbps
  const [connectionType, setConnectionType] = useState<ConnectionType>('wired');
  const [cableType, setCableType] = useState<'cat5e' | 'cat6' | 'cat6a' | 'cat7' | 'cat8'>('cat6');
  const [wifiFrequency, setWifiFrequency] = useState<WiFiFrequency>('5GHz');
  const [wifiStandard, setWifiStandard] = useState<WiFiStandard>('802.11n');
  const [numClients, setNumClients] = useState(4);
  
  const MIN_CLIENTS = 2;
  const MAX_CLIENTS = 8;

  // Generate client devices based on numClients
  const generateClientDevices = (count: number) => {
    const baseClients = [
      { id: 'laptop', name: 'Laptop', type: 'laptop' as const, icon: <Laptop className="h-6 w-6" />, description: 'Your laptop requesting data', ip: '192.168.1.101' },
      { id: 'phone', name: 'Mobile Phone', type: 'phone' as const, icon: <Smartphone className="h-6 w-6" />, description: 'Mobile device on network', ip: '192.168.1.102' },
      { id: 'netflix', name: 'Smart TV', type: 'netflix' as const, icon: <Monitor className="h-6 w-6" />, description: 'Smart TV streaming device', ip: '192.168.1.103' },
      { id: 'tablet', name: 'Tablet', type: 'phone' as const, icon: <Smartphone className="h-6 w-6" />, description: 'Tablet device', ip: '192.168.1.104' },
      { id: 'desktop', name: 'Desktop PC', type: 'laptop' as const, icon: <Monitor className="h-6 w-6" />, description: 'Desktop computer', ip: '192.168.1.105' },
      { id: 'gaming', name: 'Gaming Console', type: 'netflix' as const, icon: <Monitor className="h-6 w-6" />, description: 'Gaming console', ip: '192.168.1.106' },
      { id: 'printer', name: 'Printer', type: 'server' as const, icon: <Server className="h-6 w-6" />, description: 'Network printer', ip: '192.168.1.107' },
      { id: 'camera', name: 'Security Camera', type: 'server' as const, icon: <Server className="h-6 w-6" />, description: 'IP security camera', ip: '192.168.1.108' }
    ];
    
    return baseClients.slice(0, count);
  };

  const clientDevices = generateClientDevices(numClients);
  
  // Update activeClients when numClients changes
  React.useEffect(() => {
    const currentClientIds = clientDevices.map(device => device.id);
    setActiveClients(prev => prev.filter(id => currentClientIds.includes(id)));
  }, [numClients]);

  const cableSpecs = {
    'cat5e': { name: 'Cat 5e', maxSpeed: 1000 },
    'cat6': { name: 'Cat 6', maxSpeed: 1000 },
    'cat6a': { name: 'Cat 6a', maxSpeed: 10000 },
    'cat7': { name: 'Cat 7', maxSpeed: 10000 },
    'cat8': { name: 'Cat 8', maxSpeed: 40000 }
  };

  // Define ethernet cable options
  const ethernetCables = [
    { value: 'cat5e', name: 'Cat 5e', maxSpeed: 1000 },
    { value: 'cat6', name: 'Cat 6', maxSpeed: 1000 },
    { value: 'cat6a', name: 'Cat 6a', maxSpeed: 10000 },
    { value: 'cat7', name: 'Cat 7', maxSpeed: 10000 },
    { value: 'cat8', name: 'Cat 8', maxSpeed: 40000 }
  ];

  // Define ethernet cable state
  const [ethernetCable, setEthernetCable] = useState<'cat5e' | 'cat6' | 'cat6a' | 'cat7' | 'cat8'>('cat6');

  const getClientSpeed = () => {
    let baseSpeed = ispSpeed;
    
    // Apply WiFi limitations if wireless is selected
    if (connectionType === 'wireless') {
      // WiFi standard speed limits (theoretical max)
      const wifiStandardSpeeds = {
        '802.11a': { '2.4GHz': 0, '5GHz': 54, '6GHz': 0 },          // 1999 - 5GHz only
        '802.11b': { '2.4GHz': 11, '5GHz': 0, '6GHz': 0 },          // 1999 - 2.4GHz only
        '802.11g': { '2.4GHz': 54, '5GHz': 0, '6GHz': 0 },          // 2003 - 2.4GHz only
        '802.11n': { '2.4GHz': 150, '5GHz': 300, '6GHz': 0 },       // WiFi 4 - dual band
        '802.11ac': { '2.4GHz': 0, '5GHz': 3500, '6GHz': 0 },       // WiFi 5 - 5GHz only
        '802.11ax': { '2.4GHz': 574, '5GHz': 9608, '6GHz': 9608 },  // WiFi 6/6E
        '802.11be': { '2.4GHz': 1376, '5GHz': 23058, '6GHz': 46116 } // WiFi 7
      };
      
      // Get speed limit based on standard and frequency
      const wifiLimit = wifiStandardSpeeds[wifiStandard][wifiFrequency];
      
      // If the combination is not supported (e.g., 802.11ac on 2.4GHz), use fallback
      if (wifiLimit === 0) {
        baseSpeed = 0; // Unsupported combination
        return 0;
      }
      
      baseSpeed = Math.min(ispSpeed, wifiLimit);
      
      // Apply realistic overhead based on frequency and standard
      const overheadFactors = {
        '2.4GHz': wifiStandard === '802.11b' ? 0.3 : 
                  wifiStandard === '802.11g' ? 0.4 : 
                  wifiStandard === '802.11n' ? 0.5 : 0.5, // Legacy standards have more overhead
        '5GHz': wifiStandard === '802.11a' ? 0.6 : 
                wifiStandard === '802.11n' ? 0.7 : 
                wifiStandard === '802.11ac' ? 0.7 : 0.8, // Newer standards more efficient
        '6GHz': 0.9 // 10% reduction due to minimal overhead (only 802.11ax/be)
      };
      
      baseSpeed *= overheadFactors[wifiFrequency];
      
      // Additional standard-specific efficiency
      if (wifiStandard === '802.11be') {
        baseSpeed *= 1.1; // WiFi 7 has better efficiency
      } else if (wifiStandard === '802.11ax') {
        baseSpeed *= 1.05; // WiFi 6 has improved efficiency
      }
    }
    
    if (topology === 'bus') {
      // Bus topology shares bandwidth among all active clients
      return baseSpeed / activeClients.length;
    } else if (topology === 'ring') {
      // Ring topology has token passing, so effective speed is reduced
      return baseSpeed * 0.7 / activeClients.length; // 30% overhead for token passing
    } else if (topology === 'mesh') {
      // Mesh has multiple paths, so can handle more traffic
      return baseSpeed * 1.2; // 20% improvement due to multiple paths
    } else {
      // Star topology
      if (networkDevice === 'hub') {
        return baseSpeed / activeClients.length;
      } else {
        return baseSpeed; // Switch gives full speed to each client
      }
    }
  };

  const getDevicePositions = (topology: NetworkTopology): Record<string, { x: number; y: number }> => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Fixed positions for network infrastructure
    positions['network-device'] = { x: 300, y: 250 };
    positions['router'] = { x: 500, y: 250 };
    positions['isp'] = { x: 700, y: 250 };
    
    // Calculate dynamic height based on number of clients
    const minHeight = 400;
    const clientSpacing = Math.max(70, 400 / numClients); // Ensure minimum 70px spacing
    const dynamicHeight = Math.max(minHeight, 100 + (numClients * clientSpacing));
    
    // Dynamic positions for client devices based on topology and count
    switch (topology) {
      case 'star':
        // Arrange clients in a vertical line on the left
        clientDevices.forEach((device, index) => {
          positions[device.id] = { 
            x: 100, 
            y: 80 + (index * clientSpacing)
          };
        });
        break;
      
      case 'mesh':
        // Arrange clients in a circle around the center
        const meshRadius = 120;
        const meshCenterX = 250;
        const meshCenterY = dynamicHeight / 2;
        clientDevices.forEach((device, index) => {
          const angle = (index / numClients) * 2 * Math.PI;
          positions[device.id] = {
            x: meshCenterX + meshRadius * Math.cos(angle),
            y: meshCenterY + meshRadius * Math.sin(angle)
          };
        });
        positions['network-device'] = { x: meshCenterX, y: meshCenterY };
        positions['router'] = { x: 500, y: meshCenterY };
        positions['isp'] = { x: 700, y: meshCenterY };
        break;
      
      case 'bus':
        // Arrange clients horizontally along the bus
        const busSpacing = 300 / (numClients + 2); // +2 for network-device and router
        const busY = dynamicHeight / 2;
        clientDevices.forEach((device, index) => {
          positions[device.id] = { 
            x: 100 + (index * busSpacing), 
            y: busY
          };
        });
        positions['network-device'] = { x: 100 + (numClients * busSpacing), y: busY };
        positions['router'] = { x: 100 + ((numClients + 1) * busSpacing), y: busY };
        positions['isp'] = { x: 700, y: busY };
        break;
      
      case 'ring':
        // Arrange clients and network device in a ring
        const ringRadius = 100;
        const ringCenterX = 300;
        const ringCenterY = dynamicHeight / 2;
        const totalRingDevices = numClients + 1; // +1 for network-device
        
        clientDevices.forEach((device, index) => {
          const angle = (index / totalRingDevices) * 2 * Math.PI;
          positions[device.id] = {
            x: ringCenterX + ringRadius * Math.cos(angle),
            y: ringCenterY + ringRadius * Math.sin(angle)
          };
        });
        
        // Network device as part of the ring
        const networkAngle = (numClients / totalRingDevices) * 2 * Math.PI;
        positions['network-device'] = {
          x: ringCenterX + ringRadius * Math.cos(networkAngle),
          y: ringCenterY + ringRadius * Math.sin(networkAngle)
        };
        positions['router'] = { x: 500, y: ringCenterY };
        positions['isp'] = { x: 700, y: ringCenterY };
        break;
    }
    
    return positions;
  };

  // Calculate dynamic container height based on topology and number of clients
  const getContainerHeight = () => {
    const baseHeight = 400;
    const clientSpacing = Math.max(70, 400 / numClients); // Ensure minimum 70px spacing
    
    switch (topology) {
      case 'star':
        // Height needs to accommodate vertical client arrangement
        return Math.max(baseHeight, 180 + (numClients * clientSpacing));
      case 'mesh':
      case 'ring':
        // Circular arrangements need consistent height
        return Math.max(baseHeight, 350 + (numClients > 6 ? 150 : 0));
      case 'bus':
        // Horizontal arrangement can use base height
        return baseHeight;
      default:
        return baseHeight;
    }
  };

  const containerHeight = getContainerHeight();
  const viewBoxHeight = containerHeight;

  const devices: Device[] = [
    // Dynamic client devices
    ...clientDevices.map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      position: getDevicePositions(topology)[device.id] || { x: 0, y: 0 },
      icon: device.icon,
      description: `${device.description} (${device.ip})`,
      isActive: activeClients.includes(device.id)
    })),
    // Network infrastructure devices
    {
      id: 'network-device',
      name: topology === 'bus' ? 'Bus Backbone' : 
            topology === 'ring' ? 'Ring Node' :
            topology === 'mesh' ? 'Mesh Hub' :
            networkDevice === 'hub' ? 'Network Hub' : 'Network Switch',
      type: networkDevice,
      position: getDevicePositions(topology)['network-device'],
      icon: topology === 'bus' ? <Network className="h-8 w-8" /> : <Settings className="h-8 w-8" />,
      description: topology === 'bus' ? 'Shared communication medium (192.168.1.1)' :
                   topology === 'ring' ? 'Token ring node' :
                   topology === 'mesh' ? 'Mesh network hub' :
                   networkDevice === 'hub' ? 'Hub - broadcasts to all ports (192.168.1.1)' : 'Switch - intelligent forwarding (192.168.1.1)'
    },
    {
      id: 'router',
      name: 'Modem + Router',
      type: 'router',
      position: getDevicePositions(topology).router,
      icon: <Router className="h-8 w-8" />,
      description: 'Your home router/modem combo (192.168.1.1 internal, public IP external)'
    },
    {
      id: 'isp',
      name: 'ISP Network',
      type: 'server',
      position: getDevicePositions(topology).isp,
      icon: <Server className="h-6 w-6" />,
      description: 'Your Internet Service Provider (Public IP range)'
    }
  ];

  const getStepsForTopology = (topology: NetworkTopology, networkDevice: NetworkDevice) => {
    switch (topology) {
      case 'star':
        return getStepsForDevice(networkDevice);
      
      case 'mesh':
        return [
          {
            title: "Step 1: Multiple Path Request",
            description: "Laptop sends request, mesh network finds optimal path",
            packets: [{ from: 'laptop', to: 'phone', data: 'Path Discovery', color: '#3B82F6' }]
          },
          {
            title: "Step 2: Direct Mesh Communication",
            description: "Devices can communicate directly without central hub",
            packets: [
              { from: 'phone', to: 'netflix', data: 'Direct Route', color: '#10B981' },
              { from: 'laptop', to: 'network-device', data: 'Internet Request', color: '#F59E0B' }
            ]
          },
          {
            title: "Step 3: Multiple Paths to Internet",
            description: "Multiple devices can access internet simultaneously via different paths",
            packets: [
              { from: 'network-device', to: 'router', data: 'Internet Request', color: '#8B5CF6' },
              { from: 'netflix', to: 'router', data: 'Alternate Path', color: '#EF4444' }
            ]
          },
          {
            title: "Step 4: Redundant Response Paths",
            description: "Responses can take different paths for reliability",
            packets: [
              { from: 'router', to: 'network-device', data: 'Response Data', color: '#10B981' },
              { from: 'router', to: 'netflix', data: 'Alt Response', color: '#F59E0B' }
            ]
          }
        ];
      
      case 'bus':
        return [
          {
            title: "Step 1: Bus Transmission",
            description: "Laptop transmits on shared bus medium",
            packets: [{ from: 'laptop', to: 'network-device', data: 'Bus Signal', color: '#3B82F6' }]
          },
          {
            title: "Step 2: All Devices Receive",
            description: "All devices on bus receive transmission, but only intended recipient processes",
            packets: [
              { from: 'network-device', to: 'phone', data: 'Bus Broadcast', color: '#EF4444' },
              { from: 'network-device', to: 'netflix', data: 'Bus Broadcast', color: '#EF4444' },
              { from: 'network-device', to: 'router', data: 'Processed Signal', color: '#10B981' }
            ]
          },
          {
            title: "Step 3: Collision Detection",
            description: "Bus monitors for collisions when multiple devices transmit",
            packets: [{ from: 'router', to: 'isp', data: 'Internet Request', color: '#F59E0B' }]
          },
          {
            title: "Step 4: Shared Medium Response",
            description: "Response travels back on shared bus to all devices",
            packets: [
              { from: 'isp', to: 'router', data: 'Response Data', color: '#8B5CF6' },
              { from: 'router', to: 'network-device', data: 'Bus Response', color: '#8B5CF6' },
              { from: 'network-device', to: 'laptop', data: 'Final Data', color: '#10B981' }
            ]
          }
        ];
      
      case 'ring':
        return [
          {
            title: "Step 1: Token Acquisition",
            description: "Laptop waits for and captures the token to transmit",
            packets: [{ from: 'network-device', to: 'laptop', data: 'Token', color: '#F59E0B' }]
          },
          {
            title: "Step 2: Data + Token Transmission",
            description: "Laptop attaches data to token and sends around ring",
            packets: [{ from: 'laptop', to: 'phone', data: 'Data + Token', color: '#3B82F6' }]
          },
          {
            title: "Step 3: Ring Propagation",
            description: "Data travels around ring until it reaches router",
            packets: [
              { from: 'phone', to: 'netflix', data: 'Data + Token', color: '#3B82F6' },
              { from: 'netflix', to: 'network-device', data: 'Data + Token', color: '#3B82F6' }
            ]
          },
          {
            title: "Step 4: Token Release",
            description: "Router processes data, forwards to internet, and releases token",
            packets: [
              { from: 'network-device', to: 'router', data: 'Internet Request', color: '#10B981' },
              { from: 'router', to: 'isp', data: 'Internet Request', color: '#8B5CF6' }
            ]
          },
          {
            title: "Step 5: Response with New Token",
            description: "Response data travels back around ring with new token",
            packets: [
              { from: 'isp', to: 'router', data: 'Response Data', color: '#EF4444' },
              { from: 'router', to: 'laptop', data: 'Response + Token', color: '#10B981' }
            ]
          }
        ];
      
      default:
        return [];
    }
  };

  const getStepsForDevice = (deviceType: NetworkDevice) => {
    if (deviceType === 'hub') {
      return [
        {
          title: "Step 1: Device Request",
          description: "Laptop sends data request to the hub",
          packets: [{ from: 'laptop', to: 'network-device', data: 'HTTP Request', color: '#3B82F6' }]
        },
        {
          title: "Step 2: Hub Broadcasts",
          description: "Hub broadcasts the data to ALL connected devices (inefficient)",
          packets: [
            { from: 'network-device', to: 'phone', data: 'Broadcast data', color: '#EF4444' },
            { from: 'network-device', to: 'netflix', data: 'Broadcast data', color: '#EF4444' },
            { from: 'network-device', to: 'router', data: 'HTTP Request', color: '#10B981' }
          ]
        },
        {
          title: "Step 3: Router to ISP",
          description: "Only router processes the request and forwards to ISP",
          packets: [{ from: 'router', to: 'isp', data: 'Internet Request', color: '#F59E0B' }]
        },
        {
          title: "Step 4: Response via Hub",
          description: "Response comes back through hub, broadcasted to all devices again",
          packets: [
            { from: 'isp', to: 'router', data: 'Response Data', color: '#8B5CF6' },
            { from: 'router', to: 'network-device', data: 'Response Data', color: '#8B5CF6' }
          ]
        },
        {
          title: "Step 5: Hub Broadcasts Response",
          description: "Hub broadcasts response to all devices, but only laptop processes it",
          packets: [
            { from: 'network-device', to: 'laptop', data: 'Response Data', color: '#10B981' },
            { from: 'network-device', to: 'phone', data: 'Unwanted broadcast', color: '#EF4444' },
            { from: 'network-device', to: 'netflix', data: 'Unwanted broadcast', color: '#EF4444' }
          ]
        }
      ];
    } else {
      return [
        {
          title: "Step 1: Device Request",
          description: "Laptop sends data request to the switch",
          packets: [{ from: 'laptop', to: 'network-device', data: 'HTTP Request', color: '#3B82F6' }]
        },
        {
          title: "Step 2: Switch Intelligence",
          description: "Switch learns MAC addresses and forwards ONLY to the router",
          packets: [{ from: 'network-device', to: 'router', data: 'HTTP Request', color: '#10B981' }]
        },
        {
          title: "Step 3: Router to ISP",
          description: "Router forwards request to ISP",
          packets: [{ from: 'router', to: 'isp', data: 'Internet Request', color: '#F59E0B' }]
        },
        {
          title: "Step 4: Targeted Response",
          description: "Response comes back and switch forwards ONLY to requesting laptop",
          packets: [
            { from: 'isp', to: 'router', data: 'Response Data', color: '#8B5CF6' },
            { from: 'router', to: 'network-device', data: 'Response Data', color: '#8B5CF6' },
            { from: 'network-device', to: 'laptop', data: 'Response Data', color: '#10B981' }
          ]
        }
      ];
    }
  };

  const steps = getStepsForTopology(topology, networkDevice);

  const getDevicePosition = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.position : { x: 0, y: 0 };
  };

  const createPacket = (from: string, to: string, data: string, color: string): DataPacket => ({
    id: `${from}-${to}-${Date.now()}-${Math.random()}`,
    fromDevice: from,
    toDevice: to,
    progress: 0,
    color,
    data
  });

  const animateStep = (stepIndex: number) => {
    if (stepIndex >= steps.length) {
      setIsAnimating(false);
      return;
    }

    const step = steps[stepIndex];
    const newPackets = step.packets.map(p => 
      createPacket(p.from, p.to, p.data, p.color)
    );

    setPackets(newPackets);
    setCurrentStep(stepIndex);

    // Animate packet movement
    const animationDuration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      setPackets(prev => prev.map(packet => ({
        ...packet,
        progress
      })));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Move to next step after a brief pause
        setTimeout(() => {
          if (stepIndex < steps.length - 1) {
            animateStep(stepIndex + 1);
          } else {
            setIsAnimating(false);
          }
        }, 1000);
      }
    };

    requestAnimationFrame(animate);
  };

  const startAnimation = () => {
    setIsAnimating(true);
    setPackets([]);
    setCurrentStep(0);
    animateStep(0);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setPackets([]);
    setCurrentStep(0);
  };

  const getPacketPosition = (packet: DataPacket) => {
    const fromPos = getDevicePosition(packet.fromDevice);
    const toPos = getDevicePosition(packet.toDevice);
    
    return {
      x: fromPos.x + (toPos.x - fromPos.x) * packet.progress,
      y: fromPos.y + (toPos.y - fromPos.y) * packet.progress
    };
  };

  const toggleClientActive = (clientId: string) => {
    if (isAnimating) return;
    
    // Only allow toggling actual client devices, not infrastructure
    const clientIds = clientDevices.map(device => device.id);
    if (!clientIds.includes(clientId)) return;
    
    setActiveClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  const getConnectionLines = () => {
    const positions = getDevicePositions(topology);
    const lines = [];
    const clientIds = clientDevices.map(device => device.id);

    switch (topology) {
      case 'star':
        // All clients connect to central device
        clientIds.forEach(clientId => {
          const isActive = activeClients.includes(clientId);
          lines.push({
            from: positions[clientId],
            to: positions['network-device'],
            active: isActive,
            key: `${clientId}-network-device`
          });
        });
        // Network device to router
        lines.push({
          from: positions['network-device'],
          to: positions.router,
          active: true,
          key: 'network-device-router'
        });
        break;

      case 'mesh':
        // Full mesh between clients
        const clients = [...clientIds, 'network-device'];
        clients.forEach((client1, i) => {
          clients.slice(i + 1).forEach(client2 => {
            lines.push({
              from: positions[client1],
              to: positions[client2],
              active: true,
              key: `${client1}-${client2}`,
              style: 'dashed'
            });
          });
        });
        // Multiple connections to router
        ['network-device', 'netflix'].forEach(deviceId => {
          lines.push({
            from: positions[deviceId],
            to: positions.router,
            active: true,
            key: `${deviceId}-router`
          });
        });
        break;

      case 'bus':
        // Linear bus connection
        const busDevices = [...clientIds, 'network-device', 'router'];
        busDevices.slice(0, -1).forEach((device, i) => {
          const nextDevice = busDevices[i + 1];
          const isActive = activeClients.includes(device) || !clientIds.includes(device);
          lines.push({
            from: positions[device],
            to: positions[nextDevice],
            active: isActive,
            key: `${device}-${nextDevice}`,
            thick: true
          });
        });
        break;

      case 'ring':
        // Ring connection
        const ringDevices = [...clientIds, 'network-device'];
        ringDevices.forEach((device, i) => {
          const nextDevice = ringDevices[(i + 1) % ringDevices.length];
          const isActive = activeClients.includes(device) || !clientIds.includes(device);
          lines.push({
            from: positions[device],
            to: positions[nextDevice],
            active: isActive,
            key: `${device}-${nextDevice}`,
            curved: true
          });
        });
        // Network device to router
        lines.push({
          from: positions['network-device'],
          to: positions.router,
          active: true,
          key: 'network-device-router'
        });
        break;
    }

    // Router to ISP (always present)
    lines.push({
      from: positions.router,
      to: positions.isp,
      active: true,
      key: 'router-isp'
    });

    return lines;
  };

  const getTopologyDescription = (topology: NetworkTopology) => {
    switch (topology) {
      case 'star':
        return 'All devices connect to a central hub/switch. Most common in home networks.';
      case 'mesh':
        return 'Every device connects to every other device. Provides redundancy and multiple paths.';
      case 'bus':
        return 'All devices share a single communication line. Data travels to all devices.';
      case 'ring':
        return 'Devices form a closed loop. Data travels in one direction using token passing.';
      default:
        return '';
    }
  };

  const getTopologyAdvantages = (topology: NetworkTopology) => {
    switch (topology) {
      case 'star':
        return ['Easy to install and manage', 'Failure of one device doesn\'t affect others', 'Easy to detect faults'];
      case 'mesh':
        return ['High reliability and redundancy', 'Multiple paths for data', 'No single point of failure'];
      case 'bus':
        return ['Simple and cost-effective', 'Easy to extend', 'Uses less cable than star'];
      case 'ring':
        return ['Equal access for all devices', 'No collisions with token passing', 'Predictable performance'];
      default:
        return [];
    }
  };

  const getTopologyDisadvantages = (topology: NetworkTopology) => {
    switch (topology) {
      case 'star':
        return ['Central device failure affects whole network', 'Requires more cable', 'Hub creates bottleneck'];
      case 'mesh':
        return ['Expensive to implement', 'Complex to manage', 'Requires many connections'];
      case 'bus':
        return ['Single point of failure', 'Difficult to troubleshoot', 'Performance degrades with more devices'];
      case 'ring':
        return ['Single break stops entire network', 'Difficult to troubleshoot', 'Adding devices disrupts network'];
      default:
        return [];
    }
  };

  // Check if current topology is optimal
  const isOptimalTopology = topology === 'mesh' || (topology === 'star' && networkDevice !== 'hub');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Wifi className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            Network Topologies: {topology.charAt(0).toUpperCase() + topology.slice(1)} Topology
          </h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={startAnimation}
            disabled={isAnimating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="h-4 w-4 mr-2" />
            {isAnimating ? 'Animating...' : 'Start Animation'}
          </button>
          <button
            onClick={resetAnimation}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </button>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Number of Clients */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Number of Clients: {numClients}</h3>
          <input
            type="range"
            min={MIN_CLIENTS}
            max={MAX_CLIENTS}
            value={numClients}
            onChange={(e) => setNumClients(Number(e.target.value))}
            disabled={isAnimating}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{MIN_CLIENTS} devices</span>
            <span>{MAX_CLIENTS} devices</span>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <p>Active devices: {activeClients.length}/{numClients}</p>
          </div>
        </div>

        {/* Topology Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Network Topology</h3>
          <div className="space-y-2">
            {(['star', 'mesh', 'bus', 'ring'] as NetworkTopology[]).map((topo) => (
              <label key={topo} className="flex items-center">
                <input
                  type="radio"
                  name="topology"
                  value={topo}
                  checked={topology === topo}
                  onChange={(e) => setTopology(e.target.value as NetworkTopology)}
                  disabled={isAnimating}
                  className="mr-2"
                />
                <span className="text-sm capitalize">{topo}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Network Device Selection (only for star topology) */}
        {topology === 'star' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Central Device</h3>
            <div className="space-y-2">
              {(['hub', 'switch'] as NetworkDevice[]).map((device) => (
                <label key={device} className="flex items-center">
                  <input
                    type="radio"
                    name="networkDevice"
                    value={device}
                    checked={networkDevice === device}
                    onChange={(e) => setNetworkDevice(e.target.value as NetworkDevice)}
                    disabled={isAnimating}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{device}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Connection Type */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Connection Type</h3>
          <div className="space-y-2">
            {(['wired', 'wireless'] as ConnectionType[]).map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="connectionType"
                  value={type}
                  checked={connectionType === type}
                  onChange={(e) => setConnectionType(e.target.value as ConnectionType)}
                  disabled={isAnimating}
                  className="mr-2"
                />
                <span className="text-sm capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* WiFi Configuration (only when wireless is selected) */}
      {connectionType === 'wireless' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">WiFi Standard</h3>
            <select
              value={wifiStandard}
              onChange={(e) => setWifiStandard(e.target.value as WiFiStandard)}
              disabled={isAnimating}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="802.11a">802.11a (WiFi 1 - 1999)</option>
              <option value="802.11b">802.11b (WiFi 1 - 1999)</option>
              <option value="802.11g">802.11g (WiFi 3 - 2003)</option>
              <option value="802.11n">802.11n (WiFi 4 - 2009)</option>
              <option value="802.11ac">802.11ac (WiFi 5 - 2013)</option>
              <option value="802.11ax">802.11ax (WiFi 6 - 2019)</option>
              <option value="802.11be">802.11be (WiFi 7 - 2024)</option>
            </select>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">WiFi Frequency</h3>
            <div className="space-y-2">
              {(['2.4GHz', '5GHz', '6GHz'] as WiFiFrequency[]).map((freq) => {
                // Check if frequency is supported by the selected standard
                const isSupported = 
                  (freq === '2.4GHz' && !['802.11a', '802.11ac'].includes(wifiStandard)) ||
                  (freq === '5GHz' && !['802.11b', '802.11g'].includes(wifiStandard)) ||
                  (freq === '6GHz' && ['802.11ax', '802.11be'].includes(wifiStandard));

                return (
                  <label key={freq} className={`flex items-center ${!isSupported ? 'opacity-50' : ''}`}>
                    <input
                      type="radio"
                      name="wifiFrequency"
                      value={freq}
                      checked={wifiFrequency === freq}
                      onChange={(e) => setWifiFrequency(e.target.value as WiFiFrequency)}
                      disabled={isAnimating || !isSupported}
                      className="mr-2"
                    />
                    <span className="text-sm">{freq}</span>
                    {!isSupported && <span className="text-xs text-gray-500 ml-2">(Not supported)</span>}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ISP Speed Configuration */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">ISP Speed: {ispSpeed} Mbps</h3>
        <input
          type="range"
          min="10"
          max="1000"
          step="10"
          value={ispSpeed}
          onChange={(e) => setIspSpeed(Number(e.target.value))}
          disabled={isAnimating}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>10 Mbps</span>
          <span>1000 Mbps</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Performance Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-600">Effective Speed per Client:</span>
            <div className="text-lg font-semibold text-green-700">
              {getClientSpeed().toFixed(1)} Mbps
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Active Clients:</span>
            <div className="text-lg font-semibold text-blue-700">
              {activeClients.length}/{numClients}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Topology Efficiency:</span>
            <div className={`text-lg font-semibold ${isOptimalTopology ? 'text-green-700' : 'text-yellow-700'}`}>
              {isOptimalTopology ? 'Optimal' : 'Suboptimal'}
            </div>
          </div>
        </div>
        
        {/* IP Address Information */}
        <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
          <h4 className="font-semibold text-blue-900 mb-2">🏠 Home Network IP Addresses</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Router/Gateway:</strong> 192.168.1.1 (Default gateway for all devices)</p>
            <p><strong>Client Devices:</strong> 192.168.1.101 - 192.168.1.108 (DHCP assigned)</p>
            <p><strong>Network Range:</strong> 192.168.1.0/24 (Private Class C network)</p>
            <p><strong>Subnet Mask:</strong> 255.255.255.0 (Allows 254 devices)</p>
          </div>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="bg-gray-100 p-2 sm:p-6 rounded-lg mb-6 overflow-x-auto" style={{ height: `${containerHeight}px`, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 800 ${viewBoxHeight}`} className="min-w-full">
          {/* Connection Lines */}
          {getConnectionLines().map((line) => (
            <line
              key={line.key}
              x1={line.from.x}
              y1={line.from.y}
              x2={line.to.x}
              y2={line.to.y}
              stroke={line.active ? '#3B82F6' : '#D1D5DB'}
              strokeWidth={line.thick ? 4 : 2}
              strokeDasharray={line.style === 'dashed' ? '5,5' : 'none'}
              opacity={line.active ? 1 : 0.5}
            />
          ))}

          {/* Devices */}
          {devices.map((device) => (
            <g key={device.id}>
              <circle
                cx={device.position.x}
                cy={device.position.y}
                r="25"
                fill={device.isActive ? '#3B82F6' : '#9CA3AF'}
                stroke="#1F2937"
                strokeWidth="2"
                onClick={() => clientDevices.some(client => client.id === device.id) ? toggleClientActive(device.id) : undefined}
                style={{ cursor: clientDevices.some(client => client.id === device.id) ? 'pointer' : 'default' }}
              />
              <text
                x={device.position.x}
                y={device.position.y + 40}
                textAnchor="middle"
                className="text-xs sm:text-sm font-medium fill-gray-700"
              >
                {device.name}
              </text>
              {/* Show IP address for client devices */}
              {clientDevices.some(client => client.id === device.id) && (
                <text
                  x={device.position.x}
                  y={device.position.y + 50}
                  textAnchor="middle"
                  className="text-xs sm:text-sm fill-gray-600 font-mono font-semibold"
                >
                  {clientDevices.find(client => client.id === device.id)?.ip}
                </text>
              )}
            </g>
          ))}

          {/* Data Packets */}
          {packets.map((packet) => {
            const pos = getPacketPosition(packet);
            return (
              <g key={packet.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="6"
                  fill={packet.color}
                  opacity="0.8"
                />
                <text
                  x={pos.x}
                  y={pos.y - 10}
                  textAnchor="middle"
                  className="text-xs sm:text-sm fill-gray-700"
                >
                  {packet.data}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Current Step Information */}
      {isAnimating && steps[currentStep] && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">{steps[currentStep].title}</h4>
          <p className="text-blue-800">{steps[currentStep].description}</p>
        </div>
      )}

      {/* Topology Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
          <p className="text-sm text-gray-700 mb-3">{getTopologyDescription(topology)}</p>
          
          <h5 className="font-semibold text-green-900 mb-2">Advantages:</h5>
          <ul className="text-sm text-green-800 space-y-1">
            {getTopologyAdvantages(topology).map((advantage, index) => (
              <li key={index}>• {advantage}</li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-semibold text-red-900 mb-2">Disadvantages:</h5>
          <ul className="text-sm text-red-800 space-y-1 mb-3">
            {getTopologyDisadvantages(topology).map((disadvantage, index) => (
              <li key={index}>• {disadvantage}</li>
            ))}
          </ul>

          {connectionType === 'wireless' && (
            <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
              <h6 className="font-semibold text-yellow-900 mb-1">WiFi Performance:</h6>
              <p className="text-xs text-yellow-800">
                {wifiStandard} on {wifiFrequency} provides theoretical max speeds, but real-world performance is typically 50-70% of theoretical due to interference, distance, and protocol overhead.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
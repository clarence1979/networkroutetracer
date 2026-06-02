import React, { useState, useEffect } from 'react';
import { Globe3DContainer } from './components/Globe3D/Globe3DContainer';
import { DomainInput } from './components/UI/DomainInput';
import { RouteInfoPanel } from './components/UI/RouteInfoPanel';
import { StatsDashboard } from './components/UI/StatsDashboard';
import { NetworkingBasics } from './components/Educational/NetworkingBasics';
import { InteractiveQuiz } from './components/Educational/InteractiveQuiz';
import { HomeNetworkVisualization } from './components/HomeNetwork/HomeNetworkVisualization';
import { PrivacyPolicy } from './components/Legal/PrivacyPolicy';
import { IPAddressTheory } from './components/Educational/IPAddressTheory';
import { LoginScreen } from './components/Auth/LoginScreen';
import { useAINetworkTrace } from './hooks/useAINetworkTrace';
import { ApiKeyCache } from './services/apiKeyCache';
import { authService } from './services/authService';
import { useAuth } from './contexts/AuthContext';
import { NetworkHop } from './types/networking';
import { Network, BookOpen, Brain, BarChart3, Wifi, Settings, LogOut, Loader2 } from 'lucide-react';
import { Server } from 'lucide-react';

type Tab = 'basics' | 'ip-theory' | 'home' | 'trace' | 'quiz' | 'stats' | 'privacy';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('basics');
  const [selectedHop, setSelectedHop] = useState<NetworkHop | undefined>();
  const [showSatellites, setShowSatellites] = useState(false);
  const { user, isAuthenticated, isLoading, login, logout, openaiApiKey, setLoading } = useAuth();
  const { loading, error, routeData, traceRoute, hasAPIKey, isInitialized } = useAINetworkTrace();

  useEffect(() => {
    const initAuth = async () => {
      const authResult = await authService.attemptAutoLogin();

      if (authResult.authenticated && authResult.username) {
        login(authResult.username, authResult.isAdmin || false, authResult.openaiApiKey);
        if (authResult.openaiApiKey) {
          ApiKeyCache.apiKey = authResult.openaiApiKey;
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, [login, setLoading]);

  useEffect(() => {
    if (openaiApiKey) {
      ApiKeyCache.apiKey = openaiApiKey;
    }
  }, [openaiApiKey]);

  const handleLoginSuccess = (username: string, isAdmin: boolean, openaiKey?: string) => {
    login(username, isAdmin, openaiKey);
    if (openaiKey) {
      ApiKeyCache.apiKey = openaiKey;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('OPENAI_API_KEY');
    localStorage.removeItem('SUPABASE_URL');
    localStorage.removeItem('SUPABASE_ANON_KEY');
    ApiKeyCache.clear();
    logout();
  };

  const handleHopSelect = (hop: NetworkHop) => {
    setSelectedHop(hop);
  };

  const tabs = [
    { id: 'basics', label: 'Learn Basics', icon: BookOpen },
    { id: 'ip-theory', label: 'More about IP Address', icon: Server },
    { id: 'home', label: 'Home Network', icon: Wifi },
    { id: 'trace', label: 'Route Tracer', icon: Network },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'quiz', label: 'Test Knowledge', icon: Brain },
    { id: 'privacy', label: 'Privacy Policy', icon: Settings }
  ] as const;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:h-16">
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex-shrink-0">
                <Network className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-3">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Network Route Tracer
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Educational Tool for Year 9 Digital Technologies
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <form action="https://www.paypal.com/donate" method="post" target="_top" className="inline-block">
                <input type="hidden" name="hosted_button_id" value="PSXE6LDM3ZJDC" />
                <input
                  type="image"
                  src="https://www.paypalobjects.com/en_AU/i/btn/btn_donateCC_LG.gif"
                  border="0"
                  name="submit"
                  title="PayPal - The safer, easier way to pay online!"
                  alt="Donate with PayPal button"
                  className="h-8 sm:h-12"
                />
                <img alt="" border="0" src="https://www.paypal.com/en_AU/i/scr/pixel.gif" width="1" height="1" />
              </form>
              <div className="flex items-center ml-2 sm:ml-4">
                <span className="text-xs sm:text-sm text-gray-600 mr-1 sm:mr-2 hidden sm:inline">Proudly Made By:</span>
                <a
                  href="https://clarence.guru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/clarence-solutions-logo.png"
                    alt="Clarence's Solutions"
                    className="h-6 sm:h-8"
                  />
                </a>
              </div>
              <div className="flex items-center ml-2 sm:ml-4 space-x-2">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700">{user?.username}</span>
                  <div className="relative">
                    <Settings className="h-6 w-6 text-green-600" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex overflow-x-auto space-x-2 sm:space-x-8 pb-2 sm:pb-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {activeTab === 'basics' && (
          <div className="max-w-6xl mx-auto px-2 sm:px-0">
            <NetworkingBasics />
          </div>
        )}

        {activeTab === 'ip-theory' && (
          <div className="max-w-6xl mx-auto px-2 sm:px-0">
            <IPAddressTheory />
          </div>
        )}

        {activeTab === 'home' && (
          <div className="max-w-6xl mx-auto px-2 sm:px-0">
            <HomeNetworkVisualization />
          </div>
        )}

        {activeTab === 'trace' && (
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              <DomainInput
                onSubmit={traceRoute}
                loading={loading}
                error={error}
                disabled={!hasAPIKey}
                isInitializing={!isInitialized}
              />

              <RouteInfoPanel
                routeData={routeData}
                selectedHop={selectedHop}
                onHopSelect={handleHopSelect}
              />
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '400px', minHeight: '300px' }}>
                <div className="relative w-full h-full">
                  {/* Satellite toggle — overlay on top-left of globe */}
                  <label className="absolute top-3 left-3 z-10 flex items-center gap-2 cursor-pointer select-none bg-gray-900/85 backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-white shadow-lg hover:bg-gray-800/90 transition-colors">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={showSatellites}
                        onChange={e => setShowSatellites(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-8 h-4 rounded-full transition-colors ${showSatellites ? 'bg-blue-500' : 'bg-gray-600'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showSatellites ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="font-medium">Satellites &amp; Debris</span>
                  </label>

                  <Globe3DContainer
                    route={routeData?.hops}
                    showSatellites={showSatellites}
                    onHopClick={(hop) => {
                      setSelectedHop(hop);
                    }}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="max-w-2xl mx-auto px-2 sm:px-0">
            <InteractiveQuiz />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="max-w-4xl mx-auto px-2 sm:px-0">
            <StatsDashboard routeData={routeData} />
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="max-w-6xl mx-auto px-2 sm:px-0">
            <PrivacyPolicy />
          </div>
        )}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8 sm:py-12">
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Learning Objectives
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Understand how data travels across the internet</li>
                <li>• Learn about Australian internet infrastructure</li>
                <li>• Explore networking terminology and concepts</li>
                <li>• Discover why geographic location affects speed</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Key Concepts
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• IP Addresses and Domain Names</li>
                <li>• Internet Service Providers (ISPs)</li>
                <li>• Network latency and routing</li>
                <li>• Australia's NBN infrastructure</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                For Teachers
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Aligned with Digital Technologies curriculum</li>
                <li>• Interactive learning activities</li>
                <li>• Assessment tools via quiz feature</li>
                <li>• Real-world Australian context</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <p className="text-sm text-gray-500">
              Educational Network Route Tracer - Helping Year 9 students understand how the internet works
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

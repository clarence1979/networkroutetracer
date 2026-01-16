import React, { useState } from 'react';
import { Search, Globe, Loader } from 'lucide-react';

interface DomainInputProps {
  onSubmit: (domain: string) => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  isInitializing?: boolean;
}

export const DomainInput: React.FC<DomainInputProps> = ({
  onSubmit,
  loading = false,
  error,
  disabled = false,
  isInitializing = false
}) => {
  const [domain, setDomain] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      onSubmit(domain.trim());
    }
  };

  const validateDomain = (input: string) => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    return domainRegex.test(input);
  };

  const isValidDomain = validateDomain(domain);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Globe className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">
          AI-Powered Network Route Tracer
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
            Enter any website domain for real-time AI traceroute analysis
          </label>
          <div className="relative">
            <input
              type="text"
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain name..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading || disabled}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {loading ? (
                <Loader className="h-5 w-5 text-gray-400 animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
          
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
          
          {domain && !isValidDomain && (
            <p className="mt-1 text-sm text-yellow-600">
              Please enter a valid domain name (e.g., example.com, bbc.co.uk)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !isValidDomain || !domain || disabled || isInitializing}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'AI Analyzing Route...' : 
           isInitializing ? 'Loading...' :
           disabled ? 'Enter API Key First' : 'AI Trace Route'}
        </button>
      </form>

      {/* Quick examples */}
      {!disabled && (
      <div className="mt-4 pt-4 border-t border-gray-200 overflow-x-auto">
        <p className="text-sm text-gray-600 mb-2">Try these examples for AI analysis:</p>
        <div className="flex flex-wrap gap-2 min-w-max sm:min-w-0">
          {['google.com', 'bbc.co.uk', 'github.com', 'wikipedia.org', 'amazon.com'].map((example) => (
            <button
              key={example}
              onClick={() => setDomain(example)}
              disabled={loading || disabled}
              className="text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded-full transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiKeyCache } from '../../services/apiKeyCache';

interface APIKeyInputProps {
  onAPIKeyChange: (apiKey: string) => void;
}

export const APIKeyInput: React.FC<APIKeyInputProps> = ({ onAPIKeyChange }) => {
  const [apiKey, setApiKey] = useState(ApiKeyCache.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(
    ApiKeyCache.apiKey ? ApiKeyCache.apiKey.startsWith('sk-') && ApiKeyCache.apiKey.length > 20 : null
  );

  // Subscribe to global API key changes and auto-populate
  useEffect(() => {
    const unsubscribe = ApiKeyCache.subscribe((newApiKey) => {
      setApiKey(newApiKey);
      setIsValid(newApiKey ? newApiKey.startsWith('sk-') && newApiKey.length > 20 : null);
      onAPIKeyChange(newApiKey);
    });

    return unsubscribe;
  }, [onAPIKeyChange]);

  const handleAPIKeyChange = (value: string) => {
    setApiKey(value);
    
    // Basic validation - OpenAI keys start with 'sk-'
    const isValidFormat = value.startsWith('sk-') && value.length > 20;
    setIsValid(isValidFormat);
    
    if (isValidFormat) {
      ApiKeyCache.apiKey = value;
    } else {
      ApiKeyCache.clear();
    }
  };

  const clearAPIKey = () => {
    ApiKeyCache.clear();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Key className="h-6 w-6 text-purple-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">
          OpenAI API Configuration
        </h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="apikey" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your OpenAI API Key for AI-powered traceroute analysis
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              id="apikey"
              value={apiKey}
              onChange={(e) => handleAPIKeyChange(e.target.value)}
              placeholder="sk-..."
              className={`w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                isValid === false ? 'border-red-300' : 
                isValid === true ? 'border-green-300' : 'border-gray-300'
              }`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
              {isValid === true && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {isValid === false && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showKey ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          {isValid === false && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid OpenAI API key (starts with 'sk-')
            </p>
          )}
          
          {isValid === true && (
            <p className="mt-1 text-sm text-green-600">
              API key saved locally and ready to use
            </p>
          )}
        </div>

        {apiKey && (
          <button
            onClick={clearAPIKey}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Clear API Key
          </button>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">How to get an OpenAI API Key:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></li>
            <li>Sign in to your OpenAI account</li>
            <li>Click "Create new secret key"</li>
            <li>Copy the key and paste it above</li>
          </ol>
          <p className="text-xs text-blue-700 mt-2">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
};
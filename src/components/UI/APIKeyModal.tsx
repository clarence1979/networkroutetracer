import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react';
import { ApiKeyCache } from '../../services/apiKeyCache';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAPIKeyChange: (apiKey: string) => void;
  currentAPIKey: string;
}

export const APIKeyModal: React.FC<APIKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onAPIKeyChange,
  currentAPIKey 
}) => {
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
    });

    return unsubscribe;
  }, []);

  const handleAPIKeyChange = (value: string) => {
    setApiKey(value);
    
    // Basic validation - OpenAI keys start with 'sk-'
    const isValidFormat = value.startsWith('sk-') && value.length > 20;
    setIsValid(isValidFormat);
  };

  const handleSave = () => {
    if (isValid) {
      ApiKeyCache.apiKey = apiKey;
    } else if (apiKey === '') {
      ApiKeyCache.clear();
    }
    onClose();
  };

  const clearAPIKey = () => {
    ApiKeyCache.clear();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Key className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              OpenAI API Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
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
                Valid API key format
              </p>
            )}
          </div>

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

          <div className="flex justify-between space-x-3">
            {apiKey && (
              <button
                onClick={clearAPIKey}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Clear API Key
              </button>
            )}
            <div className="flex space-x-3 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
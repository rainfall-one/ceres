/**
 * Apostrophe OAuth2 Provider Component
 * 
 * Reusable OAuth2 authentication component for all Rainfall products.
 * Supports multiple providers (GitHub, Google, Microsoft, Custom) and 
 * can be used across desktop, mobile, and web applications.
 * 
 * @category Authentication
 * @subcategory OAuth2
 * @platform Cross-platform (Web, Desktop, Mobile)
 */

import { AlertCircle, CheckCircle, ExternalLink, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface OAuth2ProviderConfig 
{
  provider: 'github' | 'google' | 'microsoft' | 'custom';
  clientId: string;
  clientSecret: string;
  scopes: string[];
  enabled: boolean;
  
  // Microsoft-specific
  tenantId?: string;
  
  // Custom provider-specific
  customAuthUrl?: string;
  customTokenUrl?: string;
  customUserInfoUrl?: string;
  customName?: string;
}

export interface OAuth2User 
{
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
  rawData?: any;
}

export interface OAuth2FlowState 
{
  status: 'idle' | 'configuring' | 'authenticating' | 'success' | 'error';
  message: string;
  error?: string;
  user?: OAuth2User;
  authorizationCode?: string;
}

export interface OAuth2ComponentProps 
{
  // Configuration
  initialProvider?: OAuth2ProviderConfig['provider'];
  allowProviderSelection?: boolean;
  enableCustomProvider?: boolean;
  
  // Callbacks
  onConfigurationComplete?: (config: OAuth2ProviderConfig) => void;
  onAuthenticationSuccess?: (user: OAuth2User, code: string) => void;
  onAuthenticationError?: (error: string) => void;
  onProviderChange?: (provider: OAuth2ProviderConfig['provider']) => void;
  
  // UI Customization
  title?: string;
  subtitle?: string;
  showProviderGuide?: boolean;
  compactMode?: boolean;
  className?: string;
  
  // Flow control
  autoRedirect?: boolean;
  redirectUrl?: string;
  state?: string; // Custom state parameter
}

// ============================================================================
// OAUTH2 SERVICE ABSTRACTION
// ============================================================================

class OAuth2Service 
{
  private configs: Map<string, OAuth2ProviderConfig> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string = window?.location?.origin || 'http://localhost:3000') 
  {
    this.baseUrl = baseUrl;
  }

  configureProvider(config: OAuth2ProviderConfig): void 
  {
    this.configs.set(config.provider, config);
  }

  getProvider(provider: string): OAuth2ProviderConfig | undefined 
  {
    return this.configs.get(provider);
  }

  buildAuthUrl(provider: string, scopes: string[], state?: string): string 
  {
    const config = this.configs.get(provider);
    if (!config) 
    {
      throw new Error(`Provider ${provider} not configured`);
    }

    const redirectUri = `${this.baseUrl}/auth/callback`;
    const stateParam = state || `provider=${provider}&timestamp=${Date.now()}`;
    
    const authUrls = {
      github: `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=${encodeURIComponent(stateParam)}`,
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&state=${encodeURIComponent(stateParam)}`,
      microsoft: `https://login.microsoftonline.com/${config.tenantId || 'common'}/oauth2/v2.0/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&state=${encodeURIComponent(stateParam)}`,
      custom: `${config.customAuthUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&state=${encodeURIComponent(stateParam)}`
    };

    return authUrls[config.provider as keyof typeof authUrls];
  }

  async testConfiguration(config: OAuth2ProviderConfig): Promise<{ isValid: boolean; errors: string[] }> 
  {
    const errors: string[] = [];

    // Basic validation
    if (!config.clientId.trim()) errors.push('Client ID is required');
    if (!config.clientSecret.trim()) errors.push('Client Secret is required');
    if (config.provider === 'microsoft' && !config.tenantId?.trim()) 
    {
      errors.push('Tenant ID is required for Microsoft OAuth2');
    }
    if (config.provider === 'custom') 
    {
      if (!config.customAuthUrl?.trim()) errors.push('Authorization URL is required');
      if (!config.customTokenUrl?.trim()) errors.push('Token URL is required');
      if (!config.customUserInfoUrl?.trim()) errors.push('User Info URL is required');
    }

    // URL validation for custom provider
    if (config.provider === 'custom') 
    {
      try 
      {
        if (config.customAuthUrl) new URL(config.customAuthUrl);
        if (config.customTokenUrl) new URL(config.customTokenUrl);
        if (config.customUserInfoUrl) new URL(config.customUserInfoUrl);
      } 
      catch 
      {
        errors.push('Invalid URL format in custom provider configuration');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  async exchangeCodeForUser(code: string, provider: string): Promise<OAuth2User> 
  {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, provider })
    });

    if (!response.ok) 
    {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.user;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const OAuth2Provider: React.FC<OAuth2ComponentProps> = ({
  initialProvider,
  allowProviderSelection = true,
  enableCustomProvider = true,
  onConfigurationComplete,
  onAuthenticationSuccess,
  onAuthenticationError,
  onProviderChange,
  title = 'OAuth2 Authentication',
  subtitle = 'Configure your authentication provider',
  showProviderGuide = true,
  compactMode = false,
  className = '',
  autoRedirect = true,
  redirectUrl,
  state
}) => 
{
  const [oauth2Service] = useState(() => new OAuth2Service());
  const [selectedProvider, setSelectedProvider] = useState<OAuth2ProviderConfig['provider'] | null>(initialProvider || null);
  const [config, setConfig] = useState<Partial<OAuth2ProviderConfig>>({});
  const [flowState, setFlowState] = useState<OAuth2FlowState>({
    status: 'idle',
    message: 'Ready to configure OAuth2'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle OAuth2 callback from URL parameters
  useEffect(() => 
  {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) 
    {
      setFlowState({
        status: 'error',
        message: 'Authentication failed',
        error: urlParams.get('error_description') || error
      });
      onAuthenticationError?.(error);
    }
    else if (code && selectedProvider) 
    {
      handleAuthenticationCallback(code);
    }
  }, [selectedProvider]);

  const handleAuthenticationCallback = async (code: string) => 
  {
    setFlowState({
      status: 'authenticating',
      message: 'Processing authentication...'
    });

    try 
    {
      const user = await oauth2Service.exchangeCodeForUser(code, selectedProvider!);
      setFlowState({
        status: 'success',
        message: 'Authentication successful!',
        user,
        authorizationCode: code
      });
      onAuthenticationSuccess?.(user, code);
    }
    catch (error) 
    {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setFlowState({
        status: 'error',
        message: 'Authentication failed',
        error: errorMessage
      });
      onAuthenticationError?.(errorMessage);
    }
  };

  const handleProviderSelection = (provider: OAuth2ProviderConfig['provider']) => 
  {
    setSelectedProvider(provider);
    setConfig({
      provider,
      scopes: getDefaultScopes(provider),
      enabled: true
    });
    setFlowState({
      status: 'configuring',
      message: `Configuring ${provider} OAuth2...`
    });
    onProviderChange?.(provider);
  };

  const getDefaultScopes = (provider: OAuth2ProviderConfig['provider']): string[] => 
  {
    const defaultScopes = {
      github: ['read:user', 'user:email'],
      google: ['openid', 'email', 'profile'],
      microsoft: ['openid', 'email', 'profile', 'User.Read'],
      custom: ['openid', 'email', 'profile']
    };
    return defaultScopes[provider];
  };

  const updateConfig = (field: keyof OAuth2ProviderConfig, value: any) => 
  {
    setConfig(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateAndSaveConfig = async () => 
  {
    if (!selectedProvider || !config.clientId || !config.clientSecret) return;

    const fullConfig = { ...config } as OAuth2ProviderConfig;
    const validation = await oauth2Service.testConfiguration(fullConfig);
    
    if (!validation.isValid) 
    {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => 
      {
        if (error.includes('Client ID')) errorMap.clientId = error;
        else if (error.includes('Client Secret')) errorMap.clientSecret = error;
        else if (error.includes('Tenant ID')) errorMap.tenantId = error;
        else if (error.includes('Authorization URL')) errorMap.customAuthUrl = error;
        else if (error.includes('Token URL')) errorMap.customTokenUrl = error;
        else if (error.includes('User Info URL')) errorMap.customUserInfoUrl = error;
        else errorMap.general = error;
      });
      setErrors(errorMap);
      return;
    }

    oauth2Service.configureProvider(fullConfig);
    setFlowState({
      status: 'success',
      message: 'Configuration saved successfully!'
    });
    onConfigurationComplete?.(fullConfig);
  };

  const startAuthFlow = () => 
  {
    if (!selectedProvider || !config.scopes) return;

    try 
    {
      const authUrl = oauth2Service.buildAuthUrl(
        selectedProvider,
        config.scopes,
        state || `provider=${selectedProvider}&timestamp=${Date.now()}`
      );
      
      if (autoRedirect) 
      {
        window.location.href = authUrl;
      }
      else 
      {
        window.open(authUrl, '_blank');
      }
    }
    catch (error) 
    {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start OAuth2 flow';
      setFlowState({
        status: 'error',
        message: 'Failed to start authentication',
        error: errorMessage
      });
      onAuthenticationError?.(errorMessage);
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderProviderSelection = () => 
  {
    const providers: Array<{
      id: OAuth2ProviderConfig['provider'];
      name: string;
      description: string;
      icon: string;
      freeTier: string;
    }> = [
      {
        id: 'github',
        name: 'GitHub',
        description: 'Use GitHub for authentication and team management',
        icon: '🐙',
        freeTier: 'Unlimited public repos, teams for organizations'
      },
      {
        id: 'google',
        name: 'Google Workspace',
        description: 'Google Workspace integration with user management',
        icon: '🌐',
        freeTier: 'Free tier: Basic user info. Workspace for full features.'
      },
      {
        id: 'microsoft',
        name: 'Microsoft Azure AD',
        description: 'Enterprise-grade authentication with Azure Active Directory',
        icon: '🏢',
        freeTier: 'Free tier available with basic features'
      }
    ];

    if (enableCustomProvider) 
    {
      providers.push({
        id: 'custom',
        name: 'Custom OAuth2',
        description: 'Configure your own OAuth2 provider',
        icon: '⚙️',
        freeTier: 'Depends on your provider configuration'
      });
    }

    return (
      <div className="space-y-4">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleProviderSelection(provider.id)}
            className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="text-2xl">{provider.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {provider.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {provider.description}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  💰 {provider.freeTier}
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderConfigurationForm = () => 
  {
    if (!selectedProvider) return null;

    return (
      <div className="space-y-4">
        {showProviderGuide && renderProviderGuide()}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client ID *
          </label>
          <input
            type="text"
            value={config.clientId || ''}
            onChange={(e) => updateConfig('clientId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter your OAuth2 Client ID"
          />
          {errors.clientId && (
            <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client Secret *
          </label>
          <input
            type="password"
            value={config.clientSecret || ''}
            onChange={(e) => updateConfig('clientSecret', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter your OAuth2 Client Secret"
          />
          {errors.clientSecret && (
            <p className="text-red-500 text-sm mt-1">{errors.clientSecret}</p>
          )}
        </div>

        {renderProviderSpecificFields()}

        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-300">{errors.general}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          {allowProviderSelection && (
            <button
              onClick={() => setSelectedProvider(null)}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={validateAndSaveConfig}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    );
  };

  const renderProviderSpecificFields = () => 
  {
    if (selectedProvider === 'microsoft') 
    {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tenant ID *
          </label>
          <input
            type="text"
            value={config.tenantId || ''}
            onChange={(e) => updateConfig('tenantId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter your Azure AD Tenant ID"
          />
          {errors.tenantId && (
            <p className="text-red-500 text-sm mt-1">{errors.tenantId}</p>
          )}
        </div>
      );
    }

    if (selectedProvider === 'custom') 
    {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Authorization URL *
            </label>
            <input
              type="url"
              value={config.customAuthUrl || ''}
              onChange={(e) => updateConfig('customAuthUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="https://your-provider.com/oauth/authorize"
            />
            {errors.customAuthUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.customAuthUrl}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token URL *
            </label>
            <input
              type="url"
              value={config.customTokenUrl || ''}
              onChange={(e) => updateConfig('customTokenUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="https://your-provider.com/oauth/token"
            />
            {errors.customTokenUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.customTokenUrl}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Info URL *
            </label>
            <input
              type="url"
              value={config.customUserInfoUrl || ''}
              onChange={(e) => updateConfig('customUserInfoUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="https://your-provider.com/user"
            />
            {errors.customUserInfoUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.customUserInfoUrl}</p>
            )}
          </div>
        </>
      );
    }

    return null;
  };

  const renderProviderGuide = () => 
  {
    const guides = {
      github: {
        title: 'GitHub OAuth App Setup',
        steps: [
          'Go to GitHub Settings → Developer settings → OAuth Apps',
          'Click "New OAuth App"',
          'Set Authorization callback URL to: ' + (redirectUrl || `${window.location.origin}/auth/callback`),
          'Copy the Client ID and Client Secret'
        ],
        link: 'https://github.com/settings/applications/new'
      },
      google: {
        title: 'Google OAuth2 Setup',
        steps: [
          'Go to Google Cloud Console → APIs & Services → Credentials',
          'Create OAuth 2.0 Client IDs',
          'Add authorized redirect URI: ' + (redirectUrl || `${window.location.origin}/auth/callback`),
          'Copy the Client ID and Client Secret'
        ],
        link: 'https://console.cloud.google.com/apis/credentials'
      },
      microsoft: {
        title: 'Azure AD App Registration',
        steps: [
          'Go to Azure Portal → Azure Active Directory → App registrations',
          'Click "New registration"',
          'Add redirect URI: ' + (redirectUrl || `${window.location.origin}/auth/callback`),
          'Go to Certificates & secrets to create a client secret'
        ],
        link: 'https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps'
      },
      custom: {
        title: 'Custom OAuth2 Provider',
        steps: [
          'Ensure your OAuth2 provider supports standard OAuth2 flow',
          'Configure redirect URI: ' + (redirectUrl || `${window.location.origin}/auth/callback`),
          'Gather the authorization, token, and user info endpoints',
          'Ensure the provider returns user email and name in user info'
        ],
        link: null
      }
    };

    const guide = selectedProvider ? guides[selectedProvider] : null;
    if (!guide) return null;

    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
          📝 {guide.title}
        </h3>
        <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
          {guide.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        {guide.link && (
          <a
            href={guide.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2"
          >
            Open Provider Settings
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        )}
      </div>
    );
  };

  const renderAuthenticationFlow = () => 
  {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-medium text-green-900 dark:text-green-100">
              Configuration Complete
            </h3>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            {selectedProvider?.charAt(0).toUpperCase()}{selectedProvider?.slice(1)} OAuth2 is configured and ready to use.
          </p>
        </div>

        <button
          onClick={startAuthFlow}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Shield className="w-5 h-5" />
          <span>Authenticate with {selectedProvider?.charAt(0).toUpperCase()}{selectedProvider?.slice(1)}</span>
        </button>
      </div>
    );
  };

  const renderStatus = () => 
  {
    if (flowState.status === 'error') 
    {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-100">
                {flowState.message}
              </h3>
              {flowState.error && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {flowState.error}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (flowState.status === 'success' && flowState.user) 
    {
      return (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-medium text-green-900 dark:text-green-100">
                Authentication Successful!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Welcome, {flowState.user.name} ({flowState.user.email})
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (flowState.status === 'authenticating') 
    {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-blue-700 dark:text-blue-300">{flowState.message}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={`oauth2-provider ${className}`}>
      {!compactMode && (
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
      )}

      {renderStatus()}

      {flowState.status === 'success' && flowState.user ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Ready to proceed
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Authentication completed successfully
          </p>
        </div>
      ) : (
        <>
          {!selectedProvider && allowProviderSelection && renderProviderSelection()}
          {selectedProvider && flowState.status !== 'success' && renderConfigurationForm()}
          {selectedProvider && flowState.status === 'success' && !flowState.user && renderAuthenticationFlow()}
        </>
      )}
    </div>
  );
};

export default OAuth2Provider;

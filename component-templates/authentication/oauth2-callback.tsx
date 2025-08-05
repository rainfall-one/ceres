/**
 * OAuth2 Callback Handler - Apostrophe CMS Component
 * 
 * Reusable OAuth2 callback handler for all Rainfall products.
 * Handles OAuth2 callback responses from providers and manages the authentication flow.
 * 
 * CROSS-PLATFORM COMPATIBILITY:
 * - Web: Next.js App Router with useSearchParams
 * - Desktop: Electron with URL parameter parsing
 * - Mobile: React Native with deep linking
 * 
 * USAGE ACROSS PRODUCTS:
 * - JetStream Cell Dashboard: Super admin and operator authentication
 * - Rainfall Desktop: Application authentication
 * - Rainfall Mobile: Mobile app authentication
 * - Any Rainfall product requiring OAuth2 authentication
 */

'use client';

import React, { Suspense, useEffect, useState } from 'react';

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

interface OAuth2CallbackConfig
{
  /** Storage key for OAuth2 callback code */
  codeStorageKey?: string;
  /** Storage key for OAuth2 callback state */
  stateStorageKey?: string;
  /** Success redirect URL */
  successRedirectUrl: string;
  /** Error redirect URL */
  errorRedirectUrl: string;
  /** Setup completion check function */
  isSetupComplete?: () => boolean;
  /** Custom success handler (optional) */
  onSuccess?: (code: string, state?: string) => Promise<void>;
  /** Custom error handler (optional) */
  onError?: (error: string) => void;
  /** Brand configuration */
  branding: {
    Logo: React.ComponentType<{ size?: 'sm' | 'md' | 'lg'; className?: string }>;
    buttonStyles?: {
      primary: string;
      secondary: string;
    };
  };
}

interface OAuth2CallbackHandlerProps extends OAuth2CallbackConfig
{
  /** Function to get URL search parameters (platform-specific) */
  getSearchParams: () => URLSearchParams | null;
  /** Function to navigate/redirect (platform-specific) */
  navigate: (url: string) => void;
  /** Function to get/set local storage (platform-specific) */
  storage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
}

// =============================================================================
// CORE CALLBACK HANDLER COMPONENT
// =============================================================================

function OAuth2CallbackHandler({
  getSearchParams,
  navigate,
  storage,
  codeStorageKey = 'oauth_callback_code',
  stateStorageKey = 'oauth_callback_state',
  successRedirectUrl,
  errorRedirectUrl,
  isSetupComplete,
  onSuccess,
  onError,
  branding
}: OAuth2CallbackHandlerProps) 
{
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => 
  {
    async function handleCallback() 
    {
      try 
      {
        const searchParams = getSearchParams();
        
        if (!searchParams) 
        {
          setStatus('error');
          setMessage('Unable to process callback parameters');
          return;
        }

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth2 error responses
        if (error) 
        {
          const errorMsg = errorDescription || error;
          setStatus('error');
          setMessage(`Authentication failed: ${errorMsg}`);
          
          if (onError) 
          {
            onError(errorMsg);
          }
          return;
        }

        // Validate authorization code
        if (!code) 
        {
          setStatus('error');
          setMessage('No authorization code received from OAuth2 provider');
          return;
        }

        // Store callback data
        storage.setItem(codeStorageKey, code);
        if (state) 
        {
          storage.setItem(stateStorageKey, state);
        }

        // Custom success handler
        if (onSuccess) 
        {
          await onSuccess(code, state || undefined);
        }

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Determine redirect URL based on setup completion
        let redirectUrl = successRedirectUrl;
        
        if (isSetupComplete) 
        {
          const setupComplete = isSetupComplete();
          const isSetupFlow = state?.includes('setup') || !setupComplete;
          
          if (isSetupFlow && errorRedirectUrl !== successRedirectUrl) 
          {
            redirectUrl = errorRedirectUrl; // Use error redirect as setup URL
          }
        }

        // Redirect after success message display
        setTimeout(() => 
        {
          navigate(redirectUrl);
        }, 2000);
      } 
      catch (err) 
      {
        const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
        setStatus('error');
        setMessage(errorMsg);
        
        if (onError) 
        {
          onError(errorMsg);
        }
      }
    }

    handleCallback();
  }, [getSearchParams, navigate, storage, codeStorageKey, stateStorageKey, successRedirectUrl, errorRedirectUrl, isSetupComplete, onSuccess, onError]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <div className="mb-6">
            <branding.Logo size="lg" />
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {status === 'processing' && (
              <div className="text-blue-500 text-6xl mb-4 animate-spin">⟳</div>
            )}
            
            {status === 'success' && (
              <div className="text-green-500 text-6xl mb-4">✓</div>
            )}
            
            {status === 'error' && (
              <div className="text-red-500 text-6xl mb-4">✗</div>
            )}
            
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              OAuth2 Authentication
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {message}
            </p>
            
            {status === 'error' && (
              <button
                onClick={() => navigate(errorRedirectUrl)}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  branding.buttonStyles?.primary || 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                Return to Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PLATFORM-SPECIFIC IMPLEMENTATIONS
// =============================================================================

/**
 * Next.js Web Implementation
 * Uses Next.js App Router useSearchParams hook and client-side navigation
 */
export function NextJSCallbackHandler(config: OAuth2CallbackConfig) 
{
  // Dynamic import to avoid SSR issues
  const [searchParamsHook, setSearchParamsHook] = useState<any>(null);
  
  useEffect(() => 
  {
    // Dynamically import Next.js hooks
    import('next/navigation').then(({ useSearchParams }) => 
    {
      setSearchParamsHook(() => useSearchParams);
    });
  }, []);

  if (!searchParamsHook) 
  {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-blue-500 text-6xl animate-spin">⟳</div>
      </div>
    );
  }

  function CallbackContent() 
  {
    const useSearchParams = searchParamsHook();
    
    return (
      <OAuth2CallbackHandler
        {...config}
        getSearchParams={() => useSearchParams}
        navigate={(url) => 
        {
          if (typeof window !== 'undefined') 
          {
            window.location.href = url;
          }
        }}
        storage={{
          getItem: (key) => typeof window !== 'undefined' ? localStorage.getItem(key) : null,
          setItem: (key, value) => 
          {
            if (typeof window !== 'undefined') 
            {
              localStorage.setItem(key, value);
            }
          }
        }}
      />
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-blue-500 text-6xl animate-spin">⟳</div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

/**
 * Electron Desktop Implementation
 * Uses URL parameter parsing and Electron's navigation methods
 */
export function ElectronCallbackHandler(config: OAuth2CallbackConfig) 
{
  return (
    <OAuth2CallbackHandler
      {...config}
      getSearchParams={() => 
      {
        if (typeof window !== 'undefined' && window.location) 
        {
          return new URLSearchParams(window.location.search);
        }
        return null;
      }}
      navigate={(url) => 
      {
        // Use Electron's navigation or fallback to window location
        if (typeof window !== 'undefined' && (window as any).electronAPI) 
        {
          (window as any).electronAPI.navigate(url);
        } 
        else if (typeof window !== 'undefined') 
        {
          window.location.href = url;
        }
      }}
      storage={{
        getItem: (key) => 
        {
          // Use Electron's secure storage or fallback to localStorage
          if (typeof window !== 'undefined' && (window as any).electronAPI?.storage) 
          {
            return (window as any).electronAPI.storage.getItem(key);
          }
          return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        },
        setItem: (key, value) => 
        {
          // Use Electron's secure storage or fallback to localStorage
          if (typeof window !== 'undefined' && (window as any).electronAPI?.storage) 
          {
            (window as any).electronAPI.storage.setItem(key, value);
          } 
          else if (typeof window !== 'undefined') 
          {
            localStorage.setItem(key, value);
          }
        }
      }}
    />
  );
}

/**
 * React Native Mobile Implementation
 * Uses deep link parameter parsing and React Navigation
 */
export function ReactNativeCallbackHandler(config: OAuth2CallbackConfig & {
  navigation: any; // React Navigation object
  route: any; // Route parameters
}) 
{
  return (
    <OAuth2CallbackHandler
      {...config}
      getSearchParams={() => 
      {
        // Extract parameters from React Native route or deep link
        const params = config.route?.params;
        if (params) 
        {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => 
          {
            if (typeof value === 'string') 
            {
              searchParams.set(key, value);
            }
          });
          return searchParams;
        }
        return null;
      }}
      navigate={(url) => 
      {
        // Use React Navigation or deep linking
        if (config.navigation) 
        {
          // Parse the URL to determine the navigation target
          if (url.includes('dashboard')) 
          {
            config.navigation.navigate('Dashboard');
          } 
          else if (url.includes('setup')) 
          {
            config.navigation.navigate('Setup');
          }
        }
      }}
      storage={{
        getItem: (key) => 
        {
          // For React Native, we'll use a simplified sync approach
          // In real implementation, this would need to be handled differently
          // as AsyncStorage is async - typically through useEffect and state
          try 
          {
            // This is a placeholder - real React Native implementation would need
            // to handle async storage properly with hooks and state management
            return null; // or use a sync storage solution
          } 
          catch 
          {
            return null;
          }
        },
        setItem: (key, value) => 
        {
          // For React Native, we'll use a simplified sync approach
          // In real implementation, this would need to be handled differently
          try 
          {
            // This is a placeholder - real React Native implementation would need
            // proper async storage handling
          } 
          catch 
          {
            // Ignore storage errors
          }
        }
      }}
    />
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a callback handler with default Rainfall branding
 */
export function createOAuth2CallbackHandler(
  platform: 'nextjs' | 'electron' | 'react-native',
  config: Omit<OAuth2CallbackConfig, 'branding'> & {
    branding?: Partial<OAuth2CallbackConfig['branding']>;
    // React Native specific props
    navigation?: any;
    route?: any;
  }
) 
{
  const defaultBranding = {
    Logo: ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => (
      <div className={`text-blue-600 font-bold ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'} ${className}`}>
        🌧️ Rainfall
      </div>
    ),
    buttonStyles: {
      primary: 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
    }
  };

  const fullConfig = {
    ...config,
    branding: { ...defaultBranding, ...config.branding }
  };

  switch (platform) 
  {
  case 'nextjs':
    return NextJSCallbackHandler(fullConfig);
    
  case 'electron':
    return ElectronCallbackHandler(fullConfig);
    
  case 'react-native':
    return ReactNativeCallbackHandler({
      ...fullConfig,
      navigation: config.navigation,
      route: config.route
    });
    
  default:
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Default export for Next.js applications
 */
export default NextJSCallbackHandler;

// =============================================================================
// DOCUMENTATION
// =============================================================================

/**
 * USAGE EXAMPLES:
 * 
 * ## Next.js (JetStream Cell Dashboard)
 * ```tsx
 * import { NextJSCallbackHandler } from '@/shared-content/component-templates/authentication/oauth2-callback';
 * import { RainfallBranding } from '@/modules/services/rainfall-branding';
 * 
 * export default function AuthCallbackPage() {
 *   return (
 *     <NextJSCallbackHandler
 *       successRedirectUrl="/cell-dashboard"
 *       errorRedirectUrl="/super-admin-setup"
 *       isSetupComplete={() => typeof window !== 'undefined' && localStorage.getItem('jetstream-setup-complete') !== null}
 *       branding={{
 *         Logo: RainfallBranding.Logo,
 *         buttonStyles: RainfallBranding.buttonStyles
 *       }}
 *     />
 *   );
 * }
 * ```
 * 
 * ## Electron Desktop
 * ```tsx
 * import { ElectronCallbackHandler } from '@/shared-content/component-templates/authentication/oauth2-callback';
 * 
 * export function DesktopAuthCallback() {
 *   return (
 *     <ElectronCallbackHandler
 *       successRedirectUrl="/dashboard"
 *       errorRedirectUrl="/login"
 *       branding={{
 *         Logo: DesktopBranding.Logo
 *       }}
 *     />
 *   );
 * }
 * ```
 * 
 * ## React Native Mobile
 * ```tsx
 * import { ReactNativeCallbackHandler } from '@/shared-content/component-templates/authentication/oauth2-callback';
 * 
 * export function MobileAuthCallback({ navigation, route }) {
 *   return (
 *     <ReactNativeCallbackHandler
 *       navigation={navigation}
 *       route={route}
 *       successRedirectUrl="Dashboard"
 *       errorRedirectUrl="Login"
 *       branding={{
 *         Logo: MobileBranding.Logo
 *       }}
 *     />
 *   );
 * }
 * ```
 */

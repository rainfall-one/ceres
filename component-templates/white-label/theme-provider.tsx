import React, { createContext, useContext, useEffect, useState } from 'react';

export interface OperatorTheme
{
  operator: {
    name: string;
    shortName: string;
    logo: {
      primary: string;
      secondary?: string;
      favicon: string;
      dimensions: {
        maxWidth: number;
        maxHeight: number;
      };
    };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: {
        primary: string;
        secondary: string;
        muted: string;
      };
      status: {
        success: string;
        warning: string;
        error: string;
        info: string;
      };
    };
    typography: {
      primary: string;
      secondary: string;
      monospace: string;
    };
  };
  interface: {
    platformName: string;
    tagline: string;
    navigation: Record<string, string>;
    modules: Record<string, {
      displayName: string;
      description: string;
      icon: string;
    }>;
  };
  compliance: {
    showRainfallLogo: boolean;
    rainfallLogoPlacement: string;
    poweredByText: string;
    licenseDisplay: string;
  };
  customCSS?: string;
}

export interface OperatorThemeContextValue
{
  theme: OperatorTheme;
  customLabels: Record<string, string>;
  compliance: OperatorTheme['compliance'];
  updateTheme: (updates: Partial<OperatorTheme>) => void;
  generateCSS: () => string;
}

const OperatorThemeContext = createContext<OperatorThemeContextValue | null>(null);

export const useOperatorTheme = (): OperatorThemeContextValue => 
{
  const context = useContext(OperatorThemeContext);
  if (!context) 
  {
    throw new Error('useOperatorTheme must be used within an OperatorThemeProvider');
  }
  return context;
};

export interface OperatorThemeProviderProps
{
  children: React.ReactNode;
  initialTheme: OperatorTheme;
  cmsEndpoint?: string;
  autoSync?: boolean;
}

export const OperatorThemeProvider: React.FC<OperatorThemeProviderProps> = ({
  children,
  initialTheme,
  cmsEndpoint,
  autoSync = false
}) => 
{
  const [theme, setTheme] = useState<OperatorTheme>(initialTheme);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});

  // Sync with CMS if endpoint provided
  useEffect(() => 
  {
    if (cmsEndpoint && autoSync) 
    {
      fetchThemeFromCMS();
    }
  }, [cmsEndpoint, autoSync]);

  const fetchThemeFromCMS = async (): Promise<void> => 
  {
    try 
    {
      const response = await fetch(`${cmsEndpoint}/api/operator-branding`);
      if (response.ok) 
      {
        const cmsTheme = await response.json();
        setTheme(prevTheme => ({ ...prevTheme, ...cmsTheme }));
      }
    } 
    catch (error) 
    {
      console.warn('Failed to fetch theme from CMS:', error);
    }
  };

  const updateTheme = (updates: Partial<OperatorTheme>): void => 
  {
    setTheme(prevTheme => ({ ...prevTheme, ...updates }));
  };

  const generateCSS = (): string => 
  {
    return `
      :root {
        /* Operator Brand Colors */
        --operator-primary: ${theme.operator.colors.primary};
        --operator-secondary: ${theme.operator.colors.secondary};
        --operator-accent: ${theme.operator.colors.accent};
        
        /* Background Colors */
        --bg-primary: ${theme.operator.colors.background};
        --bg-surface: ${theme.operator.colors.surface};
        
        /* Text Colors */
        --text-primary: ${theme.operator.colors.text.primary};
        --text-secondary: ${theme.operator.colors.text.secondary};
        --text-muted: ${theme.operator.colors.text.muted};
        
        /* Status Colors */
        --status-success: ${theme.operator.colors.status.success};
        --status-warning: ${theme.operator.colors.status.warning};
        --status-error: ${theme.operator.colors.status.error};
        --status-info: ${theme.operator.colors.status.info};
        
        /* Typography */
        --font-primary: ${theme.operator.typography.primary};
        --font-secondary: ${theme.operator.typography.secondary};
        --font-monospace: ${theme.operator.typography.monospace};
        
        /* Protected Rainfall Elements */
        --rainfall-brand-color: #0066cc;
        --rainfall-logo-size: 24px;
      }
      
      /* Operator Logo Styling */
      .operator-logo {
        max-width: ${theme.operator.logo.dimensions.maxWidth}px;
        max-height: ${theme.operator.logo.dimensions.maxHeight}px;
      }
      
      /* Compliance Elements */
      .rainfall-attribution {
        font-size: 0.875rem;
        color: var(--text-muted);
        opacity: 0.8;
      }
      
      .powered-by-rainfall {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
      }
      
      ${theme.customCSS || ''}
    `;
  };

  // Inject CSS into document
  useEffect(() => 
  {
    const style = document.createElement('style');
    style.textContent = generateCSS();
    document.head.appendChild(style);
    
    return () => 
    {
      document.head.removeChild(style);
    };
  }, [theme]);

  const contextValue: OperatorThemeContextValue = 
  {
    theme,
    customLabels: { ...theme.interface.navigation, ...customLabels },
    compliance: theme.compliance,
    updateTheme,
    generateCSS
  };

  return (
    <OperatorThemeContext.Provider value={contextValue}>
      {children}
    </OperatorThemeContext.Provider>
  );
};

export default OperatorThemeProvider;

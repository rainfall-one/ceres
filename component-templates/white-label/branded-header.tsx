import React from 'react';
import { useOperatorTheme } from './theme-provider';

export interface BrandedHeaderProps
{
  showNavigation?: boolean;
  showUserMenu?: boolean;
  navigationItems?: NavigationItem[];
  className?: string;
}

export interface NavigationItem
{
  key: string;
  label: string;
  href: string;
  icon?: string;
  active?: boolean;
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  showNavigation = true,
  showUserMenu = true,
  navigationItems = [],
  className = ''
}) => 
{
  const { theme, customLabels, compliance } = useOperatorTheme();

  return (
    <header 
      className={`branded-header ${className}`}
      style={{
        backgroundColor: theme.operator.colors.background,
        borderBottom: `1px solid ${theme.operator.colors.surface}`,
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Operator Branding */}
      <div className="operator-brand" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img 
          src={theme.operator.logo.primary}
          alt={theme.operator.name}
          className="operator-logo"
          style={{
            maxWidth: theme.operator.logo.dimensions.maxWidth,
            maxHeight: theme.operator.logo.dimensions.maxHeight,
            height: 'auto'
          }}
        />
        <h1 
          className="platform-name"
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '600',
            color: theme.operator.colors.text.primary,
            fontFamily: theme.operator.typography.primary
          }}
        >
          {theme.interface.platformName}
        </h1>
      </div>

      {/* Navigation */}
      {showNavigation && navigationItems.length > 0 && (
        <nav className="main-navigation" style={{ display: 'flex', gap: '24px' }}>
          {navigationItems.map(item => (
            <a
              key={item.key}
              href={item.href}
              className={`nav-item ${item.active ? 'active' : ''}`}
              style={{
                textDecoration: 'none',
                color: item.active ? theme.operator.colors.primary : theme.operator.colors.text.secondary,
                fontWeight: item.active ? '600' : '400',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: item.active ? `${theme.operator.colors.primary}10` : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {item.icon && <i className={`icon-${item.icon}`} style={{ marginRight: '8px' }} />}
              {customLabels[item.key] || item.label}
            </a>
          ))}
        </nav>
      )}

      {/* User Menu & Compliance */}
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {showUserMenu && (
          <div className="user-menu">
            {/* User menu implementation */}
          </div>
        )}
        
        {/* Rainfall Compliance Attribution */}
        {compliance.showRainfallLogo && compliance.rainfallLogoPlacement === 'header-right' && (
          <div 
            className="rainfall-attribution"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: 0.8,
              fontSize: '0.75rem',
              color: theme.operator.colors.text.muted
            }}
          >
            <img 
              src="/rainfall-logo-small.svg"
              alt="Rainfall Cloud"
              style={{ width: '24px', height: '24px' }}
            />
            <span>Powered by Rainfall</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default BrandedHeader;

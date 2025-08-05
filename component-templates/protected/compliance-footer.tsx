import React from 'react';
import { useOperatorTheme } from '../white-label/theme-provider';

export interface ComplianceFooterProps
{
  showOperatorInfo?: boolean;
  showRainfallAttribution?: boolean;
  additionalLinks?: FooterLink[];
  className?: string;
}

export interface FooterLink
{
  label: string;
  href: string;
  external?: boolean;
}

export const ComplianceFooter: React.FC<ComplianceFooterProps> = ({
  showOperatorInfo = true,
  showRainfallAttribution = true,
  additionalLinks = [],
  className = ''
}) => 
{
  const { theme, compliance } = useOperatorTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className={`compliance-footer ${className}`}
      style={{
        backgroundColor: theme.operator.colors.surface,
        borderTop: `1px solid ${theme.operator.colors.text.muted}20`,
        padding: '24px',
        marginTop: 'auto'
      }}
    >
      <div 
        className="footer-content"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Operator Information */}
        {showOperatorInfo && (
          <div className="operator-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p 
              style={{
                margin: 0,
                color: theme.operator.colors.text.secondary,
                fontSize: '0.875rem'
              }}
            >
              © {currentYear} {theme.operator.name}
            </p>
            
            {/* Additional Links */}
            {additionalLinks.length > 0 && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                {additionalLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    style={{
                      color: theme.operator.colors.text.muted,
                      textDecoration: 'none',
                      fontSize: '0.75rem'
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Required Rainfall Platform Attribution */}
        {showRainfallAttribution && (
          <div 
            className="platform-attribution"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: 0.8
            }}
          >
            <span 
              className="powered-by-rainfall"
              style={{
                fontSize: '0.75rem',
                color: theme.operator.colors.text.muted,
                fontFamily: theme.operator.typography.secondary
              }}
            >
              {compliance.poweredByText || 'Powered by Rainfall Cloud Platform'}
            </span>
            
            <a 
              href="https://rainfall.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="rainfall-link"
              style={{
                display: 'flex', 
                alignItems: 'center',
                textDecoration: 'none'
              }}
            >
              <img 
                src="/rainfall-logo.svg"
                alt="Rainfall Cloud"
                style={{
                  width: '24px',
                  height: '24px',
                  opacity: 0.7
                }}
              />
            </a>
          </div>
        )}
      </div>
      
      {/* Legal/Compliance Text */}
      <div 
        className="legal-info"
        style={{
          textAlign: 'center',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${theme.operator.colors.text.muted}10`,
          fontSize: '0.625rem',
          color: theme.operator.colors.text.muted,
          opacity: 0.6
        }}
      >
        <p style={{ margin: 0 }}>
          JetStream Platform Technology © Rainfall One Ltd. All rights reserved.
        </p>
        {compliance.licenseDisplay === 'full' && (
          <p style={{ margin: '4px 0 0 0' }}>
            Licensed under the Rainfall Cloud Platform Agreement
          </p>
        )}
      </div>
    </footer>
  );
};

export default ComplianceFooter;

# OAuth2 Callback Handler - Apostrophe CMS Component

## Overview

The OAuth2 Callback Handler is a reusable component within the Apostrophe CMS system that handles OAuth2 authentication callbacks across all Rainfall products. This component provides a consistent authentication experience whether you're building for web, desktop, or mobile platforms.

## Features

### ✅ **Cross-Platform Compatibility**
- **Next.js Web Applications**: Full support for Next.js App Router with useSearchParams
- **Electron Desktop Applications**: Native desktop OAuth2 callback handling
- **React Native Mobile Applications**: Deep linking and mobile authentication support

### ✅ **Comprehensive Error Handling**
- OAuth2 provider error responses (error, error_description parameters)
- Network and connection failures
- Invalid or missing authorization codes
- Custom error handling with user-defined callbacks

### ✅ **Flexible Configuration**
- Customizable redirect URLs for success and error scenarios
- Setup completion detection for multi-step authentication flows
- Custom success and error handlers for application-specific logic
- Configurable storage keys for OAuth2 data persistence

### ✅ **Branded User Experience**
- Customizable branding with logo and button styles
- Loading states with animated indicators
- Success and error state displays
- Consistent UI across all Rainfall products

## File Structure

```
shared-content/component-templates/authentication/
├── oauth2-callback.tsx           # Main reusable callback component
├── oauth2-provider.tsx          # OAuth2 provider selection component
└── README-oauth2-callback.md    # This documentation file
```

## Platform Implementations

### Next.js Web Implementation

```tsx
import { NextJSCallbackHandler } from '@/shared-content/component-templates/authentication/oauth2-callback';
import { RainfallBranding } from '@/modules/services/rainfall-branding';

export default function AuthCallbackPage() {
  return (
    <NextJSCallbackHandler
      successRedirectUrl="/dashboard"
      errorRedirectUrl="/login"
      isSetupComplete={() => 
        typeof window !== 'undefined' && 
        localStorage.getItem('app-setup-complete') !== null
      }
      branding={{
        Logo: RainfallBranding.Logo,
        buttonStyles: RainfallBranding.buttonStyles
      }}
      onSuccess={async (code, state) => {
        // Custom success handling
        console.log('OAuth2 success:', { code, state });
      }}
      onError={(error) => {
        // Custom error handling
        console.error('OAuth2 error:', error);
      }}
    />
  );
}
```

### Electron Desktop Implementation

```tsx
import { ElectronCallbackHandler } from '@/shared-content/component-templates/authentication/oauth2-callback';
import { DesktopBranding } from '@/branding/desktop-branding';

export function DesktopAuthCallback() {
  return (
    <ElectronCallbackHandler
      successRedirectUrl="/main-window"
      errorRedirectUrl="/login-window"
      branding={{
        Logo: DesktopBranding.Logo,
        buttonStyles: DesktopBranding.buttonStyles
      }}
      onSuccess={async (code, state) => {
        // Store credentials securely
        await electronAPI.secureStorage.setItem('oauth_token', code);
      }}
    />
  );
}
```

### React Native Mobile Implementation

```tsx
import { ReactNativeCallbackHandler } from '@/shared-content/component-templates/authentication/oauth2-callback';

export function MobileAuthCallback({ navigation, route }) {
  return (
    <ReactNativeCallbackHandler
      navigation={navigation}
      route={route}
      successRedirectUrl="Dashboard"
      errorRedirectUrl="Login"
      branding={{
        Logo: MobileBranding.Logo
      }}
      onSuccess={async (code, state) => {
        // Handle mobile-specific authentication
        await AsyncStorage.setItem('oauth_code', code);
      }}
    />
  );
}
```

## Configuration Options

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `successRedirectUrl` | `string` | URL to redirect to after successful authentication |
| `errorRedirectUrl` | `string` | URL to redirect to after authentication error |
| `branding` | `BrandingConfig` | Logo and button styling configuration |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `codeStorageKey` | `string` | `'oauth_callback_code'` | localStorage key for OAuth2 code |
| `stateStorageKey` | `string` | `'oauth_callback_state'` | localStorage key for OAuth2 state |
| `isSetupComplete` | `() => boolean` | `undefined` | Function to check if initial setup is complete |
| `onSuccess` | `(code: string, state?: string) => Promise<void>` | `undefined` | Custom success handler |
| `onError` | `(error: string) => void` | `undefined` | Custom error handler |

### Branding Configuration

```tsx
interface BrandingConfig {
  Logo: React.ComponentType<{
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }>;
  buttonStyles?: {
    primary: string;
    secondary: string;
  };
}
```

## Integration Examples

### JetStream Cell Dashboard

```tsx
// src/app/auth/callback/page.tsx
import { NextJSCallbackHandler } from '../../../../shared-content/component-templates/authentication/oauth2-callback';
import { RainfallBranding } from '../../../modules/services/rainfall-branding';

export default function AuthCallbackPage() {
  return (
    <NextJSCallbackHandler
      successRedirectUrl="/cell-dashboard"
      errorRedirectUrl="/super-admin-setup"
      isSetupComplete={() => 
        typeof window !== 'undefined' && 
        localStorage.getItem('jetstream-setup-complete') !== null
      }
      branding={{
        Logo: RainfallBranding.Logo,
        buttonStyles: RainfallBranding.buttonStyles
      }}
    />
  );
}
```

### Rainfall Desktop Application

```tsx
// src/windows/auth-callback.tsx
import { ElectronCallbackHandler } from '@/shared-content/component-templates/authentication/oauth2-callback';

export function AuthCallbackWindow() {
  return (
    <ElectronCallbackHandler
      successRedirectUrl="/main-dashboard"
      errorRedirectUrl="/login"
      branding={{
        Logo: ({ size }) => (
          <img 
            src="/assets/rainfall-logo.svg" 
            alt="Rainfall" 
            className={size === 'lg' ? 'h-12' : 'h-8'} 
          />
        )
      }}
      onSuccess={async (code) => {
        // Exchange code for tokens
        await window.electronAPI.auth.exchangeCode(code);
      }}
    />
  );
}
```

## Error Handling

The component handles various OAuth2 error scenarios:

### Provider Errors
- `access_denied`: User denied access
- `invalid_request`: Malformed request
- `unauthorized_client`: Client not authorized
- `unsupported_response_type`: Invalid response type
- `invalid_scope`: Invalid or unknown scope

### Application Errors
- Missing authorization code
- Network connectivity issues
- Storage access failures
- Invalid callback parameters

### Custom Error Handling

```tsx
<NextJSCallbackHandler
  // ... other props
  onError={(error) => {
    // Log to analytics
    analytics.track('oauth_error', { error });
    
    // Show user-friendly message
    toast.error('Authentication failed. Please try again.');
    
    // Custom error recovery
    if (error.includes('access_denied')) {
      // Handle user denial specifically
      router.push('/login?error=access_denied');
    }
  }}
/>
```

## Security Considerations

### State Parameter Validation
The component automatically handles OAuth2 state parameter validation to prevent CSRF attacks.

### Secure Storage
- **Web**: Uses localStorage (consider upgrading to secure cookies for production)
- **Desktop**: Supports Electron's secure storage APIs
- **Mobile**: Compatible with React Native's secure storage solutions

### Error Information Exposure
Error messages are sanitized to prevent information leakage while providing useful debugging information.

## Testing

### Unit Testing

```tsx
import { render, screen } from '@testing-library/react';
import { NextJSCallbackHandler } from '@/shared-content/component-templates/authentication/oauth2-callback';

const mockBranding = {
  Logo: ({ size }) => <div data-testid="logo">{size}</div>,
  buttonStyles: {
    primary: 'btn-primary',
    secondary: 'btn-secondary'
  }
};

test('displays success state on valid callback', async () => {
  // Mock URL parameters
  const mockSearchParams = new URLSearchParams('?code=test-code&state=test-state');
  
  render(
    <NextJSCallbackHandler
      successRedirectUrl="/dashboard"
      errorRedirectUrl="/login"
      branding={mockBranding}
    />
  );
  
  // Assert success state is displayed
  await screen.findByText('Authentication successful!');
});
```

### Integration Testing

```tsx
// Test OAuth2 flow end-to-end
describe('OAuth2 Callback Flow', () => {
  it('should handle GitHub OAuth2 callback', async () => {
    // Simulate OAuth2 redirect
    window.location.href = '/auth/callback?code=gh_123&state=setup';
    
    // Wait for processing
    await screen.findByText('Processing authentication...');
    
    // Verify storage
    expect(localStorage.getItem('oauth_callback_code')).toBe('gh_123');
    
    // Verify redirect
    await screen.findByText('Authentication successful!');
  });
});
```

## Migration Guide

### From Hardcoded Implementation

If you have an existing hardcoded OAuth2 callback implementation:

1. **Install the component**:
   ```bash
   # Component is already available in shared-content/
   ```

2. **Replace your existing callback page**:
   ```tsx
   // Before (hardcoded)
   export default function AuthCallback() {
     // 100+ lines of custom callback logic
   }
   
   // After (Apostrophe component)
   import { NextJSCallbackHandler } from '@/shared-content/component-templates/authentication/oauth2-callback';
   
   export default function AuthCallback() {
     return (
       <NextJSCallbackHandler
         successRedirectUrl="/dashboard"
         errorRedirectUrl="/login"
         branding={YourBranding}
       />
     );
   }
   ```

3. **Update routing** (if necessary):
   ```tsx
   // Ensure your OAuth2 provider redirects to the correct callback URL
   const callbackUrl = `${window.location.origin}/auth/callback`;
   ```

## Troubleshooting

### Common Issues

**Issue**: "No authorization code received"
- **Cause**: OAuth2 provider didn't send the `code` parameter
- **Solution**: Check OAuth2 provider configuration and redirect URL

**Issue**: "Authentication failed: access_denied"
- **Cause**: User denied authorization
- **Solution**: Handle user denial gracefully and provide retry option

**Issue**: Component not redirecting after success
- **Cause**: Invalid redirect URL or navigation function
- **Solution**: Verify redirect URLs are accessible and navigation is properly configured

### Debug Mode

Enable debug logging by setting:
```tsx
<NextJSCallbackHandler
  // ... other props
  onSuccess={(code, state) => {
    console.log('Debug - OAuth2 Success:', { code, state });
  }}
  onError={(error) => {
    console.error('Debug - OAuth2 Error:', error);
  }}
/>
```

## Contributing

When contributing to the OAuth2 callback component:

1. **Test across platforms**: Ensure changes work on Web, Desktop, and Mobile
2. **Maintain backward compatibility**: Don't break existing implementations
3. **Update documentation**: Keep this README updated with any changes
4. **Follow security best practices**: Never log sensitive authentication data

## Related Components

- **[OAuth2 Provider](./oauth2-provider.tsx)**: OAuth2 provider selection and authentication initiation
- **[Rainfall Branding](../../services/rainfall-branding.ts)**: Consistent branding across products

## License

This component is part of the Rainfall Cloud platform and is subject to the platform's licensing terms.

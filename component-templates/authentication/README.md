# Apostrophe OAuth2 Provider Component

A reusable OAuth2 authentication component for all Rainfall products (Web, Desktop, Mobile).

## Overview

This component provides a complete OAuth2 authentication flow that can be used across all Rainfall Cloud products. It supports multiple providers (GitHub, Google, Microsoft, Custom) and handles the complete authentication workflow from configuration to user authentication.

## Features

- **Multi-Provider Support**: GitHub, Google Workspace, Microsoft Azure AD, Custom OAuth2
- **Cross-Platform**: Works on Web, Desktop (Electron), and Mobile (React Native)
- **Complete Flow**: Provider selection, configuration, authentication, and user management
- **Customizable UI**: Compact mode, custom styling, and flexible layout options
- **TypeScript**: Full type safety with comprehensive interfaces
- **Error Handling**: Comprehensive error states and user feedback
- **Responsive**: Mobile-friendly design with dark mode support

## Installation

### Web Applications
```bash
# Copy the component to your project
cp shared-content/component-templates/authentication/oauth2-provider.tsx src/components/
```

### Desktop Applications (Electron)
```bash
# Copy and adapt for Electron
cp shared-content/component-templates/authentication/oauth2-provider.tsx src/renderer/components/
```

### Mobile Applications (React Native)
```bash
# Copy and adapt for React Native
cp shared-content/component-templates/authentication/oauth2-provider.tsx src/components/
# Note: Will need React Native adaptations for icons and styling
```

## Usage

### Basic Usage

```tsx
import { OAuth2Provider } from './components/oauth2-provider';

function App() {
  return (
    <OAuth2Provider
      onAuthenticationSuccess={(user, code) => {
        console.log('User authenticated:', user);
        // Handle successful authentication
      }}
      onAuthenticationError={(error) => {
        console.error('Authentication failed:', error);
      }}
    />
  );
}
```

### Advanced Usage with Custom Configuration

```tsx
import { OAuth2Provider } from './components/oauth2-provider';

function AuthSetup() {
  return (
    <OAuth2Provider
      initialProvider="github"
      allowProviderSelection={true}
      enableCustomProvider={true}
      title="Setup Authentication"
      subtitle="Configure your OAuth2 provider for team access"
      showProviderGuide={true}
      compactMode={false}
      autoRedirect={true}
      state="setup=true&app=jetstream"
      onConfigurationComplete={(config) => {
        // Save configuration to backend
        console.log('Configuration saved:', config);
      }}
      onAuthenticationSuccess={(user, code) => {
        // Complete user setup
        setupUserAccount(user, code);
      }}
      onAuthenticationError={(error) => {
        // Handle authentication errors
        showErrorMessage(error);
      }}
      onProviderChange={(provider) => {
        // Track provider selection
        analytics.track('oauth_provider_selected', { provider });
      }}
    />
  );
}
```

### Compact Mode for Existing Apps

```tsx
import { OAuth2Provider } from './components/oauth2-provider';

function LoginForm() {
  return (
    <div className="login-container">
      <h1>Sign In</h1>
      
      <OAuth2Provider
        initialProvider="google"
        allowProviderSelection={false}
        compactMode={true}
        title="Sign In"
        subtitle="Use your Google account"
        autoRedirect={true}
        onAuthenticationSuccess={(user) => {
          // Redirect to dashboard
          router.push('/dashboard');
        }}
      />
    </div>
  );
}
```

## Props API

### OAuth2ComponentProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialProvider` | `'github' \| 'google' \| 'microsoft' \| 'custom'` | `undefined` | Pre-select a provider |
| `allowProviderSelection` | `boolean` | `true` | Show provider selection UI |
| `enableCustomProvider` | `boolean` | `true` | Allow custom OAuth2 providers |
| `title` | `string` | `'OAuth2 Authentication'` | Component title |
| `subtitle` | `string` | `'Configure your authentication provider'` | Component subtitle |
| `showProviderGuide` | `boolean` | `true` | Show setup instructions |
| `compactMode` | `boolean` | `false` | Minimal UI mode |
| `className` | `string` | `''` | Additional CSS classes |
| `autoRedirect` | `boolean` | `true` | Auto-redirect to provider |
| `redirectUrl` | `string` | `window.location.origin + '/auth/callback'` | OAuth2 callback URL |
| `state` | `string` | `auto-generated` | Custom state parameter |

### Callbacks

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onConfigurationComplete` | `(config: OAuth2ProviderConfig)` | Called when provider is configured |
| `onAuthenticationSuccess` | `(user: OAuth2User, code: string)` | Called on successful authentication |
| `onAuthenticationError` | `(error: string)` | Called on authentication error |
| `onProviderChange` | `(provider: string)` | Called when provider changes |

## Types

### OAuth2ProviderConfig
```tsx
interface OAuth2ProviderConfig {
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
```

### OAuth2User
```tsx
interface OAuth2User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
  rawData?: any;
}
```

## Integration Examples

### JetStream Platform
```tsx
// Super Admin Setup
<OAuth2Provider
  title="Super Admin Setup"
  subtitle="Configure authentication for your Cell"
  state="setup=true&role=super_admin"
  onAuthenticationSuccess={createSuperAdmin}
/>
```

### Rainfall Desktop
```tsx
// Desktop app login
<OAuth2Provider
  compactMode={true}
  initialProvider="google"
  allowProviderSelection={false}
  autoRedirect={false} // Use popup for desktop
  onAuthenticationSuccess={handleDesktopLogin}
/>
```

### Mobile App
```tsx
// Mobile authentication (with React Native adaptations)
<OAuth2Provider
  compactMode={true}
  showProviderGuide={false}
  onAuthenticationSuccess={handleMobileLogin}
  // Mobile-specific props would be added
/>
```

## Customization

### Styling
The component uses Tailwind CSS classes and supports dark mode. You can customize:

```tsx
<OAuth2Provider
  className="custom-oauth-container"
  // Add custom styles in your CSS
/>
```

```css
.custom-oauth-container {
  /* Your custom styles */
}

.oauth2-provider {
  /* Override component styles */
}
```

### Provider Icons
Provider icons can be customized by modifying the component or through CSS:

```css
.oauth2-provider .provider-github::before {
  content: "🐙";
}
```

## Backend Integration

The component requires a backend API endpoint at `/api/auth/token` for token exchange:

```tsx
// pages/api/auth/token.ts (Next.js example)
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { code, provider } = req.body;
    
    try {
      // Exchange code for access token
      const tokenResponse = await exchangeCodeForToken(code, provider);
      
      // Get user information
      const user = await getUserInfo(tokenResponse.access_token, provider);
      
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

## Provider Setup Guides

### GitHub
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL to: `https://yourapp.com/auth/callback`
4. Copy Client ID and Client Secret

### Google Workspace
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client IDs
3. Add authorized redirect URI: `https://yourapp.com/auth/callback`
4. Copy Client ID and Client Secret

### Microsoft Azure AD
1. Go to Azure Portal → Azure Active Directory → App registrations
2. Click "New registration"
3. Add redirect URI: `https://yourapp.com/auth/callback`
4. Go to Certificates & secrets to create a client secret

### Custom Provider
1. Ensure your OAuth2 provider supports standard OAuth2 flow
2. Configure redirect URI: `https://yourapp.com/auth/callback`
3. Gather authorization, token, and user info endpoints
4. Ensure provider returns user email and name in user info

## Security Considerations

1. **Client Secrets**: Never expose client secrets in frontend code
2. **State Parameter**: Always validate state parameter to prevent CSRF
3. **Redirect URI**: Use exact match for redirect URIs
4. **Token Storage**: Store tokens securely (httpOnly cookies recommended)
5. **HTTPS**: Always use HTTPS in production

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { OAuth2Provider } from './oauth2-provider';

test('renders provider selection', () => {
  render(<OAuth2Provider />);
  
  expect(screen.getByText('GitHub')).toBeInTheDocument();
  expect(screen.getByText('Google Workspace')).toBeInTheDocument();
  expect(screen.getByText('Microsoft Azure AD')).toBeInTheDocument();
});

test('handles provider selection', () => {
  const onProviderChange = jest.fn();
  render(<OAuth2Provider onProviderChange={onProviderChange} />);
  
  fireEvent.click(screen.getByText('GitHub'));
  expect(onProviderChange).toHaveBeenCalledWith('github');
});
```

## Migration from Hardcoded OAuth2

To migrate from hardcoded OAuth2 implementations:

1. **Replace existing OAuth2 code** with this component
2. **Update imports** to use the shared component
3. **Adapt callbacks** to your existing authentication flow
4. **Test thoroughly** with all supported providers

### Example Migration
```tsx
// Before: Hardcoded OAuth2
function SuperAdminSetup() {
  const [provider, setProvider] = useState('github');
  const [config, setConfig] = useState({});
  // ... lots of OAuth2 logic
}

// After: Using Apostrophe component
function SuperAdminSetup() {
  return (
    <OAuth2Provider
      onAuthenticationSuccess={createSuperAdmin}
      onConfigurationComplete={saveConfig}
    />
  );
}
```

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Ensure callback URL matches exactly
2. **"Invalid client"**: Check client ID and secret
3. **"Scope not granted"**: Verify requested scopes are allowed
4. **CORS errors**: Ensure proper CORS configuration

### Debug Mode
Enable debug logging:

```tsx
<OAuth2Provider
  // Add debug prop (you'll need to implement this)
  debug={true}
  onConfigurationComplete={(config) => {
    console.log('Debug - Config:', config);
  }}
/>
```

## Contributing

When updating this component:

1. **Test across platforms**: Web, Desktop, Mobile
2. **Update documentation**: Keep this README current
3. **Version changes**: Update component version in package.json
4. **Breaking changes**: Document migration path

## License

This component is part of the Rainfall Cloud platform and follows the same licensing terms.

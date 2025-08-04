# Ceres Sync Service

The endemic content synchronization service for the Ceres shared content repository. This service enables automatic synchronization of design tokens, component templates, brand assets, and documentation standards across all Rainfall platform repositories.

## Architecture Decision

This sync service lives within Ceres itself rather than as a separate package because:

- **Endemic Nature**: Content synchronization is inherent to Ceres's purpose
- **Tight Coupling**: The service is intimately tied to Ceres's content structure
- **Deployment Model**: This is infrastructure tooling, not a deployable runtime unit
- **Platform Integration**: Shared across JetStream, Jetty, and Gyre components

## Installation

From any consuming repository:

```bash
# Clone or update Ceres submodule
git submodule update --init --recursive

# Install sync service dependencies
cd shared-content/sync-service
npm install

# Build the sync service
npm run build

# Link the CLI globally (optional)
npm link
```

## Usage

### CLI Commands

```bash
# Initialize sync in a repository
ceres-sync init --submodule

# Synchronize content
ceres-sync sync

# Check sync status  
ceres-sync status

# Push local changes
ceres-sync push -m "Update design tokens"

# Verify repository integrity
ceres-sync verify
```

### Programmatic API

```javascript
const { RainfallContentSyncService } = require('./shared-content/sync-service/dist');

const service = new RainfallContentSyncService({
  ceresRepositoryUrl: 'https://github.com/rainfall-one/ceres.git',
  localContentPath: './shared-content',
  branch: 'main'
});

await service.sync();
```

## Integration with Rainfall Repositories

### JetStream (Vulcan)
- **Role**: Content authority and primary contributor
- **Integration**: Direct npm scripts calling ceres-sync
- **Sync Strategy**: Bidirectional

### Jetty
- **Role**: Content consumer with local customizations
- **Integration**: Build-time sync via npm scripts
- **Sync Strategy**: Pull-only with conflict resolution

### Gyre
- **Role**: Development consumer
- **Integration**: Manual sync control
- **Sync Strategy**: On-demand pull

## Configuration

Each repository should have a `.ceres-sync.json` configuration:

```json
{
  "ceresRepositoryUrl": "https://github.com/rainfall-one/ceres.git",
  "localContentPath": "./shared-content",
  "branch": "main",
  "autoCommit": true,
  "verbose": false
}
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Development watch mode
npm run dev
```

## Architecture

- **RainfallContentSyncService**: Core synchronization logic
- **GitContentService**: Git operations and repository management
- **CLI Tool**: Command-line interface for manual operations
- **Configuration**: Flexible per-repository configuration

This service is the foundation that enables Ceres to serve as the centralized content hub for the entire Rainfall platform ecosystem.

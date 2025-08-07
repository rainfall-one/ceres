# CMS Schema Definitions

This directory contains content type schema definitions for the Apostrophe CMS integration across the Rainfall platform. These schemas are shared between repositories to ensure consistent content management capabilities.

## Schema Structure

Each schema file defines a complete content type with:
- Field definitions and validation
- Content organization groups
- Default/sample content
- Permission configurations
- Workflow settings
- Version control settings

## Available Content Types

### 1. Homepage Content (`homepage-content.json`)
Main platform homepage content including hero sections, navigation, and feature highlights.

### 2. Service Cards (`service-card.json`)
Service cards for platform modules with status indicators and launch capabilities.
- NetMan, HexBoot, SimKick services
- Launch and configuration URLs
- Status indicators and ordering

### 3. Platform Announcements (`platform-announcement.json`)
System-wide announcements for maintenance, updates, and important notices.
- Priority-based display (high, medium, low)
- Scheduling with start/end dates
- Dismissible user notifications

### 4. System Status (`system-status.json`)
Real-time system status indicators and health information.
- Service status monitoring
- Performance metrics (uptime, response time)
- Incident management links

### 5. Branding Content (`branding-content.json`)
Platform branding elements including logos, colors, and messaging.
- Visual identity management
- Brand colors and assets
- Copyright and contact information

## Usage

These schemas are consumed by:
- Apostrophe CMS for content type registration
- JetStream frontend for content rendering
- Other Rainfall platform services for brand consistency

## Integration

Schemas follow the Ceres shared content pattern:
1. Define content structure in this directory
2. Reference from consuming applications
3. Maintain version control for schema evolution
4. Ensure cross-repository synchronization

## Permissions

Each schema includes role-based permissions:
- **content-editor**: Can create and edit content
- **admin**: Full access including deletion
- **brand-manager**: Branding content management
- **system-operator**: System status updates

## Workflow

Content types may include workflow stages:
- **draft**: Content creation and editing
- **review**: Content review process
- **approved**: Published content

Workflow is enabled for critical content types like branding to ensure proper approval processes.

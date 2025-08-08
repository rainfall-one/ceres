# Ceres - Rainfall Shared Content Hub ![Ceres](https://github.com/rainfall-one/ceres/blob/main/ceres.jpeg "Ceres")

**Ceres** is the centralized shared content repository for the Rainfall platform, containing design tokens, component templates, brand assets, and documentation standards that are synchronized across all Rainfall products.

Named after Ceres, the Roman goddess of harvest and agriculture, this repository serves as the content distribution hub for consistent design systems and branding.

## Repository Structure

```
ceres/
├── design-tokens/           # Design system tokens
│   ├── colors.json         # Color palette definitions
│   ├── typography.json     # Font and text styling
│   ├── spacing.json        # Spacing and layout values
│   └── themes.json         # Light/dark theme configurations
├── component-templates/     # Reusable UI component templates
│   ├── card-templates/     # Metric, info, and action cards
│   ├── form-templates/     # Login, settings, search forms
│   ├── layout-templates/   # Dashboard, content, sidebar layouts
│   └── navigation-templates/ # Main nav, breadcrumbs, tabs
├── brand-assets/           # Consistent branding materials
│   ├── logos/              # Logo variants and favicons
│   ├── icons/              # System and product icons
│   ├── fonts/              # Web fonts and font files
│   └── images/             # Hero backgrounds, patterns
└── documentation-standards/ # Documentation templates and guides
    ├── style-guide.md      # Design system documentation
    ├── api-docs-template.md # API documentation template
    └── readme-template.md  # Project README template
```

## Integration with Rainfall Products

### Repository Integration
Each Rainfall repository integrates Ceres as a Git submodule:

```bash
# In vulcan, demeter, hades, etc.
git submodule add https://github.com/rainfall-one/ceres.git shared-content
```

### Content Synchronization
The `RainfallContentSyncService` automatically synchronizes content from Ceres to local CMS instances in each repository.

### Sync Strategies by Repository

- **vulcan (JetStream)**: Bidirectional sync - Can push design system updates
- **demeter (Harvest)**: Pull-only sync - Consumes shared content  
- **hades (NetMan)**: Pull-only sync - Development environment

## Content Categories

### 🎨 Design Tokens
Consistent design values across all Rainfall products:
- **Colors**: Primary, secondary, semantic color palettes
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Margin, padding, gap values  
- **Themes**: Light/dark mode configurations

### 🧩 Component Templates
Reusable UI components with consistent behavior:
- **Cards**: Metric cards, info cards, action cards
- **Forms**: Login, settings, search forms
- **Layouts**: Dashboard, content, sidebar layouts
- **Navigation**: Main nav, breadcrumbs, tab navigation

### 🎯 Brand Assets
Consistent branding materials:
- **Logos**: Main logo variants, favicons
- **Icons**: System icons, product-specific icons
- **Fonts**: Web fonts and font files
- **Images**: Hero backgrounds, patterns, textures

### 📚 Documentation Standards
Consistent documentation across repositories:
- **Style Guides**: Design system documentation
- **Templates**: README, API docs, changelog templates
- **Best Practices**: Contributing guidelines, code standards

## Usage Guidelines

### Design Tokens
```json
// Use semantic names, not direct values
{
  "color": "var(--rainfall-primary-500)",
  "spacing": "var(--rainfall-space-4)"
}
```

### Component Templates
- Follow established patterns for consistency
- Test in both light and dark themes
- Ensure responsive behavior
- Maintain accessibility standards

### Brand Assets
- Use provided logo variants for different contexts
- Maintain consistent icon style and sizing
- Follow font usage guidelines

## Versioning

- **Major versions** (v2.0.0): Breaking changes to design tokens or component APIs
- **Minor versions** (v1.1.0): New components, tokens, or significant additions  
- **Patch versions** (v1.0.1): Bug fixes, small improvements, documentation updates

Current version: `v1.0.0`

## Contributing

### Content Updates

1. **Design Tokens**: Update JSON files in `design-tokens/`
2. **Components**: Add templates to appropriate `component-templates/` subdirectory
3. **Brand Assets**: Add files to `brand-assets/` with appropriate naming
4. **Documentation**: Update or add files in `documentation-standards/`

### Process

1. Create feature branch from `main`
2. Make your changes following established patterns
3. Test across different contexts (light/dark, responsive)
4. Submit Pull Request with detailed description
5. Content team reviews and approves
6. Merge and tag new version if needed

### Review Criteria

- **Consistency**: Aligns with existing design system
- **Accessibility**: Meets WCAG 2.1 AA standards
- **Performance**: Optimized file sizes and formats
- **Documentation**: Clear usage guidelines provided

## Maintenance

- **Content Reviews**: Monthly design system reviews
- **Version Management**: Semantic versioning with Git tags
- **Sync Monitoring**: Automated checks for successful content distribution
- **Documentation**: Keep README and guidelines current

## Support

- **Design System Questions**: design-system@rainfall.one
- **Technical Issues**: https://github.com/rainfall-one/ceres/issues
- **Content Requests**: content-team@rainfall.one

---

Ceres serves as the foundation for consistent, scalable content management across the entire Rainfall platform!

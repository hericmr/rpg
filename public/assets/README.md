# Assets Structure

This directory contains all game assets organized in a structured way:

## Directory Structure

```
src/assets/
├── tilesets/     # Tile sets used for map creation
├── maps/         # Map files (JSON/TMX)
├── sprites/      # Character and entity sprites
└── ui/           # UI elements and icons
```

## Configuration

All asset paths and configurations are managed in `tilesetConfig.ts`. This file contains:

- Tileset configurations (dimensions, spacing, etc.)
- Map file paths
- Sprite file paths
- UI element paths

## Adding New Assets

1. Place the asset in the appropriate directory
2. Update the configuration in `tilesetConfig.ts`
3. The asset will be automatically copied to the build directory during the build process

## Build Process

Assets are automatically copied from `src/assets` to `public/assets` during the build process using the `copyAssets.js` script. 
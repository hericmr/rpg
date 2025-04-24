export const MAP_CONFIG = {
    // Grid dimensions in tiles
    GRID_WIDTH: 20,
    GRID_HEIGHT: 18,
    
    // Tile size in pixels
    TILE_WIDTH: 8,
    TILE_HEIGHT: 8,
    
    // Total map size in pixels (should match game resolution)
    MAP_WIDTH: 20 * 8,  // 160 pixels
    MAP_HEIGHT: 18 * 8, // 144 pixels
} as const;

// Helper functions for grid calculations
export const gridToPixel = (gridX: number, gridY: number) => ({
    x: gridX * MAP_CONFIG.TILE_WIDTH,
    y: gridY * MAP_CONFIG.TILE_HEIGHT
});

export const pixelToGrid = (pixelX: number, pixelY: number) => ({
    x: Math.floor(pixelX / MAP_CONFIG.TILE_WIDTH),
    y: Math.floor(pixelY / MAP_CONFIG.TILE_HEIGHT)
}); 
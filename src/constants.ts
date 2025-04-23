// Constants for the game
export const TILE_SIZE = 16;
export const CHUNK_SIZE = 16;
export const VIEW_DISTANCE = 2;
export const WORLD_HEIGHT = 128;

// Tile types
export enum TileType {
  Air = 0,
  Dirt = 1,
  Grass = 2,
  Stone = 3,
}

// Colors for tile types (more vibrant colors for better visibility)
export const tileColors: Record<TileType, number> = {
  [TileType.Air]: 0x000000,      // Black (transparent)
  [TileType.Dirt]: 0x8B4513,     // Brown
  [TileType.Grass]: 0x00AA00,    // Bright Green
  [TileType.Stone]: 0x777777,    // Light Gray
}; 
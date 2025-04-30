import { BiomeDefinition } from './BiomeGenerator';

// Default biome definitions for different climate types
export const DEFAULT_BIOMES: BiomeDefinition[] = [
  // Plains biome - the default moderate biome with flat terrain
  {
    id: 'plains',
    name: 'Plains',
    minTemperature: -0.2,
    maxTemperature: 0.2,
    minHumidity: -0.2,
    maxHumidity: 0.2,
    heightMultiplier: 1.0,
    heightAddition: 0,
    terrainVariability: 0.2, // Very flat terrain
    peakFrequency: 0.3, // Spread out hills
    surfaceBlock: 'grass', // Grass
    subSurfaceBlock: 'dirt', // Dirt
    subsurfaceDepth: 4,
    stoneBlock: 'stone', // Stone
  },

  // Desert biome - hot and dry with dunes
  {
    id: 'desert',
    name: 'Desert',
    minTemperature: 0.4,
    maxTemperature: 1.0,
    minHumidity: -1.0,
    maxHumidity: -0.2,
    heightMultiplier: 0.8,
    heightAddition: -2, // Slightly lower elevation
    terrainVariability: 0.4, // Some dunes
    peakFrequency: 0.5, // Medium frequency dunes
    surfaceBlock: 'sand', // Sand
    subSurfaceBlock: 'sand', // More sand
    subsurfaceDepth: 6, // Deeper sand layer
    stoneBlock: 'stone', // Normal stone below
  },

  // Forest biome - moderate temperature with higher humidity and rolling hills
  {
    id: 'forest',
    name: 'Forest',
    minTemperature: -0.2,
    maxTemperature: 0.4,
    minHumidity: 0.3,
    maxHumidity: 0.8,
    heightMultiplier: 1.1,
    heightAddition: 1, // Slightly higher elevation
    terrainVariability: 0.5, // Rolling hills
    peakFrequency: 0.4, // Medium frequency hills
    surfaceBlock: 'grass', // Grass
    subSurfaceBlock: 'dirt', // Dirt
    subsurfaceDepth: 5, // Deeper dirt layer for trees
    stoneBlock: 'stone', // Stone
  },

  // Swamp biome - wet and low-lying with flat terrain
  {
    id: 'swamp',
    name: 'Swamp',
    minTemperature: 0.0,
    maxTemperature: 0.5,
    minHumidity: 0.7,
    maxHumidity: 1.0,
    heightMultiplier: 0.6,
    heightAddition: -4, // Much lower elevation
    terrainVariability: 0.1, // Very flat
    peakFrequency: 0.2, // Rare bumps
    surfaceBlock: 'clay', // Clay
    subSurfaceBlock: 'dirt', // Dirt
    subsurfaceDepth: 2,
    stoneBlock: 'stone', // Stone
  },

  // Snowy mountains - cold and high elevation with rugged peaks
  {
    id: 'snowy_mountains',
    name: 'Snowy Mountains',
    minTemperature: -1.0,
    maxTemperature: -0.4,
    minHumidity: 0.3,
    maxHumidity: 1.0,
    heightMultiplier: 1.8,
    heightAddition: 8, // Much higher elevation
    terrainVariability: 0.9, // Very mountainous
    peakFrequency: 0.7, // Frequent peaks
    surfaceBlock: 'snow', // Snow
    subSurfaceBlock: 'dirt', // Dirt
    subsurfaceDepth: 3,
    stoneBlock: 'stone', // Stone
  },

  // Savanna - hot but not as dry as desert
  {
    id: 'savanna',
    name: 'Savanna',
    minTemperature: 0.4,
    maxTemperature: 0.9,
    minHumidity: -0.3,
    maxHumidity: 0.2,
    heightMultiplier: 0.9,
    heightAddition: 2,
    terrainVariability: 0.3, // Moderately varied terrain
    peakFrequency: 0.4, // Medium frequency small hills
    surfaceBlock: 'savanna_grass', // Savanna grass (assumed to be ID 7)
    subSurfaceBlock: 'dirt', // Dirt
    subsurfaceDepth: 2,
    stoneBlock: 'stone', // Stone
  },

  // Badlands - hot and eroded terrain
  {
    id: 'badlands',
    name: 'Badlands',
    minTemperature: 0.6,
    maxTemperature: 1.0,
    minHumidity: -0.6,
    maxHumidity: -0.3,
    heightMultiplier: 1.4,
    heightAddition: 5, // Higher elevation with mesas
    terrainVariability: 0.7, // Highly varied terrain
    peakFrequency: 0.6, // Frequent mesas and cliffs
    surfaceBlock: 'red_sand', // Red sand/clay (assumed to be ID 8)
    subSurfaceBlock: 'terracotta', // Terracotta (assumed to be ID 9)
    subsurfaceDepth: 8, // Deep layers of colored terracotta
    stoneBlock: 'stone', // Stone
  }
];

/**
 * Example of how to initialize biomes for a world
 */
export function initializeDefaultBiomes(biomeGenerator: any): void {
  // Register all default biomes
  for (const biome of DEFAULT_BIOMES) {
    biomeGenerator.registerBiome(biome);
  }
} 
import { WorldGenerator } from './WorldGenerator';
import { BiomeManager } from './BiomeManager';
import { StructureManager } from './StructureManager';

// Biome imports
import { PlainsBiome } from '../biomes/PlainsBiome';
import { DesertBiome } from '../biomes/DesertBiome';
import { ForestBiome } from '../biomes/ForestBiome';
import { SwampBiome } from '../biomes/SwampBiome';
import { OreVein } from '../structures/OreVein';
import { JungleBiome } from '../biomes/JungleBiome';
import { Cave } from '../structures/Cave';

// Structure imports
import Trees from '../structures/Trees';
import Ores from '../structures/Ores';
import Caves from '../structures/Caves';
import { TaigaBiome } from '../biomes/TaigaBiome';
import { SavannaBiome } from '../biomes/SavannaBiome';
import { BadlandsBiome } from '../biomes/BadlandsBiome';
import { MushroomBiome } from '../biomes/MushroomBiome';


/**
 * Sets up a complete world generation system with biomes and structures
 */
export function initializeWorldGeneration(seed: string): {
  worldGenerator: WorldGenerator;
  biomeManager: BiomeManager;
  structureManager: StructureManager;
} {
  // Create the world generator with the seed
  const worldGenerator = new WorldGenerator(seed);

  // Create biome manager and register biomes
  const biomeManager = new BiomeManager(worldGenerator);

  // Register default biomes
  biomeManager.registerBiome(new PlainsBiome());
  biomeManager.registerBiome(new DesertBiome());
  biomeManager.registerBiome(new ForestBiome());
  biomeManager.registerBiome(new SwampBiome());
  biomeManager.registerBiome(new JungleBiome());
  biomeManager.registerBiome(new TaigaBiome());
  biomeManager.registerBiome(new SavannaBiome());
  biomeManager.registerBiome(new BadlandsBiome());
  biomeManager.registerBiome(new MushroomBiome());

  // Set biome manager for height modifications
  worldGenerator.setBiomeManager(biomeManager);

  // Create structure manager and register structures
  const structureManager = new StructureManager(worldGenerator);

  Trees.forEach(tree => structureManager.registerStructure(new tree(biomeManager)));
  Ores.forEach(ore => structureManager.registerStructure(new ore(biomeManager)));
  // Caves.forEach(cave => structureManager.registerStructure(new cave(biomeManager)));

  return {
    worldGenerator,
    biomeManager,
    structureManager
  };
}

/**
 * Generate a chunk of blocks using the modular generation system
 */
export function generateChunk(
  chunkX: number,
  chunkY: number,
  chunkWidth: number,
  chunkHeight: number,
  generators: {
    worldGenerator: WorldGenerator;
    biomeManager: BiomeManager;
    structureManager: StructureManager;
  }
): string[][] {
  const { worldGenerator, biomeManager, structureManager } = generators;

  // Create a 2D array to store the chunk data
  const chunkData: string[][] = Array(chunkHeight).fill(0).map(() => Array(chunkWidth).fill('air'));

  // Function to set a block in the chunk
  const setBlock = (worldX: number, worldY: number, blockId: string) => {
    // Convert world coordinates to chunk coordinates
    const localX = worldX - chunkX * chunkWidth;
    const localY = worldY - chunkY * chunkHeight;

    // Check if the coordinates are within the chunk bounds
    if (localX >= 0 && localX < chunkWidth && localY >= 0 && localY < chunkHeight) {
      chunkData[localY][localX] = blockId;
    }
  };

  // Function to get a block type at specified coordinates
  const getBlock = (worldX: number, worldY: number): string => {
    // Convert world coordinates to chunk coordinates
    const localX = worldX - chunkX * chunkWidth;
    const localY = worldY - chunkY * chunkHeight;

    // Check if the coordinates are within the chunk bounds
    if (localX >= 0 && localX < chunkWidth && localY >= 0 && localY < chunkHeight) {
      return chunkData[localY][localX];
    }

    // For positions outside the chunk, return undefined
    return 'undefined';
  };

  // Clear structure positions cache for this chunk
  structureManager.clearPositionsForChunk(chunkX);

  // Also clear the ore vein cache for this chunk
  OreVein.clearVeinCacheForChunk(chunkX);

  // Clear the cave cache for this chunk
  Cave.clearCaveCacheForChunk(chunkX);

  // First pass: Generate base terrain and biome blocks
  // For each column in the chunk, first calculate the surface height
  const surfaceHeights = new Array(chunkWidth);
  for (let localX = 0; localX < chunkWidth; localX++) {
    const worldX = chunkX * chunkWidth + localX;
    surfaceHeights[localX] = Math.floor(worldGenerator.getHeightAt(worldX));
  }

  // Now generate the blocks for the whole chunk
  for (let localX = 0; localX < chunkWidth; localX++) {
    const worldX = chunkX * chunkWidth + localX;

    // Get height at this position
    const heightAtX = surfaceHeights[localX];

    // Get the biome at this x-coordinate
    const biome = biomeManager.getBiomeAt(worldX, 0);

    for (let localY = 0; localY < chunkHeight; localY++) {
      const worldY = chunkY * chunkHeight + localY;

      // Get biome-specific block at this position
      const blockId = biomeManager.getBlockAt(worldX, worldY, heightAtX);
      chunkData[localY][localX] = blockId;
    }
  }

  // Second pass: Generate caves (before ores to allow ores to replace cave walls)
  // Use a different check interval for caves to create larger formations
  const CAVE_CHECK_INTERVAL = 8; // Increased interval for less frequent caves

  for (let localX = 0; localX < chunkWidth; localX += CAVE_CHECK_INTERVAL) {
    // Offset the y checks to create a more natural pattern
    const yOffset = Math.floor(worldGenerator.createNoiseFunction('cave_offset', 0.3)(chunkX * chunkWidth + localX, 0) * 8);

    for (let localY = (yOffset % CAVE_CHECK_INTERVAL); localY < chunkHeight; localY += CAVE_CHECK_INTERVAL) {
      // Add significant position variation to avoid grid-like cave patterns
      const jitterX = Math.floor(worldGenerator.createNoiseFunction('cave_jitter_x', 0.5)(localX, localY) * 5) - 2;
      const jitterY = Math.floor(worldGenerator.createNoiseFunction('cave_jitter_y', 0.5)(localX, localY) * 5) - 2;

      const worldX = chunkX * chunkWidth + localX + jitterX;
      const worldY = chunkY * chunkHeight + localY + jitterY;

      // Get the biome at this position
      const biome = biomeManager.getBiomeAt(worldX, 0);

      // Random chance to skip this point altogether, making caves more sparse
      if (Math.random() < 0.6) continue;

      // Check if a cave should be generated here
      const cave = structureManager.getCaveAt(worldX, worldY, biome.id);
      if (cave) {
        structureManager.generateStructureAt(worldX, worldY, cave, setBlock, getBlock);
      }
    }
  }

  // Third pass: Generate ores
  // Check for ore generation with a more natural, randomized pattern
  const ORE_CHECK_INTERVAL = 2; // Reduced for more samples

  // Add variation to interval to break up the grid pattern
  for (let localX = 0; localX < chunkWidth; localX += ORE_CHECK_INTERVAL) {
    // Use noise to add variation to the y-interval to break the grid pattern
    const yNoiseOffset = Math.floor(worldGenerator.createNoiseFunction('ore_grid', 0.3)(chunkX * chunkWidth + localX, 0) * ORE_CHECK_INTERVAL);

    for (let localY = yNoiseOffset % ORE_CHECK_INTERVAL; localY < chunkHeight; localY += ORE_CHECK_INTERVAL) {
      // Add slight position jitter based on noise to break the grid pattern
      const jitterX = Math.floor(worldGenerator.createNoiseFunction('ore_jitter_x', 0.8)(localX, localY) * 3) - 1;
      const jitterY = Math.floor(worldGenerator.createNoiseFunction('ore_jitter_y', 0.8)(localX, localY) * 3) - 1;

      const worldX = chunkX * chunkWidth + localX + jitterX;
      const worldY = chunkY * chunkHeight + localY + jitterY;

      // Get the biome at this position
      const biome = biomeManager.getBiomeAt(worldX, 0);

      // Check if an ore should be generated here
      const ore = structureManager.getOreAt(worldX, worldY, biome.id);
      if (ore) {
        structureManager.generateStructureAt(worldX, worldY, ore, setBlock, getBlock);
      }
    }
  }

  // Fourth pass: Generate surface structures
  // Only check for structures at fixed intervals for efficiency
  const STRUCTURE_CHECK_INTERVAL = 3; // Increased interval for more spaced-out structures

  for (let localX = 0; localX < chunkWidth; localX += STRUCTURE_CHECK_INTERVAL) {
    // Add a bit of randomness to the spacing to avoid grid-like patterns
    const offsetX = Math.floor(Math.sin(localX * 0.7) * 2);
    const adjustedLocalX = (localX + offsetX + chunkWidth) % chunkWidth;

    const worldX = chunkX * chunkWidth + adjustedLocalX;

    // Get the biome at this position
    const biome = biomeManager.getBiomeAt(worldX, 0);

    // Use the pre-calculated surface height
    const structureY = surfaceHeights[adjustedLocalX];

    // Get the block at surface to ensure it's a valid placement
    const surfaceBlock = biomeManager.getBlockAt(worldX, structureY, structureY);

    // Check for valid surface placement using biome's isValidStructureBlock method
    // This allows each biome to specify its own valid foundation blocks for structures
    const isValidSurface = biome.isValidStructureBlock(surfaceBlock);

    // Check if a structure should be generated here
    if (isValidSurface) {
      const structure = structureManager.getStructureAt(worldX, structureY, biome.id);
      if (structure) {
        // Place the structure in the world
        structureManager.generateStructureAt(worldX, structureY, structure, setBlock, getBlock);
      }
    }
  }

  return chunkData;
} 
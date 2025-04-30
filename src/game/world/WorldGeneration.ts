import { WorldGenerator } from './WorldGenerator';
import { BiomeGenerator } from './BiomeGenerator';
import { StructureGenerator } from './StructureGenerator';
import { initializeDefaultBiomes } from './DefaultBiomes';
import { initializeDefaultStructures } from './DefaultStructures';
import { registerBlockRules } from './BlockRules';

/**
 * Sets up a complete world generation system
 */
export function initializeWorldGeneration(seed: string): {
  worldGenerator: WorldGenerator;
  biomeGenerator: BiomeGenerator;
  structureGenerator: StructureGenerator;
} {
  // Create the world generator with the seed
  const worldGenerator = new WorldGenerator(seed);

  // World height constants for ore distribution calculation
  const WORLD_HEIGHT = 256;
  const WORLD_BOTTOM = -120;

  // Register ore types using Minecraft-like triangular distribution pattern
  // Scaled to fit our world height while maintaining proportional distribution

  // Coal: Distributed from sea level to close to world bottom
  worldGenerator.registerOre({
    id: 'coal_ore', // Coal ore
    minVeinSize: 5,
    maxVeinSize: 12,
    rarity: 0.5,    // Reduced rarity to make it less common
    minY: -100,     // Much deeper, closer to world bottom
    maxY: 100       // Up to moderate height
    // Triangular distribution with peak around Y 30
  });

  // Iron: Widely distributed underground, scaled to our world dimensions
  worldGenerator.registerOre({
    id: 'iron_ore', // Iron ore
    minVeinSize: 4,
    maxVeinSize: 9,
    rarity: 0.4,    // Reduced rarity
    minY: -110,     // Close to world bottom
    maxY: 50        // Moderate height
    // Triangular distribution with peak around Y -20
  });

  // Gold: Found in deeper layers
  worldGenerator.registerOre({
    id: 'gold_ore', // Gold ore
    minVeinSize: 3,
    maxVeinSize: 7,
    rarity: 0.3,    // Reduced rarity to make it less common
    minY: -115,     // Very deep, near world bottom
    maxY: 0         // Only underground
    // Triangular distribution with peak near -60
  });

  // Diamond: Rare and deep, found mainly near bedrock
  worldGenerator.registerOre({
    id: 'diamond_ore', // Diamond ore
    minVeinSize: 2,
    maxVeinSize: 5,
    rarity: 0.25,   // Very rare
    minY: -120,     // At bedrock level
    maxY: -20       // Deep underground only
    // Triangular distribution with peak near bedrock
  });

  // Emerald: Extremely rare, found in isolated single blocks
  worldGenerator.registerOre({
    id: 'emerald_ore', // Emerald ore
    minVeinSize: 1, // Often single blocks
    maxVeinSize: 3, // Rarely in small veins
    rarity: 0.15,   // Extremely rare
    minY: -80,      // Deep underground
    maxY: 80        // Wide range but very rare
    // Primarily in mountain biomes
  });

  // Create and initialize the biome generator
  const biomeGenerator = new BiomeGenerator(worldGenerator);

  // Register the biome generator with the world generator for height modifications
  worldGenerator.setBiomeGenerator(biomeGenerator);

  // Initialize default biomes
  initializeDefaultBiomes(biomeGenerator);

  // Register custom block generation rules
  registerBlockRules(worldGenerator);

  // Create and initialize the structure generator
  const structureGenerator = new StructureGenerator(worldGenerator);

  // Initialize default structures
  initializeDefaultStructures(structureGenerator);

  return {
    worldGenerator,
    biomeGenerator,
    structureGenerator
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
    biomeGenerator: BiomeGenerator;
    structureGenerator: StructureGenerator;
  }
): string[][] {
  const { worldGenerator, biomeGenerator, structureGenerator } = generators;

  // Debug check for structureGenerator's structures
  if (!structureGenerator || typeof structureGenerator.getStructureAt !== 'function') {
    console.error("Invalid structure generator in generateChunk.");
  }

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

  // Debug variables for ore counting
  let oreCount = {
    coal: 0,
    iron: 0,
    gold: 0,
    diamond: 0,
    emerald: 0
  };

  // First pass: Generate terrain and biomes
  for (let localX = 0; localX < chunkWidth; localX++) {
    const worldX = chunkX * chunkWidth + localX;

    // Get the biome at this x-coordinate (biomes span vertically)
    const biome = biomeGenerator.getBiomeAt(worldX, 0);

    for (let localY = 0; localY < chunkHeight; localY++) {
      // Convert local coordinates to world coordinates
      const worldY = chunkY * chunkHeight + localY;

      // Get the tile type at this position
      const blockId = worldGenerator.getTile(worldX, worldY);

      // Count ore types for debugging
      if (blockId === 'coal_ore') oreCount.coal++;
      else if (blockId === 'iron_ore') oreCount.iron++;
      else if (blockId === 'gold_ore') oreCount.gold++;
      else if (blockId === 'diamond_ore') oreCount.diamond++;
      else if (blockId === 'emerald_ore') oreCount.emerald++;

      chunkData[localY][localX] = blockId;
    }
  }

  // Occasionally log ore generation stats for debugging
  // @ts-ignore
  generateChunk.chunkCount = (generateChunk.chunkCount || 0) + 1;
  // @ts-ignore
  const shouldLogOres = generateChunk.chunkCount % 10 === 0;

  if (shouldLogOres) {
    const totalOres = Object.values(oreCount).reduce((sum, count) => sum + count, 0);
    if (totalOres > 0) {
      console.log(`Chunk (${chunkX}, ${chunkY}) ore stats: Coal: ${oreCount.coal}, Iron: ${oreCount.iron}, Gold: ${oreCount.gold}, Diamond: ${oreCount.diamond}, Emerald: ${oreCount.emerald}`);
    }
  }

  // Second pass: Generate structures - but with improved efficiency
  // Clear structure positions for this chunk to avoid interference
  structureGenerator.clearPositionsForChunk(chunkX);

  // Add a static variable for tracking structure generation attempts across all chunks
  // @ts-ignore
  generateChunk.structureAttempts = (generateChunk.structureAttempts || 0) + 1;

  // Only log structure debug info occasionally to avoid spamming
  // @ts-ignore
  const shouldLog = generateChunk.structureAttempts % 50 === 0;

  let structuresPlaced = 0;
  let structuresChecked = 0;

  // Only check for structures at fixed intervals
  // This makes structure generation much more efficient while still providing good coverage
  const STRUCTURE_CHECK_INTERVAL = 2; // Reduced from 4 to 2 for denser structure placement

  for (let localX = 0; localX < chunkWidth; localX += STRUCTURE_CHECK_INTERVAL) {
    try {
      // Convert local X to world X
      const worldX = chunkX * chunkWidth + localX;

      // Add a bit of randomness to the check to avoid grid-like patterns
      // while maintaining determinism based on chunk coords
      if ((worldX + chunkX) % 2 === 0) {
        continue;
      }

      structuresChecked++;

      // Get the biome at this position
      const biome = biomeGenerator.getBiomeAt(worldX, 0);

      // Check if a structure should be generated here
      const heightAtX = worldGenerator.getHeightAt(worldX);

      // Skip if height is NaN
      if (isNaN(heightAtX)) {
        continue;
      }

      // Calculate actual integer height of the ground surface
      const structureY = Math.floor(heightAtX);

      // Convert the structure Y coordinate to local Y
      const localStructureY = structureY - chunkY * chunkHeight;

      // Only consider structures that start within this chunk's Y range
      if (localStructureY >= 0 && localStructureY < chunkHeight) {
        // Verify this is actually a surface block (e.g., has air above it)
        const isSurfaceBlock = localStructureY + 1 < chunkHeight &&
          chunkData[localStructureY][localX] !== 'air' &&
          (localStructureY + 1 >= chunkHeight || chunkData[localStructureY + 1][localX] === 'air');

        if (!isSurfaceBlock) {
          continue;
        }

        // Check if we're too close to chunk boundaries to avoid cut-off structures
        // Assume max structure width is 5 blocks (per tree definition)
        const SAFETY_MARGIN = 3;
        if (localX < SAFETY_MARGIN || localX >= chunkWidth - SAFETY_MARGIN) {
          continue;
        }

        // Skip if the structure won't fit in the vertical space of the chunk
        // Average tree height is 7-9 blocks
        const MIN_VERTICAL_SPACE = 10;
        if (localStructureY + MIN_VERTICAL_SPACE > chunkHeight) {
          continue;
        }

        const structure = structureGenerator.getStructureAt(
          worldX,
          structureY,
          biome.id
        );

        if (structure) {
          // Place the structure in the world
          structureGenerator.placeStructure(worldX, structureY, structure, setBlock);
          structuresPlaced++;
        }
      }
    } catch (error) {
      console.error(`Error during structure generation in chunk (${chunkX}, ${chunkY}) at localX=${localX}:`, error);
    }
  }

  // Only log occasionally to reduce console spam
  if (shouldLog) {
    console.log(`Chunk (${chunkX}, ${chunkY}): Checked ${structuresChecked} positions, placed ${structuresPlaced} structures`);
  }

  return chunkData;
} 
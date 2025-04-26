import { WorldGenerator, BlockGenerationRule } from './WorldGenerator';

/**
 * Registers custom blocks with specific generation rules
 */
export function registerBlockRules(worldGenerator: WorldGenerator): void {
  // Beach sand block
  worldGenerator.registerGenerationRule({
    id: 4, // Sand
    name: 'sand_beach',
    priority: 85, // Higher than dirt but lower than grass
    condition: (x, y, generator) => {
      const height = generator.getHeightAt(x);
      // Beach sand near water level
      return y <= Math.floor(height) && y >= -5 && y <= 5;
    }
  });

  // Snow-capped mountain tops
  worldGenerator.registerGenerationRule({
    id: 5, // Snow
    name: 'snow',
    priority: 95, // Higher priority than grass so it replaces it
    condition: (x, y, generator) => {
      const height = generator.getHeightAt(x);
      // Only on surface and when the height is greater than 15
      return y === Math.floor(height) && height > 15;
    }
  });

  // Cave system using additional noise functions
  const caveNoise = worldGenerator.createNoiseFunction('caves', 0.05);
  worldGenerator.registerGenerationRule({
    id: 0, // Air for caves
    name: 'caves',
    priority: 50, // Lower than dirt patches but higher than stone
    condition: (x, y, generator) => {
      const height = generator.getHeightAt(x);
      // Only generate caves underground
      if (y >= Math.floor(height) - 5) {
        return false;
      }
      
      // Use 3D-like noise to create cave systems
      const noiseValue = caveNoise(x, y);
      return noiseValue > 0.5; // Adjust threshold to control cave size
    }
  });

  // Clay in swampy areas - Updated to be more specific to swamp biome
  const biomeNoise = worldGenerator.createNoiseFunction('biomes', 0.02);
  worldGenerator.registerGenerationRule({
    id: 6, // Clay
    name: 'clay',
    priority: 75, // Between ores and dirt patches
    condition: (x, y, generator) => {
      // Only near water level in swampy biomes
      const height = generator.getHeightAt(x);
      if (y > Math.floor(height) - 8 && y < Math.floor(height)) {
        // Check if we're in a swampy biome using the biome noise
        // This is a simplified way to approximate the swamp biome distribution
        const biomeValue = biomeNoise(x, 0);
        // Swamps are high humidity (positive values in this case)
        return biomeValue > 0.5; 
      }
      return false;
    }
  });

  // Badlands specific blocks - red sand and terracotta distribution
  const badlandsNoise = worldGenerator.createNoiseFunction('badlands', 0.03);
  worldGenerator.registerGenerationRule({
    id: 8, // Red sand
    name: 'red_sand',
    priority: 87, // Higher than regular sand
    condition: (x, y, generator) => {
      const height = generator.getHeightAt(x);
      // Only on surface of badlands biome
      if (y === Math.floor(height)) {
        const biomeValue = badlandsNoise(x, 0);
        // Badlands are hot and dry (high temperature, low humidity)
        return biomeValue > 0.6;
      }
      return false;
    }
  });

  // Savanna specific blocks - different grass type
  const savannaNoise = worldGenerator.createNoiseFunction('savanna', 0.03);
  worldGenerator.registerGenerationRule({
    id: 7, // Savanna grass
    name: 'savanna_grass',
    priority: 86, // Higher than beach sand
    condition: (x, y, generator) => {
      const height = generator.getHeightAt(x);
      // Only on surface of savanna biome
      if (y === Math.floor(height)) {
        const biomeValue = savannaNoise(x, 0);
        // Savanna is hot but moderately humid
        return biomeValue > 0.4 && biomeValue < 0.6;
      }
      return false;
    }
  });

  // Bedrock at the bottom of the world
  worldGenerator.registerGenerationRule({
    id: 30, // Bedrock
    name: 'bedrock',
    priority: 98, // Very high priority to ensure it's at the bottom
    condition: (x, y, generator) => {
      // Create a solid bedrock layer at the bottom of the world
      return y <= -120;
    }
  });

  // Note: Ore generation is now handled in WorldGeneration.ts to avoid duplication
} 
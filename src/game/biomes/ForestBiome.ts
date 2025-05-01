import { BaseBiome, BiomeLayer } from './BaseBiome';

export class ForestBiome extends BaseBiome {
  constructor() {
    // Define forest-specific layers with custom noise-based generation
    const layers: BiomeLayer[] = [
      // Surface layer (grass with occasional flowers, ferns, and mushrooms)
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise functions for forest surface features
          const forestFloorNoise = getNoise('forest_floor', 0.2);

          // Get noise value at this position
          const featureValue = forestFloorNoise(x, y);

          // Various forest floor decorations
          if (featureValue > 0.9) {
            // Different features based on secondary noise
            const featureTypeNoise = forestFloorNoise(x + 500, y + 500);

            if (featureTypeNoise < 0.25) {
              return 'red_mushroom'; // Rare red mushroom
            } else if (featureTypeNoise < 0.5) {
              return 'brown_mushroom'; // Brown mushroom
            } else if (featureTypeNoise < 0.75) {
              return 'fern'; // Fern
            } else {
              // Different flower types
              const flowerType = Math.floor(forestFloorNoise(x + 1000, y + 1000) * 4);
              switch (flowerType) {
                case 0: return 'blue_orchid';
                case 1: return 'poppy';
                case 2: return 'dandelion';
                default: return 'lily_of_the_valley';
              }
            }
          } else if (featureValue > 0.7) {
            return 'tall_grass'; // Common tall grass
          }

          // Default forest floor
          return 'grass';
        }
      },

      // Forest soil layer (rich with roots, occasional clay, coarse dirt)
      {
        name: 'forest_soil',
        minDepth: 1,
        maxDepth: 5,
        getBlock: (x, y, depth, getNoise) => {
          // Forest soil has more variations due to tree roots and organic material
          const soilVariationNoise = getNoise('soil_variation', 0.05);
          const rootsNoise = getNoise('tree_roots', 0.1);

          // Combined noise for soil variation
          const noiseValue = soilVariationNoise(x, y + depth * 10);
          const rootsValue = rootsNoise(x, y);

          // Tree roots appear occasionally in upper soil layers
          if (depth < 3 && rootsValue > 0.85) {
            return 'rooted_dirt';
          }

          // Other soil variations
          if (noiseValue > 0.8) {
            return 'clay'; // Clay patches from forest moisture
          } else if (noiseValue < 0.2) {
            return 'coarse_dirt'; // Coarse dirt patches
          } else if (noiseValue > 0.6 && noiseValue < 0.7) {
            return 'podzol'; // Podzol patches (decomposed organic matter)
          }

          // Regular dirt
          return 'dirt';
        }
      },

      // Stone layer with forest-specific features
      {
        name: 'deep',
        minDepth: 5,
        maxDepth: undefined, // Extends to infinity
        getBlock: (x, y, depth, getNoise) => {
          // Forest-specific underground variations
          const stoneVariationNoise = getNoise('stone_variation', 0.03);
          const mossNoise = getNoise('moss_patches', 0.08);

          // Get noise values
          const noiseValue = stoneVariationNoise(x, y);
          const mossValue = mossNoise(x, y);

          // Depth-dependent features
          if (depth < 15 && mossValue > 0.85) {
            return 'mossy_cobblestone'; // Near-surface mossy stones
          }

          // Regular stone variations
          if (depth > 30) {
            if (noiseValue > 0.85) {
              return 'andesite'; // Andesite patches
            } else if (noiseValue < 0.15) {
              return 'granite'; // Granite patches
            }
          }

          // Bedrock at the very bottom
          if (depth > 60 && stoneVariationNoise(x, y + 500) > 0.9) {
            return 'bedrock';
          }

          // Default stone
          return 'stone';
        }
      }
    ];

    super({
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
      layers: layers,
      validStructureBlocks: ['grass', 'dirt', 'podzol', 'coarse_dirt'], // Valid blocks for structure placement in forest
      rarity: 0.4 // Relatively common
    });
  }

  /**
   * Override modifyHeight to create irregular forest terrain with occasional clearings
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    // Add forest-specific terrain patterns if noise generation is available
    try {
      // Forest terrain has both hills and occasional small clearings
      const hillNoise = this.getNoise('forest_hills', 0.02);
      const smallHillNoise = this.getNoise('small_hills', 0.05);
      const clearingNoise = this.getNoise('forest_clearings', 0.01);

      // Calculate clearing influence (occasional flat areas)
      const clearingValue = clearingNoise(x, 0);
      const isInClearing = clearingValue > 0.7; // Occasional forest clearings

      if (isInClearing) {
        // Clearings are flatter (less height variation)
        return standardHeight * 0.7;
      } else {
        // Outside clearings, add more pronounced hills
        const hillFactor = hillNoise(x, 0) * 3 + smallHillNoise(x, 0) * 2;
        return standardHeight + hillFactor;
      }
    } catch (e) {
      // If noise generator isn't set yet, just return standard height
      return standardHeight;
    }
  }
} 
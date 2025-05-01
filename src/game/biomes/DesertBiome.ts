import { BaseBiome, BiomeLayer } from './BaseBiome';

export class DesertBiome extends BaseBiome {
  constructor() {
    // Define desert-specific layers with custom noise-based generation
    const layers: BiomeLayer[] = [
      // Surface sand layer with dunes and occasional dead bushes
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise functions for desert surface features
          const colorVariationNoise = getNoise('sand_color', 0.05);
          const colorValue = colorVariationNoise(x, y);

          // Different sand colors based on position (subtle variations)
          if (colorValue > 0.7) {
            return 'red_sand'; // Occasional red sand patches
          }

          // Default desert surface block
          return 'sand';
        }
      },

      // Deeper sand layer (more consistent)
      {
        name: 'sand_layer',
        minDepth: 1,
        maxDepth: 6,
        getBlock: (x, y, depth, getNoise) => {
          // Different noise pattern for sub-surface variations
          const sandVariationNoise = getNoise('sand_variation', 0.03);

          // More consistent sand deeper down, but occasional sandstone or hardened sand
          const noiseValue = sandVariationNoise(x, y + depth);

          // Deeper down, more likely to find sandstone
          const depthFactor = depth / 6; // 0.17 to 1.0
          if (noiseValue > 0.9 - (depthFactor * 0.3)) {
            return 'sandstone';
          }

          // Regular sand
          return 'sand';
        }
      },

      // Sandstone transition layer
      {
        name: 'sandstone_layer',
        minDepth: 6,
        maxDepth: 10,
        getBlock: (x, y, depth, getNoise) => {
          const stoneTransitionNoise = getNoise('stone_transition', 0.08);
          const noiseValue = stoneTransitionNoise(x, y);

          // Gradually transition from sandstone to stone
          const depthFactor = (depth - 6) / 4; // 0 to 1.0

          if (depthFactor + noiseValue > 1.1) {
            return 'stone';
          }

          return 'sandstone';
        }
      },

      // Deep stone layer
      {
        name: 'deep',
        minDepth: 10,
        maxDepth: undefined, // Extends to infinity
        getBlock: (x, y, depth, getNoise) => {
          // Desert-specific stone variations
          const stoneVariationNoise = getNoise('stone_variation', 0.04);
          const noiseValue = stoneVariationNoise(x, y);

          // Occasional terracotta in deeper layers (distinctive feature of desert biomes)
          if (depth > 20 && noiseValue > 0.8) {
            // Use different noise values to determine terracotta color
            const colorNoise = getNoise('terracotta_color', 0.02)(x, y + 1000);
            const colorIndex = Math.floor(colorNoise * 6);

            // Different terracotta colors
            switch (colorIndex) {
              case 0: return 'terracotta';
              case 1: return 'orange_terracotta';
              case 2: return 'yellow_terracotta';
              case 3: return 'brown_terracotta';
              case 4: return 'red_terracotta';
              default: return 'white_terracotta';
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
      layers: layers,
      validStructureBlocks: ['sand', 'red_sand', 'sandstone'], // Valid blocks for structure placement in desert
      rarity: 0.5 // Medium rarity
    });
  }

  /**
   * Override modifyHeight to create distinctive desert dunes
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    // Add desert-specific dune patterns if we have noise generation
    try {
      // Use different frequency noise functions for varied dune patterns
      const largeDuneNoise = this.getNoise('large_dunes', 0.007);
      const mediumDuneNoise = this.getNoise('medium_dunes', 0.02);
      const smallDuneNoise = this.getNoise('small_dunes', 0.05);

      // Combine noise patterns with different weights to create realistic dunes
      const dunePattern =
        largeDuneNoise(x, 0) * 6 +    // Large sweeping dunes
        mediumDuneNoise(x, 0) * 3 +   // Medium sized dunes
        smallDuneNoise(x, 0) * 1;     // Small ripples

      // Add dune pattern to standard height
      return standardHeight + dunePattern;
    } catch (e) {
      // If noise generation isn't set up yet, return standard height
      return standardHeight;
    }
  }
} 
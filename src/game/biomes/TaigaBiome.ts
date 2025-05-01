import { BaseBiome, BiomeLayer } from './BaseBiome';

export class TaigaBiome extends BaseBiome {
  constructor() {
    // Define taiga-specific layers with custom noise-based generation
    const layers: BiomeLayer[] = [
      // Surface layer with snow, podzol and occasional berry bushes
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise functions for taiga surface features
          const surfaceNoise = getNoise('taiga_surface', 0.1);
          const featureNoise = getNoise('taiga_features', 0.15);
          const snowNoise = getNoise('taiga_snow', 0.12);

          // Get noise values
          const surfaceValue = surfaceNoise(x, y);
          const featureValue = featureNoise(x, y);
          const snowValue = snowNoise(x, y);

          // Snow patches on higher elevations
          if (surfaceValue > 0.7 || snowValue > 0.8) {
            return 'snow';
          }

          // Special features
          if (featureValue > 0.85) {
            const featureType = Math.floor(featureNoise(x + 500, y + 500) * 5);
            switch (featureType) {
              case 0: return 'sweet_berry_bush';
              case 1: return 'fern';
              case 2: return 'dead_bush';
              case 3: return 'spruce_sapling';
              default: return 'podzol';
            }
          }

          // Default surface blocks
          if (surfaceValue < 0.3) {
            return 'podzol';
          }

          return 'grass';
        }
      },

      // Dirt and permafrost layer
      {
        name: 'dirt_layer',
        minDepth: 1,
        maxDepth: 4,
        getBlock: (x, y, depth, getNoise) => {
          const soilNoise = getNoise('taiga_soil', 0.08);
          const value = soilNoise(x, y + depth);

          // Occasionally permafrost in deeper layers
          if (depth > 2 && value > 0.75) {
            return 'permafrost';
          }

          // Sometimes coarse dirt
          if (value < 0.2) {
            return 'coarse_dirt';
          }

          // Occasionally packed ice patches
          if (value > 0.6 && value < 0.7) {
            return 'packed_ice';
          }

          return 'dirt';
        }
      },

      // Transition layer with more stone
      {
        name: 'transition',
        minDepth: 4,
        maxDepth: 8,
        getBlock: (x, y, depth, getNoise) => {
          const stoneNoise = getNoise('taiga_stone_transition', 0.06);
          const value = stoneNoise(x, y);

          // More stone as we go deeper
          const depthFactor = (depth - 4) / 4; // 0 to 1

          if (value < depthFactor * 0.8) {
            return 'stone';
          }

          // Sometimes granite in this biome
          if (value > 0.8) {
            return 'granite';
          }

          // Sometimes diorite
          if (value > 0.65 && value < 0.75) {
            return 'diorite';
          }

          return 'dirt';
        }
      },

      // Deep layer with various stone types
      {
        name: 'deep',
        minDepth: 8,
        maxDepth: undefined,
        getBlock: (x, y, depth, getNoise) => {
          const deepNoise = getNoise('taiga_deep', 0.04);
          const stoneTypeNoise = getNoise('taiga_stone_types', 0.07);

          const deepValue = deepNoise(x, y + depth * 0.5);
          const stoneValue = stoneTypeNoise(x, y);

          // Special stone types
          if (depth > 15) {
            if (deepValue > 0.85) {
              return 'andesite';
            }

            if (deepValue > 0.7 && deepValue < 0.8) {
              // Ice caves in the deep
              if (stoneValue > 0.9) {
                return 'blue_ice';
              }
              return 'packed_ice';
            }

            if (stoneValue > 0.85 && stoneValue < 0.95) {
              // Mossy stone in some cave areas
              return 'mossy_cobblestone';
            }
          }

          // Bedrock at very deep levels
          if (depth > 60 && deepNoise(x, y + 500) > 0.9) {
            return 'bedrock';
          }

          return 'stone';
        }
      }
    ];

    super({
      id: 'taiga',
      name: 'Taiga',
      minTemperature: -0.8,
      maxTemperature: -0.2,
      minHumidity: 0.0,
      maxHumidity: 0.6,
      heightMultiplier: 1.1,
      heightAddition: 4, // Higher elevation for taiga forests
      terrainVariability: 0.4, // Moderate terrain variation
      peakFrequency: 0.4, // Somewhat frequent hills
      layers: layers,
      validStructureBlocks: ['grass', 'podzol', 'snow', 'dirt'], // Valid blocks for structure placement
      rarity: 0.5 // Medium rarity
    });
  }

  /**
   * Override modifyHeight to create rolling hills with some occasional mountains
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    try {
      // Use different noise functions for terrain variation
      const hillNoise = this.getNoise('taiga_hills', 0.015);
      const smallHillNoise = this.getNoise('taiga_small_hills', 0.04);
      const roughnessNoise = this.getNoise('taiga_roughness', 0.08);

      // Combine noise patterns for natural-looking terrain
      const terrainModifier =
        hillNoise(x, 0) * 5 +         // Larger hills
        smallHillNoise(x, 0) * 2 +    // Small hills
        roughnessNoise(x, 0) * 0.5;   // Subtle roughness

      return standardHeight + terrainModifier;
    } catch (e) {
      // If noise generation isn't set up yet, return standard height
      return standardHeight;
    }
  }
} 
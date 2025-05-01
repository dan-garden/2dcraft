import { BaseBiome, BiomeLayer } from './BaseBiome';

export class JungleBiome extends BaseBiome {
  constructor() {
    // Define jungle-specific layers with custom noise-based generation
    const layers: BiomeLayer[] = [
      // Surface layer (dense vegetation with vines, flowers, and various plants)
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise functions for jungle surface features
          const jungleFloorNoise = getNoise('jungle_floor', 0.15);
          const vegetationNoise = getNoise('vegetation', 0.2);

          // Get noise values at this position
          const featureValue = jungleFloorNoise(x, y);
          const vegetationValue = vegetationNoise(x, y);

          // Dense jungle vegetation and features
          if (featureValue > 0.8) {
            // Different features based on secondary noise
            const featureTypeNoise = jungleFloorNoise(x + 600, y + 600);

            if (featureTypeNoise < 0.2) {
              return 'melon'; // Occasional melons
            } else if (featureTypeNoise < 0.4) {
              return 'cocoa_bean'; // Cocoa beans (usually on trees, but can be found on ground)
            } else if (featureTypeNoise < 0.6) {
              return 'fern'; // Ferns common in jungle
            } else if (featureTypeNoise < 0.8) {
              return 'vine'; // Hanging vines
            } else {
              // Various tropical flowers
              const flowerType = Math.floor(jungleFloorNoise(x + 1000, y + 1000) * 3);
              switch (flowerType) {
                case 0: return 'allium';
                case 1: return 'blue_orchid';
                default: return 'jungle_flower'; // Generic jungle flower
              }
            }
          } else if (vegetationValue > 0.7) {
            // Common jungle undergrowth
            const undergrowthType = Math.floor(vegetationNoise(x + 800, y + 800) * 3);
            switch (undergrowthType) {
              case 0: return 'bamboo';
              case 1: return 'jungle_leaves'; // Fallen leaves
              default: return 'grass'; // Tall grass
            }
          }

          // Default jungle floor
          return 'grass';
        }
      },

      // Rich jungle soil layer (moist with high organic content)
      {
        name: 'jungle_soil',
        minDepth: 1,
        maxDepth: 5,
        getBlock: (x, y, depth, getNoise) => {
          // Jungle soil has high organic content and moisture
          const soilVariationNoise = getNoise('soil_variation', 0.04);
          const rootsNoise = getNoise('tree_roots', 0.08);

          // Combined noise for soil variation
          const noiseValue = soilVariationNoise(x, y + depth * 8);
          const rootsValue = rootsNoise(x, y);

          // Dense tree root network in jungle soil
          if (depth < 3 && rootsValue > 0.75) {
            return 'rooted_dirt';
          }

          // Other soil variations
          if (noiseValue > 0.8) {
            return 'clay'; // Clay from heavy rainfall
          } else if (noiseValue < 0.15) {
            return 'mud'; // Mud patches from constant moisture
          } else if (noiseValue > 0.65 && noiseValue < 0.75) {
            return 'podzol'; // Podzol from organic decomposition
          }

          // Regular dirt
          return 'dirt';
        }
      },

      // Stone layer with jungle-specific features
      {
        name: 'deep',
        minDepth: 5,
        maxDepth: undefined, // Extends to infinity
        getBlock: (x, y, depth, getNoise) => {
          // Jungle-specific underground features
          const stoneVariationNoise = getNoise('stone_variation', 0.03);
          const mossNoise = getNoise('moss_patches', 0.07);
          const limestoneNoise = getNoise('limestone', 0.05);

          // Get noise values
          const noiseValue = stoneVariationNoise(x, y);
          const mossValue = mossNoise(x, y);
          const limestoneValue = limestoneNoise(x, y);

          // Mossy features common in jungles due to moisture
          if (depth < 15 && mossValue > 0.8) {
            return 'mossy_cobblestone';
          }

          // Limestone/dripstone caves are common in jungle regions
          if (depth > 25 && limestoneValue > 0.85) {
            // Different limestone/calcium formations
            const formationType = Math.floor(limestoneValue * 10) % 3;
            switch (formationType) {
              case 0: return 'dripstone';
              case 1: return 'calcite';
              default: return 'tuff';
            }
          }

          // Regular stone variations
          if (depth > 20) {
            if (noiseValue > 0.88) {
              return 'emerald_ore'; // Rare emeralds in jungle mountains
            } else if (noiseValue > 0.75) {
              return 'diorite'; // Diorite patches common in jungle geology
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
      id: 'jungle',
      name: 'Jungle',
      minTemperature: 0.3,
      maxTemperature: 1.0,
      minHumidity: 0.6,
      maxHumidity: 1.0,
      heightMultiplier: 1.2,
      heightAddition: 2, // Higher elevation for jungle mountains
      terrainVariability: 0.8, // High variability for steep terrain
      peakFrequency: 0.6, // More frequent peaks for jungle mountains
      layers: layers,
      validStructureBlocks: ['grass', 'dirt', 'podzol', 'stone'], // Valid blocks for structure placement in jungle
      rarity: 0.6 // Moderately rare
    });
  }

  /**
   * Override modifyHeight to create distinctive jungle terrain with mountains and valleys
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    // Add jungle-specific terrain patterns
    try {
      // Use multi-frequency noise to create varied terrain with mountains and ravines
      const mountainNoise = this.getNoise('jungle_mountains', 0.01);
      const valleyNoise = this.getNoise('jungle_valleys', 0.02);
      const roughnessNoise = this.getNoise('jungle_roughness', 0.04);

      // Calculate mountain and valley influence
      const mountainValue = mountainNoise(x, 0);
      const valleyValue = valleyNoise(x, 0);
      const roughnessValue = roughnessNoise(x, 0);

      // Sharper, more dramatic terrain changes for jungle
      let heightModifier = 0;

      // Add steep mountains (typical of jungle terrain)
      if (mountainValue > 0.6) {
        // Exponential curve for steeper slopes
        heightModifier += Math.pow(mountainValue - 0.6, 2) * 30;
      }

      // Add valleys and ravines
      if (valleyValue < 0.35) {
        heightModifier -= Math.pow(0.35 - valleyValue, 2) * 20;
      }

      // Add roughness for micro-terrain
      heightModifier += roughnessValue * 3;

      return standardHeight + heightModifier;
    } catch (e) {
      // If noise generation isn't set up yet, return standard height
      return standardHeight;
    }
  }
} 
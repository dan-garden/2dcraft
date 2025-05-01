import { BaseBiome, BiomeLayer } from './BaseBiome';

export class SwampBiome extends BaseBiome {
  constructor() {
    // Define swamp-specific layers with custom noise-based generation
    const layers: BiomeLayer[] = [
      // Surface layer with murky water, lily pads, and other swamp vegetation
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise functions for swamp surface features
          const waterNoise = getNoise('swamp_water', 0.1);
          const vegetationNoise = getNoise('swamp_vegetation', 0.15);
          const fogNoise = getNoise('swamp_fog', 0.2);

          // Get noise values at this position
          const waterValue = waterNoise(x, y);
          const vegetationValue = vegetationNoise(x, y);
          const fogValue = fogNoise(x, y);

          // Swamp water pools (murky water)
          if (waterValue > 0.6) {
            // Sometimes lily pads on water
            if (vegetationValue > 0.85) {
              return 'lily_pad';
            }
            return 'swamp_water';
          }

          // Fog patches in swamp
          if (fogValue > 0.9) {
            return 'swamp_fog'; // Visual effect block
          }

          // Swamp vegetation
          if (vegetationValue > 0.75) {
            const plantType = Math.floor(vegetationNoise(x + 300, y + 300) * 6);
            switch (plantType) {
              case 0: return 'vine';
              case 1: return 'mushroom';
              case 2: return 'dead_bush';
              case 3: return 'seagrass';
              case 4: return 'dripleaf';
              default: return 'tall_grass';
            }
          }

          // Default surface is a mix of grass and mud
          if (vegetationValue < 0.3) {
            return 'mud';
          }

          return 'grass';
        }
      },

      // Mud/clay layer
      {
        name: 'mud_layer',
        minDepth: 1,
        maxDepth: 5,
        getBlock: (x, y, depth, getNoise) => {
          const soilNoise = getNoise('swamp_soil', 0.06);
          const value = soilNoise(x, y + depth);
          const organicNoise = getNoise('swamp_organic', 0.08);
          const organicValue = organicNoise(x, y + depth * 2);

          // Swamp soil composition
          if (value > 0.7) {
            return 'clay'; // Clay deposits
          } else if (value < 0.3) {
            return 'mud'; // Lots of mud in swamps
          } else if (value > 0.55 && value < 0.65) {
            return 'gravel'; // Occasional gravel
          }

          // Organic material
          if (organicValue > 0.85) {
            return 'rooted_mud'; // Tree roots in the ground
          } else if (organicValue < 0.15) {
            return 'muddy_mangrove_roots'; // Mangrove roots
          }

          return 'dirt';
        }
      },

      // Transition to stone with occasional peat
      {
        name: 'transition',
        minDepth: 5,
        maxDepth: 9,
        getBlock: (x, y, depth, getNoise) => {
          const transitionNoise = getNoise('swamp_transition', 0.05);
          const value = transitionNoise(x, y);
          const wetNoise = getNoise('swamp_wet_patches', 0.07);
          const wetValue = wetNoise(x, y + depth);

          // More stone as we go deeper
          const depthFactor = (depth - 5) / 4; // 0 to 1

          if (value < 0.4 + (depthFactor * 0.4)) {
            // Stone with mossy patches
            if (wetValue > 0.8) {
              return 'mossy_stone';
            }
            return 'stone';
          } else if (value > 0.8) {
            return 'peat'; // Peat deposits (compressed organic matter)
          } else if (value > 0.6 && value < 0.7) {
            if (wetValue > 0.6) {
              return 'mud_bricks'; // Ancient swamp structures
            }
            return 'clay';
          }

          return 'dirt';
        }
      },

      // Deep stone layer
      {
        name: 'deep',
        minDepth: 9,
        maxDepth: undefined,
        getBlock: (x, y, depth, getNoise) => {
          const deepNoise = getNoise('swamp_deep', 0.04);
          const slimeNoise = getNoise('swamp_slime', 0.07);
          const wetCaveNoise = getNoise('swamp_wet_cave', 0.08);

          const deepValue = deepNoise(x, y + depth * 0.5);
          const slimeValue = slimeNoise(x, y);
          const wetValue = wetCaveNoise(x, y - depth);

          // Special stone types and features
          if (depth > 12) {
            if (deepValue > 0.85) {
              return 'tuff'; // Occasional tuff
            }

            if (depth > 20 && slimeValue > 0.9) {
              return 'slime_block'; // Rare slime deposits
            }

            // Wet cave features
            if (wetValue > 0.85) {
              if (deepValue > 0.7) {
                return 'dripstone'; // Cave dripstone
              }
              return 'mossy_cobblestone';
            }

            // Ancient ruins in caves
            if (depth > 30 && deepValue > 0.6 && deepValue < 0.7 && slimeValue > 0.7) {
              return 'infested_stone'; // Silverfish infested stone looks like normal stone
            }
          }

          // Bedrock at the very bottom
          if (depth > 60 && deepNoise(x, y + 500) > 0.9) {
            return 'bedrock';
          }

          return 'stone';
        }
      }
    ];

    super({
      id: 'swamp',
      name: 'Swamp',
      minTemperature: 0.0,
      maxTemperature: 0.8,
      minHumidity: 0.7,
      maxHumidity: 1.0,
      heightMultiplier: 0.7,
      heightAddition: -3, // Lower elevation for swamps
      terrainVariability: 0.15, // Low variability for flat swamps
      peakFrequency: 0.1, // Very few peaks
      layers: layers,
      validStructureBlocks: ['grass', 'mud', 'dirt', 'clay'], // Valid blocks for structure placement
      rarity: 0.45 // Medium rarity
    });
  }

  /**
   * Override modifyHeight to create flat swampy terrain with occasional small hills
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    try {
      // Use gentle noise functions for minimal terrain variation
      const flatNoiseSmall = this.getNoise('swamp_flat_small', 0.03);
      const flatNoiseLarge = this.getNoise('swamp_flat_large', 0.01);
      const waterPoolNoise = this.getNoise('swamp_pools', 0.05);

      // Subtle terrain variation for swamp landscape
      let heightModifier =
        flatNoiseSmall(x, 0) * 0.8 +    // Small variations
        flatNoiseLarge(x, 0) * 1.2;     // Larger, gentler variations

      // Water depressions for swamp pools
      if (waterPoolNoise(x, 0) > 0.65) {
        heightModifier -= (waterPoolNoise(x, 0) - 0.65) * 5;
      }

      return standardHeight + heightModifier;
    } catch (e) {
      // If noise generation isn't set up yet, return standard height
      return standardHeight;
    }
  }
} 
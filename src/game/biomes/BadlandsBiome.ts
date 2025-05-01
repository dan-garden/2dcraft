import { BaseBiome, BiomeLayer } from './BaseBiome';

export class BadlandsBiome extends BaseBiome {
  constructor() {
    // Define badlands-specific layers with custom noise-based generation
    const layers: BiomeLayer[] = [
      // Surface layer (red sand with occasional dead bushes and cacti)
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise functions for badlands surface features
          const surfaceNoise = getNoise('badlands_surface', 0.1);
          const vegetationNoise = getNoise('badlands_vegetation', 0.2);
          const windNoise = getNoise('badlands_wind', 0.15);

          // Get noise values at this position
          const surfaceValue = surfaceNoise(x, y);
          const vegetationValue = vegetationNoise(x, y);
          const windValue = windNoise(x, y);

          // Wind-swept areas
          if (windValue > 0.9) {
            return 'smooth_red_sandstone'; // Polished by wind
          }

          // Sparse vegetation
          if (vegetationValue > 0.9) {
            const plantType = Math.floor(vegetationNoise(x + 400, y + 400) * 4);
            switch (plantType) {
              case 0: return 'dead_bush';
              case 1: return 'cactus';
              case 2: return 'bush_remnant'; // Mostly dead vegetation
              default: return 'dead_shrub';
            }
          }

          // Surface material
          if (surfaceValue > 0.85) {
            return 'hardened_clay'; // Exposed clay
          } else if (surfaceValue < 0.15) {
            return 'coarse_dirt'; // Patches of coarse dirt
          } else if (surfaceValue > 0.4 && surfaceValue < 0.5) {
            return 'red_gravel'; // Eroded red sandstone
          }

          // Default red sand
          return 'red_sand';
        }
      },

      // Red sandstone layer
      {
        name: 'sandstone_layer',
        minDepth: 1,
        maxDepth: 3,
        getBlock: (x, y, depth, getNoise) => {
          const stoneNoise = getNoise('badlands_stone', 0.08);
          const value = stoneNoise(x, y + depth);
          const cracksNoise = getNoise('badlands_cracks', 0.1);
          const cracksValue = cracksNoise(x, y);

          // Cracked areas - erosion
          if (cracksValue > 0.9) {
            return 'cracked_red_sandstone';
          }

          // Mostly red sandstone with some variations
          if (value < 0.3) {
            return 'red_sand'; // Some sand pockets
          } else if (value > 0.8) {
            return 'smooth_red_sandstone'; // Smooth variant
          } else if (value > 0.5 && value < 0.7) {
            return 'chiseled_red_sandstone'; // Decorative variant
          }

          return 'red_sandstone';
        }
      },

      // Colored terracotta layers (mesa distinctive feature)
      {
        name: 'terracotta_layers',
        minDepth: 3,
        maxDepth: 18,
        getBlock: (x, y, depth, getNoise) => {
          // Create a layered pattern of differently colored terracotta
          // This is what makes badlands/mesa biomes so distinctive

          // Use depth to determine layer color
          const layerIndex = (depth + Math.floor(y * 0.05)) % 12;

          // Additional variation noise
          const variationNoise = getNoise('terracotta_variation', 0.1);
          const variationValue = variationNoise(x, y + depth);
          const fossilNoise = getNoise('badlands_fossil', 0.12);
          const fossilValue = fossilNoise(x, y);

          // Occasionally break the pattern with standard terracotta
          if (variationValue > 0.85) {
            return 'terracotta';
          }

          // Rare fossils in terracotta layers
          if (fossilValue > 0.96 && depth > 8) {
            return 'bone_block';
          }

          // Return different colored terracotta based on layer
          switch (layerIndex) {
            case 0: return 'orange_terracotta';
            case 1: return 'terracotta';
            case 2: return 'yellow_terracotta';
            case 3: return 'brown_terracotta';
            case 4: return 'red_terracotta';
            case 5: return 'white_terracotta';
            case 6: return 'light_gray_terracotta';
            case 7: return 'cyan_terracotta';
            case 8: return 'magenta_terracotta';
            case 9: return 'pink_terracotta';
            case 10: return 'orange_terracotta';
            default: return 'terracotta';
          }
        }
      },

      // Deep stone layer
      {
        name: 'deep',
        minDepth: 18,
        maxDepth: undefined,
        getBlock: (x, y, depth, getNoise) => {
          const deepNoise = getNoise('badlands_deep', 0.04);
          const featureNoise = getNoise('badlands_features', 0.07);
          const cavesNoise = getNoise('badlands_caves', 0.06);

          const deepValue = deepNoise(x, y + depth * 0.5);
          const featureValue = featureNoise(x, y);
          const cavesValue = cavesNoise(x, y);

          // Special stone types and features
          if (depth > 25) {
            if (deepValue > 0.9) {
              return 'terracotta'; // Deep terracotta pockets
            }

            // Dry caves with unique features
            if (cavesValue > 0.92) {
              if (featureValue > 0.8) {
                return 'calcite'; // Mineral deposits
              }
              return 'tuff'; // Volcanic rock
            }

            // Ancient dry river beds
            if (depth > 35 && featureValue > 0.9) {
              return 'magma_block'; // Dried lava flows
            }

            // Special rock formations
            if (depth > 30 && deepValue > 0.75 && deepValue < 0.85) {
              const stoneType = Math.floor(featureValue * 4);
              switch (stoneType) {
                case 0: return 'polished_blackstone';
                case 1: return 'basalt';
                case 2: return 'smooth_stone';
                default: return 'obsidian';
              }
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
      id: 'badlands',
      name: 'Badlands',
      minTemperature: 0.4,
      maxTemperature: 1.0,
      minHumidity: -1.0,
      maxHumidity: -0.4,
      heightMultiplier: 1.1,
      heightAddition: 5, // Elevated terrain
      terrainVariability: 0.9, // High variability for mesa formations
      peakFrequency: 0.4, // Medium frequency of peaks
      layers: layers,
      validStructureBlocks: ['red_sand', 'hardened_clay', 'terracotta'],
      rarity: 0.7 // Fairly rare
    });
  }

  /**
   * Override modifyHeight to create mesa-like terrain with flat-topped mountains and steep cliffs
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    try {
      // Use noise functions to create mesa-like terrain
      const mesaNoise = this.getNoise('badlands_mesa', 0.015);
      const cliffNoise = this.getNoise('badlands_cliffs', 0.08);
      const flatTopNoise = this.getNoise('badlands_flattop', 0.03);
      const canyonNoise = this.getNoise('badlands_canyon', 0.005);

      const mesaValue = mesaNoise(x, 0);
      const cliffValue = cliffNoise(x, 0);
      const flatTopValue = flatTopNoise(x, 0);
      const canyonValue = canyonNoise(x, 0);

      let heightModifier = 0;

      // Create deep canyons in some areas
      if (canyonValue < 0.2) {
        // Deep canyons
        const canyonDepth = (0.2 - canyonValue) * 30;
        heightModifier -= canyonDepth;
      }
      // Create tall mesas with flat tops
      else if (mesaValue > 0.55) {
        // Plateau height based on noise
        const plateauHeight = Math.pow(mesaValue - 0.55, 1.2) * 40;

        // Flatten the top of the mesa
        if (flatTopValue > 0.4) {
          heightModifier += plateauHeight;
        } else {
          // Create irregular edges
          heightModifier += plateauHeight * (0.7 + (flatTopValue * 0.75));
        }

        // Add cliff detail
        heightModifier += cliffValue * 2;
      } else {
        // Lower areas between mesas
        heightModifier += (cliffValue - 0.5) * 2;
      }

      return standardHeight + heightModifier;
    } catch (e) {
      // If noise generation isn't set up yet, return standard height
      return standardHeight;
    }
  }
} 
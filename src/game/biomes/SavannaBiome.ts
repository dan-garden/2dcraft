import { BaseBiome, BiomeLayer } from './BaseBiome';

export class SavannaBiome extends BaseBiome {
  constructor() {
    // Define savanna-specific layers with custom noise-based generation
    const layers: BiomeLayer[] = [
      // Surface layer (golden grass with occasional acacia trees)
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise functions for savanna surface features
          const grassNoise = getNoise('savanna_grass', 0.15);
          const featureNoise = getNoise('savanna_features', 0.2);
          const waterNoise = getNoise('savanna_water', 0.25);

          // Get noise values
          const grassValue = grassNoise(x, y);
          const featureValue = featureNoise(x, y);
          const waterValue = waterNoise(x, y);

          // Rare water holes (oases)
          if (waterValue > 0.95) {
            return 'water';
          }

          // Special features and vegetation
          if (featureValue > 0.85) {
            const featureType = Math.floor(featureNoise(x + 500, y + 500) * 5);
            switch (featureType) {
              case 0: return 'dead_bush';
              case 1: return 'tall_grass';
              case 2: return 'acacia_sapling';
              case 3: return 'hay_block'; // Some dried grass bundles
              default: return 'grass_tuft';
            }
          }

          // Different grass types
          if (grassValue > 0.6) {
            return 'tall_grass';
          } else if (grassValue < 0.2) {
            return 'coarse_dirt'; // Exposed dirt patches
          } else if (grassValue > 0.4 && grassValue < 0.5) {
            return 'dry_grass'; // Extra dry patches
          }

          // Default savanna surface - golden grass
          return 'savanna_grass';
        }
      },

      // Hard dirt layer
      {
        name: 'dirt_layer',
        minDepth: 1,
        maxDepth: 4,
        getBlock: (x, y, depth, getNoise) => {
          const soilNoise = getNoise('savanna_soil', 0.08);
          const value = soilNoise(x, y + depth);
          const rootsNoise = getNoise('savanna_roots', 0.06);
          const rootsValue = rootsNoise(x, y + depth);

          // Drought-affected soil
          if (value > 0.7) {
            return 'terracotta'; // Terracotta common in arid regions
          } else if (value < 0.2) {
            return 'coarse_dirt'; // More coarse dirt
          } else if (value > 0.5 && value < 0.6) {
            return 'gravel'; // Some gravel patches
          }

          // Acacia tree root systems
          if (rootsValue > 0.85) {
            return 'rooted_dirt';
          } else if (rootsValue < 0.15) {
            return 'termite_nest'; // Termite colonies in savanna
          }

          return 'dirt';
        }
      },

      // Transition layer with hardened clay
      {
        name: 'transition',
        minDepth: 4,
        maxDepth: 8,
        getBlock: (x, y, depth, getNoise) => {
          const transitionNoise = getNoise('savanna_transition', 0.06);
          const value = transitionNoise(x, y);
          const dryBedNoise = getNoise('savanna_dry_riverbeds', 0.09);
          const dryBedValue = dryBedNoise(x, y);

          // More stone as we go deeper
          const depthFactor = (depth - 4) / 4; // 0 to 1

          if (value < 0.3 + (depthFactor * 0.4)) {
            // Dried riverbeds underground
            if (dryBedValue > 0.9) {
              return 'dried_mud';
            }
            return 'stone';
          } else if (value > 0.8) {
            // Various terracotta colors
            const colorNoise = transitionNoise(x + 300, y + 300);
            const colorType = Math.floor(colorNoise * 4);

            switch (colorType) {
              case 0: return 'orange_terracotta';
              case 1: return 'terracotta';
              case 2: return 'yellow_terracotta';
              default: return 'red_terracotta';
            }
          } else if (value > 0.6 && value < 0.7) {
            // Fossils and ancient bones
            if (dryBedValue > 0.8) {
              return 'bone_block';
            }
            return 'calcite';
          }

          return 'hardened_clay';
        }
      },

      // Deep layer
      {
        name: 'deep',
        minDepth: 8,
        maxDepth: undefined,
        getBlock: (x, y, depth, getNoise) => {
          const deepNoise = getNoise('savanna_deep', 0.04);
          const featureNoise = getNoise('savanna_deep_features', 0.07);
          const ancientNoise = getNoise('savanna_ancient', 0.02);

          const deepValue = deepNoise(x, y + depth * 0.5);
          const featureValue = featureNoise(x, y);
          const ancientValue = ancientNoise(x, y + depth);

          // Special stone types
          if (depth > 15) {
            if (deepValue > 0.85) {
              return 'terracotta'; // Deep terracotta deposits
            }

            // Dried cave systems
            if (featureValue > 0.9) {
              return 'cracked_stone_bricks'; // Dry, cracked stone
            }

            // Ancient structures - buried ruins
            if (depth > 30 && ancientValue > 0.95) {
              const ruinType = Math.floor(featureValue * 3);
              switch (ruinType) {
                case 0: return 'chiseled_stone';
                case 1: return 'ancient_debris';
                default: return 'gilded_blackstone';
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
      id: 'savanna',
      name: 'Savanna',
      minTemperature: 0.3,
      maxTemperature: 1.0,
      minHumidity: -0.6,
      maxHumidity: 0.0,
      heightMultiplier: 1.0,
      heightAddition: 1, // Slightly elevated
      terrainVariability: 0.3, // Moderate terrain variation
      peakFrequency: 0.35, // Occasional plateaus
      layers: layers,
      validStructureBlocks: ['savanna_grass', 'dirt', 'coarse_dirt'], // Valid blocks for structure placement
      rarity: 0.5 // Medium rarity
    });
  }

  /**
   * Override modifyHeight to create flat plains with occasional plateaus
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    try {
      // Use noise functions to create plateau-like terrain
      const plateauNoise = this.getNoise('savanna_plateau', 0.01);
      const flatNoise = this.getNoise('savanna_flat', 0.03);
      const roughnessNoise = this.getNoise('savanna_roughness', 0.1);

      // Plateau formation for savanna mesas
      const plateauValue = plateauNoise(x, 0);
      let heightModifier = 0;

      // Create mesa-like terrain in some areas
      if (plateauValue > 0.7) {
        // More abrupt, plateau-like terrain
        const plateauHeight = Math.pow(plateauValue - 0.7, 0.8) * 40;
        heightModifier += plateauHeight;
      } else {
        // Otherwise, gently rolling plains
        heightModifier += flatNoise(x, 0) * 2;
      }

      // Add subtle roughness
      heightModifier += roughnessNoise(x, 0) * 0.6;

      return standardHeight + heightModifier;
    } catch (e) {
      // If noise generation isn't set up yet, return standard height
      return standardHeight;
    }
  }
} 
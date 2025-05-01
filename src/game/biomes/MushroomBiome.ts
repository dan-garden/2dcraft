import { BaseBiome, BiomeLayer } from './BaseBiome';

export class MushroomBiome extends BaseBiome {
  constructor() {
    // Define mushroom-specific layers with custom noise-based generation
    const layers: BiomeLayer[] = [
      // Surface layer (mycelium with giant mushrooms and colorful features)
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise functions for mushroom island features
          const myceliumNoise = getNoise('mycelium_patterns', 0.1);
          const mushroomNoise = getNoise('mushroom_features', 0.15);
          const glowNoise = getNoise('mushroom_glow', 0.12);

          // Get noise values at this position
          const myceliumValue = myceliumNoise(x, y);
          const mushroomValue = mushroomNoise(x, y);
          const glowValue = glowNoise(x, y);

          // Glowing mushroom patches
          if (glowValue > 0.9) {
            return 'glowshroom_surface';
          }

          // Mushroom features and other colorful fungi
          if (mushroomValue > 0.85) {
            const mushroomType = Math.floor(mushroomNoise(x + 500, y + 500) * 7);
            switch (mushroomType) {
              case 0: return 'red_mushroom';
              case 1: return 'brown_mushroom';
              case 2: return 'huge_mushroom_stem';
              case 3: return 'mushroom_light'; // Bioluminescent mushroom
              case 4: return 'purple_mushroom';
              case 5: return 'black_mushroom';
              default: return 'mushroom_cluster';
            }
          }

          // Mycelium variations
          if (myceliumValue < 0.2) {
            return 'mushroom_grass'; // Slightly grassy mycelium
          } else if (myceliumValue > 0.8) {
            return 'glowing_mycelium'; // Glowing variant
          } else if (myceliumValue > 0.4 && myceliumValue < 0.6) {
            return 'dense_mycelium'; // Thicker mycelium
          }

          // Default mycelium surface
          return 'mycelium';
        }
      },

      // Rich soil layer filled with fungi
      {
        name: 'fungi_layer',
        minDepth: 1,
        maxDepth: 5,
        getBlock: (x, y, depth, getNoise) => {
          const fungiNoise = getNoise('underground_fungi', 0.07);
          const value = fungiNoise(x, y + depth);
          const networkNoise = getNoise('mycelium_network', 0.05);
          const networkValue = networkNoise(x, y + depth * 2);

          // Underground fungi and soil
          if (value > 0.8) {
            return 'fungi_soil'; // Rich soil full of mushroom roots
          } else if (value < 0.2) {
            return 'glowshroom'; // Glowing underground mushroom
          } else if (value > 0.6 && value < 0.7) {
            return 'mushroom_root'; // Mushroom root system
          }

          // Mycelium networks underground
          if (networkValue > 0.9) {
            return 'mycelium_vein'; // Veins of pure mycelium
          } else if (networkValue < 0.1) {
            return 'porous_mycelium'; // Sponge-like structure
          } else if (networkValue > 0.6 && networkValue < 0.8) {
            return 'spore_sac'; // Spore producing structure
          }

          // Regular soil
          return 'dirt';
        }
      },

      // Transition layer with unique mushroom minerals
      {
        name: 'transition',
        minDepth: 5,
        maxDepth: 10,
        getBlock: (x, y, depth, getNoise) => {
          const transitionNoise = getNoise('mushroom_transition', 0.05);
          const value = transitionNoise(x, y);
          const crystalNoise = getNoise('mushroom_crystal', 0.08);
          const crystalValue = crystalNoise(x, y);

          // More stone as we go deeper
          const depthFactor = (depth - 5) / 5; // 0 to 1

          if (value < 0.3 + (depthFactor * 0.4)) {
            // Crystal formations occasionally
            if (crystalValue > 0.9) {
              return 'mushroom_crystal';
            }
            return 'stone';
          } else if (value > 0.85) {
            // Special mushroom-infused minerals
            return 'mycelite'; // Stone with embedded mycelium
          } else if (value > 0.7 && value < 0.8) {
            return 'spore_stone'; // Stone with embedded spores
          } else if (value > 0.4 && value < 0.6) {
            // Alien-looking minerals
            if (crystalValue > 0.8) {
              return 'amethyst'; // Purple crystals
            }
            return 'calcite'; // White mineral deposits
          }

          return 'dirt';
        }
      },

      // Deep layer with unique mushroom gems
      {
        name: 'deep',
        minDepth: 10,
        maxDepth: undefined,
        getBlock: (x, y, depth, getNoise) => {
          const deepNoise = getNoise('mushroom_deep', 0.04);
          const featureNoise = getNoise('mushroom_deep_features', 0.07);
          const magicNoise = getNoise('mushroom_magic', 0.03);

          const deepValue = deepNoise(x, y + depth * 0.5);
          const featureValue = featureNoise(x, y);
          const magicValue = magicNoise(x, y + depth);

          // Special mushroom biome minerals
          if (depth > 20) {
            if (deepValue > 0.9) {
              return 'mushroom_cave'; // Embedded mushroom cave
            }

            // Magical mushroom features deep underground
            if (magicValue > 0.95) {
              const magicType = Math.floor(featureValue * 4);
              switch (magicType) {
                case 0: return 'bioluminescent_block'; // Rare glowing ore-like block
                case 1: return 'mycelium_fossil'; // Ancient fossilized mushrooms
                case 2: return 'prismatic_mycelium'; // Rainbow-colored mycelium
                default: return 'spore_crystal'; // Crystallized mushroom spores
              }
            }

            // Ancient structures
            if (depth > 40 && deepValue > 0.6 && deepValue < 0.7) {
              return 'ancient_mycelium_brick'; // Old ruins of mushroom civilization
            }

            // Underground lakes
            if (depth > 30 && featureValue > 0.93) {
              return 'purified_water'; // Clean water filtered by mycelium
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
      id: 'mushroom',
      name: 'Mushroom Island',
      minTemperature: -0.1,
      maxTemperature: 0.4,
      minHumidity: 0.5,
      maxHumidity: 1.0,
      heightMultiplier: 0.9,
      heightAddition: 0, // Average elevation
      terrainVariability: 0.5, // Moderately variable terrain
      peakFrequency: 0.5, // Medium frequency of small hills
      layers: layers,
      validStructureBlocks: ['mycelium', 'mushroom_grass', 'dirt'], // Valid blocks for structure placement
      rarity: 0.85 // Very rare biome
    });
  }

  /**
   * Override modifyHeight to create distinctive mushroom terrain with rounded hills
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    try {
      // Use different noise functions for terrain variation
      const largeHillNoise = this.getNoise('mushroom_large_hills', 0.02);
      const smallHillNoise = this.getNoise('mushroom_small_hills', 0.05);
      const specialFeatureNoise = this.getNoise('mushroom_special', 0.01);

      // Create smoothly rounded terrain
      let heightModifier = 0;

      // Combine noise patterns for rounded, smooth hills
      heightModifier =
        Math.abs(largeHillNoise(x, 0)) * 8 +  // Rounded, dome-like hills
        Math.abs(smallHillNoise(x, 0)) * 4;   // Smaller rounded features

      // Occasional special features (giant mushroom platforms)
      const specialValue = specialFeatureNoise(x, 0);
      if (specialValue > 0.95) {
        heightModifier += 15; // Large, flat-topped hill for giant mushroom colony
      }

      // Occasional small crater-like depressions
      const craterNoise = this.getNoise('mushroom_craters', 0.06);
      if (craterNoise(x, 0) > 0.85) {
        heightModifier -= Math.pow(craterNoise(x, 0) - 0.85, 2) * 15;
      }

      return standardHeight + heightModifier;
    } catch (e) {
      // If noise generation isn't set up yet, return standard height
      return standardHeight;
    }
  }
} 
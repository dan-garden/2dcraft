import { BaseBiome, BiomeLayer } from './BaseBiome';

export class SwampBiome extends BaseBiome {
  constructor() {
    // Define swamp-specific layers with custom noise-based generation
    const layers: BiomeLayer[] = [
      // Surface layer (muddy with lily pads, occasional water pools)
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise functions for swamp surface features
          const swampFloorNoise = getNoise('swamp_floor', 0.1);
          const waterPoolNoise = getNoise('water_pools', 0.05);

          // Get noise value at this position
          const featureValue = swampFloorNoise(x, y);
          const waterValue = waterPoolNoise(x, y);

          // Occasional water pools
          if (waterValue > 0.75) {
            return 'water';
          }

          // Various swamp floor decorations
          if (featureValue > 0.9) {
            // Different features based on secondary noise
            const featureTypeNoise = swampFloorNoise(x + 700, y + 700);

            if (featureTypeNoise < 0.3) {
              return 'lily_pad'; // Lily pads on edges
            } else if (featureTypeNoise < 0.6) {
              return 'mushroom'; // Various mushrooms
            } else if (featureTypeNoise < 0.8) {
              return 'dead_bush';
            } else {
              return 'seagrass'; // Seagrass at water edges
            }
          } else if (featureValue > 0.7) {
            return 'mud'; // Patches of exposed mud
          }

          // Default swamp surface
          return 'clay'; // Clay-heavy surface
        }
      },

      // Upper swamp soil layer (waterlogged, rich in organic matter)
      {
        name: 'swamp_soil',
        minDepth: 1,
        maxDepth: 2,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise for the waterlogged soil patterns
          const soilNoise = getNoise('soil_variation', 0.08);
          const noiseValue = soilNoise(x, y);

          // Waterlogged soil composition
          if (noiseValue > 0.7) {
            return 'mud'; // Mud pockets
          } else if (noiseValue < 0.2) {
            return 'clay'; // Clay deposits
          }

          // Most of swamp soil is wet dirt
          return 'dirt';
        }
      },

      // Lower soil/clay layer
      {
        name: 'clay_layer',
        minDepth: 2,
        maxDepth: 4,
        getBlock: (x, y, depth, getNoise) => {
          // Swamps typically have clay-rich lower soil
          const clayNoise = getNoise('clay_distribution', 0.06);
          const noiseValue = clayNoise(x, y + depth * 5);

          // Mostly clay with some dirt and occasional gravel
          if (noiseValue > 0.6) {
            return 'clay';
          } else if (noiseValue < 0.2) {
            return 'gravel'; // Occasional gravel deposits
          }

          return 'dirt';
        }
      },

      // Stone layer with swamp-specific features
      {
        name: 'deep',
        minDepth: 4,
        maxDepth: undefined, // Extends to infinity
        getBlock: (x, y, depth, getNoise) => {
          // Swamp-specific underground features
          const stoneVariationNoise = getNoise('stone_variation', 0.03);
          const fossilNoise = getNoise('fossils', 0.1);

          // Get noise values
          const noiseValue = stoneVariationNoise(x, y);
          const fossilValue = fossilNoise(x, y);

          // Swamps can have unique fossils in the stone
          if (depth < 20 && fossilValue > 0.95) {
            return 'bone_block'; // Rare fossil deposits
          }

          // More slime blocks in swamp underground
          if (depth < 30 && noiseValue > 0.9) {
            return 'slime_block';
          }

          // Some coal deposits
          if (depth > 15 && depth < 40 && noiseValue < 0.2) {
            return 'coal_ore';
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
      id: 'swamp',
      name: 'Swamp',
      minTemperature: 0.0,
      maxTemperature: 0.5,
      minHumidity: 0.7,
      maxHumidity: 1.0,
      heightMultiplier: 0.6,
      heightAddition: -4, // Much lower elevation
      terrainVariability: 0.1, // Very flat
      peakFrequency: 0.2, // Rare bumps
      layers: layers,
      validStructureBlocks: ['clay', 'dirt', 'mud', 'grass'], // Valid blocks for structure placement in swamp
      rarity: 0.7 // Rare biome
    });
  }

  /**
   * Override modifyHeight to create distinctive flat swamp terrain with occasional bumps
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    // Add swamp-specific terrain patterns if we have noise generation
    try {
      // Use very low frequency noise for occasional small raised areas
      const bumpNoise = this.getNoise('swamp_bumps', 0.008);
      const microTerrainNoise = this.getNoise('micro_terrain', 0.1);

      // Calculate bump influence (very occasional small bumps)
      const bumpValue = bumpNoise(x, 0);
      const microValue = microTerrainNoise(x, 0) * 0.5;

      if (bumpValue > 0.85) {
        // Occasional small bumps
        return standardHeight + (bumpValue - 0.85) * 20 + microValue;
      } else {
        // Add tiny micro-terrain for texture
        return standardHeight + microValue * 0.5;
      }
    } catch (e) {
      // If noise generator isn't set yet, return standard height
      return standardHeight;
    }
  }
} 
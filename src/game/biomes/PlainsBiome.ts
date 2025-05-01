import { BaseBiome, BiomeLayer } from './BaseBiome';

export class PlainsBiome extends BaseBiome {
  constructor() {
    // Define layers with custom noise-based block generation
    const layers: BiomeLayer[] = [
      // Surface layer (grass with occasional flowers and tall grass)
      {
        name: 'surface',
        minDepth: 0,
        maxDepth: 1,
        getBlock: (x, y, depth, getNoise) => {
          // Create noise function for flower distribution
          const flowerNoise = getNoise('flowers', 0.1);
          const grassNoise = getNoise('tallgrass', 0.2);

          // Get noise value at this position
          const flowerValue = flowerNoise(x, y);
          const grassValue = grassNoise(x, y);

          // Occasional flowers (very rare)
          if (flowerValue > 0.85) {
            // Different flower types based on position
            const flowerType = Math.floor(flowerNoise(x + 100, y + 100) * 3);
            switch (flowerType) {
              case 0: return 'dandelion';
              case 1: return 'poppy';
              default: return 'daisy';
            }
          }

          // Occasional tall grass (somewhat common)
          if (grassValue > 0.7) {
            return 'tall_grass';
          }

          // Default surface block
          return 'grass';
        }
      },

      // Sub-surface layer (dirt with occasional clay or gravel deposits)
      {
        name: 'sub_surface',
        minDepth: 1,
        maxDepth: 5,
        getBlock: (x, y, depth, getNoise) => {
          // Different noise pattern for sub-surface variations
          const dirtVariationNoise = getNoise('dirt_variation', 0.05);

          // More variations deeper down
          const depthFactor = depth / 5; // 0.2 to 1.0
          const noiseValue = dirtVariationNoise(x, y) * (1 + depthFactor);

          // Occasional clay or gravel patches
          if (noiseValue > 0.85) {
            return 'clay';
          } else if (noiseValue < 0.15) {
            return 'gravel';
          }

          // Regular dirt
          return 'dirt';
        }
      },

      // Deep layer (mostly stone with ore veins handled separately)
      {
        name: 'deep',
        minDepth: 5,
        maxDepth: undefined, // Extends to infinity
        getBlock: (x, y, depth, getNoise) => {
          // Stone variations based on depth and noise
          const stoneVariationNoise = getNoise('stone_variation', 0.03);
          const noiseValue = stoneVariationNoise(x, y);

          // Deeper layers have more stone variations
          if (depth > 20) {
            // Occasional bedrock near the bottom of the world
            if (depth > 60 && stoneVariationNoise(x, y + 500) > 0.9) {
              return 'bedrock';
            }

            // Occasional deepslate in lower layers
            if (depth > 40 && noiseValue > 0.7) {
              return 'deepslate';
            }
          }

          // Regular stone for most of the underground
          return 'stone';
        }
      }
    ];

    super({
      id: 'plains',
      name: 'Plains',
      minTemperature: -0.2,
      maxTemperature: 0.2,
      minHumidity: -0.2,
      maxHumidity: 0.2,
      heightMultiplier: 1.0,
      heightAddition: 0,
      terrainVariability: 0.2, // Very flat terrain
      peakFrequency: 0.3, // Spread out hills
      layers: layers,
      validStructureBlocks: ['grass', 'dirt'], // Valid blocks for structure placement in plains
      rarity: 0.3 // Plains are common
    });
  }

  /**
   * Override modifyHeight to add small rolling hills characteristic of plains
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    // Add gentle rolling hills if we have noise generation available
    try {
      const hillNoise = this.getNoise('rolling_hills', 0.01);
      const smallHillNoise = this.getNoise('small_hills', 0.05);

      // Combine different frequencies for more natural terrain
      const hillFactor = hillNoise(x, 0) * 2 + smallHillNoise(x, 0) * 1;

      // Add gentle hills to the terrain
      return standardHeight + hillFactor * 2;
    } catch (e) {
      // If noise generator isn't set yet, just return standard height
      return standardHeight;
    }
  }
} 
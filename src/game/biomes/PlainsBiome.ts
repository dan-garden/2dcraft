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

      // Dirt layer with clay and gravel pockets throughout
      {
        name: 'dirt_layer',
        minDepth: 1,
        maxDepth: 5,
        getBlock: (x, y, depth, getNoise) => {
          // Check for clay and gravel pockets first
          const pocketBlock = this.getPocketMaterial(x, y, depth, getNoise);
          if (pocketBlock) return pocketBlock;

          // Regular dirt if no special materials
          return 'dirt';
        }
      },

      // Deep layer (mostly stone with ore veins handled separately)
      {
        name: 'deep',
        minDepth: 5,
        maxDepth: undefined, // Extends to infinity
        getBlock: (x, y, depth, getNoise) => {
          // Check for clay and gravel pockets first (more frequent in upper layers)
          const pocketBlock = this.getPocketMaterial(x, y, depth, getNoise);
          if (pocketBlock) return pocketBlock;

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
      heightMultiplier: 0.8, // Reduced from 1.0 for flatter terrain
      heightAddition: 0,
      terrainVariability: 0.1, // Reduced from 0.2 for much flatter terrain
      peakFrequency: 0.15, // Reduced from 0.3 for fewer hills
      layers: layers,
      validStructureBlocks: ['grass', 'dirt'], // Valid blocks for structure placement in plains
      rarity: 0.3 // Plains are common
    });
  }

  /**
   * Helper method to check if a position should be a clay or gravel pocket
   * Used by both dirt and deep layers to create consistent pockets across layer boundaries
   */
  getPocketMaterial(x: number, y: number, depth: number, getNoise: Function): string | null {
    // Different noise patterns for material variations - larger pockets (lower frequency)
    const materialNoise = getNoise('material_variation', 0.03);
    const secondaryNoise = getNoise('secondary_variation', 0.025);

    // Tertiary noise for additional variation
    const variationNoise = getNoise('variation', 0.08);

    // Adjust pocket frequency based on depth - more common in upper layers
    const depthFactor = Math.max(0, 1 - (depth / 40)); // 1.0 at surface, 0 at depth 40+

    // Get noise values at this position with vertical stretching for natural pocket shapes
    const noiseValue = materialNoise(x, y + depth * 0.5);
    const secondValue = secondaryNoise(x - depth, y + depth * 0.2);
    const variationValue = variationNoise(x + y, depth);

    // Clay pockets - more frequent but still natural looking
    // Clay is more common in the upper layers
    const clayThreshold = 0.72 - (depthFactor * 0.15); // 0.57 near surface, 0.72 deep
    if (noiseValue > clayThreshold && secondValue > 0.4) {
      // Use variation noise to create more natural boundaries
      const edgeFactor = Math.abs(noiseValue - clayThreshold) * 10; // How far inside the pocket we are

      // Create clay pocket with soft edges
      if (variationValue < 0.6 + edgeFactor) {
        return 'clay';
      }
    }

    // Gravel pockets - distributed throughout all layers
    // Gravel can be found at any depth
    const gravelThreshold = 0.75 - (depthFactor * 0.1); // 0.65 near surface, 0.75 deep
    if (secondValue > gravelThreshold && noiseValue < 0.6) {
      // Variation for more natural pocket edges
      const edgeFactor = Math.abs(secondValue - gravelThreshold) * 8;

      // Create gravel pocket with soft edges
      if (variationValue > 0.4 - edgeFactor) {
        return 'gravel';
      }
    }

    // No special material at this position
    return null;
  }

  /**
   * Override modifyHeight to add minimal rolling hills characteristic of plains
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    // Get the standard height modification
    const standardHeight = super.modifyHeight(x, baseHeight, detailNoise);

    // Add very gentle, almost flat terrain with minimal hills
    try {
      const hillNoise = this.getNoise('rolling_hills', 0.008); // Lower frequency for wider, gentler changes
      const smallHillNoise = this.getNoise('small_hills', 0.04); // Lower frequency for smoother terrain

      // Combine different frequencies for more natural but very flat terrain
      const hillFactor = hillNoise(x, 0) * 1.0 + smallHillNoise(x, 0) * 0.5; // Reduced multipliers

      // Add very subtle hills to the terrain
      return standardHeight + hillFactor * 0.8; // Reduced from 2.0 to 0.8
    } catch (e) {
      // If noise generator isn't set yet, just return standard height
      return standardHeight;
    }
  }
} 
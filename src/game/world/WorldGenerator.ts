import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

export interface OreSettings {
  id: string;
  minVeinSize: number;
  maxVeinSize: number;
  rarity: number;
  minY: number;
  maxY: number;
}

export class WorldGenerator {
  private noise: (x: number, y: number) => number;
  private noise2: (x: number, y: number) => number;
  private noise3: (x: number, y: number) => number;
  private oreNoise: (x: number, y: number) => number;
  private ores: OreSettings[] = [];
  private seed: string;

  // Optional reference to a biome generator for height modifications
  private biomeGenerator: { modifyHeight: (x: number, baseHeight: number) => number } | null = null;

  constructor(seed: string) {
    this.seed = seed;
    const prng = alea(seed);
    this.noise = createNoise2D(prng);
    this.noise2 = createNoise2D(alea(seed + '2'));
    this.noise3 = createNoise2D(alea(seed + '3'));
    this.oreNoise = createNoise2D(alea(seed + 'ores'));
  }

  // Set the biome generator for this world
  setBiomeGenerator(biomeGenerator: { modifyHeight: (x: number, baseHeight: number) => number }): void {
    this.biomeGenerator = biomeGenerator;
  }

  // Alias for compatibility with new BiomeManager
  setBiomeManager(biomeManager: { modifyHeight: (x: number, baseHeight: number) => number }): void {
    this.biomeGenerator = biomeManager;
  }

  registerOre(ore: OreSettings): void {
    this.ores.push(ore);
  }

  getHeightAt(x: number): number {
    // Base terrain height using multiple octaves of noise
    const baseNoise = this.noise(x / 50, 0 / 50) * 0.5;
    const detailNoise = this.noise2(x / 20, 0 / 20) * 0.3;
    const fineNoise = this.noise3(x / 10, 0 / 10) * 0.2;

    // Combine noise functions for more interesting terrain
    const baseHeight = (baseNoise + detailNoise + fineNoise) * 20;

    // Check for NaN before biome modification
    if (isNaN(baseHeight)) {
      console.error(`NaN detected in WorldGenerator.getHeightAt: baseHeight=${baseHeight}, x=${x}`);
      console.error(`  noise values: baseNoise=${baseNoise}, detailNoise=${detailNoise}, fineNoise=${fineNoise}`);
      return 0; // Return a safe default height to prevent issues
    }

    // Apply biome-specific height modifications if a biome generator is set
    if (this.biomeGenerator) {
      const modifiedHeight = this.biomeGenerator.modifyHeight(x, baseHeight);

      // Check for NaN after biome modification
      if (isNaN(modifiedHeight)) {
        console.error(`NaN detected after biome.modifyHeight: baseHeight=${baseHeight}, modifiedHeight=${modifiedHeight}, x=${x}`);
        return baseHeight; // Fall back to unmodified height
      }

      return modifiedHeight;
    }

    return baseHeight;
  }

  /**
   * Check if an ore should be generated at a specific position
   * This is now called directly by StructureManager rather than through generation rules
   */
  checkOreGeneration(x: number, y: number, ore: OreSettings): boolean {
    // Check if we're in the correct y-level range for this ore
    if (y >= ore.minY && y <= ore.maxY) {
      // First check if this block is surrounded by air (cave check)
      // This prevents floating ores in caves
      if (this.isNearAir(x, y)) {
        return false;
      }

      // Use noise to determine if this should be an ore vein
      const oreNoise = this.oreNoise(x / 20, y / 20); // Increased scale from 10 to 20 for larger ore patches

      // Calculate a unique seed for this ore type for more varied distribution
      // Use a simple hash function to convert ore.id (string) to a number
      const oreSeedValue = this.hashStringToNumber(ore.id);
      const oreTypeNoise = this.oreNoise((x + oreSeedValue) / 30, (y + oreSeedValue) / 30); // Increased scale

      // Combine noises for better distribution - weighted to generate more ores
      const combinedNoise = (oreNoise * 0.6 + oreTypeNoise * 0.4);

      // Adjust rarity threshold to make ores much more common
      // The threshold is now much lower, making it easier to generate ores
      if (combinedNoise > (0.6 - ore.rarity)) {
        // Determine vein size based on a separate noise sample
        const veinSizeFactor = this.oreNoise(x / 5 + 1000, y / 5 + 1000);

        // Fix vein size calculation to properly use min and max values
        const veinSizeRange = ore.maxVeinSize - ore.minVeinSize + 1;
        const veinSize = ore.minVeinSize + Math.floor(veinSizeFactor * veinSizeRange);

        // Check if this block is part of the vein
        const veinNoiseX = this.oreNoise(x / 6, y / 6); // Adjusted scale
        const veinNoiseY = this.oreNoise(x / 6 + 500, y / 6 + 500);

        // Calculate a more stable vein center that doesn't change with each block check
        const regionSize = Math.max(veinSize * 2, 8); // Ensure region is large enough
        const regionX = Math.floor(x / regionSize) * regionSize;
        const regionY = Math.floor(y / regionSize) * regionSize;

        // Use the region to generate a stable vein center
        const veinCenterX = regionX + Math.floor(veinNoiseX * regionSize);
        const veinCenterY = regionY + Math.floor(veinNoiseY * regionSize);

        const distanceToVeinCenter = Math.sqrt(
          Math.pow(x - veinCenterX, 2) +
          Math.pow(y - veinCenterY, 2)
        );

        // Allow for slight variations in vein shape with additional noise
        const veinShapeNoise = this.oreNoise(x / 2 + 200, y / 2 + 200);
        const veinRadius = (veinSize / 2) * (0.85 + veinShapeNoise * 0.3);

        // Larger radius for more ore generation
        const enlargedRadius = veinRadius * 1.5;

        if (distanceToVeinCenter <= enlargedRadius) {
          // Add some randomness to prevent perfect circles
          const edgeNoise = this.oreNoise(x + y, x - y) * 0.3;
          if (distanceToVeinCenter <= enlargedRadius - edgeNoise) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Simple hash function to convert a string to a numeric value
   */
  private hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 2477); // Use modulo to keep the values in a reasonable range
  }

  /**
   * Checks if a block position is near air blocks (caves)
   * @param x - The x coordinate
   * @param y - The y coordinate
   * @returns true if air is detected nearby, false otherwise
   */
  private isNearAir(x: number, y: number): boolean {
    // First, check if the current position is above the surface
    const surfaceHeight = this.getHeightAt(x);
    if (y >= Math.floor(surfaceHeight)) {
      return true; // Above surface is considered "near air"
    }

    // Create a cache for this position check to avoid repeated rule evaluation
    // This is important since we call getTile multiple times which processes all rules
    const positionKey = `${x},${y}`;
    if (!this._airCheckCache) this._airCheckCache = new Map();
    if (this._airCheckCache.has(positionKey)) {
      return this._airCheckCache.get(positionKey) as boolean;
    }

    // Check neighboring blocks for air (0)
    // We use a smaller area (only direct neighbors) to avoid too many restrictions
    const neighbors = [
      { dx: 0, dy: 1 },  // above
      { dx: 0, dy: -1 }, // below
      { dx: 1, dy: 0 },  // right
      { dx: -1, dy: 0 }, // left
    ];

    // We'll use the cave generation rule to more accurately detect caves
    // rather than just checking for air blocks through getTile
    const caveNoise = this.createNoiseFunction('caves', 0.05);

    for (const offset of neighbors) {
      const nx = x + offset.dx;
      const ny = y + offset.dy;

      // Check specific generation rules that would create caves
      // This uses the same threshold as in BlockRules.ts cave generation
      const noiseValue = caveNoise(nx, ny);
      if (noiseValue > 0.7) {
        this._airCheckCache.set(positionKey, true);
        return true;
      }

      // Also check if it's already air through normal rules
      // First check if this neighbor is above the terrain height
      if (ny > Math.floor(this.getHeightAt(nx))) {
        this._airCheckCache.set(positionKey, true);
        return true;
      }
    }

    this._airCheckCache.set(positionKey, false);
    return false;
  }

  // Cache for air block checks to improve performance
  private _airCheckCache: Map<string, boolean> = new Map();

  // Create a new noise function with given parameters
  createNoiseFunction(suffix: string, scale: number = 1): (x: number, y: number) => number {
    const noiseFunc = createNoise2D(alea(this.seed + suffix));
    return (x: number, y: number) => noiseFunc(x * scale, y * scale);
  }
}
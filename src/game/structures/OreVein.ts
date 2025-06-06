import { BaseStructure, StructureProps } from './BaseStructure';
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';
import { BiomeManager } from '../world/BiomeManager';

export interface OreVeinProps extends StructureProps {
  minVeinSize: number;
  maxVeinSize: number;
  minY: number;
  maxY: number;
  minSpaceBetween: number;
  // What block this ore generates in (default is stone)
  inBlock?: string;
  // Reference to BiomeManager to get all biomes dynamically (optional)
  biomeManager?: BiomeManager;
}

export class OreVein extends BaseStructure {
  public readonly minVeinSize: number;
  public readonly maxVeinSize: number;
  public readonly minY: number;
  public readonly maxY: number;
  public readonly minSpaceBetween: number;
  public readonly inBlock: string;

  // Store previously generated vein centers to prevent overlap
  private static veinCache: Map<string, Array<{ x: number, y: number, radius: number }>> = new Map();

  // Noise functions for random generation while maintaining determinism
  private veinSizeNoise: (x: number, y: number) => number;
  private spreadNoise: (x: number, y: number) => number;
  private shapeNoise: (x: number, y: number) => number;

  constructor(props: OreVeinProps) {
    // If biomeManager is provided, get all biome IDs for validBiomes
    // otherwise use provided validBiomes or the default list
    let validBiomes = props.validBiomes;

    if (props.biomeManager) {
      // Get all biome IDs from the BiomeManager
      validBiomes = props.biomeManager.getAllBiomes().map(biome => biome.id);
    } else if (!validBiomes) {
      // Fallback to the default list if neither biomeManager nor validBiomes are provided
      validBiomes = ['plains', 'forest', 'desert', 'swamp', 'snowy_mountains', 'savanna', 'badlands'];
    }

    super({
      ...props,
      validBiomes: validBiomes
    });

    this.minVeinSize = props.minVeinSize;
    this.maxVeinSize = props.maxVeinSize;
    this.minY = props.minY;
    this.maxY = props.maxY;
    this.minSpaceBetween = props.minSpaceBetween || 8;
    this.inBlock = props.inBlock || 'stone';

    // Initialize noise functions with different seeds based on ore ID for consistent but varied generation
    const baseSeed = this.id || 'default';
    this.veinSizeNoise = createNoise2D(alea(baseSeed + '-size'));
    this.spreadNoise = createNoise2D(alea(baseSeed + '-spread'));
    this.shapeNoise = createNoise2D(alea(baseSeed + '-shape'));

    // Initialize vein cache for this ore type if it doesn't exist
    if (!OreVein.veinCache.has(this.id)) {
      OreVein.veinCache.set(this.id, []);
    }
  }

  override canGenerateAt(x: number, y: number, biomeId: string, noiseFn: (x: number) => number): boolean {
    // Check Y-level constraint
    if (y < this.minY || y > this.maxY) {
      return false;
    }

    // Check if the biome is valid
    if (!this.validBiomes.includes(biomeId)) {
      return false;
    }

    // Check for nearby ore veins of the same type to prevent overlap
    const oreVeins = OreVein.veinCache.get(this.id) || [];
    const tooCloseToExistingVein = oreVeins.some(vein => {
      const distance = Math.sqrt(Math.pow(x - vein.x, 2) + Math.pow(y - vein.y, 2));
      // Add small randomness to distance check to create less regular spacing
      const randomSpaceFactor = 0.8 + (this.shapeNoise(x / 10, y / 10) * 0.4);
      return distance < (this.minSpaceBetween + vein.radius) * randomSpaceFactor;
    });

    if (tooCloseToExistingVein) {
      return false;
    }

    // Add more randomness to the ore placement to avoid grid patterns
    // This varies the rarity threshold by position instead of using the same threshold everywhere
    const positionVariance = (this.spreadNoise(x / 25, y / 25) + 1) / 2 * 0.3;
    const effectiveRarity = this.rarity * (0.85 + positionVariance);

    // Use the noise function to determine if an ore should generate based on adjusted rarity
    return noiseFn(x) <= effectiveRarity;
  }

  override generateAt(
    x: number,
    y: number,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn: (x: number, y: number) => string
  ): void {
    // Generate a random value between 0 and 1
    const randomValue = (this.veinSizeNoise(x / 100, y / 100) + 1) / 2;

    // Apply exponential distribution to make larger veins rarer
    // For rare ores (low rarity value), we increase the exponent to make large veins even rarer
    // For common ores (high rarity value), we use a smaller exponent
    const baseExponent = 2.0;
    const rarityFactor = Math.max(0.1, Math.min(1.0, 1.0 - this.rarity)); // Ensures value between 0.1 and 1.0
    const exponent = baseExponent + rarityFactor * 2.0; // Exponent ranges from 2.0 to 4.0
    const exponentialValue = Math.pow(randomValue, exponent);

    // Determine target vein size from min/max range using the exponential distribution
    const targetVeinSize = Math.floor(
      this.minVeinSize + exponentialValue * (this.maxVeinSize - this.minVeinSize + 1)
    );

    // Calculate a working radius for initial approach
    // This is just a starting point - we'll count actual blocks placed
    const workingRadius = Math.ceil(Math.sqrt(targetVeinSize / Math.PI));

    // Register this vein in the cache to prevent overlaps
    const oreVeins = OreVein.veinCache.get(this.id) || [];
    oreVeins.push({ x, y, radius: workingRadius });
    OreVein.veinCache.set(this.id, oreVeins);

    // Generate the vein using a growth algorithm
    const blocksPlaced = new Set<string>();
    const toProcess = [{ x, y }]; // Start with center block

    // Keep placing ore blocks until we reach the target size or run out of valid positions
    while (blocksPlaced.size < targetVeinSize && toProcess.length > 0) {
      // Get the next position to process
      const pos = toProcess.shift()!;
      const posKey = `${pos.x},${pos.y}`;

      // Skip if already processed
      if (blocksPlaced.has(posKey)) continue;

      // Check if this position is valid for ore placement
      if (pos.x < x - workingRadius * 2 || pos.x > x + workingRadius * 2 ||
        pos.y < this.minY || pos.y > this.maxY) {
        continue; // Out of bounds
      }

      // Check if the existing block is the target block type
      const existingBlock = getBlockFn(pos.x, pos.y);
      if (existingBlock === this.inBlock) {
        // Place the ore block
        setBlockFn(pos.x, pos.y, this.id);
        blocksPlaced.add(posKey);

        // Add adjacent blocks to process queue with decreasing probability
        // This creates more natural-looking veins
        const distFromCenter = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
        const spreadChance = 0.85 - (distFromCenter / (workingRadius * 2.5));

        // Consider each neighboring position including diagonals (8-way connectivity)
        // and extended neighbors (knight's moves - 2,1 or 1,2 blocks away)
        const neighbors = [
          // Cardinal directions (direct neighbors)
          { x: pos.x + 1, y: pos.y, isDiagonal: false, isExtended: false },
          { x: pos.x - 1, y: pos.y, isDiagonal: false, isExtended: false },
          { x: pos.x, y: pos.y + 1, isDiagonal: false, isExtended: false },
          { x: pos.x, y: pos.y - 1, isDiagonal: false, isExtended: false },
          // Diagonal directions
          { x: pos.x + 1, y: pos.y + 1, isDiagonal: true, isExtended: false },
          { x: pos.x + 1, y: pos.y - 1, isDiagonal: true, isExtended: false },
          { x: pos.x - 1, y: pos.y + 1, isDiagonal: true, isExtended: false },
          { x: pos.x - 1, y: pos.y - 1, isDiagonal: true, isExtended: false },
          // Extended neighbors (knight's moves) for more natural-looking veins
          { x: pos.x + 2, y: pos.y + 1, isDiagonal: false, isExtended: true },
          { x: pos.x + 2, y: pos.y - 1, isDiagonal: false, isExtended: true },
          { x: pos.x - 2, y: pos.y + 1, isDiagonal: false, isExtended: true },
          { x: pos.x - 2, y: pos.y - 1, isDiagonal: false, isExtended: true },
          { x: pos.x + 1, y: pos.y + 2, isDiagonal: false, isExtended: true },
          { x: pos.x + 1, y: pos.y - 2, isDiagonal: false, isExtended: true },
          { x: pos.x - 1, y: pos.y + 2, isDiagonal: false, isExtended: true },
          { x: pos.x - 1, y: pos.y - 2, isDiagonal: false, isExtended: true }
        ];

        // Randomize neighbor order using noise, but ensure some diagonal neighbors have higher priority
        neighbors.sort((a, b) => {
          // Use different noise scales for variety
          const noiseA = this.spreadNoise(a.x / 15, a.y / 15);
          const noiseB = this.spreadNoise(b.x / 15, b.y / 15);

          // Give diagonals a slight bonus to improve diagonal spread
          const diagBonusA = a.isDiagonal ? 0.2 : 0;
          const diagBonusB = b.isDiagonal ? 0.2 : 0;

          return (noiseB + diagBonusB) - (noiseA + diagBonusA);
        });

        for (const neighbor of neighbors) {
          // Adjust spread chance based on neighbor type
          let adjustedSpreadChance = spreadChance;

          if (neighbor.isDiagonal) {
            // Improve diagonal chance - make it closer to cardinal directions
            adjustedSpreadChance *= 0.9; // Only slightly reduce diagonal chance (was 0.7)
          }

          if (neighbor.isExtended) {
            // Extended neighbors have lower chance but still possible
            adjustedSpreadChance *= 0.5;
          }

          // Decide whether to process this neighbor based on spread chance and noise
          // Use different scales for different neighbor types for more natural patterns
          let noiseScale = 20;
          if (neighbor.isDiagonal) noiseScale = 18;
          if (neighbor.isExtended) noiseScale = 25;

          const neighborNoise = (this.spreadNoise(neighbor.x / noiseScale, neighbor.y / noiseScale) + 1) / 2; // Map to 0-1

          // Use compounding noise for more natural shapes
          const shapeInfluence = (this.shapeNoise(neighbor.x / 30, neighbor.y / 30) + 1) / 2;
          const combinedFactor = (neighborNoise * 0.7 + shapeInfluence * 0.3);

          if (combinedFactor < adjustedSpreadChance) {
            toProcess.push(neighbor);
          }
        }
      }
    }

    // If we didn't place enough blocks, try to fill to minimum size
    if (blocksPlaced.size < this.minVeinSize) {
      const searchRadius = workingRadius * 2;

      // Try to place additional blocks in a wider area
      for (let offsetX = -searchRadius; offsetX <= searchRadius && blocksPlaced.size < this.minVeinSize; offsetX++) {
        for (let offsetY = -searchRadius; offsetY <= searchRadius && blocksPlaced.size < this.minVeinSize; offsetY++) {
          const blockX = x + offsetX;
          const blockY = y + offsetY;
          const posKey = `${blockX},${blockY}`;

          // Skip if already an ore block
          if (blocksPlaced.has(posKey)) continue;

          // Check Y constraints
          if (blockY < this.minY || blockY > this.maxY) continue;

          // Check if it's adjacent to an existing ore block (including diagonals)
          const adjacentPositions = [
            // Cardinal directions
            { x: blockX + 1, y: blockY },
            { x: blockX - 1, y: blockY },
            { x: blockX, y: blockY + 1 },
            { x: blockX, y: blockY - 1 },
            // Diagonal directions
            { x: blockX + 1, y: blockY + 1 },
            { x: blockX + 1, y: blockY - 1 },
            { x: blockX - 1, y: blockY + 1 },
            { x: blockX - 1, y: blockY - 1 }
          ];

          const hasAdjacentOre = adjacentPositions.some(adj => blocksPlaced.has(`${adj.x},${adj.y}`));

          if (hasAdjacentOre) {
            // Check if it can be replaced
            const existingBlock = getBlockFn(blockX, blockY);
            if (existingBlock === this.inBlock) {
              // Use shape noise to add natural variation to the filling process
              // Increase likelihood of filling diagonally during this phase
              const distFromCenter = Math.sqrt(Math.pow(blockX - x, 2) + Math.pow(blockY - y, 2));
              const distanceFactor = 1 - Math.min(distFromCenter / (workingRadius * 2), 1);

              // Combine multiple noise functions for more natural patterns
              const shapeVariation = (this.shapeNoise(blockX / 5, blockY / 5) + 1) / 2;
              const spreadVariation = (this.spreadNoise(blockX / 8, blockY / 8) + 1) / 2;

              // Create a combined factor that favors both distance from center and noise
              const combinedFactor = (shapeVariation * 0.4 + spreadVariation * 0.3 + distanceFactor * 0.3);

              // Higher threshold for adding blocks, make sure vein has enough blocks
              if (combinedFactor > 0.25) {
                setBlockFn(blockX, blockY, this.id);
                blocksPlaced.add(posKey);
              }
            }
          }
        }
      }
    }
  }

  /**
   * Clear the vein cache for regeneration
   */
  public static clearVeinCache(): void {
    OreVein.veinCache.clear();
  }

  /**
   * Clear veins only for a specific chunk
   */
  public static clearVeinCacheForChunk(chunkX: number, chunkSize: number = 16): void {
    const startX = chunkX * chunkSize;
    const endX = startX + chunkSize - 1;

    for (const [oreId, veins] of OreVein.veinCache.entries()) {
      const filteredVeins = veins.filter(vein =>
        vein.x < startX || vein.x > endX
      );
      OreVein.veinCache.set(oreId, filteredVeins);
    }
  }

  /**
   * Debug method to simulate vein size distribution
   * Shows how often different vein sizes will appear with the exponential formula
   */
  public static debugVeinSizeDistribution(minSize: number, maxSize: number, rarity: number = 0.5, samples: number = 1000): { [size: number]: number } {
    const distribution: { [size: number]: number } = {};

    // Initialize all possible sizes with zero count
    for (let size = minSize; size <= maxSize; size++) {
      distribution[size] = 0;
    }

    // Run simulation
    for (let i = 0; i < samples; i++) {
      // Simulate random value between 0 and 1
      const randomValue = Math.random();

      // Apply exponential distribution with the same formula as in generateAt
      const baseExponent = 2.0;
      const rarityFactor = Math.max(0.1, Math.min(1.0, 1.0 - rarity));
      const exponent = baseExponent + rarityFactor * 2.0;
      const exponentialValue = Math.pow(randomValue, exponent);

      // Calculate vein size
      const veinSize = Math.floor(
        minSize + exponentialValue * (maxSize - minSize + 1)
      );

      // Increment count for this size
      distribution[veinSize]++;
    }

    return distribution;
  }
} 
import { WorldGenerator } from './WorldGenerator';
import { BaseStructure } from '../structures/BaseStructure';
import { OreVein } from '../structures/OreVein';
import { PatternStructure } from '../structures/PatternStructure';
import { Cave } from '../structures/Cave';

export class StructureManager {
  private structures: BaseStructure[] = [];
  // Store structure positions globally (not per chunk) to prevent overlap across chunk boundaries
  private structurePositions: Map<string, { x: number, y: number }[]> = new Map();
  private structureNoise: (x: number) => number;
  private oreNoise: (x: number, y: number) => number;
  private caveNoise: (x: number, y: number) => number;
  private readonly chunkSize = 16;

  constructor(private worldGenerator: WorldGenerator) {
    // Create noise functions for structure placement
    const noiseFn = this.worldGenerator.createNoiseFunction('structures', 0.01);
    this.structureNoise = (x: number) => (noiseFn(x, 0) + 1) / 2; // Map to 0-1 range
    this.oreNoise = this.worldGenerator.createNoiseFunction('ores', 0.05);
    this.caveNoise = this.worldGenerator.createNoiseFunction('caves', 0.03);
  }

  registerStructure(structure: BaseStructure): void {
    this.structures.push(structure);
    this.structurePositions.set(structure.id, []);
  }

  /**
   * Clears structure position cache for the chunk being generated
   * We only clear positions for the current chunk's area to maintain structure spacing
   * at chunk boundaries
   */
  clearPositionsForChunk(chunkX?: number): void {
    if (chunkX === undefined) {
      // Reset all structure positions when no specific chunk is provided
      for (const structure of this.structures) {
        this.structurePositions.set(structure.id, []);
      }
      return;
    }

    // Calculate chunk boundaries
    const startX = chunkX * this.chunkSize;
    const endX = startX + this.chunkSize - 1;

    // For each structure type, filter out positions within this chunk
    for (const [structureId, positions] of this.structurePositions.entries()) {
      const filteredPositions = positions.filter(pos =>
        pos.x < startX || pos.x > endX
      );
      this.structurePositions.set(structureId, filteredPositions);
    }
  }

  /**
   * Checks if a structure should be generated at the given position
   * and returns the structure if one should be placed
   */
  getStructureAt(x: number, y: number, biomeId: string): BaseStructure | null {
    // Check surface structures only (not ores)
    for (const structure of this.structures) {
      // Skip ore veins, they're handled separately
      if (structure instanceof OreVein) continue;

      // Check if this structure can generate here
      if (structure.canGenerateAt(x, y, biomeId, this.structureNoise)) {
        // Get existing positions for this structure type
        const existingPositions = this.structurePositions.get(structure.id) || [];

        // For pattern structures, use their calculated width for minimum distance
        let minDistance = structure.minDistance;
        if (structure instanceof PatternStructure) {
          // Use pattern width for minimum distance calculation
          // Add extra spacing to prevent trees from looking too crowded
          minDistance = Math.max(structure.width + 2, minDistance);
        }

        // Add randomness to the minimum distance to create more natural spacing
        const noiseValue = this.structureNoise(x * 0.5);
        const randomizedDistance = minDistance * (1 + noiseValue * 0.5); // Vary by up to 50%

        // Check if this structure is too close to others of the same type
        let tooClose = false;
        for (const pos of existingPositions) {
          const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
          if (distance < randomizedDistance) {
            tooClose = true;
            break;
          }
        }

        // Also check against other structure types (for structures that shouldn't overlap)
        if (!tooClose && structure instanceof PatternStructure) {
          for (const [otherId, positions] of this.structurePositions.entries()) {
            if (otherId !== structure.id) {
              for (const pos of positions) {
                const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                if (distance < minDistance * 0.75) { // Some overlap is allowed between different types
                  tooClose = true;
                  break;
                }
              }
            }
            if (tooClose) break;
          }
        }

        if (!tooClose) {
          // Add this position to the list of structure positions
          existingPositions.push({ x, y });
          this.structurePositions.set(structure.id, existingPositions);
          return structure;
        }
      }
    }

    return null;
  }

  /**
   * Check if an ore vein should be generated at the given position
   */
  getOreAt(x: number, y: number, biomeId: string): OreVein | null {
    // Add randomness to position check to break up grid patterns
    // Only process ~70% of positions to create more natural distribution
    const positionCheckNoise = this.oreNoise(x / 5, y / 5);
    if (positionCheckNoise > 0.7) {
      return null;
    }

    for (const structure of this.structures) {
      // Only process ore veins
      if (!(structure instanceof OreVein)) continue;

      // Create a more complex noise-based check function for this position
      // that varies with both x and y coordinates
      const oreCheckNoise = (xPos: number) => {
        // Create a mixed noise using both coordinates and the ore position
        const noise1 = this.structureNoise(x + y * 100 + xPos);
        const noise2 = this.oreNoise(x / 20, y / 20);

        // Mix the noises to break the regularity
        return (noise1 * 0.7 + noise2 * 0.3);
      };

      // Check if this ore can generate here
      if (structure.canGenerateAt(x, y, biomeId, oreCheckNoise)) {
        return structure as OreVein;
      }
    }

    return null;
  }

  /**
   * Check if a cave should be generated at the given position
   */
  getCaveAt(x: number, y: number, biomeId: string): Cave | null {
    // Use a different noise pattern for caves to avoid grid-like patterns
    const positionCheckNoise = this.caveNoise(x / 10, y / 10);
    // Increase the threshold to make caves less frequent
    if (positionCheckNoise > 0.7) {
      return null;
    }

    // Further reduce cave frequency with depth-based probability
    if (y > -40) {
      // Near surface - reduce frequency
      const depthFactor = 0.8 - (Math.abs(y) / 50);
      if (Math.random() < depthFactor) {
        return null;
      }
    }

    for (const structure of this.structures) {
      // Only process cave structures
      if (!(structure instanceof Cave)) continue;

      // Create a noise-based check function for this position
      const caveCheckNoise = (xPos: number) => {
        // Use a mix of noise functions for more natural cave distribution
        const noise1 = this.structureNoise(x + y * 50 + xPos);
        const noise2 = this.caveNoise(x / 40, y / 40);
        // Reduce the overall noise value to make caves less frequent
        return (noise1 * 0.6 + noise2 * 0.4) * 0.7;
      };

      // Check if a cave can generate here
      if (structure.canGenerateAt(x, y, biomeId, caveCheckNoise)) {
        return structure as Cave;
      }
    }

    return null;
  }

  /**
   * Generate a structure at the given position
   */
  generateStructureAt(
    x: number,
    y: number,
    structure: BaseStructure,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn?: (x: number, y: number) => string
  ): void {
    if (structure instanceof OreVein || structure instanceof Cave) {
      // Ore veins and caves need the block-checking function
      if (getBlockFn) {
        structure.generateAt(x, y, setBlockFn, getBlockFn);
      } else {
        console.error("Block check function required for ore vein or cave generation");
      }
    } else {
      // Other structures don't need the getBlockFn
      structure.generateAt(x, y, setBlockFn);
    }
  }

  /**
   * Debug utility to check which structures can generate in which biomes
   */
  public logBiomeStructureCompatibility(biomes: string[]): void {
    console.log("Structure-Biome Compatibility:");
    console.log("---------------------------------");

    if (this.structures.length === 0) {
      console.error("No structures registered!");
      return;
    }

    console.log(`Available biomes: [${biomes.join(", ")}]`);

    // Check each structure against available biomes
    for (const structure of this.structures) {
      const compatibleBiomes = structure.validBiomes.filter(biomeId =>
        biomes.includes(biomeId)
      );

      console.log(`Structure "${structure.id}" (rarity: ${structure.rarity})`);
      console.log(`  Valid biomes: [${structure.validBiomes.join(", ")}]`);
      console.log(`  Compatible with available biomes: [${compatibleBiomes.join(", ")}]`);
      console.log(`  Will generate in: ${compatibleBiomes.length > 0 ? "YES" : "NO"}`);
      console.log("---");
    }
  }
} 
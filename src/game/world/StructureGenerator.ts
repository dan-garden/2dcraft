import { WorldGenerator } from './WorldGenerator';

export interface StructureDefinition {
  id: string;
  name: string;
  // Rarity between 0 and 1, where 0 is most rare
  rarity: number;
  // Minimum distance between structures of the same type
  minDistance: number;
  // Biome IDs where this structure can generate
  validBiomes: string[];
  // Block pattern defining the structure
  pattern: string[][];
  // Y offset to place the structure relative to the surface
  yOffset: number;
}

export class StructureGenerator {
  private structures: StructureDefinition[] = [];
  private structurePositions: Map<string, { x: number, y: number }[]> = new Map();
  private structureNoise: (x: number, y: number) => number;

  constructor(private worldGenerator: WorldGenerator) {
    this.structureNoise = this.createPositionNoise();
  }

  registerStructure(structure: StructureDefinition): void {
    this.structures.push(structure);
    this.structurePositions.set(structure.id, []);
  }

  /**
   * Clears structure position cache for a specific chunk
   * This should be called before generating structures in a new chunk
   */
  clearPositionsForChunk(chunkX: number): void {
    // Minimal debug - only log if no structures
    if (this.structures.length === 0) {
      // Only log once per session
      if (!this._hasLoggedClearWarning) {
        console.warn("No structures registered when clearing positions for chunk!");
        this._hasLoggedClearWarning = true;
      }
    }

    // Initialize empty arrays for all structures to ensure clean start for this chunk
    for (const structure of this.structures) {
      this.structurePositions.set(structure.id, []);
    }
  }

  /**
   * Checks if a structure should be generated at the given position
   * and returns the structure definition if so
   */
  getStructureAt(x: number, y: number, biomeId: string): StructureDefinition | null {
    // Check number of registered structures
    if (this.structures.length === 0) {
      // Only log once per session
      if (!this._hasLoggedStructureWarning) {
        console.warn("No structures registered for generation");
        this._hasLoggedStructureWarning = true;
      }
      return null;
    }

    // Check each registered structure
    for (const structure of this.structures) {
      // Skip if this biome is not valid for this structure
      if (!structure.validBiomes.includes(biomeId)) {
        continue;
      }

      // Use noise to determine if a structure should generate here
      const noiseValue = this.getSeedForPosition(x);

      // Check rarity against the noise value - higher rarity means more common
      if (noiseValue <= structure.rarity) {
        // Check minimum distance to other structures of the same type
        const existingPositions = this.structurePositions.get(structure.id) || [];

        let tooClose = false;
        for (const pos of existingPositions) {
          const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
          if (distance < structure.minDistance) {
            tooClose = true;
            break;
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
   * Places a structure in the world
   */
  placeStructure(x: number, y: number, structure: StructureDefinition, setBlockFn: (x: number, y: number, blockId: string) => void): void {
    // The y parameter is already the surface height
    // We don't need to recalculate it, just use the provided y value

    // Calculate the base Y position for the structure by adding the structure's offset
    const baseY = y + structure.yOffset;

    // Safety check for NaN in baseY
    if (isNaN(baseY)) {
      console.error(`NaN detected in baseY for structure placement: x=${x}, y=${y}, yOffset=${structure.yOffset}`);
      return;
    }

    // Pre-check if the entire structure will fit in the target area
    // Calculate structure dimensions
    const structureHeight = structure.pattern.length;
    const structureWidth = Math.max(...structure.pattern.map(row => row.length));

    // Calculate world bounds of the structure
    const minWorldX = x - Math.floor(structureWidth / 2);
    const maxWorldX = x + Math.ceil(structureWidth / 2) - 1;
    const maxWorldY = baseY + structureHeight - 1;

    // Loop through the structure pattern and place blocks
    for (let patternY = 0; patternY < structure.pattern.length; patternY++) {
      const row = structure.pattern[patternY];
      for (let patternX = 0; patternX < row.length; patternX++) {
        const blockId = row[patternX];
        if (blockId !== 'air') { // Skip air blocks
          // Calculate world coordinates - center horizontally
          const worldX = x + patternX - Math.floor(row.length / 2);
          const worldY = baseY + (structure.pattern.length - 1 - patternY); // Invert Y to match pattern orientation

          // Safety check for NaN in coordinates
          if (isNaN(worldX) || isNaN(worldY)) {
            console.error(`NaN detected in calculated coordinates: worldX=${worldX}, worldY=${worldY}`);
            continue;
          }

          // Place the block
          setBlockFn(worldX, worldY, blockId);
        }
      }
    }
  }

  /**
   * Creates a deterministic noise function for structure positions
   */
  private createPositionNoise(): (x: number, y: number) => number {
    // Use the world generator's utility for creating noise functions
    if (!this.worldGenerator) {
      console.error("WorldGenerator reference is undefined in StructureGenerator!");
      // Return a simple deterministic function as fallback
      return (x, y) => Math.sin(x * 0.1) * 0.5 + 0.5;
    }

    if (!this.worldGenerator.createNoiseFunction) {
      console.error("createNoiseFunction method is missing from WorldGenerator!");
      // Return a simple deterministic function as fallback
      return (x, y) => Math.sin(x * 0.1) * 0.5 + 0.5;
    }

    return this.worldGenerator.createNoiseFunction('structures', 0.01);
  }

  /**
   * Gets a seed value for the given position
   */
  private getSeedForPosition(x: number): number {
    // Use a larger scale for structures to make them more spread out
    const scaledX = Math.floor(x / 16);

    // Check if noise function is defined
    if (!this.structureNoise) {
      if (!this._hasLoggedNoiseWarning) {
        console.error("Structure noise function is undefined!");
        this._hasLoggedNoiseWarning = true;
      }
      return 0;
    }

    // Map the noise from [-1, 1] to [0, 1] range to properly compare with rarity
    return (this.structureNoise(scaledX, 0) + 1) / 2;
  }

  // Private flags to prevent log spamming
  private _hasLoggedStructureWarning: boolean = false;
  private _hasLoggedClearWarning: boolean = false;
  private _hasLoggedNoiseWarning: boolean = false;

  // Debug utility to check which structures can generate in which biomes
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
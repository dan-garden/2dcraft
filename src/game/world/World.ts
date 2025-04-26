import { Chunk } from './Chunk';
import { WorldGenerator } from './WorldGenerator';
import { BiomeGenerator } from './BiomeGenerator';
import { StructureGenerator } from './StructureGenerator';
import { Block } from '../blocks/Block';
import { blockRegistry } from '../blocks';
import { initializeWorldGeneration } from './WorldGeneration';

export class World {
  private generators: {
    worldGenerator: WorldGenerator;
    biomeGenerator: BiomeGenerator;
    structureGenerator: StructureGenerator;
  };
  private chunks = new Map<string, Chunk>();
  private modifiedBlocks = new Map<string, number>(); // Only store modified blocks
  private readonly WORLD_HEIGHT = 256;
  private readonly WORLD_BOTTOM = -120; // Bottom limit where bedrock starts
  private readonly CHUNK_RENDER_DISTANCE = 3; // Number of chunks in each direction
  private debugMode = false;

  // Store player position to detect significant movement
  private lastPlayerChunkX = 0;
  private lastPlayerChunkY = 0;
  private isFirstUpdate = true; // Add flag to track first update
  private readonly CHUNK_UPDATE_THRESHOLD = 1; // How many chunks player needs to move before regenerating

  constructor(seed: string) {
    // Initialize the world with the new modular generation system
    this.generators = initializeWorldGeneration(seed);

    // Verify structure generator initialization
    if (!this.generators.structureGenerator) {
      console.error("Structure generator was not initialized in World constructor!");
    } else {
      // Try to check if any structures are registered
      try {
        // @ts-ignore - accessing private property for debugging
        const structureCount = this.generators.structureGenerator.structures?.length || 0;
        console.log(`World initialized with ${structureCount} registered structures`);
      } catch (error) {
        console.error("Unable to verify structure count:", error);
      }
    }
  }

  private blockKey(x: number, y: number) {
    return `${x},${y}`;
  }

  private chunkKey(x: number, y: number) {
    return `${x},${y}`;
  }

  private worldToChunkCoords(x: number, y: number): { chunkX: number, chunkY: number, localX: number, localY: number } {
    const chunkX = Math.floor(x / Chunk.SIZE);
    const chunkY = Math.floor(y / Chunk.SIZE);
    const localX = ((x % Chunk.SIZE) + Chunk.SIZE) % Chunk.SIZE; // Handle negative coordinates
    const localY = ((y % Chunk.SIZE) + Chunk.SIZE) % Chunk.SIZE;
    return { chunkX, chunkY, localX, localY };
  }

  public update(playerX: number, playerY: number) {
    // Convert player position to chunk coordinates
    const { chunkX, chunkY } = this.worldToChunkCoords(playerX, playerY);

    // Calculate how far the player has moved in chunks
    const chunkDistanceX = Math.abs(chunkX - this.lastPlayerChunkX);
    const chunkDistanceY = Math.abs(chunkY - this.lastPlayerChunkY);

    // Only regenerate chunks if:
    // 1. This is the first update ever, OR
    // 2. Player has moved at least CHUNK_UPDATE_THRESHOLD chunks
    if (this.isFirstUpdate ||
      chunkDistanceX >= this.CHUNK_UPDATE_THRESHOLD ||
      chunkDistanceY >= this.CHUNK_UPDATE_THRESHOLD) {

      // Update last position
      this.lastPlayerChunkX = chunkX;
      this.lastPlayerChunkY = chunkY;
      this.isFirstUpdate = false; // Mark that we've done the first update

      // Clear old chunks that are now outside the render distance
      const chunksToRemove: string[] = [];

      for (const [key, chunk] of this.chunks.entries()) {
        const chunkDistX = Math.abs(chunk.x - chunkX);
        const chunkDistY = Math.abs(chunk.y - chunkY);

        if (chunkDistX > this.CHUNK_RENDER_DISTANCE || chunkDistY > this.CHUNK_RENDER_DISTANCE) {
          chunksToRemove.push(key);
        }
      }

      // Remove chunks outside render distance
      for (const key of chunksToRemove) {
        this.chunks.delete(key);
      }

      // Only generate new chunks, don't regenerate existing ones
      for (let x = chunkX - this.CHUNK_RENDER_DISTANCE; x <= chunkX + this.CHUNK_RENDER_DISTANCE; x++) {
        for (let y = chunkY - this.CHUNK_RENDER_DISTANCE; y <= chunkY + this.CHUNK_RENDER_DISTANCE; y++) {
          const key = this.chunkKey(x, y);
          if (!this.chunks.has(key)) {
            this.getChunkAt(x, y);
          }
        }
      }

      if (this.debugMode) {
        console.log(`Updated chunks around player at chunk (${chunkX}, ${chunkY})`);
        console.log(`Removed ${chunksToRemove.length} out-of-range chunks, total active chunks: ${this.chunks.size}`);
      }
    }
  }

  private getChunkAt(chunkX: number, chunkY: number): Chunk {
    const key = this.chunkKey(chunkX, chunkY);

    if (!this.chunks.has(key)) {
      // Generate a new chunk if it doesn't exist
      const chunk = new Chunk(chunkX, chunkY, this.generators);
      this.chunks.set(key, chunk);
      return chunk;
    }

    return this.chunks.get(key)!;
  }

  public getChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }

  public getBlockAt(x: number, y: number): Block {
    // Check modified blocks first
    const blockKey = this.blockKey(x, y);
    if (this.modifiedBlocks.has(blockKey)) {
      const blockId = this.modifiedBlocks.get(blockKey)!;
      if (this.debugMode) {
        // console.log(`Getting modified block at (${x}, ${y}): ID=${blockId}, key=${blockKey}`);
      }
      return blockRegistry.getById(blockId);
    }

    // Return air if above world height
    if (y >= this.WORLD_HEIGHT) {
      if (this.debugMode) {
        // console.log(`Block at (${x}, ${y}) is above world height, returning air`);
      }
      return blockRegistry.getById(0);
    }

    // Return bedrock if below world bottom
    if (y <= this.WORLD_BOTTOM) {
      if (this.debugMode) {
        // console.log(`Block at (${x}, ${y}) is below world bottom, returning bedrock`);
      }
      return blockRegistry.getById(30); // Bedrock
    }

    // Get the block from the correct chunk
    const { chunkX, chunkY, localX, localY } = this.worldToChunkCoords(x, y);
    const chunk = this.getChunkAt(chunkX, chunkY);
    const blockId = chunk.data[localY][localX];

    if (this.debugMode) {
      // console.log(`Getting generated block at (${x}, ${y}): ID=${blockId}, chunk=(${chunkX},${chunkY}), local=(${localX},${localY})`);
    }

    return blockRegistry.getById(blockId);
  }

  public setBlockAt(x: number, y: number, blockId: number) {
    const blockKey = this.blockKey(x, y);

    // Get existing block ID for logging
    let existingBlockId = -1;
    if (this.modifiedBlocks.has(blockKey)) {
      existingBlockId = this.modifiedBlocks.get(blockKey)!;
    } else {
      // Get from chunk
      const { chunkX, chunkY, localX, localY } = this.worldToChunkCoords(x, y);
      const chunk = this.getChunkAt(chunkX, chunkY);
      existingBlockId = chunk.data[localY][localX];
    }

    if (this.debugMode) {
      const oldBlock = blockRegistry.getById(existingBlockId);
      const newBlock = blockRegistry.getById(blockId);
      // console.log(`Setting block at (${x}, ${y}) from ${oldBlock.name} (ID=${existingBlockId}) to ${newBlock.name} (ID=${blockId})`);
    }

    // Update the modified blocks map
    this.modifiedBlocks.set(blockKey, blockId);

    // Also update the chunk data if the chunk exists
    const { chunkX, chunkY, localX, localY } = this.worldToChunkCoords(x, y);
    const key = this.chunkKey(chunkX, chunkY);

    if (this.chunks.has(key)) {
      const chunk = this.chunks.get(key)!;
      chunk.data[localY][localX] = blockId;

      if (this.debugMode) {
        // console.log(`Updated chunk data at (${chunkX}, ${chunkY}), local (${localX}, ${localY})`);
      }
    } else if (this.debugMode) {
      // console.log(`Chunk (${chunkX}, ${chunkY}) not loaded, only modifiedBlocks updated`);
    }
  }

  public getModifiedBlocks(): Map<string, number> {
    return this.modifiedBlocks;
  }

  public clearModifiedBlocks() {
    this.modifiedBlocks.clear();
  }

  // New methods to access the generators
  public getWorldGenerator(): WorldGenerator {
    return this.generators.worldGenerator;
  }

  public getBiomeGenerator(): BiomeGenerator {
    return this.generators.biomeGenerator;
  }

  public getStructureGenerator(): StructureGenerator {
    return this.generators.structureGenerator;
  }

  // Generate a structure at the specified location
  public generateStructure(structureId: string, x: number, y: number): boolean {
    const biome = this.generators.biomeGenerator.getBiomeAt(x, 0); // Only use x for biome determination

    // Place the structure directly
    const structure = this.generators.structureGenerator.getStructureAt(x, y, biome.id);
    if (!structure) return false;

    // If we want a specific structure, override the one found by coordinates
    const structureToPlace = structureId ?
      this.generators.structureGenerator['structures'].find(s => s.id === structureId) :
      structure;

    if (!structureToPlace) return false;

    // Place the structure
    this.generators.structureGenerator.placeStructure(
      x, y, structureToPlace,
      (worldX, worldY, blockId) => this.setBlockAt(worldX, worldY, blockId)
    );

    return true;
  }

  // Get smoothed terrain height at a specific position
  public getTerrainHeightAt(x: number): number {
    const generator = this.generators.worldGenerator;
    // This will use the biome-aware height calculation with transitions
    return generator.getHeightAt(x);
  }

  // Debug methods for visualizing the terrain transitions
  public debugHeightProfile(startX: number, endX: number): Array<[number, number]> {
    return this.generators.biomeGenerator.debugHeightProfile(startX, endX);
  }

  public debugBiomeBoundaries(startX: number, endX: number): Array<[number, string]> {
    return this.generators.biomeGenerator.debugBiomeBoundaries(startX, endX);
  }

  // Method to handle debug toggle event from InputController
  public handleDebugToggle(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`World debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
  }

  // Debug method to diagnose structure generation issues
  public debugStructureSystem(): void {
    console.log("Structure System Debug");
    console.log("=====================");

    if (!this.generators.structureGenerator) {
      console.error("Structure generator is undefined!");
      return;
    }

    try {
      // @ts-ignore - accessing private property for debugging
      const structures = this.generators.structureGenerator.structures || [];
      console.log(`Registered structures: ${structures.length}`);

      if (structures.length === 0) {
        console.error("No structures are registered!");
      } else {
        // Get all biome IDs from biome generator
        const biomes = this.generators.biomeGenerator.getAllBiomes();
        const biomeIds = biomes.map(b => b.id);

        // Use the compatibility checker
        this.generators.structureGenerator.logBiomeStructureCompatibility(biomeIds);
      }
    } catch (error) {
      console.error("Error during structure debug:", error);
    }
  }
}
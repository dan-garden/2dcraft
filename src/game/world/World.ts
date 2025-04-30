import { Chunk } from './Chunk';
import { WorldGenerator } from './WorldGenerator';
import { BiomeManager } from './BiomeManager';
import { StructureManager } from './StructureManager';
import { Block } from '../blocks/Block';
import { blockRegistry } from '../blocks';
import { initializeWorldGeneration } from './WorldGeneration';

export class World {
  private generators: {
    worldGenerator: WorldGenerator;
    biomeManager: BiomeManager;
    structureManager: StructureManager;
  };
  private chunks = new Map<string, Chunk>();
  private modifiedBlocks = new Map<string, string>(); // Only store modified blocks
  private breakingStates = new Map<string, { progress: number, isBeingBroken: boolean }>(); // Store breaking state per position
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

    // Verify structure manager initialization
    if (!this.generators.structureManager) {
      console.error("Structure manager was not initialized in World constructor!");
    } else {
      // Try to check if any structures are registered
      try {
        // @ts-ignore - accessing private property for debugging
        const structureCount = this.generators.structureManager.structures?.length || 0;
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
      return blockRegistry.getById('air');
    }

    // Return bedrock if below world bottom
    if (y <= this.WORLD_BOTTOM) {
      if (this.debugMode) {
        // console.log(`Block at (${x}, ${y}) is below world bottom, returning bedrock`);
      }
      return blockRegistry.getById('bedrock'); // Bedrock
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

  public setBlockAt(x: number, y: number, blockId: string) {
    const blockKey = this.blockKey(x, y);

    // Get existing block ID for logging
    let existingBlockId = '';
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

  public getModifiedBlocks(): Map<string, string> {
    return this.modifiedBlocks;
  }

  public clearModifiedBlocks() {
    this.modifiedBlocks.clear();
  }

  // New methods to access the generators
  public getWorldGenerator(): WorldGenerator {
    return this.generators.worldGenerator;
  }

  public getBiomeManager(): BiomeManager {
    return this.generators.biomeManager;
  }

  public getStructureManager(): StructureManager {
    return this.generators.structureManager;
  }

  // Backwards compatibility methods for compatibility with older code
  public getBiomeGenerator(): BiomeManager {
    return this.generators.biomeManager;
  }

  public getStructureGenerator(): StructureManager {
    return this.generators.structureManager;
  }

  // Generate a structure at the specified location
  public generateStructure(structureId: string, x: number, y: number): boolean {
    const biome = this.generators.biomeManager.getBiomeAt(x, 0); // Only use x for biome determination

    // If a specific structure ID is provided, find that structure
    let structureToPlace = null;
    if (structureId) {
      // @ts-ignore - accessing private property for debugging
      structureToPlace = this.generators.structureManager.structures?.find(s => s.id === structureId);
    }

    if (!structureToPlace) {
      // If no structure found or no ID provided, check if one should generate here
      structureToPlace = this.generators.structureManager.getStructureAt(x, y, biome.id);
    }

    if (!structureToPlace) return false;

    // Place the structure
    this.generators.structureManager.generateStructureAt(
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
    const result: Array<[number, number]> = [];
    const generator = this.generators.worldGenerator;

    // Sample heights at regular intervals
    for (let x = startX; x <= endX; x++) {
      const height = generator.getHeightAt(x);
      result.push([x, height]);
    }

    return result;
  }

  public debugBiomeBoundaries(startX: number, endX: number): Array<[number, string]> {
    const result: Array<[number, string]> = [];
    const CHUNK_SIZE = 16;
    const sampled: { [key: number]: boolean } = {};

    // Sample biomes at regular intervals
    for (let x = startX; x <= endX; x++) {
      const chunkX = Math.floor(x / CHUNK_SIZE);

      // Only sample once per chunk to detect boundaries
      if (!sampled[chunkX]) {
        const biome = this.generators.biomeManager.getBiomeForChunk(chunkX);
        result.push([x, biome.id]);
        sampled[chunkX] = true;
      }

      // Also mark chunk boundaries
      if (x % CHUNK_SIZE === 0) {
        result.push([x, "BOUNDARY"]);
      }
    }

    return result;
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

    if (!this.generators.structureManager) {
      console.error("Structure manager is undefined!");
      return;
    }

    try {
      // @ts-ignore - accessing private property for debugging
      const structures = this.generators.structureManager.structures || [];
      console.log(`Registered structures: ${structures.length}`);

      if (structures.length === 0) {
        console.error("No structures are registered!");
      } else {
        // Get all biome IDs from biome manager
        const biomes = this.generators.biomeManager.getAllBiomes();
        const biomeIds = biomes.map(b => b.id);

        // Log structure-biome compatibility if available
        // @ts-ignore - might not have this method
        if (typeof this.generators.structureManager.logBiomeStructureCompatibility === 'function') {
          this.generators.structureManager.logBiomeStructureCompatibility(biomeIds);
        } else {
          console.log(`Available biomes: [${biomeIds.join(", ")}]`);
          console.log("No compatibility checking method available in structure manager");
        }
      }
    } catch (error) {
      console.error("Error during structure debug:", error);
    }
  }

  /**
   * Updates the light emission value for a block at the specified position
   * @param x X coordinate
   * @param y Y coordinate
   * @param lightValue New light emission value (0-15)
   */
  public updateBlockLightAt(x: number, y: number, lightValue: number): void {
    // Clamp light value between 0 and 15
    const clampedValue = Math.max(0, Math.min(15, lightValue));

    // Get the block at this position
    const blockId = this.getBlockAt(x, y).id;
    if (blockId === 'air') return; // Don't update air blocks

    // For now, just record that this block's light has changed
    // In a more complete implementation, you would update the block's
    // light value in the chunk data and propagate light changes
    console.log(`Updated light for block at ${x},${y} to ${clampedValue}`);

    // Mark this block as modified so it gets re-rendered
    const key = `${x},${y}`;
    if (!this.modifiedBlocks.has(key)) {
      this.modifiedBlocks.set(key, blockId);
    }
  }

  public getBlockBreakingState(x: number, y: number): { progress: number, isBeingBroken: boolean } {
    const key = this.blockKey(x, y);
    return this.breakingStates.get(key) || { progress: 0, isBeingBroken: false };
  }

  public setBlockBreakingState(x: number, y: number, progress: number, isBeingBroken: boolean): void {
    const key = this.blockKey(x, y);
    if (progress === 0 && !isBeingBroken) {
      this.breakingStates.delete(key);
    } else {
      this.breakingStates.set(key, { progress, isBeingBroken });
    }
  }

  public resetBlockBreakingState(x: number, y: number): void {
    const key = this.blockKey(x, y);
    this.breakingStates.delete(key);
  }
}
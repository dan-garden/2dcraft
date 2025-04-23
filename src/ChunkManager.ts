import { Application, Container, Sprite } from 'pixi.js';
import { Chunk } from './Chunk';
import { CHUNK_SIZE, TILE_SIZE, WORLD_HEIGHT } from './constants';

// Direction constants for player movement
const DIRECTION = {
  NONE: 0,
  UP: 1,
  RIGHT: 2,
  DOWN: 3,
  LEFT: 4
};

export class ChunkManager {
  app: Application;
  noise2D: (x: number, y: number) => number;
  chunks: Map<string, Chunk>;
  visibleChunks: Set<string>;
  chunksToGenerate: { x: number, y: number }[];
  worldContainer: Container;

  // New variables to track player and movement
  private lastPlayerChunkX: number = 0;
  private lastPlayerChunkY: number = 0;
  private playerDirection: number = DIRECTION.NONE;

  constructor(app: Application, noise2D: (x: number, y: number) => number) {
    this.app = app;
    this.noise2D = noise2D;
    this.chunks = new Map();
    this.visibleChunks = new Set();
    this.chunksToGenerate = [];

    // Create a container for all world objects
    this.worldContainer = new Container();
    app.stage.addChild(this.worldContainer);
  }

  /**
   * Get a chunk key string from coordinates
   */
  getChunkKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Get or create chunk at specified coordinates
   */
  getChunk(x: number, y: number): Chunk {
    const key = this.getChunkKey(x, y);
    if (!this.chunks.has(key)) {
      // Create new chunk
      const chunk = new Chunk(x, y, this.noise2D);
      this.chunks.set(key, chunk);
      return chunk;
    }
    return this.chunks.get(key)!;
  }

  /**
   * Queue a chunk to be generated
   */
  queueChunk(x: number, y: number): void {
    // Check if chunk already exists
    const key = this.getChunkKey(x, y);
    if (this.chunks.has(key)) {
      return;
    }

    // Check if chunk is already in queue
    if (!this.chunksToGenerate.some(chunk => chunk.x === x && chunk.y === y)) {
      this.chunksToGenerate.push({ x, y });
    }
  }

  /**
   * Force load chunks in an area around a position
   */
  forceLoadChunksAroundPosition(worldX: number, worldY: number): void {
    const centerChunkX = Math.floor(worldX / (CHUNK_SIZE * TILE_SIZE));
    const centerChunkY = Math.floor(worldY / (CHUNK_SIZE * TILE_SIZE));

    console.log(`Force loading chunks around (${centerChunkX}, ${centerChunkY})`);

    // Generate a 7x7 area of chunks around the player
    const viewDistance = 3; // 3 chunks in each direction (7x7 area)

    for (let y = centerChunkY - viewDistance; y <= centerChunkY + viewDistance; y++) {
      for (let x = centerChunkX - viewDistance; x <= centerChunkX + viewDistance; x++) {
        const key = this.getChunkKey(x, y);

        // If the chunk doesn't exist, create and generate it immediately
        if (!this.chunks.has(key)) {
          const chunk = new Chunk(x, y, this.noise2D);
          chunk.generate();

          // Make sure to create the texture
          chunk.createTexture(this.app);

          this.chunks.set(key, chunk);

          // Add the chunk to visible set and add its sprite to the world
          this.visibleChunks.add(key);
          if (chunk.sprite) {
            // Position the chunk in world coordinates
            const worldPosX = x * CHUNK_SIZE * TILE_SIZE;
            const worldPosY = y * CHUNK_SIZE * TILE_SIZE;
            chunk.sprite.position.set(worldPosX, worldPosY);
            this.worldContainer.addChild(chunk.sprite);
          }

          console.log(`Force generated chunk at (${x}, ${y})`);
        }
      }
    }

    // Update player's last chunk position
    this.lastPlayerChunkX = centerChunkX;
    this.lastPlayerChunkY = centerChunkY;
  }

  /**
   * Update player direction based on their movement
   */
  updatePlayerDirection(playerX: number, playerY: number, vx: number, vy: number): void {
    const playerChunkX = Math.floor(playerX / (CHUNK_SIZE * TILE_SIZE));
    const playerChunkY = Math.floor(playerY / (CHUNK_SIZE * TILE_SIZE));

    // Update direction based on velocity
    if (Math.abs(vx) > Math.abs(vy)) {
      this.playerDirection = vx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else if (Math.abs(vy) > 0) {
      this.playerDirection = vy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    } else {
      this.playerDirection = DIRECTION.NONE;
    }

    // If player moved to a new chunk, prioritize chunk generation in that direction
    if (playerChunkX !== this.lastPlayerChunkX || playerChunkY !== this.lastPlayerChunkY) {
      this.prioritizeChunksInDirection(playerChunkX, playerChunkY);
      this.lastPlayerChunkX = playerChunkX;
      this.lastPlayerChunkY = playerChunkY;
    }
  }

  /**
   * Prioritize chunk generation in the player's movement direction
   */
  prioritizeChunksInDirection(playerChunkX: number, playerChunkY: number): void {
    // Get extra distance in the direction of movement
    let extraX = 0;
    let extraY = 0;

    switch (this.playerDirection) {
      case DIRECTION.UP:
        extraY = -2;
        break;
      case DIRECTION.RIGHT:
        extraX = 2;
        break;
      case DIRECTION.DOWN:
        extraY = 2;
        break;
      case DIRECTION.LEFT:
        extraX = -2;
        break;
    }

    // Immediately generate chunks in the direction of movement
    if (extraX !== 0 || extraY !== 0) {
      for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
          const chunkX = playerChunkX + extraX + x;
          const chunkY = playerChunkY + extraY + y;
          const key = this.getChunkKey(chunkX, chunkY);

          if (!this.chunks.has(key)) {
            // Move this chunk to the front of the queue
            this.chunksToGenerate = this.chunksToGenerate.filter(
              chunk => !(chunk.x === chunkX && chunk.y === chunkY)
            );
            this.chunksToGenerate.unshift({ x: chunkX, y: chunkY });
          }
        }
      }
    }
  }

  /**
   * Process a number of chunks from the generation queue
   */
  processChunkQueue(count: number): void {
    for (let i = 0; i < count && this.chunksToGenerate.length > 0; i++) {
      const { x, y } = this.chunksToGenerate.shift()!;
      const key = this.getChunkKey(x, y);

      // Skip if chunk was created while in queue
      if (this.chunks.has(key)) {
        continue;
      }

      console.log(`Processing chunk at (${x}, ${y})`);

      // Create and generate the chunk
      const chunk = new Chunk(x, y, this.noise2D);
      chunk.generate();

      // Create the texture after generating the chunk
      chunk.createTexture(this.app);

      this.chunks.set(key, chunk);

      // If chunk is visible, add to visible set and add sprite to world
      if (this.isChunkVisible(x, y)) {
        this.visibleChunks.add(key);
        if (chunk.sprite) {
          // Position the chunk in world coordinates
          const worldPosX = x * CHUNK_SIZE * TILE_SIZE;
          const worldPosY = y * CHUNK_SIZE * TILE_SIZE;
          chunk.sprite.position.set(worldPosX, worldPosY);
          this.worldContainer.addChild(chunk.sprite);
        }
      }
    }
  }

  /**
   * Check if a chunk should be visible based on camera position
   */
  isChunkVisible(chunkX: number, chunkY: number, cameraX: number = 0, cameraY: number = 0): boolean {
    // Calculate screen bounds in chunk coordinates
    const screenLeft = cameraX / (CHUNK_SIZE * TILE_SIZE);
    const screenRight = (cameraX + this.app.screen.width) / (CHUNK_SIZE * TILE_SIZE);
    const screenTop = cameraY / (CHUNK_SIZE * TILE_SIZE);
    const screenBottom = (cameraY + this.app.screen.height) / (CHUNK_SIZE * TILE_SIZE);

    // Add a buffer of 1 chunk in each direction
    return (
      chunkX >= Math.floor(screenLeft) - 1 &&
      chunkX <= Math.ceil(screenRight) + 1 &&
      chunkY >= Math.floor(screenTop) - 1 &&
      chunkY <= Math.ceil(screenBottom) + 1
    );
  }

  /**
   * Update which chunks should be visible based on camera position
   */
  updateVisibleChunks(cameraX: number, cameraY: number): void {
    // Calculate center chunk based on camera position and screen dimensions
    const centerChunkX = Math.floor((cameraX + this.app.screen.width / 2) / (CHUNK_SIZE * TILE_SIZE));
    const centerChunkY = Math.floor((cameraY + this.app.screen.height / 2) / (CHUNK_SIZE * TILE_SIZE));

    // Calculate view distance needed to cover screen plus margin
    // The +2 ensures we have chunks loaded outside the visible area
    const viewDistanceX = Math.ceil(this.app.screen.width / (CHUNK_SIZE * TILE_SIZE) / 2) + 2;
    const viewDistanceY = Math.ceil(this.app.screen.height / (CHUNK_SIZE * TILE_SIZE) / 2) + 2;

    // Check visibility of existing chunks and queue new ones
    for (let y = centerChunkY - viewDistanceY; y <= centerChunkY + viewDistanceY; y++) {
      for (let x = centerChunkX - viewDistanceX; x <= centerChunkX + viewDistanceX; x++) {
        const key = this.getChunkKey(x, y);

        // Queue chunk for generation if it doesn't exist
        if (!this.chunks.has(key)) {
          this.queueChunk(x, y);
        }
        // Make chunk visible if it exists but isn't visible
        else if (!this.visibleChunks.has(key)) {
          const chunk = this.chunks.get(key)!;

          // Make sure chunk is generated and has texture
          if (!chunk.isGenerated) {
            chunk.generate();
            chunk.createTexture(this.app);
          } else if (!chunk.sprite) {
            chunk.createTexture(this.app);
          }

          this.visibleChunks.add(key);

          if (chunk.sprite) {
            // Position the chunk in world coordinates (not camera relative)
            const worldPosX = x * CHUNK_SIZE * TILE_SIZE;
            const worldPosY = y * CHUNK_SIZE * TILE_SIZE;
            chunk.sprite.position.set(worldPosX, worldPosY);
            this.worldContainer.addChild(chunk.sprite);
          }
        }
      }
    }

    // Hide chunks that are now too far away
    for (const key of this.visibleChunks) {
      const [xStr, yStr] = key.split(',');
      const x = parseInt(xStr);
      const y = parseInt(yStr);

      if (
        x < centerChunkX - viewDistanceX - 1 ||
        x > centerChunkX + viewDistanceX + 1 ||
        y < centerChunkY - viewDistanceY - 1 ||
        y > centerChunkY + viewDistanceY + 1
      ) {
        // Remove from visible set
        this.visibleChunks.delete(key);

        // Remove sprite from world
        const chunk = this.chunks.get(key);
        if (chunk && chunk.sprite) {
          this.worldContainer.removeChild(chunk.sprite);
        }
      }
    }
  }

  /**
   * Update positions of visible chunks based on camera position
   */
  updateChunkPositions(cameraX: number, cameraY: number): void {
    // Move the entire world container to offset by camera position
    this.worldContainer.position.set(-cameraX, -cameraY);
  }
} 
import { Application, Graphics, Sprite, RenderTexture } from 'pixi.js';
import { CHUNK_SIZE, TILE_SIZE, WORLD_HEIGHT } from './constants';
import { Block, blockRegistry } from './blocks';

export class Chunk {
  tileIds: number[][] = [];
  blockInstances: Map<string, Block> = new Map(); // Store actual block instances
  sprite: Sprite | null = null;
  texture: RenderTexture | null = null;
  needsUpdate = true;
  lastVisibleFrame = 0;
  isGenerated = false;

  constructor(public cx: number, public cy: number, private noise2D: (x: number, y: number) => number) { }

  // Process game tick for all blocks in this chunk
  processGameTick(deltaTime: number): void {
    if (!this.isGenerated) return;

    // Process game tick for each block instance
    for (const [key, blockInstance] of this.blockInstances.entries()) {
      const needsUpdate = blockInstance.onGameTick(deltaTime);
      if (needsUpdate) {
        this.needsUpdate = true;
      }
    }
  }

  // Check if a player is walking over any blocks in this chunk
  checkPlayerWalkOver(player: any): void {
    if (!this.isGenerated) return;

    // Calculate which tiles the player is touching
    const playerFeetY = player.y + player.height;
    const playerCenterX = player.x + player.width / 2;

    // Convert to local chunk coordinates
    const localX = Math.floor((playerCenterX - this.cx * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);
    const localY = Math.floor((playerFeetY - this.cy * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);

    // Ignore if player is outside this chunk
    if (localX < 0 || localX >= CHUNK_SIZE || localY < 0 || localY >= CHUNK_SIZE) {
      return;
    }

    // Get the key for the block at player's feet
    const blockKey = `${localX},${localY}`;

    // If there's a block instance, call its onPlayerWalkOver method
    if (this.blockInstances.has(blockKey)) {
      const blockInstance = this.blockInstances.get(blockKey)!;
      const needsUpdate = blockInstance.onPlayerWalkOver(player);
      if (needsUpdate) {
        this.needsUpdate = true;
      }
    }
  }

  generate() {
    // Initialize empty tile array
    this.tileIds = Array(CHUNK_SIZE).fill(null).map(() => Array(CHUNK_SIZE).fill(blockRegistry.air.id));
    // Clear any previous block instances
    this.blockInstances.clear();

    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const worldX = this.cx * CHUNK_SIZE + x;

        // Use less intense noise for flatter terrain
        const baseNoise = this.noise2D(worldX * 0.02, 0);
        const detailNoise = this.noise2D(worldX * 0.05, 0) * 0.15;

        // Additional noise for ice patches
        const iceNoise = this.noise2D(worldX * 0.1, 5) * 0.5 + 0.5;

        // Reduce height variation for flatter terrain
        const heightValue = (baseNoise + detailNoise) * 0.3 + 0.5; // Reduced multiplier for less height variation

        // Move base terrain level higher for more flat land to traverse
        const baseHeight = WORLD_HEIGHT * 0.6;
        const height = Math.floor(baseHeight + heightValue * WORLD_HEIGHT * 0.1);

        // Convert to world y position
        const worldY = this.cy * CHUNK_SIZE + y;

        let blockId: number;
        if (worldY < height) {
          blockId = blockRegistry.air.id;
        } else if (worldY === height) {
          // Add ice patches randomly based on noise
          if (iceNoise > 0.7) {
            blockId = blockRegistry.ice.id;
          } else {
            blockId = blockRegistry.grass.id;
          }
        } else if (worldY < height + 3) {
          blockId = blockRegistry.dirt.id;
        } else {
          blockId = blockRegistry.stone.id;
        }

        this.tileIds[y][x] = blockId;

        // Create and store an actual block instance for non-air blocks
        if (blockId !== blockRegistry.air.id) {
          const block = blockRegistry.getBlockById(blockId);
          // Create a new instance to avoid sharing state
          const blockInstance = Object.create(Object.getPrototypeOf(block));
          Object.assign(blockInstance, block);

          // Set block position properties
          const actualWorldX = this.cx * CHUNK_SIZE * TILE_SIZE + x * TILE_SIZE;
          const actualWorldY = this.cy * CHUNK_SIZE * TILE_SIZE + y * TILE_SIZE;
          blockInstance.updatePosition(actualWorldX, actualWorldY);
          blockInstance.chunkX = this.cx;
          blockInstance.chunkY = this.cy;
          blockInstance.tileX = x;
          blockInstance.tileY = y;

          // Call onPlace event
          blockInstance.onPlace(actualWorldX, actualWorldY);

          // Store block instance
          this.blockInstances.set(`${x},${y}`, blockInstance);

          // Calculate sunlight for blocks on the surface
          if (worldY === height) {
            blockInstance.isInDirectSunlight = true;
          }
        }
      }
    }

    this.isGenerated = true;
    this.needsUpdate = true;
  }

  createTexture(app: Application) {
    // Make sure the chunk is generated before creating texture
    if (!this.isGenerated) {
      this.generate();
    }

    if (this.texture) {
      this.texture.destroy(true);
    }

    // Create a render texture for the chunk
    this.texture = RenderTexture.create({
      width: CHUNK_SIZE * TILE_SIZE,
      height: CHUNK_SIZE * TILE_SIZE,
      resolution: 1
    });

    // Create a graphics object to draw the chunk
    const tempGraphics = new Graphics();

    // Draw each tile first
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const blockId = this.tileIds[y][x];
        const blockKey = `${x},${y}`;

        // Skip air blocks
        if (blockId === blockRegistry.air.id) continue;

        let customRendered = false;

        // If we have a block instance, use it for rendering
        if (this.blockInstances.has(blockKey)) {
          const blockInstance = this.blockInstances.get(blockKey)!;
          customRendered = blockInstance.onRender(tempGraphics, x, y, TILE_SIZE);
        }

        // If not custom rendered, use default rendering
        if (!customRendered) {
          const block = blockRegistry.getBlockById(blockId);
          tempGraphics.fill({ color: block.color });
          tempGraphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }

        // Special handling for the bottom-right tile to ensure it renders properly
        // Draw it with a slight overlap to address potential rendering issues at chunk boundaries
        if (x === CHUNK_SIZE - 1 && y === CHUNK_SIZE - 1) {
          const block = blockRegistry.getBlockById(blockId);
          tempGraphics.fill({ color: block.color });
          tempGraphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 0.5, TILE_SIZE + 0.5);
        }
      }
    }

    // Render the graphics to the texture
    app.renderer.render({
      container: tempGraphics,
      target: this.texture
    });

    // If we don't have a sprite yet, create one
    if (!this.sprite) {
      this.sprite = new Sprite(this.texture);
      this.sprite.position.set(
        this.cx * CHUNK_SIZE * TILE_SIZE,
        this.cy * CHUNK_SIZE * TILE_SIZE
      );
    } else {
      // Otherwise just update the texture
      this.sprite.texture = this.texture;
    }

    this.needsUpdate = false;
  }

  // Get block at the specified position within this chunk
  getTile(x: number, y: number): Block {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || !this.isGenerated) {
      return blockRegistry.air;
    }

    const blockKey = `${x},${y}`;
    if (this.blockInstances.has(blockKey)) {
      return this.blockInstances.get(blockKey)!;
    }

    const blockId = this.tileIds[y][x];
    return blockRegistry.getBlockById(blockId);
  }

  // Set a tile at the specified position
  setTile(x: number, y: number, blockId: number): boolean {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || !this.isGenerated) {
      return false;
    }

    const blockKey = `${x},${y}`;
    const oldBlockId = this.tileIds[y][x];

    // Call onRemove for the old block if it exists
    if (this.blockInstances.has(blockKey)) {
      const oldBlock = this.blockInstances.get(blockKey)!;
      oldBlock.onRemove();
      this.blockInstances.delete(blockKey);
    }

    // Set the new block ID
    this.tileIds[y][x] = blockId;

    // Create a new block instance for non-air blocks
    if (blockId !== blockRegistry.air.id) {
      const block = blockRegistry.getBlockById(blockId);
      // Create a new instance to avoid sharing state
      const blockInstance = Object.create(Object.getPrototypeOf(block));
      Object.assign(blockInstance, block);

      // Set block position properties
      const actualWorldX = this.cx * CHUNK_SIZE * TILE_SIZE + x * TILE_SIZE;
      const actualWorldY = this.cy * CHUNK_SIZE * TILE_SIZE + y * TILE_SIZE;
      blockInstance.updatePosition(actualWorldX, actualWorldY);
      blockInstance.chunkX = this.cx;
      blockInstance.chunkY = this.cy;
      blockInstance.tileX = x;
      blockInstance.tileY = y;

      // Call onPlace event
      blockInstance.onPlace(actualWorldX, actualWorldY);

      // Store block instance
      this.blockInstances.set(blockKey, blockInstance);
    }

    // Mark chunk for update so it will be redrawn
    this.needsUpdate = true;

    return true;
  }
} 
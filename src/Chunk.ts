import { Application, Graphics, Sprite, RenderTexture } from 'pixi.js';
import { CHUNK_SIZE, TILE_SIZE, WORLD_HEIGHT } from './constants';
import { Block, blockRegistry } from './blocks';

export class Chunk {
  tileIds: number[][] = [];
  sprite: Sprite | null = null;
  texture: RenderTexture | null = null;
  needsUpdate = true;
  lastVisibleFrame = 0;
  isGenerated = false;

  constructor(public cx: number, public cy: number, private noise2D: (x: number, y: number) => number) { }

  generate() {
    // Initialize empty tile array
    this.tileIds = Array(CHUNK_SIZE).fill(null).map(() => Array(CHUNK_SIZE).fill(blockRegistry.air.id));

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
        const block = blockRegistry.getBlockById(blockId);
        if (block.id === blockRegistry.air.id) continue;

        tempGraphics.fill({ color: block.color });
        tempGraphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Special handling for the bottom-right tile to ensure it renders properly
        // Draw it with a slight overlap to address potential rendering issues at chunk boundaries
        if (x === CHUNK_SIZE - 1 && y === CHUNK_SIZE - 1) {
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
    const blockId = this.tileIds[y][x];
    return blockRegistry.getBlockById(blockId);
  }

  // Set a tile at the specified position
  setTile(x: number, y: number, blockId: number): boolean {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || !this.isGenerated) {
      return false;
    }

    // Set the new block ID
    this.tileIds[y][x] = blockId;

    // Mark chunk for update so it will be redrawn
    this.needsUpdate = true;

    return true;
  }
} 
import { Application, Graphics, Sprite, RenderTexture } from 'pixi.js';
import { CHUNK_SIZE, TILE_SIZE, WORLD_HEIGHT, TileType, tileColors } from './constants';

export class Chunk {
  tiles: TileType[][] = [];
  sprite: Sprite | null = null;
  texture: RenderTexture | null = null;
  needsUpdate = true;
  lastVisibleFrame = 0;
  isGenerated = false;

  constructor(public cx: number, public cy: number, private noise2D: (x: number, y: number) => number) { }

  generate() {
    // Initialize empty tile array
    this.tiles = Array(CHUNK_SIZE).fill(null).map(() => Array(CHUNK_SIZE).fill(TileType.Air));

    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const worldX = this.cx * CHUNK_SIZE + x;

        // Use multiple octaves of noise for more interesting terrain
        const baseNoise = this.noise2D(worldX * 0.05, 0);
        const detailNoise = this.noise2D(worldX * 0.1, 0) * 0.3;

        // Fix for upside-down world - higher values mean higher ground position
        const heightValue = (baseNoise + detailNoise) * 0.5 + 0.5; // Normalize to 0-1
        const height = Math.floor(WORLD_HEIGHT * (1 - heightValue) * 0.5) + WORLD_HEIGHT / 4;

        // Convert to world y position
        const worldY = this.cy * CHUNK_SIZE + y;

        if (worldY < height) {
          this.tiles[y][x] = TileType.Air;
        } else if (worldY === height) {
          this.tiles[y][x] = TileType.Grass;
        } else if (worldY < height + 3) {
          this.tiles[y][x] = TileType.Dirt;
        } else {
          this.tiles[y][x] = TileType.Stone;
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

    // Create a temporary graphics object to draw the chunk
    const tempGraphics = new Graphics();

    // Draw all tiles using modern PixiJS v8 methods
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const tile = this.tiles[y][x];
        if (tile === TileType.Air) continue;

        // Modern PixiJS v8 fill and rect methods
        tempGraphics.fill({ color: tileColors[tile] });
        tempGraphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Add a border around the chunk for debugging
    tempGraphics.fill({ color: 0x000000, alpha: 0 });
    tempGraphics.stroke({ width: 1, color: 0x333333, alpha: 0.5 });
    tempGraphics.rect(0, 0, CHUNK_SIZE * TILE_SIZE, CHUNK_SIZE * TILE_SIZE);

    // Render the graphics to the texture using modern PixiJS v8 render options
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

  // Get tile at the specified position within this chunk
  getTile(x: number, y: number): TileType {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || !this.isGenerated) {
      return TileType.Air;
    }
    return this.tiles[y][x];
  }
} 
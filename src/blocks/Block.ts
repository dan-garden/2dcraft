export abstract class Block {
  // Unique identifier for the block
  abstract readonly id: number;

  // Human-readable name of the block
  abstract readonly name: string;

  // Color used for rendering (as a hex value)
  abstract readonly color: number;

  // Whether the block is solid (affects collision)
  abstract readonly isSolid: boolean;

  // Friction coefficient for movement (higher = more grip, lower = more slippery)
  // Default is 1.0 (normal friction)
  readonly friction: number = 1.0;

  // Dynamic properties
  protected _isInDirectSunlight: boolean = false;
  protected _lastTickTime: number = 0;

  // Block position in the world (set when placed in a chunk)
  worldX: number = 0;
  worldY: number = 0;
  chunkX: number = 0;
  chunkY: number = 0;
  tileX: number = 0;
  tileY: number = 0;

  // Optional: Future properties
  // hardness?: number; // How difficult it is to break
  // blastResistance?: number; // Resistance to explosions
  // lightLevel?: number; // Light emitted by the block

  constructor() { }

  // Method to check if the block is collidable
  isCollidable(): boolean {
    return this.isSolid;
  }

  // Event handlers - can be overridden by specific block types

  /**
   * Called on each game tick for this block
   * @param deltaTime Time elapsed since last tick in milliseconds
   * @returns True if the block state changed and needs to be redrawn
   */
  onGameTick(deltaTime: number): boolean {
    this._lastTickTime += deltaTime;
    return false;
  }

  /**
   * Called when a player walks over this block
   * @param player The player instance
   * @returns True if the block state changed and needs to be redrawn
   */
  onPlayerWalkOver(player: any): boolean {
    return false;
  }

  /**
   * Called when this block is placed in the world
   * @param x World X coordinate
   * @param y World Y coordinate
   * @returns True if the block needs special initialization
   */
  onPlace(x: number, y: number): boolean {
    this.updatePosition(x, y);
    return false;
  }

  /**
   * Called when this block is removed from the world
   * @returns True if special effects or actions should happen
   */
  onRemove(): boolean {
    return false;
  }

  /**
   * Called when this block is rendered
   * @param graphics The graphics object to draw on
   * @param x Local X coordinate within chunk
   * @param y Local Y coordinate within chunk
   * @param tileSize The size of a tile in pixels
   * @returns True if custom rendering was performed
   */
  onRender(graphics: any, x: number, y: number, tileSize: number): boolean {
    return false;
  }

  /**
   * Update the block's position in the world
   */
  updatePosition(worldX: number, worldY: number): void {
    this.worldX = worldX;
    this.worldY = worldY;
    // These will be calculated based on chunk size and tile size when actually placing blocks
  }

  /**
   * Check if the block is in direct sunlight
   */
  get isInDirectSunlight(): boolean {
    return this._isInDirectSunlight;
  }

  /**
   * Set the sunlight status of the block
   */
  set isInDirectSunlight(value: boolean) {
    this._isInDirectSunlight = value;
  }
} 
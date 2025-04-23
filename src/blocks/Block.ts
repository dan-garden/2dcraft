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

  // Optional: Future properties
  // hardness?: number; // How difficult it is to break
  // blastResistance?: number; // Resistance to explosions
  // lightLevel?: number; // Light emitted by the block

  constructor() { }

  // Method to check if the block is collidable
  isCollidable(): boolean {
    return this.isSolid;
  }
} 
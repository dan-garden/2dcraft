export abstract class Block {
  // Unique identifier for the block
  abstract readonly id: number;

  // Human-readable name of the block
  abstract readonly name: string;

  // Color used for rendering (as a hex value)
  abstract readonly color: number;

  // Whether the block is solid (affects collision)
  abstract readonly isSolid: boolean;

  // Whether the block is transparent (affects rendering)
  readonly isTransparent: boolean = false;

  // Path to the texture for the block
  abstract texturePath?: string;

  // Whether to tint the texture with the block's color
  readonly tinted: boolean = false;

  // Friction coefficient for movement (higher = more grip, lower = more slippery)
  // Default is 1.0 (normal friction)
  readonly friction: number = 1.0;

  // How difficult the block is to break (higher value = harder)
  // Default is 1.0 (normal difficulty)
  readonly hardness: number = 1.0;

  // Light emission level (0-15, where 0 is no light and 15 is maximum brightness)
  readonly lightEmission: number = 0;

  // Optional onTick method called every game tick for blocks in view
  // world: The game world instance
  // x, y: The block's position in the world
  // deltaTime: Time elapsed since last tick in milliseconds
  onTick?(world: any, x: number, y: number, deltaTime: number): void { }

  // Optional: Future properties
  // blastResistance?: number; // Resistance to explosions
  // lightLevel?: number; // Light emitted by the block

  constructor() { }
} 
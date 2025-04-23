import { Block } from './Block';
import { AirBlock } from './AirBlock';
import { DirtBlock } from './DirtBlock';
import { GrassBlock } from './GrassBlock';
import { StoneBlock } from './StoneBlock';
import { IceBlock } from './IceBlock';

/**
 * Registry to store and retrieve block types
 */
export class BlockRegistry {
  private static instance: BlockRegistry;
  private blocks: Map<number, Block> = new Map();

  // Block instances
  readonly air = new AirBlock();
  readonly dirt = new DirtBlock();
  readonly grass = new GrassBlock();
  readonly stone = new StoneBlock();
  readonly ice = new IceBlock();

  // Private constructor for singleton pattern
  private constructor() {
    // Register all blocks
    this.registerBlock(this.air);
    this.registerBlock(this.dirt);
    this.registerBlock(this.grass);
    this.registerBlock(this.stone);
    this.registerBlock(this.ice);
  }

  /**
   * Get the BlockRegistry instance
   */
  public static getInstance(): BlockRegistry {
    if (!BlockRegistry.instance) {
      BlockRegistry.instance = new BlockRegistry();
    }
    return BlockRegistry.instance;
  }

  /**
   * Register a block in the registry
   */
  private registerBlock(block: Block): void {
    if (this.blocks.has(block.id)) {
      throw new Error(`Block with ID ${block.id} is already registered`);
    }
    this.blocks.set(block.id, block);
  }

  /**
   * Get a block by ID
   */
  getBlockById(id: number): Block {
    const block = this.blocks.get(id);
    if (!block) {
      // Return air block as fallback for unknown IDs
      console.warn(`Unknown block ID: ${id}, returning air block instead`);
      return this.air;
    }
    return block;
  }

  /**
   * Get all registered blocks
   */
  getAllBlocks(): Block[] {
    return Array.from(this.blocks.values());
  }
} 
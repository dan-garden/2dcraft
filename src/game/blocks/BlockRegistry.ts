import { Block } from './Block';
import { blockClasses } from '../registry/blocks/blockManifest';

type BlockConstructor = new () => Block;
type BlockWithVariants = BlockConstructor & {
  getAllVariants: () => Block[];
};

/**
 * Registry to store and retrieve block types
 */
export class BlockRegistry {
  private static instance: BlockRegistry;
  private blocks = new Map<string, Block>();

  // Private constructor for singleton pattern
  private constructor() {
    this.registerBlocks();
  }

  private registerBlocks() {
    for (const blockClass of blockClasses) {
      try {
        const block = new blockClass();
        if (block.shouldRegister) {
          this.register(block);
        }

        // Register variants if the block has them
        if (block.hasVariants && typeof (blockClass as BlockWithVariants).getAllVariants === 'function') {
          const variants = (blockClass as BlockWithVariants).getAllVariants();
          variants.forEach((variant: Block) => this.register(variant));
        }
      } catch (error) {
        console.error(`Error registering block:`, error);
      }
    }
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
  private register(block: Block) {
    if (this.blocks.has(block.id)) {
      throw new Error(`Block ID ${block.id} already registered`);
    }
    this.blocks.set(block.id, block);
  }

  public getById(id: string): Block {
    return this.blocks.get(id) ?? this.blocks.get('air')!;
  }

  public all(): Block[] {
    return Array.from(this.blocks.values());
  }
} 
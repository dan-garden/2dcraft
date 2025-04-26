import { Block } from './Block';
import { Air } from './0_Air';
import { Dirt } from './1_Dirt';
import { Grass } from './2_Grass';
import { Stone } from './3_Stone';
import { Sand } from './4_Sand';
import { Snow } from './5_Snow';
import { Clay } from './6_Clay';
import { LogOak } from './11_LogOak';
import { LeavesOak } from './12_LeavesOak';
import { CoalOre } from './13_CoalOre';
import { IronOre } from './14_IronOre';
import { GoldOre } from './15_GoldOre';
import { DiamondOre } from './16_DiamondOre';
import { EmeraldOre } from './17_EmeraldOre';
import { Bedrock } from './30_Bedrock';
import { Cactus } from './18_Cactus';
import { LogSpruce } from './19_LogSpruce';
import { LeavesSpruce } from './20_LeavesSpruce';
import { Light } from './31_Light';
/**
 * Registry to store and retrieve block types
 */
export class BlockRegistry {
  private static instance: BlockRegistry;
  private blocks = new Map<number, Block>();

  // Private constructor for singleton pattern
  private constructor() {
    [
      new Air(),
      new Dirt(),
      new Grass(),
      new Stone(),
      new Sand(),
      new Snow(),
      new Clay(),
      new LogOak(),
      new LeavesOak(),
      new CoalOre(),
      new IronOre(),
      new GoldOre(),
      new DiamondOre(),
      new EmeraldOre(),
      new Bedrock(),
      new Cactus(),
      new LogSpruce(),
      new LeavesSpruce(),
      new Light(),
    ].forEach((b: Block) => this.register(b));
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

  public getById(id: number): Block {
    return this.blocks.get(id) ?? this.blocks.get(0)!;
  }

  public all(): Block[] {
    return Array.from(this.blocks.values());
  }
} 
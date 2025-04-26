// Export all block types
export * from './Block';
export * from './0_Air';
export * from './1_Dirt';
export * from './2_Grass';
export * from './3_Stone';
export * from './4_Sand';
export * from './5_Snow';
export * from './6_Clay';
export * from './11_LogOak';
export * from './12_LeavesOak';
export * from './13_CoalOre';
export * from './14_IronOre';
export * from './15_GoldOre';
export * from './16_DiamondOre';
export * from './17_EmeraldOre';
export * from './30_Bedrock';
export * from './18_Cactus';
export * from './19_LogSpruce';
export * from './20_LeavesSpruce';
export * from './31_Light';

// Export BlockRegistry and create a singleton instance for easy access
import { BlockRegistry } from './BlockRegistry';
export { BlockRegistry };

// Export a singleton instance for convenience
export const blockRegistry = BlockRegistry.getInstance(); 
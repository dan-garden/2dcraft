// Export all block types
export * from './Block';
export * from './AirBlock';
export * from './DirtBlock';
export * from './GrassBlock';
export * from './StoneBlock';
export * from './IceBlock';

// Export BlockRegistry and create a singleton instance for easy access
import { BlockRegistry } from './BlockRegistry';
export { BlockRegistry };

// Export a singleton instance for convenience
export const blockRegistry = BlockRegistry.getInstance(); 
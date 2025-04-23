export { Block } from './Block';
export { AirBlock } from './AirBlock';
export { DirtBlock } from './DirtBlock';
export { GrassBlock } from './GrassBlock';
export { StoneBlock } from './StoneBlock';
export { BlockRegistry } from './BlockRegistry';

// Export a singleton instance of the registry for easy access
import { BlockRegistry } from './BlockRegistry';
export const blockRegistry = BlockRegistry.getInstance(); 
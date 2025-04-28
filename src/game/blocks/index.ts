// Export BlockRegistry and create a singleton instance for easy access
import { BlockRegistry } from './BlockRegistry';
export { BlockRegistry };

// Export a singleton instance for convenience
export const blockRegistry = BlockRegistry.getInstance(); 
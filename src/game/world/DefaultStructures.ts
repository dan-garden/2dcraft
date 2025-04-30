import { StructureDefinition } from './StructureGenerator';

// Example structure definitions
export const DEFAULT_STRUCTURES: StructureDefinition[] = [
  // Simple tree structure
  {
    id: 'oak_tree',
    name: 'Oak Tree',
    rarity: 0.7, // Increased from 0.4 for more common trees
    minDistance: 4, // Decreased to allow more trees to be closer together
    validBiomes: ['plains', 'forest'], // Removed 'meadow' and 'hills' which aren't in DefaultBiomes
    yOffset: 0, // Placed at ground level
    pattern: [
      ['air', 'leaves_oak', 'leaves_oak', 'leaves_oak', 'air'], // Leaves (12) - LeavesOak
      ['leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak'],
      ['leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak'],
      ['air', 'leaves_oak', 'log_oak', 'leaves_oak', 'air'], // 11 = LogOak
      ['air', 'air', 'log_oak', 'air', 'air'], // Single-block trunk
      ['air', 'air', 'log_oak', 'air', 'air'],
      ['air', 'air', 'log_oak', 'air', 'air']
    ]
  },

  // Small oak tree variation (for more diverse forests)
  {
    id: 'small_oak_tree',
    name: 'Small Oak Tree',
    rarity: 0.6, // Increased from 0.3 to make small trees more common
    minDistance: 3, // Decreased to allow more trees to be placed
    validBiomes: ['plains', 'forest'], // Removed 'meadow' and 'hills' which aren't in DefaultBiomes
    yOffset: 0,
    pattern: [
      ['air', 'leaves_oak', 'leaves_oak', 'air'], // Smaller leaf canopy
      ['leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak'],
      ['air', 'leaves_oak', 'log_oak', 'air'], // Single-block trunk
      ['air', 'air', 'log_oak', 'air'],
      ['air', 'air', 'log_oak', 'air']
    ]
  },

  // Snowy tree
  {
    id: 'snowy_tree',
    name: 'Snowy Tree',
    rarity: 0.7, // Increased from 0.5 for more spawns
    minDistance: 5, // Decreased to allow more trees
    validBiomes: ['snowy_mountains'],
    yOffset: 0,
    pattern: [
      ['air', 'air', 'leaves_spruce', 'air', 'air'],
      ['air', 'leaves_spruce', 'leaves_spruce', 'leaves_spruce', 'air'],
      ['air', 'leaves_spruce', 'leaves_spruce', 'leaves_spruce', 'air'],
      ['leaves_spruce', 'leaves_spruce', 'leaves_spruce', 'leaves_spruce', 'leaves_spruce'],
      ['air', 'leaves_spruce', 'log_spruce', 'leaves_spruce', 'air'], // Single-block trunk
      ['air', 'air', 'log_spruce', 'air', 'air'],
      ['air', 'air', 'log_spruce', 'air', 'air'],
      ['air', 'air', 'log_spruce', 'air', 'air'],
      ['air', 'air', 'log_spruce', 'air', 'air']
    ]
  },

  // Small boulder
  {
    id: 'boulder',
    name: 'Boulder',
    rarity: 0.3, // Increased from 0.2 for more boulders
    minDistance: 8, // Decreased to allow more boulders
    validBiomes: ['plains', 'desert', 'savanna', 'badlands'], // Added savanna and badlands from DefaultBiomes
    yOffset: 0,
    pattern: [
      ['air', 'stone', 'stone', 'air'],
      ['stone', 'stone', 'stone', 'stone'],
      ['stone', 'stone', 'stone', 'stone']
    ]
  },
  {
    id: 'cactus',
    name: 'Cactus',
    rarity: 0.4, // Increased from 0.2 for more cacti
    minDistance: 3, // Decreased to allow more cacti
    validBiomes: ['desert', 'badlands'], // Added badlands for more cacti distribution
    yOffset: 0,
    pattern: [
      ['cactus'],
      ['cactus'],
      ['cactus']
    ],
  },

  // New structure: Swamp vegetation
  {
    id: 'swamp_shrub',
    name: 'Swamp Shrub',
    rarity: 0.5,
    minDistance: 3,
    validBiomes: ['swamp'],
    yOffset: 0,
    pattern: [
      ['leaves_oak', 'leaves_oak', 'leaves_oak'], // Simple shrub made of leaves
      ['air', 'log_oak', 'air']
    ]
  },

  // New structure: Savanna tree (acacia-like)
  {
    id: 'savanna_tree',
    name: 'Savanna Tree',
    rarity: 0.5,
    minDistance: 6,
    validBiomes: ['savanna'],
    yOffset: 0,
    pattern: [
      ['air', 'leaves_oak', 'leaves_oak', 'leaves_oak', 'air'],
      ['leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak'],
      ['air', 'air', 'log_oak', 'air', 'air'],
      ['air', 'air', 'log_oak', 'air', 'air'],
      ['air', 'air', 'log_oak', 'air', 'air']
    ]
  }
];

/**
 * Example of how to initialize structures for a world
 */
export function initializeDefaultStructures(structureGenerator: any): void {
  // Register all default structures
  console.log(`Initializing ${DEFAULT_STRUCTURES.length} default structures`);

  if (!structureGenerator) {
    console.error("Structure generator is undefined in initializeDefaultStructures!");
    return;
  }

  if (typeof structureGenerator.registerStructure !== 'function') {
    console.error("registerStructure is not a function in structure generator!");
    return;
  }

  for (const structure of DEFAULT_STRUCTURES) {
    structureGenerator.registerStructure(structure);
  }

  try {
    // Attempt to access the structures property to verify registration
    const structureCount = structureGenerator.structures?.length || 'unknown';
    console.log(`After initialization, registered ${structureCount} structures`);
  } catch (error) {
    console.error("Unable to verify structure registration:", error);
  }
} 
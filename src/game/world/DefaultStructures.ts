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
      [0, 12, 12, 12, 0], // Leaves (12) - LeavesOak
      [12, 12, 12, 12, 12],
      [12, 12, 12, 12, 12],
      [0, 12, 11, 12, 0], // 11 = LogOak
      [0, 0, 11, 0, 0], // Single-block trunk
      [0, 0, 11, 0, 0],
      [0, 0, 11, 0, 0]
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
      [0, 12, 12, 0], // Smaller leaf canopy
      [12, 12, 12, 12],
      [0, 12, 11, 0], // Single-block trunk
      [0, 0, 11, 0],
      [0, 0, 11, 0]
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
      [0, 0, 20, 0, 0],
      [0, 20, 20, 20, 0],
      [0, 20, 20, 20, 0],
      [20, 20, 20, 20, 20],
      [0, 20, 19, 20, 0], // Single-block trunk
      [0, 0, 19, 0, 0],
      [0, 0, 19, 0, 0],
      [0, 0, 19, 0, 0],
      [0, 0, 19, 0, 0]
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
      [0, 3, 3, 0],
      [3, 3, 3, 3],
      [3, 3, 3, 3]
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
      [18],
      [18],
      [18]
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
      [12, 12, 12], // Simple shrub made of leaves
      [0, 11, 0]
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
      [0, 12, 12, 12, 0],
      [12, 12, 12, 12, 12],
      [0, 0, 11, 0, 0],
      [0, 0, 11, 0, 0],
      [0, 0, 11, 0, 0]
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
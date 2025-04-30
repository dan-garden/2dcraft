import { PatternStructure } from './PatternStructure';

export class OakTree extends PatternStructure {
  constructor() {
    super({
      id: 'oak_tree',
      name: 'Oak Tree',
      rarity: 0.7,
      minDistance: 4,
      validBiomes: ['plains', 'forest'],
      yOffset: 0,
      pattern: [
        ['air', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'air'],
        ['oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves'],
        ['oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves'],
        ['air', 'oak_leaves', 'oak_log', 'oak_leaves', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air']
      ]
    });
  }
} 
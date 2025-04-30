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
        ['air', 'leaves_oak', 'leaves_oak', 'leaves_oak', 'air'],
        ['leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak'],
        ['leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak', 'leaves_oak'],
        ['air', 'leaves_oak', 'log_oak', 'leaves_oak', 'air'],
        ['air', 'air', 'log_oak', 'air', 'air'],
        ['air', 'air', 'log_oak', 'air', 'air'],
        ['air', 'air', 'log_oak', 'air', 'air']
      ]
    });
  }
} 
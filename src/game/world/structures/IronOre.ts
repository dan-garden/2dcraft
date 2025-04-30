import { OreVein } from './OreVein';

export class IronOre extends OreVein {
  constructor() {
    super({
      id: 'iron_ore',
      name: 'Iron Ore',
      rarity: 0.5,
      minVeinSize: 5,
      maxVeinSize: 12,
      minY: -100,
      maxY: 100,
      minSpaceBetween: 8,
      inBlock: 'stone',
      validBiomes: ['plains', 'forest', 'desert', 'swamp', 'snowy_mountains', 'savanna', 'badlands']
    });
  }
} 
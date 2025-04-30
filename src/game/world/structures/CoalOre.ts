import { OreVein } from './OreVein';

export class CoalOre extends OreVein {
  constructor() {
    super({
      id: 'coal_ore',
      name: 'Coal Ore',
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
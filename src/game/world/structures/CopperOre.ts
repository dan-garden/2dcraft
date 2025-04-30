import { OreVein } from './OreVein';
import { BiomeManager } from '../BiomeManager';

export class CopperOre extends OreVein {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'copper_ore',
      name: 'Copper Ore',
      rarity: 0.3,
      minVeinSize: 4,
      maxVeinSize: 10,
      minY: -80,
      maxY: 48,
      minSpaceBetween: 8,
      inBlock: 'stone',
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
} 
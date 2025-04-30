import { OreVein } from './OreVein';
import { BiomeManager } from '../BiomeManager';

export class IronOre extends OreVein {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'iron_ore',
      name: 'Iron Ore',
      rarity: 0.35,
      minVeinSize: 5,
      maxVeinSize: 12,
      minY: -128,
      maxY: 256,
      minSpaceBetween: 0,
      inBlock: 'stone',
      validBiomes: [], // Empty array, let OreVein constructor handle it
      biomeManager: biomeManager
    });
  }
} 
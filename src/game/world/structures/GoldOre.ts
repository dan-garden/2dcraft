import { OreVein } from './OreVein';
import { BiomeManager } from '../BiomeManager';

export class GoldOre extends OreVein {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'gold_ore',
      name: 'Gold Ore',
      rarity: 0.25,
      minVeinSize: 2,
      maxVeinSize: 9,
      minY: -128,
      maxY: -32,
      minSpaceBetween: 0,
      inBlock: 'stone',
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
} 
import { OreVein } from './OreVein';
import { BiomeManager } from '../BiomeManager';

export class DiamondOre extends OreVein {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'diamond_ore',
      name: 'Diamond Ore',
      rarity: 0.12,
      minVeinSize: 1,
      maxVeinSize: 8,
      minY: -128,
      maxY: -70,
      minSpaceBetween: 0,
      inBlock: 'stone',
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
} 
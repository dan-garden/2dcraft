import { OreVein } from './OreVein';
import { BiomeManager } from '../BiomeManager';

export class CoalOre extends OreVein {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'coal_ore',
      name: 'Coal Ore',
      rarity: 0.6,
      minVeinSize: 4,
      maxVeinSize: 15,
      minY: -120,
      maxY: 128,
      minSpaceBetween: 0,
      inBlock: 'stone',
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
} 
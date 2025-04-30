import { OreVein } from './OreVein';
import { BiomeManager } from '../BiomeManager';

export class EmeraldOre extends OreVein {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'emerald_ore',
      name: 'Emerald Ore',
      rarity: 0.03,
      minVeinSize: 1,
      maxVeinSize: 1,
      minY: -80,
      maxY: 256,
      minSpaceBetween: 24,
      inBlock: 'stone',
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
} 
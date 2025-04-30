import { OreVein } from './OreVein';
import { BiomeManager } from '../BiomeManager';

export class LapisOre extends OreVein {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'lapis_ore',
      name: 'Lapis Lazuli Ore',
      rarity: 0.15,
      minVeinSize: 2,
      maxVeinSize: 6,
      minY: -128,
      maxY: -48,
      minSpaceBetween: 0,
      inBlock: 'stone',
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
} 
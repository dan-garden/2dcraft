import { OreVein } from './OreVein';
import { BiomeManager } from '../BiomeManager';

export class RedstoneOre extends OreVein {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'redstone_ore',
      name: 'Redstone Ore',
      rarity: 0.25,
      minVeinSize: 4,
      maxVeinSize: 8,
      minY: -128,
      maxY: -96,
      minSpaceBetween: 8,
      inBlock: 'stone',
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
} 
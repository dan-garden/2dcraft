import { OreVein } from './OreVein';
import { BiomeManager } from '../world/BiomeManager';

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
      minSpaceBetween: 0,
      inBlock: 'stone',
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
}

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
      minSpaceBetween: 0,
      inBlock: 'stone',
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
}

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
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
}

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
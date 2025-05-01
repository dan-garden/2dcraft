import { Cave } from './Cave';
import { BiomeManager } from '../world/BiomeManager';

export class SmallCave extends Cave {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'small_cave',
      name: 'Small Cave',
      rarity: 0.2,
      minSize: 25,
      maxSize: 60,
      minY: -120,
      maxY: 20,
      minSpaceBetween: 20,
      replaceBlock: 'stone',
      surfaceOpeningProbability: 0.1,
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
}

export class MediumCave extends Cave {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'medium_cave',
      name: 'Medium Cave',
      rarity: 0.12,
      minSize: 50,
      maxSize: 100,
      minY: -150,
      maxY: 0,
      minSpaceBetween: 25,
      replaceBlock: 'stone',
      surfaceOpeningProbability: 0.05,
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
}

export class LargeCave extends Cave {
  constructor(biomeManager?: BiomeManager) {
    super({
      id: 'large_cave',
      name: 'Large Cave',
      rarity: 0.06,
      minSize: 100,
      maxSize: 180,
      minY: -200,
      maxY: -20,
      minSpaceBetween: 40,
      replaceBlock: 'stone',
      surfaceOpeningProbability: 0.02,
      validBiomes: [],
      biomeManager: biomeManager
    });
  }
}

export class UndergroundLake extends Cave {
  constructor(biomeManager?: BiomeManager) {
    // Get all biome IDs if biomeManager is provided
    let validBiomes = ['plains', 'forest', 'swamp'];
    if (biomeManager) {
      // Filter to only include biomes where underground lakes should appear
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['plains', 'forest', 'swamp'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'underground_lake',
      name: 'Underground Lake',
      rarity: 0.08,
      minSize: 60,
      maxSize: 120,
      minY: -140,
      maxY: -30,
      minSpaceBetween: 50,
      replaceBlock: 'stone',
      validBiomes: validBiomes,
      hasWaterPools: true,
      surfaceOpeningProbability: 0.01,
      biomeManager: biomeManager
    });
  }
}

export class CrystalCave extends Cave {
  constructor(biomeManager?: BiomeManager) {
    // Get all biome IDs if biomeManager is provided
    let validBiomes = ['mountains', 'snowy_mountains'];
    if (biomeManager) {
      // Filter to only include biomes where crystal caves should appear
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['mountains', 'snowy_mountains'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'crystal_cave',
      name: 'Crystal Cave',
      rarity: 0.05,
      minSize: 35,
      maxSize: 80,
      minY: -180,
      maxY: -60,
      minSpaceBetween: 60,
      replaceBlock: 'stone',
      validBiomes: validBiomes,
      hasCrystals: true,
      surfaceOpeningProbability: 0,
      biomeManager: biomeManager
    });
  }
}

export class LavaCave extends Cave {
  constructor(biomeManager?: BiomeManager) {
    // Get all biome IDs if biomeManager is provided
    let validBiomes = ['badlands', 'desert'];
    if (biomeManager) {
      // Filter to only include biomes where lava caves should appear
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['badlands', 'desert'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'lava_cave',
      name: 'Lava Cave',
      rarity: 0.04,
      minSize: 45,
      maxSize: 90,
      minY: -200,
      maxY: -80,
      minSpaceBetween: 70,
      replaceBlock: 'stone',
      validBiomes: validBiomes,
      surfaceOpeningProbability: 0,
      biomeManager: biomeManager
    });
  }
}

export class StalactiteCave extends Cave {
  constructor(biomeManager?: BiomeManager) {
    // Get all biome IDs if biomeManager is provided
    let validBiomes = ['forest', 'mountains', 'jungle'];
    if (biomeManager) {
      // Filter to only include biomes where stalactite caves should appear
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['forest', 'mountains', 'jungle'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'stalactite_cave',
      name: 'Stalactite Cave',
      rarity: 0.09,
      minSize: 40,
      maxSize: 95,
      minY: -160,
      maxY: -10,
      minSpaceBetween: 45,
      replaceBlock: 'stone',
      validBiomes: validBiomes,
      hasStalactites: true,
      surfaceOpeningProbability: 0.03,
      biomeManager: biomeManager
    });
  }
}

const Caves = [
  SmallCave,
  MediumCave,
  LargeCave,
  UndergroundLake,
  CrystalCave,
  LavaCave,
  StalactiteCave,
]

export default Caves;
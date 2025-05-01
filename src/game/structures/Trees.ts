import { PatternStructure } from './PatternStructure';
import { BiomeManager } from '../world/BiomeManager';

export class OakTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    // Get all biome IDs if biomeManager is provided
    let validBiomes = ['plains', 'forest'];
    if (biomeManager) {
      // Filter to only include biomes where oak trees should grow
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['plains', 'forest'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'oak_tree',
      name: 'Oak Tree',
      rarity: 0.7,
      minDistance: 4,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'air'],
        ['oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves'],
        ['oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves'],
        ['air', 'oak_leaves', 'oak_log', 'oak_leaves', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air']
      ]
    });
  }
}

export class BirchTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['forest'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['forest'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'birch_tree',
      name: 'Birch Tree',
      rarity: 0.8,
      minDistance: 2,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'birch_leaves', 'birch_leaves', 'birch_leaves', 'air'],
        ['birch_leaves', 'birch_leaves', 'birch_leaves', 'birch_leaves', 'birch_leaves'],
        ['birch_leaves', 'birch_leaves', 'birch_leaves', 'birch_leaves', 'birch_leaves'],
        ['air', 'birch_leaves', 'birch_log', 'birch_leaves', 'air'],
        ['air', 'air', 'birch_log', 'air', 'air'],
        ['air', 'air', 'birch_log', 'air', 'air'],
        ['air', 'air', 'birch_log', 'air', 'air'],
        ['air', 'air', 'birch_log', 'air', 'air']
      ]
    });
  }
}

export class SpruceTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['forest', 'snowy_mountains'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['forest', 'snowy_mountains'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'spruce_tree',
      name: 'Spruce Tree',
      rarity: 0.65,
      minDistance: 5,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'air', 'spruce_leaves', 'air', 'air'],
        ['air', 'spruce_leaves', 'spruce_leaves', 'spruce_leaves', 'air'],
        ['spruce_leaves', 'spruce_leaves', 'spruce_leaves', 'spruce_leaves', 'spruce_leaves'],
        ['air', 'spruce_leaves', 'spruce_log', 'spruce_leaves', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'spruce_leaves', 'spruce_log', 'spruce_leaves', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air']
      ]
    });
  }
}

export class AcaciaTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['savanna'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['savanna'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'acacia_tree',
      name: 'Acacia Tree',
      rarity: 0.5,
      minDistance: 6,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'air', 'air', 'air'],
        ['acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'air', 'air'],
        ['acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'air'],
        ['air', 'air', 'air', 'acacia_log', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves'],
        ['air', 'air', 'acacia_log', 'air', 'air', 'air', 'air'],
        ['air', 'acacia_log', 'air', 'air', 'air', 'air', 'air'],
        ['air', 'acacia_log', 'air', 'air', 'air', 'air', 'air'],
        ['air', 'acacia_log', 'air', 'air', 'air', 'air', 'air']
      ]
    });
  }
}

export class JungleTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['jungle'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['jungle'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'jungle_tree',
      name: 'Jungle Tree',
      rarity: 0.8,
      minDistance: 3,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves'],
        ['jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves'],
        ['jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_log', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves'],
        ['jungle_leaves', 'jungle_leaves', 'jungle_leaves', 'jungle_log', 'jungle_leaves', 'jungle_leaves', 'jungle_leaves'],
        ['air', 'air', 'air', 'jungle_log', 'air', 'air', 'air'],
        ['air', 'air', 'air', 'jungle_log', 'air', 'air', 'air'],
        ['air', 'air', 'air', 'jungle_log', 'air', 'air', 'air'],
        ['air', 'air', 'air', 'jungle_log', 'air', 'air', 'air'],
        ['air', 'air', 'air', 'jungle_log', 'air', 'air', 'air'],
        ['air', 'air', 'air', 'jungle_log', 'air', 'air', 'air']
      ]
    });
  }
}

export class DarkOakTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['dark_forest'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['dark_forest'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'dark_oak_tree',
      name: 'Dark Oak Tree',
      rarity: 0.7,
      minDistance: 4,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves'],
        ['dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_leaves'],
        ['dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_log', 'dark_oak_leaves', 'dark_oak_log', 'dark_oak_leaves', 'dark_oak_leaves'],
        ['dark_oak_leaves', 'dark_oak_leaves', 'dark_oak_log', 'dark_oak_log', 'dark_oak_log', 'dark_oak_leaves', 'dark_oak_leaves'],
        ['air', 'air', 'dark_oak_log', 'dark_oak_log', 'dark_oak_log', 'air', 'air'],
        ['air', 'air', 'air', 'dark_oak_log', 'air', 'air', 'air'],
        ['air', 'air', 'air', 'dark_oak_log', 'air', 'air', 'air']
      ]
    });
  }
}

export class CactusPlant extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['desert'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['desert'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'cactus',
      name: 'Cactus',
      rarity: 0.9,
      minDistance: 3,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'cactus', 'air'],
        ['air', 'cactus', 'air'],
        ['air', 'cactus', 'air']
      ]
    });
  }
} 
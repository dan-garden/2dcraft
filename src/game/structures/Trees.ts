import { PatternStructure } from './PatternStructure';
import { BiomeManager } from '../world/BiomeManager';

class OakTree extends PatternStructure {
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

class BirchTree extends PatternStructure {
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

class SpruceTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['forest', 'snowy_mountains', 'taiga'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['forest', 'snowy_mountains', 'taiga'].includes(biome.id))
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

class AcaciaTree extends PatternStructure {
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

class JungleTree extends PatternStructure {
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

class DarkOakTree extends PatternStructure {
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

class CactusPlant extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['desert', 'badlands'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['desert', 'badlands'].includes(biome.id))
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

// New trees and structures for the new biomes

class TallSpruceTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['taiga'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['taiga'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'tall_spruce_tree',
      name: 'Tall Spruce Tree',
      rarity: 0.8,
      minDistance: 6,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'air', 'spruce_leaves', 'air', 'air'],
        ['air', 'spruce_leaves', 'spruce_leaves', 'spruce_leaves', 'air'],
        ['spruce_leaves', 'spruce_leaves', 'spruce_leaves', 'spruce_leaves', 'spruce_leaves'],
        ['spruce_leaves', 'spruce_leaves', 'spruce_leaves', 'spruce_leaves', 'spruce_leaves'],
        ['air', 'spruce_leaves', 'spruce_log', 'spruce_leaves', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'spruce_leaves', 'spruce_log', 'spruce_leaves', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air']
      ]
    });
  }
}

class SnowySpruceTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['taiga'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['taiga'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'snowy_spruce_tree',
      name: 'Snowy Spruce Tree',
      rarity: 0.75,
      minDistance: 5,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'air', 'snow', 'air', 'air'],
        ['air', 'snow', 'spruce_leaves', 'snow', 'air'],
        ['snow', 'spruce_leaves', 'spruce_leaves', 'spruce_leaves', 'snow'],
        ['air', 'spruce_leaves', 'spruce_log', 'spruce_leaves', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air'],
        ['air', 'air', 'spruce_log', 'air', 'air']
      ]
    });
  }
}

class SwampWillowTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['swamp'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['swamp'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'swamp_willow_tree',
      name: 'Swamp Willow Tree',
      rarity: 0.7,
      minDistance: 6,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['vine', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'vine'],
        ['oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves'],
        ['oak_leaves', 'vine', 'oak_log', 'vine', 'oak_leaves'],
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'vine', 'oak_log', 'vine', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air']
      ]
    });
  }
}

class MangroveTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['swamp'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['swamp'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'mangrove_tree',
      name: 'Mangrove Tree',
      rarity: 0.8,
      minDistance: 5,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'air'],
        ['oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves', 'oak_leaves'],
        ['vine', 'oak_leaves', 'oak_log', 'oak_leaves', 'vine'],
        ['air', 'vine', 'oak_log', 'vine', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'oak_log', 'oak_log', 'oak_log', 'air'],
        ['oak_log', 'air', 'air', 'air', 'oak_log']
      ]
    });
  }
}

class RedMushroomHuge extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['mushroom'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['mushroom'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'red_mushroom_huge',
      name: 'Giant Red Mushroom',
      rarity: 0.7,
      minDistance: 8,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['red_mushroom_block', 'red_mushroom_block', 'red_mushroom_block', 'red_mushroom_block', 'red_mushroom_block'],
        ['red_mushroom_block', 'red_mushroom_block', 'red_mushroom_block', 'red_mushroom_block', 'red_mushroom_block'],
        ['red_mushroom_block', 'red_mushroom_block', 'red_mushroom_block', 'red_mushroom_block', 'red_mushroom_block'],
        ['air', 'air', 'mushroom_stem', 'air', 'air'],
        ['air', 'air', 'mushroom_stem', 'air', 'air'],
        ['air', 'air', 'mushroom_stem', 'air', 'air']
      ]
    });
  }
}

class BrownMushroomHuge extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['mushroom'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['mushroom'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'brown_mushroom_huge',
      name: 'Giant Brown Mushroom',
      rarity: 0.7,
      minDistance: 8,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'brown_mushroom_block', 'brown_mushroom_block', 'brown_mushroom_block', 'air'],
        ['brown_mushroom_block', 'brown_mushroom_block', 'brown_mushroom_block', 'brown_mushroom_block', 'brown_mushroom_block'],
        ['brown_mushroom_block', 'brown_mushroom_block', 'mushroom_stem', 'brown_mushroom_block', 'brown_mushroom_block'],
        ['air', 'air', 'mushroom_stem', 'air', 'air'],
        ['air', 'air', 'mushroom_stem', 'air', 'air'],
        ['air', 'air', 'mushroom_stem', 'air', 'air']
      ]
    });
  }
}

class GlowingMushroom extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['mushroom'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['mushroom'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'glowing_mushroom',
      name: 'Glowing Mushroom',
      rarity: 0.85,
      minDistance: 4,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'shroomlight', 'shroomlight', 'shroomlight', 'air'],
        ['shroomlight', 'shroomlight', 'shroomlight', 'shroomlight', 'shroomlight'],
        ['air', 'air', 'mushroom_stem', 'air', 'air'],
        ['air', 'air', 'mushroom_stem', 'air', 'air']
      ]
    });
  }
}

class DeadTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['badlands', 'savanna'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['badlands', 'savanna'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'dead_tree',
      name: 'Dead Tree',
      rarity: 0.9,
      minDistance: 7,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'oak_log', 'air', 'oak_log', 'air'],
        ['oak_log', 'air', 'oak_log', 'air', 'oak_log'],
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air'],
        ['air', 'air', 'oak_log', 'air', 'air']
      ]
    });
  }
}

class SavannaTree extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['savanna'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['savanna'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'savanna_tree',
      name: 'Savanna Tree',
      rarity: 0.8,
      minDistance: 10,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['air', 'air', 'air', 'acacia_leaves', 'acacia_leaves', 'air', 'air'],
        ['air', 'air', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'air'],
        ['air', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'air'],
        ['acacia_leaves', 'acacia_leaves', 'acacia_leaves', 'acacia_log', 'acacia_leaves', 'air', 'air'],
        ['air', 'air', 'air', 'acacia_log', 'air', 'air', 'air'],
        ['air', 'air', 'air', 'acacia_log', 'air', 'air', 'air'],
        ['air', 'air', 'air', 'acacia_log', 'air', 'air', 'air'],
        ['air', 'air', 'air', 'acacia_log', 'air', 'air', 'air']
      ]
    });
  }
}

class BerryBush extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['taiga'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['taiga'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'berry_bush',
      name: 'Sweet Berry Bush',
      rarity: 0.75,
      minDistance: 2,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['sweet_berry_bush', 'sweet_berry_bush', 'sweet_berry_bush'],
        ['sweet_berry_bush', 'sweet_berry_bush', 'sweet_berry_bush']
      ]
    });
  }
}

class BadlandsPillar extends PatternStructure {
  constructor(biomeManager?: BiomeManager) {
    let validBiomes = ['badlands'];
    if (biomeManager) {
      validBiomes = biomeManager.getAllBiomes()
        .filter(biome => ['badlands'].includes(biome.id))
        .map(biome => biome.id);
    }

    super({
      id: 'terracotta_pillar',
      name: 'Terracotta Pillar',
      rarity: 0.93,
      minDistance: 15,
      validBiomes: validBiomes,
      yOffset: 0,
      pattern: [
        ['terracotta', 'orange_terracotta', 'terracotta'],
        ['red_terracotta', 'terracotta', 'red_terracotta'],
        ['terracotta', 'yellow_terracotta', 'terracotta'],
        ['orange_terracotta', 'terracotta', 'orange_terracotta'],
        ['terracotta', 'red_terracotta', 'terracotta'],
        ['yellow_terracotta', 'terracotta', 'yellow_terracotta'],
        ['terracotta', 'orange_terracotta', 'terracotta']
      ]
    });
  }
}

const Trees = [
  OakTree,
  BirchTree,
  SpruceTree,
  AcaciaTree,
  JungleTree,
  DarkOakTree,
  CactusPlant,
  TallSpruceTree,
  SnowySpruceTree,
  SwampWillowTree,
  MangroveTree,
  RedMushroomHuge,
  BrownMushroomHuge,
  GlowingMushroom,
  DeadTree,
  SavannaTree,
  BerryBush,
  BadlandsPillar
];

export default Trees;
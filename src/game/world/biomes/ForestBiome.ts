import { BaseBiome } from './BaseBiome';

export class ForestBiome extends BaseBiome {
  constructor() {
    super({
      id: 'forest',
      name: 'Forest',
      minTemperature: -0.2,
      maxTemperature: 0.4,
      minHumidity: 0.3,
      maxHumidity: 0.8,
      heightMultiplier: 1.1,
      heightAddition: 1, // Slightly higher elevation
      terrainVariability: 0.5, // Rolling hills
      peakFrequency: 0.4, // Medium frequency hills
      surfaceBlock: 'grass',
      subSurfaceBlock: 'dirt',
      subsurfaceDepth: 5, // Deeper dirt layer for trees
      stoneBlock: 'stone',
    });
  }
} 
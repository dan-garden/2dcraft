import { BaseBiome } from './BaseBiome';

export class DesertBiome extends BaseBiome {
  constructor() {
    super({
      id: 'desert',
      name: 'Desert',
      minTemperature: 0.4,
      maxTemperature: 1.0,
      minHumidity: -1.0,
      maxHumidity: -0.2,
      heightMultiplier: 0.8,
      heightAddition: -2, // Slightly lower elevation
      terrainVariability: 0.4, // Some dunes
      peakFrequency: 0.5, // Medium frequency dunes
      surfaceBlock: 'sand',
      subSurfaceBlock: 'sand',
      subsurfaceDepth: 6, // Deeper sand layer
      stoneBlock: 'stone',
    });
  }
} 
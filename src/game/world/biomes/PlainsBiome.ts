import { BaseBiome } from './BaseBiome';

export class PlainsBiome extends BaseBiome {
  constructor() {
    super({
      id: 'plains',
      name: 'Plains',
      minTemperature: -0.2,
      maxTemperature: 0.2,
      minHumidity: -0.2,
      maxHumidity: 0.2,
      heightMultiplier: 1.0,
      heightAddition: 0,
      terrainVariability: 0.2, // Very flat terrain
      peakFrequency: 0.3, // Spread out hills
      surfaceBlock: 'grass',
      subSurfaceBlock: 'dirt',
      subsurfaceDepth: 4,
      stoneBlock: 'stone',
    });
  }
} 
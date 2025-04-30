import { BaseBiome } from './BaseBiome';

export class SwampBiome extends BaseBiome {
  constructor() {
    super({
      id: 'swamp',
      name: 'Swamp',
      minTemperature: 0.0,
      maxTemperature: 0.5,
      minHumidity: 0.7,
      maxHumidity: 1.0,
      heightMultiplier: 0.6,
      heightAddition: -4, // Much lower elevation
      terrainVariability: 0.1, // Very flat
      peakFrequency: 0.2, // Rare bumps
      surfaceBlock: 'clay',
      subSurfaceBlock: 'dirt',
      subsurfaceDepth: 2,
      stoneBlock: 'stone',
    });
  }
} 
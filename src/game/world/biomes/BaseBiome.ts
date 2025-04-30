export interface BiomeProps {
  id: string;
  name: string;
  // Temperature ranges from -1 (cold) to 1 (hot)
  minTemperature: number;
  maxTemperature: number;
  // Humidity ranges from -1 (dry) to 1 (wet)
  minHumidity: number;
  maxHumidity: number;
  // Terrain modification factors
  heightMultiplier: number;
  heightAddition: number;
  // Terrain variability (0-1)
  terrainVariability: number;
  // Peak frequency (0-1)
  peakFrequency: number;
  // Block types
  surfaceBlock: string;
  subSurfaceBlock: string;
  subsurfaceDepth: number;
  stoneBlock: string;
}

export class BaseBiome {
  public readonly id: string;
  public readonly name: string;

  // Climate parameters
  public readonly minTemperature: number;
  public readonly maxTemperature: number;
  public readonly minHumidity: number;
  public readonly maxHumidity: number;

  // Terrain parameters
  public readonly heightMultiplier: number;
  public readonly heightAddition: number;
  public readonly terrainVariability: number;
  public readonly peakFrequency: number;

  // Block types
  public readonly surfaceBlock: string;
  public readonly subSurfaceBlock: string;
  public readonly subsurfaceDepth: number;
  public readonly stoneBlock: string;

  constructor(props: BiomeProps) {
    this.id = props.id;
    this.name = props.name;
    this.minTemperature = props.minTemperature;
    this.maxTemperature = props.maxTemperature;
    this.minHumidity = props.minHumidity;
    this.maxHumidity = props.maxHumidity;
    this.heightMultiplier = props.heightMultiplier;
    this.heightAddition = props.heightAddition;
    this.terrainVariability = props.terrainVariability;
    this.peakFrequency = props.peakFrequency;
    this.surfaceBlock = props.surfaceBlock;
    this.subSurfaceBlock = props.subSurfaceBlock;
    this.subsurfaceDepth = props.subsurfaceDepth;
    this.stoneBlock = props.stoneBlock;
  }

  /**
   * Modifies the base terrain height based on biome-specific parameters
   */
  modifyHeight(x: number, baseHeight: number, detailNoise: number): number {
    const variabilityFactor = detailNoise * this.terrainVariability;
    return baseHeight * this.heightMultiplier +
      variabilityFactor * 10 +
      this.heightAddition;
  }

  /**
   * Determine if the biome is applicable at the given climate parameters
   */
  isApplicable(temperature: number, humidity: number): boolean {
    return temperature >= this.minTemperature &&
      temperature <= this.maxTemperature &&
      humidity >= this.minHumidity &&
      humidity <= this.maxHumidity;
  }

  /**
   * Get layers of blocks for this biome from top to bottom
   * Each element is an object with block ID and thickness
   */
  getLayers(): Array<{ id: string, thickness: number }> {
    return [
      { id: this.surfaceBlock, thickness: 1 },
      { id: this.subSurfaceBlock, thickness: this.subsurfaceDepth },
      { id: this.stoneBlock, thickness: Infinity }
    ];
  }

  /**
   * Get block at specified depth from surface
   */
  getBlockAtDepth(depth: number): string {
    if (depth <= 0) {
      return this.surfaceBlock;
    } else if (depth <= this.subsurfaceDepth) {
      return this.subSurfaceBlock;
    } else {
      return this.stoneBlock;
    }
  }
} 
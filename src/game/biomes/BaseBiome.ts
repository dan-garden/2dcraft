export interface BiomeLayer {
  name: string;
  getBlock: (x: number, y: number, depth: number, noise: (suffix: string, scale?: number) => (x: number, y: number) => number) => string;
  minDepth: number;
  maxDepth?: number; // If undefined, extends to infinity
}

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
  // Layers configuration
  layers: BiomeLayer[];
  // Valid blocks for structure placement (optional)
  validStructureBlocks?: string[];
  // Rarity (0-1). Lower values are more common (default: 0.5)
  rarity?: number;
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

  // Layer configuration
  public readonly layers: BiomeLayer[];

  // Valid structure blocks
  public readonly validStructureBlocks: string[];

  // Biome rarity
  public readonly rarity: number;

  // Map to store noise functions for this biome
  private noiseFunctions: Map<string, (x: number, y: number) => number> = new Map();
  private noiseGenerator: ((suffix: string, scale?: number) => (x: number, y: number) => number) | null = null;

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
    this.layers = props.layers;
    this.rarity = props.rarity ?? 0.5; // Default rarity is 0.5

    // Set default valid structure blocks if not provided
    this.validStructureBlocks = props.validStructureBlocks || this.getDefaultValidStructureBlocks();
  }

  /**
   * Get default valid structure blocks based on surface layer block types
   * This is used if specific validStructureBlocks are not provided
   */
  private getDefaultValidStructureBlocks(): string[] {
    // Default valid blocks that are suitable for structures in most biomes
    return ['grass', 'dirt', 'sand', 'stone', 'gravel', 'clay', 'terracotta', 'podzol'];
  }

  /**
   * Check if a block type is valid for placing structures in this biome
   */
  isValidStructureBlock(blockType: string): boolean {
    return this.validStructureBlocks.includes(blockType);
  }

  /**
   * Set the noise function generator from WorldGenerator
   */
  setNoiseGenerator(generator: (suffix: string, scale?: number) => (x: number, y: number) => number): void {
    this.noiseGenerator = generator;
  }

  /**
   * Get or create a noise function with the specified parameters
   */
  getNoise(suffix: string, scale: number = 1): (x: number, y: number) => number {
    if (!this.noiseGenerator) {
      throw new Error("Noise generator not set for biome " + this.id);
    }

    const key = `${suffix}_${scale}`;
    if (!this.noiseFunctions.has(key)) {
      this.noiseFunctions.set(key, this.noiseGenerator(this.id + '_' + suffix, scale));
    }
    return this.noiseFunctions.get(key)!;
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
   * Get block at specified world coordinates and depth from surface
   */
  getBlockAt(x: number, y: number, depth: number): string {
    if (depth < 0) {
      return 'air'; // Above surface
    }

    // Find the appropriate layer for this depth
    for (const layer of this.layers) {
      if (depth >= layer.minDepth && (layer.maxDepth === undefined || depth <= layer.maxDepth)) {
        // If noise generator isn't set, use a simplified approach
        if (!this.noiseGenerator) {
          return layer.name; // Fallback to using layer name as block ID
        }

        // Otherwise use the noise-based block generation
        return layer.getBlock(x, y, depth, (suffix, scale) => this.getNoise(suffix, scale));
      }
    }

    // Fallback to stone if no layer matches
    return 'stone';
  }

  /**
   * Get layers of blocks for this biome (simplified for compatibility)
   */
  getLayers(): Array<{ id: string, thickness: number }> {
    return this.layers.map(layer => {
      return {
        id: layer.name,
        thickness: layer.maxDepth !== undefined ? layer.maxDepth - layer.minDepth : Infinity
      };
    });
  }
} 
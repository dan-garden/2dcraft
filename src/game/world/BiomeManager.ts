import { WorldGenerator } from './WorldGenerator';
import { BaseBiome } from '../biomes/BaseBiome';

export class BiomeManager {
  private biomes: BaseBiome[] = [];
  private temperatureNoise: (x: number, y: number) => number;
  private humidityNoise: (x: number, y: number) => number;
  private terrainDetailNoise: (x: number, y: number) => number;
  private biomeBoundaryNoise: (x: number, y: number) => number;
  private rarityNoise: (x: number, y: number) => number;
  private biomeCache: Map<number, BaseBiome> = new Map();
  private readonly CHUNK_SIZE = 16;

  // Biome transition settings
  private readonly TRANSITION_SIZE = 8; // Number of blocks for transition

  // Minimum biome width in chunks
  private readonly MIN_BIOME_WIDTH = 3;

  // Current biome continuity tracking
  private currentBiome: BaseBiome | null = null;
  private currentBiomeChunks = 0;

  constructor(private worldGenerator: WorldGenerator) {
    // Create noise functions for biome parameters
    this.temperatureNoise = worldGenerator.createNoiseFunction('temperature', 0.01);
    this.humidityNoise = worldGenerator.createNoiseFunction('humidity', 0.01);
    this.terrainDetailNoise = worldGenerator.createNoiseFunction('terrain_detail', 0.05);
    this.biomeBoundaryNoise = worldGenerator.createNoiseFunction('biome_boundary', 0.02);
    this.rarityNoise = worldGenerator.createNoiseFunction('biome_rarity', 0.01);
  }

  registerBiome(biome: BaseBiome): void {
    // Set the noise generator for this biome
    biome.setNoiseGenerator((suffix, scale) => this.worldGenerator.createNoiseFunction(biome.id + '_' + suffix, scale || 1));
    this.biomes.push(biome);
  }

  /**
   * Gets the biome at a specific x-coordinate
   * Each chunk typically has one biome, with transitions at chunk boundaries
   */
  getBiomeAt(x: number, y: number): BaseBiome {
    // Convert to chunk coordinates to ensure consistency within chunks
    const chunkX = Math.floor(x / this.CHUNK_SIZE);

    // Use chunk center for biome determination
    const chunkCenterX = chunkX * this.CHUNK_SIZE + this.CHUNK_SIZE / 2;

    // Check if we've already calculated this chunk's biome
    if (this.biomeCache.has(chunkX)) {
      return this.biomeCache.get(chunkX)!;
    }

    // If we're enforcing minimum biome width and still have chunks to generate for current biome
    if (this.currentBiome && this.currentBiomeChunks < this.MIN_BIOME_WIDTH) {
      this.currentBiomeChunks++;
      this.biomeCache.set(chunkX, this.currentBiome);
      return this.currentBiome;
    }

    // Get climate parameters for this position
    const temperature = this.temperatureNoise(chunkCenterX, 0);
    const humidity = this.humidityNoise(chunkCenterX, 0);

    // Add small noise to create natural biome boundaries
    const boundaryNoise = this.biomeBoundaryNoise(chunkCenterX, 0) * 0.2;
    const adjustedTemperature = temperature + boundaryNoise;
    const adjustedHumidity = humidity + boundaryNoise;

    // Get rarity noise for this position to affect biome selection
    const rarityValue = this.rarityNoise(chunkCenterX, 0);

    // Find all matching biomes based on temperature and humidity
    const matchingBiomes = this.biomes.filter(biome =>
      biome.isApplicable(adjustedTemperature, adjustedHumidity)
    );

    // Select a biome using rarity as a weighting factor
    let selectedBiome: BaseBiome;

    if (matchingBiomes.length > 0) {
      // Use rarity to filter or weight biome selection
      // Lower rarity value = more common
      const weightedBiomes = matchingBiomes.filter(biome => {
        // Compare the biome's rarity against our noise value
        // This creates a random chance based on the rarity
        return biome.rarity <= rarityValue + 0.5;
      });

      // If no biomes passed the rarity filter, fallback to all matching biomes
      const finalCandidates = weightedBiomes.length > 0 ? weightedBiomes : matchingBiomes;

      // Choose a random biome from the candidates
      const randomIndex = Math.floor(this.worldGenerator.createNoiseFunction(
        'biome_selection_' + chunkX, 1)(0, 0) * finalCandidates.length);
      selectedBiome = finalCandidates[Math.min(randomIndex, finalCandidates.length - 1)];
    } else if (this.biomes.length > 0) {
      // If no biome matches, randomly select one from all biomes
      const randomIndex = Math.floor(this.worldGenerator.createNoiseFunction(
        'biome_fallback_' + chunkX, 1)(0, 0) * this.biomes.length);
      selectedBiome = this.biomes[Math.min(randomIndex, this.biomes.length - 1)];
    } else {
      throw new Error("No biomes registered with BiomeManager");
    }

    // Reset the biome continuity counter to ensure minimum width
    this.currentBiome = selectedBiome;
    this.currentBiomeChunks = 1;

    // Cache the result for this chunk
    this.biomeCache.set(chunkX, selectedBiome);

    return selectedBiome;
  }

  /**
   * Modifies the base terrain height based on biome parameters
   * Handles smooth transitions between biomes at chunk boundaries
   */
  modifyHeight(x: number, baseHeight: number): number {
    // Get the primary biome for this position
    const chunkX = Math.floor(x / this.CHUNK_SIZE);
    const primaryBiome = this.getBiomeForChunk(chunkX);

    // Calculate the height if we were using only this biome
    const detailNoise = this.terrainDetailNoise(x * primaryBiome.peakFrequency, 0);
    const primaryHeight = primaryBiome.modifyHeight(x, baseHeight, detailNoise);

    // Determine distance from chunk boundary
    const distanceFromChunkStart = x - (chunkX * this.CHUNK_SIZE);
    const distanceFromChunkEnd = this.CHUNK_SIZE - distanceFromChunkStart;

    // If we're well within the chunk, just return the primary height
    if (distanceFromChunkStart >= this.TRANSITION_SIZE / 2 &&
      distanceFromChunkEnd >= this.TRANSITION_SIZE / 2) {
      return primaryHeight;
    }

    // We're near a boundary, need to blend with neighboring biome
    let neighborChunkX: number;
    let blendFactor: number;

    // Determine which neighboring chunk we're blending with and calculate blend factor
    if (distanceFromChunkStart < this.TRANSITION_SIZE / 2) {
      // Near the start of the chunk, blend with previous chunk
      neighborChunkX = chunkX - 1;
      blendFactor = distanceFromChunkStart / (this.TRANSITION_SIZE / 2); // 0 at boundary, 1 at TRANSITION_SIZE/2
    } else {
      // Near the end of the chunk, blend with next chunk
      neighborChunkX = chunkX + 1;
      blendFactor = distanceFromChunkEnd / (this.TRANSITION_SIZE / 2); // 0 at boundary, 1 at TRANSITION_SIZE/2
    }

    // Get the neighboring biome
    const neighborBiome = this.getBiomeForChunk(neighborChunkX);

    // Calculate the height using the neighbor biome
    const neighborDetailNoise = this.terrainDetailNoise(x * neighborBiome.peakFrequency, 0);
    const neighborHeight = neighborBiome.modifyHeight(x, baseHeight, neighborDetailNoise);

    // Smooth the transition using cosine interpolation
    blendFactor = (1 - Math.cos(blendFactor * Math.PI)) / 2;

    // Interpolate between the two heights
    return primaryHeight * blendFactor + neighborHeight * (1 - blendFactor);
  }

  // Get the biome for an entire chunk
  getBiomeForChunk(chunkX: number): BaseBiome {
    // Use the center of the chunk for determining biome
    const chunkCenterX = chunkX * this.CHUNK_SIZE + this.CHUNK_SIZE / 2;
    return this.getBiomeAt(chunkCenterX, 0);
  }

  // Get block type at a certain position, accounting for biome layers
  getBlockAt(x: number, y: number, heightAtX: number): string {
    const biome = this.getBiomeAt(x, y);
    const depth = Math.floor(heightAtX) - y;

    // Handle blocks above ground
    if (depth < 0) {
      return 'air';
    }

    // Use the biome's new getBlockAt method for noise-based generation
    return biome.getBlockAt(x, y, depth);
  }

  // Clear the biome cache (useful when changing world generation parameters)
  clearCache(): void {
    this.biomeCache.clear();
    this.currentBiome = null;
    this.currentBiomeChunks = 0;
  }

  // Get all registered biomes
  getAllBiomes(): BaseBiome[] {
    return [...this.biomes];
  }
} 
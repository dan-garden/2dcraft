import { WorldGenerator } from './WorldGenerator';
import { BaseBiome } from '../biomes/BaseBiome';

export class BiomeManager {
  private biomes: BaseBiome[] = [];
  private temperatureNoise: (x: number, y: number) => number;
  private humidityNoise: (x: number, y: number) => number;
  private terrainDetailNoise: (x: number, y: number) => number;
  private biomeBoundaryNoise: (x: number, y: number) => number;
  private biomeCache: Map<number, BaseBiome> = new Map();
  private readonly CHUNK_SIZE = 16;

  // Biome transition settings
  private readonly TRANSITION_SIZE = 8; // Number of blocks for transition

  constructor(private worldGenerator: WorldGenerator) {
    // Create noise functions for biome parameters
    this.temperatureNoise = worldGenerator.createNoiseFunction('temperature', 0.01);
    this.humidityNoise = worldGenerator.createNoiseFunction('humidity', 0.01);
    this.terrainDetailNoise = worldGenerator.createNoiseFunction('terrain_detail', 0.05);
    this.biomeBoundaryNoise = worldGenerator.createNoiseFunction('biome_boundary', 0.02);
  }

  registerBiome(biome: BaseBiome): void {
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

    const temperature = this.temperatureNoise(chunkCenterX, 0);
    const humidity = this.humidityNoise(chunkCenterX, 0);

    // Add small noise to create natural biome boundaries
    const boundaryNoise = this.biomeBoundaryNoise(chunkCenterX, 0) * 0.2;
    const adjustedTemperature = temperature + boundaryNoise;
    const adjustedHumidity = humidity + boundaryNoise;

    // Find matching biomes based on temperature and humidity
    const matchingBiomes = this.biomes.filter(biome =>
      biome.isApplicable(adjustedTemperature, adjustedHumidity)
    );

    // If there are matching biomes, use the first one
    let selectedBiome: BaseBiome;
    if (matchingBiomes.length > 0) {
      selectedBiome = matchingBiomes[0];
    } else if (this.biomes.length > 0) {
      // If no biome matches, use the first registered biome as default
      selectedBiome = this.biomes[0];
    } else {
      throw new Error("No biomes registered with BiomeManager");
    }

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

    // Get appropriate block from biome layers
    return biome.getBlockAtDepth(depth);
  }

  // Clear the biome cache (useful when changing world generation parameters)
  clearCache(): void {
    this.biomeCache.clear();
  }

  // Get all registered biomes
  getAllBiomes(): BaseBiome[] {
    return [...this.biomes];
  }
} 
import { WorldGenerator, BlockGenerationRule } from './WorldGenerator';

export interface BiomeDefinition {
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
  // 0 = flat, 1 = very mountainous
  terrainVariability: number;
  // Peak frequency (0-1) 
  // 0 = spread out peaks, 1 = frequent peaks
  peakFrequency: number;
  // Block overrides
  surfaceBlock: string;
  subSurfaceBlock: string;
  subsurfaceDepth: number;
  stoneBlock: string;
}

export class BiomeGenerator {
  private biomes: BiomeDefinition[] = [];
  private defaultBiome: BiomeDefinition;
  private temperatureNoise: (x: number, y: number) => number;
  private humidityNoise: (x: number, y: number) => number;
  private terrainDetailNoise: (x: number, y: number) => number;
  private biomeBoundaryNoise: (x: number, y: number) => number;
  private biomeCache: Map<number, BiomeDefinition> = new Map();
  private readonly CHUNK_SIZE = 16; // Assuming chunk size is 16, matches Chunk.SIZE

  // Biome transition settings
  private readonly TRANSITION_SIZE = 8; // Number of blocks for transition (half on each side of chunk boundary)

  constructor(private worldGenerator: WorldGenerator) {
    // Create noise functions for biome parameters
    this.temperatureNoise = worldGenerator.createNoiseFunction('temperature', 0.01);
    this.humidityNoise = worldGenerator.createNoiseFunction('humidity', 0.01);
    this.terrainDetailNoise = worldGenerator.createNoiseFunction('terrain_detail', 0.05);
    this.biomeBoundaryNoise = worldGenerator.createNoiseFunction('biome_boundary', 0.02);

    // Create a default plains biome that will be used if no biome matches
    this.defaultBiome = {
      id: 'plains',
      name: 'Plains',
      minTemperature: -1,
      maxTemperature: 1,
      minHumidity: -1,
      maxHumidity: 1,
      heightMultiplier: 1.0,
      heightAddition: 0,
      terrainVariability: 0.2,
      peakFrequency: 0.3,
      surfaceBlock: 'grass',
      subSurfaceBlock: 'dirt',
      subsurfaceDepth: 4,
      stoneBlock: 'stone',
    };

    // Register the biome rule with high priority
    this.registerBiomeBlockRules();
  }

  registerBiome(biome: BiomeDefinition): void {
    this.biomes.push(biome);
  }

  private registerBiomeBlockRules(): void {
    // Surface block rule based on biome
    this.worldGenerator.registerGenerationRule({
      id: '', // Empty string placeholder, will be replaced by actual biome's surface block
      name: 'biome_surface',
      priority: 95, // Higher than grass
      condition: (x, y, generator) => {
        const height = generator.getHeightAt(x);
        if (y !== Math.floor(height)) {
          return false;
        }

        // For surface blocks, we need to handle transitions to avoid odd-looking seams
        const biome = this.getBiomeWithTransitionBlending(x, 0);

        // Dynamically replace the block ID with the biome's surface block
        (this.worldGenerator as any).currentBlockId = biome.surfaceBlock;
        return true;
      }
    });

    // Subsurface block rule based on biome
    this.worldGenerator.registerGenerationRule({
      id: '', // Empty string placeholder, will be replaced by actual biome's subsurface block
      name: 'biome_subsurface',
      priority: 85, // Higher than dirt
      condition: (x, y, generator) => {
        const height = generator.getHeightAt(x);
        const biome = this.getBiomeWithTransitionBlending(x, 0);

        const depthFromSurface = Math.floor(height) - y;
        if (depthFromSurface > 0 && depthFromSurface <= biome.subsurfaceDepth) {
          // Dynamically replace the block ID with the biome's subsurface block
          (this.worldGenerator as any).currentBlockId = biome.subSurfaceBlock;
          return true;
        }
        return false;
      }
    });

    // Stone block rule based on biome
    this.worldGenerator.registerGenerationRule({
      id: '', // Empty string placeholder, will be replaced by actual biome's stone block
      name: 'biome_stone',
      priority: 5, // Just above default stone
      condition: (x, y, generator) => {
        const height = generator.getHeightAt(x);
        const biome = this.getBiomeWithTransitionBlending(x, 0);

        const depthFromSurface = Math.floor(height) - y;
        if (depthFromSurface > biome.subsurfaceDepth) {
          // Dynamically replace the block ID with the biome's stone block
          (this.worldGenerator as any).currentBlockId = biome.stoneBlock;
          return true;
        }
        return false;
      }
    });
  }

  /**
   * Gets the biome at a specific x-coordinate
   * Each chunk only has one biome, and biomes span vertically
   */
  getBiomeAt(x: number, y: number): BiomeDefinition {
    // Convert to chunk coordinates to ensure consistency within chunks
    const chunkX = Math.floor(x / this.CHUNK_SIZE);

    // Use chunk center for biome determination - ensures entire chunk has same biome
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
      adjustedTemperature >= biome.minTemperature &&
      adjustedTemperature <= biome.maxTemperature &&
      adjustedHumidity >= biome.minHumidity &&
      adjustedHumidity <= biome.maxHumidity
    );

    // If there are matching biomes, use the first one
    let selectedBiome: BiomeDefinition;
    if (matchingBiomes.length > 0) {
      selectedBiome = matchingBiomes[0];
    } else {
      // If no biome matches, use the default biome
      selectedBiome = this.defaultBiome;
    }

    // Cache the result for this chunk
    this.biomeCache.set(chunkX, selectedBiome);

    return selectedBiome;
  }

  /**
   * Gets the biome with smooth transitions at biome boundaries
   * Used for block generation to blend surface blocks
   */
  getBiomeWithTransitionBlending(x: number, y: number): BiomeDefinition {
    // First get the primary biome for this position
    const chunkX = Math.floor(x / this.CHUNK_SIZE);
    const primaryBiome = this.getBiomeForChunk(chunkX);

    // Determine distance from chunk boundary
    const distanceFromChunkStart = x - (chunkX * this.CHUNK_SIZE);
    const distanceFromChunkEnd = this.CHUNK_SIZE - distanceFromChunkStart;

    // If we're well within the chunk, just return the primary biome
    if (distanceFromChunkStart >= this.TRANSITION_SIZE / 2 &&
      distanceFromChunkEnd >= this.TRANSITION_SIZE / 2) {
      return primaryBiome;
    }

    // We're near a boundary, find the neighboring biome
    const neighborChunkX = distanceFromChunkStart < this.TRANSITION_SIZE / 2 ?
      chunkX - 1 : chunkX + 1;
    const neighborBiome = this.getBiomeForChunk(neighborChunkX);

    // Safety check for missing biome properties in neighbor biome
    if (neighborBiome.terrainVariability === undefined || neighborBiome.peakFrequency === undefined) {
      console.error(`Neighbor biome ${neighborBiome.id} is missing required properties for height calculation`);
      console.error(`   terrainVariability=${neighborBiome.terrainVariability}, peakFrequency=${neighborBiome.peakFrequency}`);
      // Fall back to default values
      neighborBiome.terrainVariability = neighborBiome.terrainVariability || 0.2;
      neighborBiome.peakFrequency = neighborBiome.peakFrequency || 0.3;
    }

    // If the neighbor has the same biome, no need to blend
    if (primaryBiome.id === neighborBiome.id) {
      return primaryBiome;
    }

    // Calculate blend factor (0-1) based on distance from boundary
    const distanceFromBoundary = Math.min(distanceFromChunkStart, distanceFromChunkEnd);
    const blendFactor = distanceFromBoundary / (this.TRANSITION_SIZE / 2);

    // Return the primary biome (block transitions are handled in modifyHeight)
    return primaryBiome;
  }

  // Apply biome-specific height modifications to the world generator's height calculation
  // with smooth transitions at biome boundaries
  modifyHeight(x: number, baseHeight: number): number {
    // Safety check for NaN input
    if (isNaN(baseHeight)) {
      console.error(`BiomeGenerator.modifyHeight received NaN baseHeight for x=${x}`);
      return 0; // Return a safe value
    }

    // Get the primary biome for this position
    const chunkX = Math.floor(x / this.CHUNK_SIZE);
    const primaryBiome = this.getBiomeForChunk(chunkX);

    // Safety check for missing biome properties
    if (primaryBiome.terrainVariability === undefined || primaryBiome.peakFrequency === undefined) {
      console.error(`Biome ${primaryBiome.id} is missing required properties for height calculation`);
      console.error(`   terrainVariability=${primaryBiome.terrainVariability}, peakFrequency=${primaryBiome.peakFrequency}`);
      // Fall back to default values
      primaryBiome.terrainVariability = primaryBiome.terrainVariability || 0.2;
      primaryBiome.peakFrequency = primaryBiome.peakFrequency || 0.3;
    }

    // Calculate the height if we were using only this biome
    const detailNoise = this.terrainDetailNoise(x * primaryBiome.peakFrequency, 0);
    const variabilityFactor = detailNoise * primaryBiome.terrainVariability;
    const primaryHeight = baseHeight * primaryBiome.heightMultiplier +
      variabilityFactor * 10 +
      primaryBiome.heightAddition;

    // Check for NaN in primary height calculation
    if (isNaN(primaryHeight)) {
      console.error(`NaN detected in BiomeGenerator.modifyHeight: primaryHeight=${primaryHeight}, x=${x}`);
      console.error(`  detailNoise=${detailNoise}, variabilityFactor=${variabilityFactor}`);
      console.error(`  primaryBiome=${primaryBiome.id}, multiplier=${primaryBiome.heightMultiplier}, addition=${primaryBiome.heightAddition}`);
      return baseHeight; // Return the unmodified height
    }

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

    // Safety check for missing biome properties in neighbor biome
    if (neighborBiome.terrainVariability === undefined || neighborBiome.peakFrequency === undefined) {
      console.error(`Neighbor biome ${neighborBiome.id} is missing required properties for height calculation`);
      console.error(`   terrainVariability=${neighborBiome.terrainVariability}, peakFrequency=${neighborBiome.peakFrequency}`);
      // Fall back to default values
      neighborBiome.terrainVariability = neighborBiome.terrainVariability || 0.2;
      neighborBiome.peakFrequency = neighborBiome.peakFrequency || 0.3;
    }

    // Calculate the height using the neighbor biome
    const neighborDetailNoise = this.terrainDetailNoise(x * neighborBiome.peakFrequency, 0);
    const neighborVariabilityFactor = neighborDetailNoise * neighborBiome.terrainVariability;
    const neighborHeight = baseHeight * neighborBiome.heightMultiplier +
      neighborVariabilityFactor * 10 +
      neighborBiome.heightAddition;

    // Check for NaN in neighbor height calculation
    if (isNaN(neighborHeight)) {
      console.error(`NaN detected in neighbor height: neighborHeight=${neighborHeight}, x=${x}`);
      console.error(`  neighborBiome=${neighborBiome.id}, multiplier=${neighborBiome.heightMultiplier}`);
      return primaryHeight; // Fall back to the primary biome's height
    }

    // Smooth the transition using cosine interpolation for extra smoothness
    blendFactor = (1 - Math.cos(blendFactor * Math.PI)) / 2;

    // Check for NaN in blend factor
    if (isNaN(blendFactor)) {
      console.error(`NaN detected in blendFactor: ${blendFactor}, x=${x}`);
      return primaryHeight; // Fall back to primary height
    }

    // Interpolate between the two heights
    const finalHeight = primaryHeight * blendFactor + neighborHeight * (1 - blendFactor);

    // Final NaN check
    if (isNaN(finalHeight)) {
      console.error(`NaN detected in final height calculation: finalHeight=${finalHeight}, x=${x}`);
      console.error(`  primaryHeight=${primaryHeight}, neighborHeight=${neighborHeight}, blendFactor=${blendFactor}`);
      return baseHeight; // Return the unmodified height as a last resort
    }

    return finalHeight;
  }

  // Clear the biome cache (useful when changing world generation parameters)
  clearCache(): void {
    this.biomeCache.clear();
  }

  // Get the biome for an entire chunk
  getBiomeForChunk(chunkX: number): BiomeDefinition {
    // Use the center of the chunk for determining biome
    const chunkCenterX = chunkX * this.CHUNK_SIZE + this.CHUNK_SIZE / 2;
    return this.getBiomeAt(chunkCenterX, 0);
  }

  // Get all registered biomes (for debugging/UI)
  getAllBiomes(): BiomeDefinition[] {
    return [...this.biomes, this.defaultBiome];
  }

  // Debug method to visualize the height transition between biomes
  // Returns an array of [x, height] pairs for a given range
  debugHeightProfile(startX: number, endX: number): Array<[number, number]> {
    const result: Array<[number, number]> = [];
    const baseNoiseScale = 0.01; // Match the scale used in WorldGenerator

    // Create a simple noise function for base height
    const baseNoise = (x: number) => {
      return Math.sin(x * baseNoiseScale) * 10;
    };

    // Sample heights at regular intervals
    for (let x = startX; x <= endX; x++) {
      const baseHeight = baseNoise(x);
      const modifiedHeight = this.modifyHeight(x, baseHeight);
      result.push([x, modifiedHeight]);
    }

    return result;
  }

  // Debug method to check biome boundaries
  debugBiomeBoundaries(startX: number, endX: number): Array<[number, string]> {
    const result: Array<[number, string]> = [];
    const sampled: { [key: number]: boolean } = {};

    // Sample biomes at regular intervals
    for (let x = startX; x <= endX; x++) {
      const chunkX = Math.floor(x / this.CHUNK_SIZE);

      // Only sample once per chunk to detect boundaries
      if (!sampled[chunkX]) {
        const biome = this.getBiomeForChunk(chunkX);
        result.push([x, biome.id]);
        sampled[chunkX] = true;
      }

      // Also mark chunk boundaries
      if (x % this.CHUNK_SIZE === 0) {
        result.push([x, "BOUNDARY"]);
      }
    }

    return result;
  }
} 
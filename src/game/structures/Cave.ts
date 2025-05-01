import { BaseStructure, StructureProps } from './BaseStructure';
import { createNoise2D, createNoise3D } from 'simplex-noise';
import alea from 'alea';
import { BiomeManager } from '../world/BiomeManager';

export interface CaveProps extends StructureProps {
  minSize: number;
  maxSize: number;
  minY: number;
  maxY: number;
  minSpaceBetween: number;
  // Surface openings configuration
  surfaceOpeningProbability?: number;
  // Additional features for caves
  hasStalactites?: boolean;
  hasWaterPools?: boolean;
  hasCrystals?: boolean;
  // The block to replace (usually stone)
  replaceBlock?: string;
  // Reference to BiomeManager to get all biomes dynamically (optional)
  biomeManager?: BiomeManager;
}

export class Cave extends BaseStructure {
  public readonly minSize: number;
  public readonly maxSize: number;
  public readonly minY: number;
  public readonly maxY: number;
  public readonly minSpaceBetween: number;
  public readonly replaceBlock: string;
  public readonly hasStalactites: boolean;
  public readonly hasWaterPools: boolean;
  public readonly hasCrystals: boolean;
  public readonly surfaceOpeningProbability: number;

  // Store previously generated cave centers to prevent overlap
  private static caveCache: Map<string, Array<{ x: number, y: number, radius: number }>> = new Map();

  // Noise functions for random generation while maintaining determinism
  private sizeFn: (x: number, y: number) => number;
  private shapeFn: (x: number, y: number) => number;
  private featureFn: (x: number, y: number) => number;
  private detailFn: (x: number, y: number) => number;
  private cavityFn: (x: number, y: number) => number;

  constructor(props: CaveProps) {
    // If biomeManager is provided, get all biome IDs for validBiomes
    let validBiomes = props.validBiomes;

    if (props.biomeManager) {
      // Get all biome IDs from the BiomeManager
      validBiomes = props.biomeManager.getAllBiomes().map(biome => biome.id);
    } else if (!validBiomes) {
      // Fallback to the default list if neither biomeManager nor validBiomes are provided
      validBiomes = ['plains', 'forest', 'desert', 'swamp', 'snowy_mountains', 'savanna', 'badlands'];
    }

    super({
      ...props,
      validBiomes: validBiomes
    });

    this.minSize = props.minSize;
    this.maxSize = props.maxSize;
    this.minY = props.minY;
    this.maxY = props.maxY;
    this.minSpaceBetween = props.minSpaceBetween || 20; // Increased to make caves less frequent
    this.replaceBlock = props.replaceBlock || 'stone';
    this.hasStalactites = props.hasStalactites || false;
    this.hasWaterPools = props.hasWaterPools || false;
    this.hasCrystals = props.hasCrystals || false;
    this.surfaceOpeningProbability = props.surfaceOpeningProbability || 0.15; // Low probability for surface openings

    // Initialize noise functions with different seeds for varied generation
    const baseSeed = this.id || 'default';
    this.sizeFn = createNoise2D(alea(baseSeed + '-size'));
    this.shapeFn = createNoise2D(alea(baseSeed + '-shape'));
    this.featureFn = createNoise2D(alea(baseSeed + '-features'));
    this.detailFn = createNoise2D(alea(baseSeed + '-detail'));
    this.cavityFn = createNoise2D(alea(baseSeed + '-cavity'));

    // Initialize cave cache for this cave type if it doesn't exist
    if (!Cave.caveCache.has(this.id)) {
      Cave.caveCache.set(this.id, []);
    }
  }

  override canGenerateAt(x: number, y: number, biomeId: string, noiseFn: (x: number) => number): boolean {
    // Check Y-level constraint
    if (y < this.minY || y > this.maxY) {
      return false;
    }

    // Make caves less frequent near the surface with a depth-based probability adjustment
    if (y > -40) {
      // Near surface: Apply significant reduction
      const depthPenalty = 0.8 * (1 - (Math.abs(y) / 40)); // Between 0 and 0.8 based on depth
      if (Math.random() < depthPenalty) {
        return false;
      }
    }

    // Check if the biome is valid
    if (!this.validBiomes.includes(biomeId)) {
      return false;
    }

    // Check for nearby caves to prevent overlap
    const caves = Cave.caveCache.get(this.id) || [];
    const tooCloseToExistingCave = caves.some(cave => {
      const distance = Math.sqrt(Math.pow(x - cave.x, 2) + Math.pow(y - cave.y, 2));
      const randomSpaceFactor = 0.9 + (this.shapeFn(x / 15, y / 15) * 0.2);
      return distance < (this.minSpaceBetween + cave.radius) * randomSpaceFactor;
    });

    if (tooCloseToExistingCave) {
      return false;
    }

    // Add more randomness to the cave placement
    const positionVariance = (this.shapeFn(x / 40, y / 40) + 1) / 2 * 0.4;

    // Adjust rarity based on depth - caves are rarer closer to surface
    let depthModifier = 1.0;
    if (y > -80) {
      depthModifier = 0.5 + ((Math.abs(y) / 80) * 0.5); // 0.5 to 1.0 scaling with depth
    }

    const effectiveRarity = this.rarity * depthModifier * (0.8 + positionVariance);

    // Use the noise function to determine if a cave should generate
    return noiseFn(x) <= effectiveRarity;
  }

  override generateAt(
    x: number,
    y: number,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn: (x: number, y: number) => string
  ): void {
    // Generate a random value between 0 and 1 for size
    const randomValue = (this.sizeFn(x / 100, y / 100) + 1) / 2;

    // Apply scaling for larger caves to be rarer
    const exponent = 1.8 + (1.0 - this.rarity) * 1.8; // Increased exponent for size distribution
    const scaledValue = Math.pow(randomValue, exponent);

    // Determine target cave size
    const targetSize = Math.floor(
      this.minSize + scaledValue * (this.maxSize - this.minSize + 1)
    );

    // Calculate radius for initial approach
    const workingRadius = Math.ceil(Math.sqrt(targetSize / Math.PI) * 1.4); // Increased radius for more natural caverns

    // Register this cave in the cache
    const caves = Cave.caveCache.get(this.id) || [];
    caves.push({ x, y, radius: workingRadius });
    Cave.caveCache.set(this.id, caves);

    // Use metaballs/noise-based approach for more natural cave shapes
    this.generateNoiseCave(x, y, workingRadius, targetSize, setBlockFn, getBlockFn);
  }

  /**
   * Generate a more natural cave using multiple noise functions combined with circular falloff
   */
  private generateNoiseCave(
    centerX: number,
    centerY: number,
    radius: number,
    targetSize: number,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn: (x: number, y: number) => string
  ): void {
    const blocksPlaced = new Set<string>();
    const extendedRadius = Math.ceil(radius * 1.4); // Slightly larger area to work with

    // Prepare multiple noise scales for layered effect
    const largeScale = 20.0;
    const mediumScale = 10.0;
    const smallScale = 5.0;
    const detailScale = 2.5;

    // Try a circular scan pattern with noise influence
    for (let offsetX = -extendedRadius; offsetX <= extendedRadius; offsetX++) {
      for (let offsetY = -extendedRadius; offsetY <= extendedRadius; offsetY++) {
        const worldX = centerX + offsetX;
        const worldY = centerY + offsetY;

        // Skip if outside the Y-bounds
        if (worldY < this.minY || worldY > this.maxY) continue;

        // Calculate normalized distance from center (0-1)
        const distSq = (offsetX * offsetX + offsetY * offsetY) / (radius * radius);
        if (distSq > 1.8) continue; // Skip blocks far outside our target area

        // Get the existing block
        const existingBlock = getBlockFn(worldX, worldY);
        if (existingBlock !== this.replaceBlock) continue;

        // Multi-layered noise for natural-looking caves
        const largeNoise = (this.cavityFn(worldX / largeScale, worldY / largeScale) + 1) / 2;
        const mediumNoise = (this.shapeFn(worldX / mediumScale, worldY / mediumScale) + 1) / 2;
        const smallNoise = (this.detailFn(worldX / smallScale, worldY / smallScale) + 1) / 2;
        const detailNoise = (this.featureFn(worldX / detailScale, worldY / detailScale) + 1) / 2;

        // Weight the different noise scales
        const combinedNoise = largeNoise * 0.5 + mediumNoise * 0.3 + smallNoise * 0.15 + detailNoise * 0.05;

        // Radial falloff function - closer to center = more likely to be air
        // Using a smooth falloff for more natural shapes
        const radialFalloff = Math.max(0, 1 - Math.pow(Math.sqrt(distSq), 1.5));

        // Combine noise and distance for final determination
        // High noise + close to center = more likely to be air
        const cutoffThreshold = 0.4 + (0.5 * radialFalloff);

        if (combinedNoise > cutoffThreshold) {
          // Place air block
          setBlockFn(worldX, worldY, 'air');
          blocksPlaced.add(`${worldX},${worldY}`);

          // Consider adding features but with low probability
          if (combinedNoise > 0.9 && Math.random() > 0.8) {
            this.addCaveFeatures(worldX, worldY, setBlockFn, getBlockFn);
          }
        }
      }
    }

    // Connect fragmented areas of the cave
    this.connectCaveFragments(centerX, centerY, radius, blocksPlaced, setBlockFn, getBlockFn);

    // If we've placed enough blocks, consider adding an entrance
    if (blocksPlaced.size >= targetSize * 0.8) {
      // Only create surface entrances for caves near the surface with low probability
      if (centerY > -60 && Math.random() < this.surfaceOpeningProbability) {
        this.createCaveEntrance(centerX, centerY, blocksPlaced, setBlockFn, getBlockFn);
      }
    }
  }

  /**
   * Connect fragmented areas of the cave to ensure it's a single continuous structure
   */
  private connectCaveFragments(
    centerX: number,
    centerY: number,
    radius: number,
    blocksPlaced: Set<string>,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn: (x: number, y: number) => string
  ): void {
    if (blocksPlaced.size === 0) return;

    // Find isolated regions by flood filling
    const visitedBlocks = new Set<string>();
    const regions: Array<Set<string>> = [];

    // Process all placed blocks
    for (const posKey of blocksPlaced) {
      if (visitedBlocks.has(posKey)) continue;

      // Start a new region
      const region = new Set<string>();
      const queue = [posKey];

      // Flood fill to find all connected blocks
      while (queue.length > 0) {
        const currentPosKey = queue.shift()!;
        if (visitedBlocks.has(currentPosKey)) continue;

        visitedBlocks.add(currentPosKey);
        region.add(currentPosKey);

        // Parse coordinates
        const [xStr, yStr] = currentPosKey.split(',');
        const x = parseInt(xStr);
        const y = parseInt(yStr);

        // Check all 8 neighboring positions
        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
          { x: x + 1, y: y + 1 },
          { x: x + 1, y: y - 1 },
          { x: x - 1, y: y + 1 },
          { x: x - 1, y: y - 1 }
        ];

        for (const neighbor of neighbors) {
          const neighborKey = `${neighbor.x},${neighbor.y}`;
          if (blocksPlaced.has(neighborKey) && !visitedBlocks.has(neighborKey)) {
            queue.push(neighborKey);
          }
        }
      }

      // Add completed region
      if (region.size > 0) {
        regions.push(region);
      }
    }

    // If we only have one region, the cave is already connected
    if (regions.length <= 1) return;

    // Sort regions by size (descending)
    regions.sort((a, b) => b.size - a.size);

    // Primary region is the largest one
    const primaryRegion = regions[0];

    // Connect each other region to the primary one
    for (let i = 1; i < regions.length; i++) {
      this.connectRegions(primaryRegion, regions[i], radius, setBlockFn, getBlockFn, blocksPlaced);
    }
  }

  /**
   * Connect two separated regions of the cave
   */
  private connectRegions(
    regionA: Set<string>,
    regionB: Set<string>,
    radius: number,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn: (x: number, y: number) => string,
    blocksPlaced: Set<string>
  ): void {
    // Find closest pair of points between the two regions
    let minDistance = Infinity;
    let pointA: { x: number, y: number } | null = null;
    let pointB: { x: number, y: number } | null = null;

    // Sample points from both regions instead of checking all combinations
    const sampleSizeA = Math.min(50, regionA.size);
    const sampleSizeB = Math.min(50, regionB.size);

    const sampledA = this.samplePoints(regionA, sampleSizeA);
    const sampledB = this.samplePoints(regionB, sampleSizeB);

    // Find closest pair
    for (const pointInA of sampledA) {
      for (const pointInB of sampledB) {
        const dist = Math.sqrt(
          Math.pow(pointInA.x - pointInB.x, 2) +
          Math.pow(pointInA.y - pointInB.y, 2)
        );

        if (dist < minDistance) {
          minDistance = dist;
          pointA = pointInA;
          pointB = pointInB;
        }
      }
    }

    // If we found valid points, create a tunnel between them
    if (pointA && pointB) {
      this.createTunnel(pointA, pointB, setBlockFn, getBlockFn, blocksPlaced);
    }
  }

  /**
   * Sample a subset of points from a region
   */
  private samplePoints(region: Set<string>, sampleSize: number): Array<{ x: number, y: number }> {
    const points: Array<{ x: number, y: number }> = [];
    const regionPoints = Array.from(region);

    // Randomly select points
    for (let i = 0; i < sampleSize && i < regionPoints.length; i++) {
      const randomIndex = Math.floor(Math.random() * regionPoints.length);
      const [xStr, yStr] = regionPoints[randomIndex].split(',');
      points.push({
        x: parseInt(xStr),
        y: parseInt(yStr)
      });
    }

    return points;
  }

  /**
   * Create a natural tunnel between two points
   */
  private createTunnel(
    start: { x: number, y: number },
    end: { x: number, y: number },
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn: (x: number, y: number) => string,
    blocksPlaced: Set<string>
  ): void {
    // Create a natural tunneling path
    let x = start.x;
    let y = start.y;
    const targetX = end.x;
    const targetY = end.y;

    // Calculate direction vector
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    // Normalized direction vector
    const ndx = dx / distance;
    const ndy = dy / distance;

    // Random step size for more natural paths
    const minStep = 0.4;
    const maxStep = 0.9;

    // Add some noise to the path
    let currentX = x;
    let currentY = y;
    let totalDistance = 0;

    while (totalDistance < distance) {
      // Calculate step size
      const stepBase = minStep + Math.random() * (maxStep - minStep);

      // Add slight noise to direction
      const noise = (this.detailFn(currentX / 5, currentY / 5) + 1) / 10;
      const noiseX = (Math.random() - 0.5) * noise;
      const noiseY = (Math.random() - 0.5) * noise;

      // Update position
      currentX += (ndx + noiseX) * stepBase;
      currentY += (ndy + noiseY) * stepBase;
      totalDistance += stepBase;

      // Convert to integer coordinates
      const blockX = Math.round(currentX);
      const blockY = Math.round(currentY);

      // Check if we've reached the surface or outside air
      if (getBlockFn(blockX, blockY) === 'air' && !blocksPlaced.has(`${blockX},${blockY}`)) {
        // Found an exit, tunnel complete
        break;
      }

      // Create the tunnel by placing air
      if (getBlockFn(blockX, blockY) !== 'air') {
        setBlockFn(blockX, blockY, 'air');
        blocksPlaced.add(`${blockX},${blockY}`);
      }

      // Tunnel width that varies with depth - wider near start, narrower near surface
      const distanceFromStart = Math.abs(blockY - start.y);
      const maxPotentialDistance = Math.abs(start.y); // Max theoretical distance to surface
      const progressRatio = Math.min(1, distanceFromStart / (maxPotentialDistance || 1));
      const tunnelWidth = Math.max(1, Math.floor(3 * (1 - progressRatio)));

      // Add width to the tunnel using a circular pattern
      for (let wx = -tunnelWidth; wx <= tunnelWidth; wx++) {
        for (let wy = -tunnelWidth; wy <= tunnelWidth; wy++) {
          if (wx * wx + wy * wy <= tunnelWidth * tunnelWidth) {
            const worldX = blockX + wx;
            const worldY = blockY + wy;

            // Only replace appropriate blocks
            const currentBlock = getBlockFn(worldX, worldY);
            if (currentBlock !== 'air' && currentBlock !== 'water' && currentBlock !== 'undefined') {
              setBlockFn(worldX, worldY, 'air');
              blocksPlaced.add(`${worldX},${worldY}`);
            }
          }
        }
      }
    }
  }

  /**
   * Add special features to caves like stalactites, water pools, or crystals
   */
  private addCaveFeatures(
    x: number,
    y: number,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn: (x: number, y: number) => string
  ): void {
    // Feature probability based on noise
    const featureValue = (this.featureFn(x / 10, y / 10) + 1) / 2;

    // Small chance to add features (prevents overcrowding)
    if (featureValue > 0.9) {
      // Check if blocks above/below are solid
      const blockAbove = getBlockFn(x, y + 1);
      const blockBelow = getBlockFn(x, y - 1);

      // Add stalactites hanging from ceiling
      if (this.hasStalactites && blockAbove === this.replaceBlock && featureValue > 0.95) {
        // Stalactites only form on ceilings
        setBlockFn(x, y, 'stalactite');
      }

      // Add water pools on the floor
      else if (this.hasWaterPools && blockBelow !== 'air' && y < -40 && featureValue > 0.96) {
        setBlockFn(x, y, 'water');
      }

      // Add crystals on walls with very low probability
      else if (this.hasCrystals && featureValue > 0.97) {
        // Check if there's a wall nearby
        const hasAdjacentWall = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 }
        ].some(pos => getBlockFn(pos.x, pos.y) === this.replaceBlock);

        if (hasAdjacentWall) {
          // Different colors of crystals based on depth
          if (y < -100) {
            setBlockFn(x, y, 'diamond_crystal');
          } else if (y < -80) {
            setBlockFn(x, y, 'amethyst_crystal');
          } else {
            setBlockFn(x, y, 'quartz_crystal');
          }
        }
      }
    }
  }

  /**
   * Create tunnel entrances to the surface or other areas
   */
  private createCaveEntrance(
    centerX: number,
    centerY: number,
    blocksPlaced: Set<string>,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn: (x: number, y: number) => string
  ): void {
    // Only create entrances for caves relatively near the surface
    if (centerY < -60) return;

    // Find edge points of the cave that could serve as entrance starting points
    const edgePoints: Array<{ x: number, y: number }> = [];

    // Collect candidate edge points
    for (const posKey of blocksPlaced) {
      const [xStr, yStr] = posKey.split(',');
      const x = parseInt(xStr);
      const y = parseInt(yStr);

      // Check if this is an edge point (has adjacent non-air blocks)
      const adjacentPositions = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 }
      ];

      const hasAdjacentSolid = adjacentPositions.some(pos => {
        const block = getBlockFn(pos.x, pos.y);
        return block !== 'air';
      });

      if (hasAdjacentSolid) {
        edgePoints.push({ x, y });
      }
    }

    if (edgePoints.length === 0) return;

    // Sort edge points by their y-value (higher y = closer to surface)
    edgePoints.sort((a, b) => b.y - a.y);

    // Take the top few points as potential entrance candidates
    const candidateCount = Math.min(5, edgePoints.length);
    const candidates = edgePoints.slice(0, candidateCount);

    // Select a random candidate as the entrance point
    const entrancePoint = candidates[Math.floor((this.featureFn(centerX / 50, centerY / 50) + 1) / 2 * candidateCount)];

    if (!entrancePoint) return;

    // Create a natural-looking winding tunnel that leads to the surface
    this.createWindingTunnelToSurface(entrancePoint.x, entrancePoint.y, setBlockFn, getBlockFn);
  }

  /**
   * Create a natural-looking winding tunnel that leads to the surface
   */
  private createWindingTunnelToSurface(
    startX: number,
    startY: number,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn: (x: number, y: number) => string
  ): void {
    // Initial direction is mostly upward
    let dx = 0;
    let dy = 1; // Default upward

    let currentX = startX;
    let currentY = startY;
    let tunnelLength = 0;
    const maxTunnelLength = 100; // Longer max tunnel to reach surface

    // Track blocks we've placed as part of this tunnel
    const tunnelBlocks = new Set<string>();

    // Use noise for more natural twisting
    const xNoiseScale = 0.08;
    const yNoiseScale = 0.05;

    while (tunnelLength < maxTunnelLength) {
      // Get noise-influenced direction
      const noiseX = (this.detailFn(currentX * xNoiseScale, currentY * yNoiseScale) + 1) / 2 - 0.5;
      const noiseY = (this.shapeFn(currentX * xNoiseScale, currentY * yNoiseScale) + 1) / 2;

      // Adjust direction - stronger upward tendency with some twists
      dx = 0.3 * dx + 0.7 * noiseX;
      dy = 0.7 * dy + 0.3 * noiseY; // Maintain upward bias

      // Normalize to prevent too large steps and maintain upward movement
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        dx = dx / length * 0.8;
        dy = Math.max(0.3, dy / length * 0.8); // Ensure we keep moving up
      }

      // Move to next position
      currentX += dx;
      currentY += dy;
      tunnelLength++;

      // Round to nearest block
      const blockX = Math.round(currentX);
      const blockY = Math.round(currentY);

      // Check if we've reached the surface or outside air
      if (getBlockFn(blockX, blockY) === 'air' && !tunnelBlocks.has(`${blockX},${blockY}`)) {
        // Found an exit, tunnel complete
        break;
      }

      // Create the tunnel by placing air
      if (getBlockFn(blockX, blockY) !== 'air') {
        setBlockFn(blockX, blockY, 'air');
        tunnelBlocks.add(`${blockX},${blockY}`);
      }

      // Calculate tunnel width using current vs starting position
      const tunnelWidth = Math.max(1, Math.min(3, Math.floor(3 - (tunnelLength / 30))));

      // Add width to the tunnel using a circular pattern
      for (let wx = -tunnelWidth; wx <= tunnelWidth; wx++) {
        for (let wy = -tunnelWidth; wy <= tunnelWidth; wy++) {
          if (wx * wx + wy * wy <= tunnelWidth * tunnelWidth) {
            const worldX = blockX + wx;
            const worldY = blockY + wy;

            // Only replace appropriate blocks
            const currentBlock = getBlockFn(worldX, worldY);
            if (currentBlock !== 'air' && currentBlock !== 'water' && currentBlock !== 'undefined') {
              setBlockFn(worldX, worldY, 'air');
              tunnelBlocks.add(`${worldX},${worldY}`);
            }
          }
        }
      }
    }
  }

  /**
   * Clear the cave cache for regeneration
   */
  public static clearCaveCache(): void {
    Cave.caveCache.clear();
  }

  /**
   * Clear caves only for a specific chunk
   */
  public static clearCaveCacheForChunk(chunkX: number, chunkSize: number = 16): void {
    const startX = chunkX * chunkSize;
    const endX = startX + chunkSize - 1;

    for (const [caveId, caves] of Cave.caveCache.entries()) {
      const filteredCaves = caves.filter(cave =>
        cave.x < startX || cave.x > endX
      );
      Cave.caveCache.set(caveId, filteredCaves);
    }
  }
} 
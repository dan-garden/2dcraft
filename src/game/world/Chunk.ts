import { WorldGenerator } from './WorldGenerator';
import { BiomeManager } from './BiomeManager';
import { StructureManager } from './StructureManager';
import { generateChunk } from './WorldGeneration';

export class Chunk {
  static readonly SIZE = 16;
  readonly x: number;
  readonly y: number;
  readonly data: string[][];

  constructor(x: number, y: number, generators: {
    worldGenerator: WorldGenerator;
    biomeManager: BiomeManager;
    structureManager: StructureManager;
  }) {
    this.x = x;
    this.y = y;
    this.data = this.generate(generators);
  }

  private generate(generators: {
    worldGenerator: WorldGenerator;
    biomeManager: BiomeManager;
    structureManager: StructureManager;
  }): string[][] {
    // Use the new generateChunk function from the modular system
    return generateChunk(this.x, this.y, Chunk.SIZE, Chunk.SIZE, generators);
  }

  // Get the world bounds of this chunk
  public getBounds() {
    const startX = this.x * Chunk.SIZE;
    const startY = this.y * Chunk.SIZE;
    const endX = startX + Chunk.SIZE - 1;
    const endY = startY + Chunk.SIZE - 1;
    return { startX, startY, endX, endY };
  }
}
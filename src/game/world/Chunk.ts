import { WorldGenerator } from './WorldGenerator';
import { BiomeGenerator } from './BiomeGenerator';
import { StructureGenerator } from './StructureGenerator';
import { generateChunk } from './WorldGeneration';

export class Chunk {
  static readonly SIZE = 16;
  readonly x: number;
  readonly y: number;
  readonly data: number[][];

  constructor(x: number, y: number, generators: {
    worldGenerator: WorldGenerator;
    biomeGenerator: BiomeGenerator;
    structureGenerator: StructureGenerator;
  }) {
    this.x = x;
    this.y = y;
    this.data = this.generate(generators);
  }

  private generate(generators: {
    worldGenerator: WorldGenerator;
    biomeGenerator: BiomeGenerator;
    structureGenerator: StructureGenerator;
  }): number[][] {
    // Use the new generateChunk function from the modular system
    return generateChunk(this.x, this.y, Chunk.SIZE, Chunk.SIZE, generators);
  }
}
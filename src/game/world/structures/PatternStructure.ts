import { BaseStructure, StructureProps } from './BaseStructure';

export interface PatternStructureProps extends StructureProps {
  pattern: string[][]; // 2D array representing the structure pattern
}

export class PatternStructure extends BaseStructure {
  public readonly pattern: string[][];
  public readonly width: number;
  public readonly height: number;

  constructor(props: PatternStructureProps) {
    super(props);
    this.pattern = props.pattern;
    this.height = this.pattern.length;
    this.width = this.pattern.length > 0 ? this.pattern[0].length : 0;
  }

  override canGenerateAt(x: number, y: number, biomeId: string, noiseFn: (x: number) => number): boolean {
    // Check biome and probability with the parent class method
    if (!super.canGenerateAt(x, y, biomeId, noiseFn)) {
      return false;
    }

    // Additional check to ensure the structure won't be cut off at chunk boundaries
    const safetyMargin = Math.ceil(this.width / 2) + 1;
    const chunkSize = 16;

    // Calculate distance to chunk boundary
    const chunkX = Math.floor(x / chunkSize);
    const startX = chunkX * chunkSize;
    const endX = startX + chunkSize - 1;

    // Ensure we're not too close to chunk boundaries horizontally
    if (x < startX + safetyMargin || x > endX - safetyMargin) {
      return false;
    }

    // For vertical structures like trees, ensure there's enough vertical space
    // since the pattern is centered on x but grows upward from y
    if (y + this.height > y + 16) { // Check if it will extend too far up
      return false;
    }

    return true;
  }

  override generateAt(
    x: number,
    y: number,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn?: (x: number, y: number) => string
  ): void {
    // Calculate the base Y position for the structure by adding the structure's offset
    const baseY = y + this.yOffset;

    // Loop through the structure pattern and place blocks
    for (let patternY = 0; patternY < this.pattern.length; patternY++) {
      const row = this.pattern[patternY];
      for (let patternX = 0; patternX < row.length; patternX++) {
        const blockId = row[patternX];
        if (blockId !== 'air') { // Skip air blocks
          // Calculate world coordinates - center horizontally
          const worldX = x + patternX - Math.floor(row.length / 2);
          const worldY = baseY + (this.pattern.length - 1 - patternY); // Invert Y to match pattern orientation

          // Place the block
          setBlockFn(worldX, worldY, blockId);
        }
      }
    }
  }
} 
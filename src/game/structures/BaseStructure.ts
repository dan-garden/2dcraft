export interface StructureProps {
  id: string;
  name: string;
  rarity: number; // 0 to 1, where 1 is most common
  validBiomes: string[]; // Biome IDs where this structure can generate
  minDistance?: number; // Minimum distance between structures of the same type
  yOffset?: number; // Vertical offset relative to the surface
}

export class BaseStructure {
  public readonly id: string;
  public readonly name: string;
  public readonly rarity: number;
  public readonly validBiomes: string[];
  public readonly minDistance: number;
  public readonly yOffset: number;

  constructor(props: StructureProps) {
    this.id = props.id;
    this.name = props.name;
    this.rarity = props.rarity;
    this.validBiomes = props.validBiomes;
    this.minDistance = props.minDistance || 3;
    this.yOffset = props.yOffset || 0;
  }

  // Determines if this structure should be placed at the given location
  canGenerateAt(x: number, y: number, biomeId: string, noiseFn: (x: number) => number): boolean {
    // Check if this biome is valid for this structure
    if (!this.validBiomes.includes(biomeId)) {
      return false;
    }

    // Use noise to determine if a structure should generate here
    const noiseValue = noiseFn(x);
    return noiseValue <= this.rarity;
  }

  // Generate the structure at the given position
  // The default implementation is empty - subclasses should override this
  generateAt(
    x: number,
    y: number,
    setBlockFn: (x: number, y: number, blockId: string) => void,
    getBlockFn?: (x: number, y: number) => string
  ): void {
    // Default implementation does nothing - override in subclasses
  }
} 
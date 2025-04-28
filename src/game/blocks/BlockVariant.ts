import { Block } from './Block';

export class BlockVariant extends Block {
  private baseId: number;
  private variantId: number;
  private variantName: string;
  private variantColor: number;
  private variantTexturePath: string;

  constructor(
    baseBlock: Block,
    variantId: number,
    variantName: string,
    variantColor: number,
    variantTexturePath: string
  ) {
    super();
    this.baseId = baseBlock.id;
    this.variantId = variantId;
    this.variantName = variantName;
    this.variantColor = variantColor;
    this.variantTexturePath = variantTexturePath;
  }

  get id(): number {
    return this.variantId;
  }

  get name(): string {
    return this.variantName;
  }

  get color(): number {
    return this.variantColor;
  }

  get isSolid(): boolean {
    return true;
  }

  get texturePath(): string {
    return this.variantTexturePath;
  }
} 
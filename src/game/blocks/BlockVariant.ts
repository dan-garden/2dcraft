import { Block } from './Block';

export class BlockVariant extends Block {
  private baseId: string;
  private variantId: string;
  private variantName: string;
  private variantColor: number;
  private variantTexturePath: string;

  constructor(
    baseBlock: Block,
    variantId: string,
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

  get id(): string {
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
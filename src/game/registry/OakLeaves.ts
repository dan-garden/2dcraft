import { Block } from '../blocks/Block';

export class OakLeaves extends Block {
  readonly id = 'oak_leaves';
  readonly name = 'Oak Leaves';
  readonly color = 0x00AA00; // Bright Green
  readonly isSolid = true;
  readonly isTransparent = true; // Leaves should be transparent
  readonly texturePath = './textures/blocks/oak_leaves.png';
  readonly tinted = true;
} 
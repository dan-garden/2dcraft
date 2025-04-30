import { Block } from '../../blocks/Block';

export class SpruceLeaves extends Block {
  readonly id = 'spruce_leaves';
  readonly name = 'Spruce Leaves';
  readonly color = 0x00AA00; // Bright Green
  readonly isSolid = true;
  readonly isTransparent = true; // Leaves should be transparent
  readonly texturePath = './textures/blocks/spruce_leaves.png';
  readonly tinted = true;
} 
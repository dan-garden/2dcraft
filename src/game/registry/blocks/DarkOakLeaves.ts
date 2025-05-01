import { Block } from '../../blocks/Block';

export class DarkOakLeaves extends Block {
  readonly id = 'dark_oak_leaves';
  readonly name = 'Dark Oak Leaves';
  readonly color = 0x00AA00;
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './textures/blocks/dark_oak_leaves.png';
  readonly tinted = true;
} 
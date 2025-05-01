import { Block } from '../../blocks/Block';

export class AcaciaLeaves extends Block {
  readonly id = 'acacia_leaves';
  readonly name = 'Acacia Leaves';
  readonly color = 0x00AA00;
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './textures/blocks/acacia_leaves.png';
  readonly tinted = true;
} 
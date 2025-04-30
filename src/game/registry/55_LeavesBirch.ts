import { Block } from '../blocks/Block';

export class LeavesBirch extends Block {
  readonly id = 55;
  readonly name = 'Birch Leaves';
  readonly color = 0x00AA00;
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './textures/blocks/birch_leaves.png';
  readonly tinted = true;
} 
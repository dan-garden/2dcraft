import { Block } from '../blocks/Block';

export class LeavesSpruce extends Block {
  readonly id = 20;
  readonly name = 'Spruce Leaves';
  readonly color = 0x00AA00; // Bright Green
  readonly isSolid = true;
  readonly isTransparent = true; // Leaves should be transparent
  readonly texturePath = './textures/blocks/spruce_leaves.png';
  readonly tinted = true;
} 
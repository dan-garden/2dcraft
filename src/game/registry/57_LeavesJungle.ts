import { Block } from '../blocks/Block';

export class LeavesJungle extends Block {
  readonly id = 'leaves_jungle';
  readonly name = 'Jungle Leaves';
  readonly color = 0x00AA00;
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './textures/blocks/jungle_leaves.png';
  readonly tinted = true;
} 
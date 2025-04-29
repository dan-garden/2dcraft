import { Block } from '../blocks/Block';

export class LeavesJungle extends Block {
  readonly id = 57;
  readonly name = 'Leaves Jungle';
  readonly color = 0x00AA00;
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './assets/textures/leaves_jungle.png';
  readonly tinted = true;
} 
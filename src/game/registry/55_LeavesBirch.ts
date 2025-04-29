import { Block } from '../blocks/Block';

export class LeavesBirch extends Block {
  readonly id = 55;
  readonly name = 'Leaves Birch';
  readonly color = 0x00AA00;
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './assets/textures/leaves_birch.png';
  readonly tinted = true;
} 
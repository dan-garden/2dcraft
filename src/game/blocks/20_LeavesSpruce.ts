import { Block } from './Block';

export class LeavesSpruce extends Block {
  readonly id = 20;
  readonly name = 'Leaves Spruce';
  readonly color = 0x00AA00; // Bright Green
  readonly isSolid = true;
  readonly isTransparent = true; // Leaves should be transparent
  readonly texturePath = './assets/textures/leaves_spruce.png';
  readonly tinted = true;
} 
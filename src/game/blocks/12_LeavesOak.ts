import { Block } from './Block';

export class LeavesOak extends Block {
  readonly id = 12;
  readonly name = 'Leaves Oak';
  readonly color = 0x00AA00; // Bright Green
  readonly isSolid = true;
  readonly isTransparent = true; // Leaves should be transparent
  readonly texturePath = './assets/textures/leaves_oak.png';
  readonly tinted = true;
} 
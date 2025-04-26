import { Block } from './Block';

export class Clay extends Block {
  readonly id = 6;
  readonly name = 'Clay';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './assets/textures/clay.png';
} 
import { Block } from '../blocks/Block';

export class Clay extends Block {
  readonly id = 6;
  readonly name = 'Clay';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/clay.png';
} 
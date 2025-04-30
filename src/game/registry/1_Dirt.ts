import { Block } from '../blocks/Block';

export class Dirt extends Block {
  readonly id = 1;
  readonly name = 'Dirt';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/dirt.png';
} 
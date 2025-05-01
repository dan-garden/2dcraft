import { Block } from '../../blocks/Block';

export class Sandstone extends Block {
  readonly id = 'sandstone';
  readonly name = 'Sandstone';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/sandstone.png';
} 
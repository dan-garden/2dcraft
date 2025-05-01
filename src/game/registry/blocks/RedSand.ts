import { Block } from '../../blocks/Block';

export class RedSand extends Block {
  readonly id = 'red_sand';
  readonly name = 'Red Sand';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/red_sand.png';
} 
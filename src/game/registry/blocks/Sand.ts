import { Block } from '../../blocks/Block';

export class Sand extends Block {
  readonly id = 'sand';
  readonly name = 'Sand';
  readonly color = 0xFFFF00; // Yellow
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/sand.png';
} 
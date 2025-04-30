import { Block } from '../../blocks/Block';

export class Gravel extends Block {
  readonly id = 'gravel';
  readonly name = 'Gravel';
  readonly color = 0xFFFF00;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/gravel.png';
} 
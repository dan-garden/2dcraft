import { Block } from '../blocks/Block';

export class Gravel extends Block {
  readonly id = 24;
  readonly name = 'Gravel';
  readonly color = 0xFFFF00;
  readonly isSolid = true;
  readonly texturePath = './assets/textures/gravel.png';
} 
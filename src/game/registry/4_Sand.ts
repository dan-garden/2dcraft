import { Block } from '../blocks/Block';

export class Sand extends Block {
  readonly id = 4;
  readonly name = 'Sand';
  readonly color = 0xFFFF00; // Yellow
  readonly isSolid = true;
  readonly texturePath = './assets/textures/sand.png';
} 
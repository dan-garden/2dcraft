import { Block } from '../blocks/Block';

export class Snow extends Block {
  readonly id = 5;
  readonly name = 'Snow';
  readonly color = 0xFFFFFF; // White
  readonly isSolid = true;
  readonly texturePath = './assets/textures/snow.png';
} 
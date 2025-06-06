import { Block } from '../../blocks/Block';

export class Snow extends Block {
  readonly id = 'snow';
  readonly name = 'Snow';
  readonly color = 0xFFFFFF; // White
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/snow.png';
} 
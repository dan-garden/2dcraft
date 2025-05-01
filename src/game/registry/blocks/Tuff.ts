import { Block } from '../../blocks/Block';

export class Tuff extends Block {
  readonly id = 'tuff';
  readonly name = 'Tuff';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/tuff.png';
  readonly tinted = false;
} 
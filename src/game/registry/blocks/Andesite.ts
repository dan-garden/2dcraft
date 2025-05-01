import { Block } from '../../blocks/Block';

export class Andesite extends Block {
  readonly id = 'andesite';
  readonly name = 'Andesite';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/andesite.png';
  readonly tinted = false;
} 
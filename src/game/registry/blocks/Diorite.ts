import { Block } from '../../blocks/Block';

export class Diorite extends Block {
  readonly id = 'diorite';
  readonly name = 'Diorite';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/diorite.png';
  readonly tinted = false;
} 
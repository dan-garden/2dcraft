import { Block } from '../blocks/Block';

export class Bookshelf extends Block {
  readonly id = 'bookshelf';
  readonly name = 'Bookshelf';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/bookshelf.png';
  readonly tinted = false;
} 
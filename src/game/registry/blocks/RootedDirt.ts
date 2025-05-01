import { Block } from '../../blocks/Block';

export class RootedDirt extends Block {
  readonly id = 'rooted_dirt';
  readonly name = 'Rooted Dirt';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/rooted_dirt.png';
} 
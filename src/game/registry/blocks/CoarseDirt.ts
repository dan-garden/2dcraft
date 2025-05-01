import { Block } from '../../blocks/Block';

export class CoarseDirt extends Block {
  readonly id = 'coarse_dirt';
  readonly name = 'Coarse Dirt';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/coarse_dirt.png';
} 
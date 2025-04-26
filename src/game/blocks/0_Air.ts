import { Block } from './Block';

export class Air extends Block {
  readonly id = 0;
  readonly name = 'Air';
  readonly color = 0x82F0FF; // Sky blue color
  readonly isSolid = false;
  readonly isTransparent = true;
  readonly texturePath = '';
} 
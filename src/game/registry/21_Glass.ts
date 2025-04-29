import { Block } from '../blocks/Block';

export class Glass extends Block {
  readonly id = 21;
  readonly name = 'Glass';
  readonly color = 0x00AA00; // Bright Green
  readonly isSolid = true;
  readonly isTransparent = true; // Leaves should be transparent
  readonly texturePath = './assets/textures/glass.png';
  readonly tinted = false;
} 
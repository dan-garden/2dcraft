import { Block } from '../blocks/Block';

export class Cactus extends Block {
  readonly id = 'cactus';
  readonly name = 'Cactus';
  readonly color = 0x00AA00; // Bright Green
  readonly isSolid = true;
  readonly isTransparent = true; // Cactus should be transparent
  readonly texturePath = './textures/blocks/cactus_side.png';
  readonly tinted = true;
} 
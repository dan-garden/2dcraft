import { Block } from '../blocks/Block';

export class Ice extends Block {
  readonly id = 53;
  readonly name = 'Ice';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/ice.png';
  readonly tinted = false;
} 
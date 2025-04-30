import { Block } from '../blocks/Block';

export class Ice extends Block {
  readonly id = 'ice';
  readonly name = 'Ice';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/ice.png';
  readonly tinted = false;
} 
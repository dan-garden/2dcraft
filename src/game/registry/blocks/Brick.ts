import { Block } from '../../blocks/Block';

export class Brick extends Block {
  readonly id = 'brick';
  readonly name = 'Brick';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/brick.png';
  readonly tinted = false;
} 
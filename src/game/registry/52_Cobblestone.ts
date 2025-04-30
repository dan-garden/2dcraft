import { Block } from '../blocks/Block';

export class Cobblestone extends Block {
  readonly id = 52;
  readonly name = 'Cobblestone';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/cobblestone.png';
  readonly tinted = false;
} 
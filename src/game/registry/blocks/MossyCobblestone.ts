import { Block } from '../../blocks/Block';

export class MossyCobblestone extends Block {
  readonly id = 'mossy_cobblestone';
  readonly name = 'Mossy Cobblestone';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/mossy_cobblestone.png';
  readonly tinted = false;
} 
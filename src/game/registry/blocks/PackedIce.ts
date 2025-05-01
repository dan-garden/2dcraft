import { Block } from '../../blocks/Block';

export class PackedIce extends Block {
  readonly id = 'packed_ice';
  readonly name = 'Packed Ice';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/packed_ice.png';
  readonly tinted = false;
} 
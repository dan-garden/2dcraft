import { Block } from '../../blocks/Block';

export class ShroomLight extends Block {
  readonly id = 'shroomlight';
  readonly name = 'Shroom Light';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/shroomlight.png';
  readonly tinted = false;
} 
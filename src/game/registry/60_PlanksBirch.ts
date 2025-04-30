import { Block } from '../blocks/Block';

export class PlanksBirch extends Block {
  readonly id = 60;
  readonly name = 'Birch Planks';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/birch_planks.png';
  readonly tinted = false;
} 
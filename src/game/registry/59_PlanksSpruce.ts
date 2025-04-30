import { Block } from '../blocks/Block';

export class PlanksSpruce extends Block {
  readonly id = 'spruce_planks';
  readonly name = 'Spruce Planks';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/spruce_planks.png';
  readonly tinted = false;
} 
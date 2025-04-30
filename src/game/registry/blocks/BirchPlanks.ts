import { Block } from '../../blocks/Block';

export class BirchPlanks extends Block {
  readonly id = 'birch_planks';
  readonly name = 'Birch Planks';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/birch_planks.png';
  readonly tinted = false;
} 
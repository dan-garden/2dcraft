import { Block } from '../../blocks/Block';

export class OakPlanks extends Block {
  readonly id = 'oak_planks';
  readonly name = 'Oak Planks';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/oak_planks.png';
  readonly tinted = false;
} 
import { Block } from '../../blocks/Block';

export class DarkOakPlanks extends Block {
  readonly id = 'dark_oak_planks';
  readonly name = 'Dark Oak Planks';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/dark_oak_planks.png';
  readonly tinted = false;
} 
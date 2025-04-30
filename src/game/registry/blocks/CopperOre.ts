import { Block } from '../../blocks/Block';

export class CopperOre extends Block {
  readonly id = 'copper_ore';
  readonly name = 'Copper Ore';
  readonly color = 0xD2691E; // Copper/Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/copper_ore.png';
  readonly tinted = false;
} 
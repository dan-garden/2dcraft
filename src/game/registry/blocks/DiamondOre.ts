import { Block } from '../../blocks/Block';

export class DiamondOre extends Block {
  readonly id = 'diamond_ore';
  readonly name = 'Diamond Ore';
  readonly color = 0x00FFFF; // Cyan
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/diamond_ore.png';
  readonly tinted = false;
} 
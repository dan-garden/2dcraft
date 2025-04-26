import { Block } from './Block';

export class DiamondOre extends Block {
  readonly id = 16;
  readonly name = 'Diamond Ore';
  readonly color = 0x00FFFF; // Cyan
  readonly isSolid = true;
  readonly texturePath = './assets/textures/diamond_ore.png';
  readonly tinted = false;
} 
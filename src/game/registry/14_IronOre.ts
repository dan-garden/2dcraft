import { Block } from '../blocks/Block';

export class IronOre extends Block {
  readonly id = 14;
  readonly name = 'Iron Ore';
  readonly color = 0x808080; // Gray
  readonly isSolid = true;
  readonly texturePath = './assets/textures/iron_ore.png';
  readonly tinted = false;
} 
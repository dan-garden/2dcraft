import { Block } from '../blocks/Block';

export class IronOre extends Block {
  readonly id = 'iron_ore';
  readonly name = 'Iron Ore';
  readonly color = 0x808080; // Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/iron_ore.png';
  readonly tinted = false;
} 
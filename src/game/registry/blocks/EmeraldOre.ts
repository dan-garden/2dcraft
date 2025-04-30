import { Block } from '../../blocks/Block';

export class EmeraldOre extends Block {
  readonly id = 'emerald_ore';
  readonly name = 'Emerald Ore';
  readonly color = 0xAAFF00; // Bright Green
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/emerald_ore.png';
  readonly tinted = false;
} 
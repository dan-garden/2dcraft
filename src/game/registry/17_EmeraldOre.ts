import { Block } from '../blocks/Block';

export class EmeraldOre extends Block {
  readonly id = 17;
  readonly name = 'Emerald Ore';
  readonly color = 0xAAFF00; // Bright Green
  readonly isSolid = true;
  readonly texturePath = './assets/textures/emerald_ore.png';
  readonly tinted = false;
} 
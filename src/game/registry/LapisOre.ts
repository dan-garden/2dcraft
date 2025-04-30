import { Block } from '../blocks/Block';

export class LapisOre extends Block {
  readonly id = 'lapis_ore';
  readonly name = 'Lapis Lazuli Ore';
  readonly color = 0x0000CD; // Deep Blue
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/lapis_ore.png';
  readonly tinted = false;
} 
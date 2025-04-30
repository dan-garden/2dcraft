import { Block } from '../blocks/Block';

export class RedstoneOre extends Block {
  readonly id = 'redstone_ore';
  readonly name = 'Redstone Ore';
  readonly color = 0xFF0000; // Red
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/redstone_ore.png';
  readonly tinted = false;
} 
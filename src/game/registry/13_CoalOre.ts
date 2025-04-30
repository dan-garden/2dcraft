import { Block } from '../blocks/Block';

export class CoalOre extends Block {
  readonly id = 'coal_ore';
  readonly name = 'Coal Ore';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/coal_ore.png';
  readonly tinted = false;
} 
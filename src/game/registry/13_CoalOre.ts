import { Block } from '../blocks/Block';

export class CoalOre extends Block {
  readonly id = 13;
  readonly name = 'Coal Ore';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './assets/textures/coal_ore.png';
  readonly tinted = false;
} 
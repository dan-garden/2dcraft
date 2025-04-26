import { Block } from './Block';

export class GoldOre extends Block {
  readonly id = 15;
  readonly name = 'Gold Ore';
  readonly color = 0xFFD700; // Gold
  readonly isSolid = true;
  readonly texturePath = './assets/textures/gold_ore.png';
  readonly tinted = false;
} 
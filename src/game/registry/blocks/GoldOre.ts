import { Block } from '../../blocks/Block';

export class GoldOre extends Block {
  readonly id = 'gold_ore';
  readonly name = 'Gold Ore';
  readonly color = 0xFFD700; // Gold
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/gold_ore.png';
  readonly tinted = false;
} 
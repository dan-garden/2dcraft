import { Block } from '../../blocks/Block';

export class RedMushroomBlock extends Block {
  readonly id = 'red_mushroom_block';
  readonly name = 'Red Mushroom Block';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/red_mushroom_block.png';
  readonly tinted = false;
} 
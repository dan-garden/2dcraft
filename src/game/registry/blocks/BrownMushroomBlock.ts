import { Block } from '../../blocks/Block';

export class BrownMushroomBlock extends Block {
  readonly id = 'brown_mushroom_block';
  readonly name = 'Brown Mushroom Block';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/brown_mushroom_block.png';
  readonly tinted = false;
} 
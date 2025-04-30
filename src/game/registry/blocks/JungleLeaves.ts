import { Block } from '../../blocks/Block';

export class JungleLeaves extends Block {
  readonly id = 'jungle_leaves';
  readonly name = 'Jungle Leaves';
  readonly color = 0x00AA00;
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './textures/blocks/jungle_leaves.png';
  readonly tinted = true;
} 
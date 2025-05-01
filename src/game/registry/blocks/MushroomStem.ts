import { Block } from '../../blocks/Block';

export class MushroomStem extends Block {
  readonly id = 'mushroom_stem';
  readonly name = 'Mushroom Stem';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/mushroom_stem.png';
  readonly tinted = false;
} 
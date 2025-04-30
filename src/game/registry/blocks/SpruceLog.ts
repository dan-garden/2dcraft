import { Block } from '../../blocks/Block';

export class SpruceLog extends Block {
  readonly id = 'spruce_log';
  readonly name = 'Spruce Log';
  readonly color = 0x777777; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/spruce_log.png';
  readonly tinted = false;
} 
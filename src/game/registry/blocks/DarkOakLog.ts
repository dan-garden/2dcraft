import { Block } from '../../blocks/Block';

export class DarkOakLog extends Block {
  readonly id = 'dark_oak_log';
  readonly name = 'Dark Oak Log';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/dark_oak_log.png';
  readonly tinted = false;
} 
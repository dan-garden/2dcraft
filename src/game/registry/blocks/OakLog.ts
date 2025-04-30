import { Block } from '../../blocks/Block';

export class OakLog extends Block {
  readonly id = 'oak_log';
  readonly name = 'Oak Log';
  readonly color = 0x777777; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/oak_log.png';
  readonly tinted = false;
} 
import { Block } from '../blocks/Block';

export class LogSpruce extends Block {
  readonly id = 'log_spruce';
  readonly name = 'Spruce Log';
  readonly color = 0x777777; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/log_spruce.png';
  readonly tinted = false;
} 
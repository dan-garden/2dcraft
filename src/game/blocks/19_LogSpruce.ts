import { Block } from './Block';

export class LogSpruce extends Block {
  readonly id = 19;
  readonly name = 'Spruce Log';
  readonly color = 0x777777; // Brown
  readonly isSolid = true;
  readonly texturePath = './assets/textures/log_spruce.png';
  readonly tinted = false;
} 
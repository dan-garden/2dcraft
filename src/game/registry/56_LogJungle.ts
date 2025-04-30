import { Block } from '../blocks/Block';

export class LogJungle extends Block {
  readonly id = 'log_jungle';
  readonly name = 'Jungle Log';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/jungle_log.png';
  readonly tinted = false;
} 
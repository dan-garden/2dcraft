import { Block } from '../blocks/Block';

export class LogJungle extends Block {
  readonly id = 56;
  readonly name = 'Jungle Log';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './assets/textures/log_jungle.png';
  readonly tinted = false;
} 
import { Block } from '../blocks/Block';

export class LogOak extends Block {
  readonly id = 11;
  readonly name = 'Oak Log';
  readonly color = 0x777777; // Brown
  readonly isSolid = true;
  readonly texturePath = './assets/textures/log_oak.png';
  readonly tinted = false;
} 
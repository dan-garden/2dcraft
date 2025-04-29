import { Block } from '../blocks/Block';

export class LogBirch extends Block {
  readonly id = 54;
  readonly name = 'Birch Log';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './assets/textures/log_birch.png';
  readonly tinted = false;
} 
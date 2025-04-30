import { Block } from '../blocks/Block';

export class BirchLog extends Block {
  readonly id = 'birch_log';
  readonly name = 'Birch Log';
  readonly color = 0x777777;
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/birch_log.png';
  readonly tinted = false;
} 
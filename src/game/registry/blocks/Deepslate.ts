import { Block } from '../../blocks/Block';

export class Deepslate extends Block {
  readonly id = 'deepslate';
  readonly name = 'Deepslate';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/deepslate.png';
  readonly tinted = false;
  readonly hardness = 4.0; // Harder than dirt/grass
} 
import { Block } from '../blocks/Block';

export class Stone extends Block {
  readonly id = 'stone';
  readonly name = 'Stone';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/stone.png';
  readonly tinted = false;
  readonly hardness = 4.0; // Harder than dirt/grass
} 
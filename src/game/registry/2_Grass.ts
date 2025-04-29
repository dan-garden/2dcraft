import { Block } from '../blocks/Block';

export class Grass extends Block {
  readonly id = 2;
  readonly name = 'Grass';
  readonly color = 0x648732; // Bright Green
  readonly isSolid = true;
  readonly texturePath = './assets/textures/grass_top.png';
  readonly tinted = true; // Enable tinting for this block
} 
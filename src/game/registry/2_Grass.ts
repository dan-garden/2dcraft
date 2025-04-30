import { Block } from '../blocks/Block';

export class Grass extends Block {
  readonly id = 'grass';
  readonly name = 'Grass';
  readonly color = 0x648732; // Bright Green
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/grass_block_top.png';
  readonly tinted = true; // Enable tinting for this block
} 
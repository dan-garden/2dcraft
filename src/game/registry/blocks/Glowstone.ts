import { Block } from '../../blocks/Block';

export class Glowstone extends Block {
  readonly id = 'glowstone';
  readonly name = 'Glowstone';
  readonly color = 0xFFFF77; // Yellow light
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './textures/blocks/glowstone.png';
  readonly tinted = false;
  readonly lightEmission = 15; // Maximum light level
} 
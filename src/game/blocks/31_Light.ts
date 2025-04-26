import { Block } from './Block';

export class Light extends Block {
  readonly id = 31;
  readonly name = 'Light';
  readonly color = 0xFFFF77; // Yellow light
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './assets/textures/glowstone.png';
  readonly tinted = false;
  readonly lightEmission = 15; // Maximum light level
} 
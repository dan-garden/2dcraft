import { Block } from './Block';

export class Wool extends Block {
  readonly id = 32;
  readonly name = 'Wool';
  readonly color = 0xFFA500; // Orange color
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './assets/textures/wool_colored_black.png';
  readonly lightEmission = 12; // High light emission
} 
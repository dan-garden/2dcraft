import { Block } from './Block';

export class Light extends Block {
  readonly id = 31;
  readonly name = 'Light';
  readonly color = 0xFFFF77; // Yellow light
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './assets/textures/light.png';
  readonly tinted = true;
  readonly isLightSource = true;
  readonly lightIntensity = 1.0; // Default light intensity
  readonly lightColor = 0xFFFF99; // Light color (slightly different from block color)
  readonly lightRadius = 10.0; // How far the light reaches in blocks
} 
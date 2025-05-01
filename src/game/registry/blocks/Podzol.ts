import { Block } from '../../blocks/Block';

export class Podzol extends Block {
  readonly id = 'podzol';
  readonly name = 'Podzol';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/podzol_top.png';
} 
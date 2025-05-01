import { Block } from '../../blocks/Block';

export class Calcite extends Block {
  readonly id = 'calcite';
  readonly name = 'Calcite';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/calcite.png';
  readonly tinted = false;
} 
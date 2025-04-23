import { Block } from './Block';

export class GrassBlock extends Block {
  readonly id = 2;
  readonly name = 'Grass';
  readonly color = 0x00AA00; // Bright Green
  readonly isSolid = true;
} 
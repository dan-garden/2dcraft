import { Block } from './Block';

export class DirtBlock extends Block {
  readonly id = 1;
  readonly name = 'Dirt';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
} 
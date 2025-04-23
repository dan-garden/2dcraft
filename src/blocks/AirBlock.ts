import { Block } from './Block';

export class AirBlock extends Block {
  readonly id = 0;
  readonly name = 'Air';
  readonly color = 0x000000; // Black (transparent)
  readonly isSolid = false;
} 
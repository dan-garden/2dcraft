import { Block } from './Block';

export class StoneBlock extends Block {
  readonly id = 3;
  readonly name = 'Stone';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
} 
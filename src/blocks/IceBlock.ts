import { Block } from './Block';

export class IceBlock extends Block {
  readonly id = 4;
  readonly name = 'Ice';
  readonly color = 0xA5F2F3; // Light blue
  readonly isSolid = true;
  readonly friction = 0.3; // Low friction - slippery!
} 
import { Block } from '../../blocks/Block';

export class Mud extends Block {
  readonly id = 'mud';
  readonly name = 'Mud';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/mud.png';
  readonly tinted = false;
} 
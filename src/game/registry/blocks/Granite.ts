import { Block } from '../../blocks/Block';

export class Granite extends Block {
  readonly id = 'granite';
  readonly name = 'Granite';
  readonly color = 0x777777; // Light Gray
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/granite.png';
  readonly tinted = false;
} 
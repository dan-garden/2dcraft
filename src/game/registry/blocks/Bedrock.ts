import { Block } from '../../blocks/Block';

export class Bedrock extends Block {
  readonly id = 'bedrock';
  readonly name = 'Bedrock';
  readonly color = 0x8B4513; // Brown
  readonly isSolid = true;
  readonly texturePath = './textures/blocks/bedrock.png';
  readonly hardness = Infinity; // Unbreakable
}
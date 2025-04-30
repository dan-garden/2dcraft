import { Block } from '../blocks/Block';
import { BlockVariant } from '../blocks/BlockVariant';

export class Wool extends Block {
  static readonly id = 'wool';
  readonly id = Wool.id;
  readonly name = 'Wool';
  readonly color = 0xFFA500; // Orange color
  readonly isSolid = true;
  readonly isTransparent = true;
  readonly texturePath = './textures/blocks/wool_colored_black.png';
  readonly lightEmission = 12; // High light emission
  readonly shouldRegister = false; // Base wool block should not be registered
  readonly hasVariants = true; // Wool has color variants

  // Define wool colors and their properties
  static readonly COLORS = [
    { name: 'White', color: 0xFFFFFF, texture: 'wool_colored_white.png' },
    { name: 'Orange', color: 0xFFA500, texture: 'wool_colored_orange.png' },
    { name: 'Magenta', color: 0xFF00FF, texture: 'wool_colored_magenta.png' },
    { name: 'Light Blue', color: 0xADD8E6, texture: 'wool_colored_light_blue.png' },
    { name: 'Yellow', color: 0xFFFF00, texture: 'wool_colored_yellow.png' },
    { name: 'Lime', color: 0x00FF00, texture: 'wool_colored_lime.png' },
    { name: 'Pink', color: 0xFFC0CB, texture: 'wool_colored_pink.png' },
    { name: 'Gray', color: 0x808080, texture: 'wool_colored_gray.png' },
    { name: 'Light Gray', color: 0xD3D3D3, texture: 'wool_colored_silver.png' },
    { name: 'Cyan', color: 0x00FFFF, texture: 'wool_colored_cyan.png' },
    { name: 'Purple', color: 0x800080, texture: 'wool_colored_purple.png' },
    { name: 'Blue', color: 0x0000FF, texture: 'wool_colored_blue.png' },
    { name: 'Brown', color: 0x8B4513, texture: 'wool_colored_brown.png' },
    { name: 'Green', color: 0x008000, texture: 'wool_colored_green.png' },
    { name: 'Red', color: 0xFF0000, texture: 'wool_colored_red.png' },
    { name: 'Black', color: 0x000000, texture: 'wool_colored_black.png' }
  ];

  // Create a variant for a specific color
  static createVariant(colorIndex: number): BlockVariant {
    if (colorIndex < 0 || colorIndex >= Wool.COLORS.length) {
      throw new Error(`Invalid wool color index: ${colorIndex}`);
    }

    const color = Wool.COLORS[colorIndex];
    return new BlockVariant(
      new Wool(),
      Wool.id + colorIndex,
      `${color.name} Wool`,
      color.color,
      `./textures/blocks/${color.texture}`
    );
  }

  // Get all wool variants
  static getAllVariants(): BlockVariant[] {
    return Wool.COLORS.map((_, index) => Wool.createVariant(index));
  }
} 
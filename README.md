# 2DCraft Block System

This project implements a flexible block system for a 2D Minecraft-like game.

## Block System Architecture

The block system is built with these components:

### Core Components

1. **Abstract Block Class**
   - Base class for all block types
   - Properties: id, name, color, isSolid
   - Methods: isCollidable()

2. **Block Implementations**
   - AirBlock: Non-solid, transparent block (id: 0)
   - DirtBlock: Basic solid terrain block (id: 1)
   - GrassBlock: Top layer of terrain (id: 2)
   - StoneBlock: Common solid block for underground (id: 3)

3. **BlockRegistry**
   - Singleton pattern for global access
   - Manages block instances
   - Provides methods to retrieve blocks by ID

## Integration with Game Systems

The block system integrates with:

1. **Chunk System**
   - Stores block IDs instead of enum values
   - Returns Block objects for collision detection and rendering

2. **Rendering System**
   - Uses block colors for visualization
   - Can be extended to support sprites/textures

3. **Physics/Collision System**
   - Uses block.isCollidable() to determine if a player can pass through a block

## Adding New Block Types

To add a new block type:

1. Create a new class extending Block (e.g., `SandBlock.ts`)
2. Define properties (id, name, color, isSolid)
3. Register in BlockRegistry
4. Update block generation logic in Chunk.generate()

## Future Enhancements

- Add block textures/sprites
- Implement block behaviors (e.g., gravity for sand, growth for plants)
- Add block metadata for variants
- Implement block dropping/collection
- Add crafting system 
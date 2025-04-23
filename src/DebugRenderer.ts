import { Application, Container, Graphics, Text } from 'pixi.js';
import { CHUNK_SIZE, TILE_SIZE, VIEW_DISTANCE, MAX_DIG_RADIUS } from './constants';
import { Player } from './Player';
import { ChunkManager } from './ChunkManager';
import { Camera } from './Camera';
import { Block, blockRegistry } from './blocks';

export class DebugRenderer {
  container: Container;
  gridGraphics: Graphics;
  playerBoundaryGraphics: Graphics;
  chunkBoundariesGraphics: Graphics;
  hoverTileGraphics: Graphics;
  digRadiusGraphics: Graphics;
  digEffectGraphics: Graphics; // For visual dig effects
  infoText: Text;
  showDebug = true;
  mouseX = 0;
  mouseY = 0;
  isDigging = false; // Flag to track if player is actively digging
  pulseTimer = 0; // For pulsing dig radius animation
  digEffects: { x: number, y: number, timer: number }[] = []; // Visual effects for digging
  hoverTile: { x: number, y: number, block: Block | null } = { x: 0, y: 0, block: null };

  constructor(private app: Application) {
    this.container = new Container();
    this.container.zIndex = 1000; // Always on top

    // Graphics for tile grid
    this.gridGraphics = new Graphics();

    // Graphics for player boundary
    this.playerBoundaryGraphics = new Graphics();

    // Graphics for chunk boundaries
    this.chunkBoundariesGraphics = new Graphics();

    // Graphics for hover tile highlight
    this.hoverTileGraphics = new Graphics();

    // Graphics for digging radius
    this.digRadiusGraphics = new Graphics();

    // Graphics for dig effects
    this.digEffectGraphics = new Graphics();

    // Debug info text - use correct PixiJS v8 Text constructor
    this.infoText = new Text('Debug Info');
    this.infoText.style.fontSize = 12;
    this.infoText.style.fill = 0xFFFFFF;
    this.infoText.style.fontFamily = 'monospace';
    this.infoText.position.set(10, 10);

    // Add all to container
    this.container.addChild(this.gridGraphics);
    this.container.addChild(this.chunkBoundariesGraphics);
    this.container.addChild(this.playerBoundaryGraphics);
    this.container.addChild(this.hoverTileGraphics);
    this.container.addChild(this.digRadiusGraphics);
    this.container.addChild(this.digEffectGraphics);
    this.container.addChild(this.infoText);

    // Add container to stage
    app.stage.addChild(this.container);

    // Add keyboard toggle for debug rendering
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        this.showDebug = !this.showDebug;
        this.container.visible = this.showDebug;
      }
    });

    // Track mouse position for block hover
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  update(player: Player, chunkManager: ChunkManager, camera: Camera, stats: any) {
    // Update pulse timer for animations
    this.pulseTimer += 0.05;
    if (this.pulseTimer > Math.PI * 2) {
      this.pulseTimer = 0;
    }

    // Update dig effects
    this.updateDigEffects(camera);

    if (!this.showDebug) return;

    // Clear all graphics
    this.gridGraphics.clear();
    this.playerBoundaryGraphics.clear();
    this.chunkBoundariesGraphics.clear();
    this.hoverTileGraphics.clear();
    this.digRadiusGraphics.clear();

    // Remove any previous text labels
    while (this.chunkBoundariesGraphics.children.length > 0) {
      this.chunkBoundariesGraphics.removeChildAt(0);
    }

    // Update hover tile information
    this.updateHoverTile(chunkManager, camera);

    // Draw grid
    this.drawGrid(camera);

    // Draw player boundary
    this.drawPlayerBoundary(player, camera);

    // Draw chunk boundaries and generation radius
    this.drawChunkBoundaries(chunkManager, camera, player);

    // Draw hover tile highlight
    this.drawHoverTile(camera);

    // Draw dig radius only when actively digging
    if (this.isDigging) {
      this.drawDigRadius(player, camera);
    }

    // Update info text
    this.updateInfoText(player, chunkManager, camera, stats);
  }

  updateHoverTile(chunkManager: ChunkManager, camera: Camera) {
    // Convert mouse screen position to world position
    const worldX = this.mouseX + camera.x;
    const worldY = this.mouseY + camera.y;

    // Convert to tile coordinates
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    // Convert to chunk coordinates
    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkY = Math.floor(tileY / CHUNK_SIZE);

    // Determine tile position within chunk
    const localTileX = ((tileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localTileY = ((tileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    // Get block if the chunk exists
    let block: Block | null = null;
    const key = `${chunkX},${chunkY}`;

    if (chunkManager.chunks.has(key) && chunkManager.chunks.get(key)!.isGenerated) {
      block = chunkManager.chunks.get(key)!.getTile(localTileX, localTileY);
    }

    this.hoverTile = {
      x: tileX,
      y: tileY,
      block: block
    };
  }

  private drawGrid(camera: Camera) {
    // Draw a grid of tiles for reference
    this.gridGraphics.stroke({ width: 0.5, color: 0x333333, alpha: 0.3 });

    // Calculate visible area
    const startX = Math.floor(camera.x / TILE_SIZE) * TILE_SIZE - camera.x;
    const startY = Math.floor(camera.y / TILE_SIZE) * TILE_SIZE - camera.y;
    const endX = startX + this.app.screen.width + TILE_SIZE;
    const endY = startY + this.app.screen.height + TILE_SIZE;

    // Vertical lines
    for (let x = startX; x < endX; x += TILE_SIZE) {
      this.gridGraphics.moveTo(x, startY);
      this.gridGraphics.lineTo(x, endY);
    }

    // Horizontal lines
    for (let y = startY; y < endY; y += TILE_SIZE) {
      this.gridGraphics.moveTo(startX, y);
      this.gridGraphics.lineTo(endX, y);
    }
  }

  private drawPlayerBoundary(player: Player, camera: Camera) {
    // Draw player hitbox
    const playerScreenX = player.x - camera.x;
    const playerScreenY = player.y - camera.y;

    // Draw player box
    this.playerBoundaryGraphics.rect(playerScreenX, playerScreenY, player.width, player.height);
    this.playerBoundaryGraphics.stroke({ width: 2, color: 0xFF00FF });

    // Draw a circle at player's position for better visibility
    this.playerBoundaryGraphics.circle(
      playerScreenX + player.width / 2,
      playerScreenY + player.height / 2,
      5
    );
    this.playerBoundaryGraphics.stroke({ width: 2, color: 0x00FFFF });
  }

  private drawChunkBoundaries(chunkManager: ChunkManager, camera: Camera, player: Player) {
    // Calculate visible area in chunks
    const chunkWidth = CHUNK_SIZE * TILE_SIZE;
    const chunkHeight = CHUNK_SIZE * TILE_SIZE;
    const startChunkX = Math.floor(camera.x / chunkWidth);
    const startChunkY = Math.floor(camera.y / chunkHeight);
    const chunksX = Math.ceil(this.app.screen.width / chunkWidth) + 1;
    const chunksY = Math.ceil(this.app.screen.height / chunkHeight) + 1;

    // Draw chunk boundaries
    for (let cy = startChunkY; cy < startChunkY + chunksY; cy++) {
      for (let cx = startChunkX; cx < startChunkX + chunksX; cx++) {
        const screenX = cx * chunkWidth - camera.x;
        const screenY = cy * chunkHeight - camera.y;

        // Check if this chunk exists in our chunk manager
        const key = `${cx},${cy}`;
        const isGenerated = chunkManager.chunks.has(key) && chunkManager.chunks.get(key)!.isGenerated;
        const isVisible = chunkManager.visibleChunks.has(key);

        // Draw chunk border with slight inset to avoid overlapping last block
        this.chunkBoundariesGraphics.rect(screenX, screenY, chunkWidth - 0.5, chunkHeight - 0.5);

        if (isGenerated) {
          // Green for generated chunks
          this.chunkBoundariesGraphics.stroke({ width: 1, color: isVisible ? 0x00FF00 : 0x008800 });
        } else {
          // Red for non-generated chunks
          this.chunkBoundariesGraphics.stroke({ width: 1, color: 0xFF0000, alpha: 0.5 });
        }

        // Draw chunk coordinates
        const text = new Text(`${cx},${cy}`);
        text.style.fontSize = 10;
        text.style.fill = 0xFFFFFF;
        text.position.set(screenX + 5, screenY + 5);
        this.chunkBoundariesGraphics.addChild(text);
      }
    }

    // Draw view distance radius around player
    const playerChunkX = Math.floor(player.x / chunkWidth);
    const playerChunkY = Math.floor(player.y / chunkHeight);

    // Draw view distance area
    const radiusX = (VIEW_DISTANCE * 2 + 1) * chunkWidth;
    const radiusY = (VIEW_DISTANCE * 2 + 1) * chunkHeight;
    const centerX = (playerChunkX - VIEW_DISTANCE) * chunkWidth - camera.x;
    const centerY = (playerChunkY - VIEW_DISTANCE) * chunkHeight - camera.y;
    this.chunkBoundariesGraphics.rect(centerX, centerY, radiusX, radiusY);
    this.chunkBoundariesGraphics.stroke({ width: 2, color: 0x0000FF, alpha: 0.5 });
  }

  drawHoverTile(camera: Camera) {
    // Draw highlighted outline around the hovered tile
    const screenX = this.hoverTile.x * TILE_SIZE - camera.x;
    const screenY = this.hoverTile.y * TILE_SIZE - camera.y;

    // Only draw if it's a valid tile
    if (this.hoverTile.block !== null) {
      // Fill with semi-transparent color
      this.hoverTileGraphics.fill({ color: 0xFFFF00, alpha: 0.3 });
      this.hoverTileGraphics.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Add outline
      this.hoverTileGraphics.stroke({ width: 2, color: 0xFFFF00, alpha: 0.8 });
      this.hoverTileGraphics.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }

  drawDigRadius(player: Player, camera: Camera) {
    // Get player's center in screen coordinates
    const playerCenterX = player.x + player.width / 2 - camera.x;
    const playerCenterY = player.y + player.height / 2 - camera.y;

    // Draw a simple, stable circle representing the digging radius
    // Remove the pulsing effect to avoid glitchiness
    this.digRadiusGraphics.stroke({ width: 1.5, color: 0x00FF00, alpha: 0.4 });
    this.digRadiusGraphics.circle(playerCenterX, playerCenterY, MAX_DIG_RADIUS);

    // Add a small inner circle to better indicate the player's position
    this.digRadiusGraphics.stroke({ width: 1, color: 0xFFFFFF, alpha: 0.3 });
    this.digRadiusGraphics.circle(playerCenterX, playerCenterY, 8);
  }

  private updateInfoText(player: Player, chunkManager: ChunkManager, camera: Camera, stats: any) {
    // Calculate chunk coords
    const chunkWidth = CHUNK_SIZE * TILE_SIZE;
    const chunkHeight = CHUNK_SIZE * TILE_SIZE;
    const playerChunkX = Math.floor(player.x / chunkWidth);
    const playerChunkY = Math.floor(player.y / chunkHeight);

    // Get block name
    let blockName = "Unknown";
    if (this.hoverTile.block !== null) {
      blockName = this.hoverTile.block.name;
    }

    // Get block under player
    let blockUnderPlayer = "None";
    const blockBelow = player.getBlockBelow(chunkManager.chunks);
    if (blockBelow) {
      blockUnderPlayer = `${blockBelow.name} (friction: ${blockBelow.friction})`;
    }

    const debugInfo = [
      `FPS: ${stats.fps}`,
      `Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})`,
      `Velocity: (${player.vx.toFixed(2)}, ${player.vy.toFixed(2)})`,
      `Player Chunk: (${playerChunkX}, ${playerChunkY})`,
      `Camera: (${Math.floor(camera.x)}, ${Math.floor(camera.y)})`,
      `Chunks: ${stats.chunkCount} total, ${stats.visibleChunks} visible`,
      `Queue: ${stats.queuedChunks} chunks`,
      `Standing on: ${blockUnderPlayer}`,
      `Hover Tile: (${this.hoverTile.x}, ${this.hoverTile.y}) - ${blockName}`,
      `Press F3 to toggle debug view`
    ];

    this.infoText.text = debugInfo.join('\n');
  }

  // Add a visual effect when a block is dug
  showDigEffect(tileX: number, tileY: number) {
    // Add a new dig effect
    this.digEffects.push({
      x: tileX * TILE_SIZE,
      y: tileY * TILE_SIZE,
      timer: 1.0 // Effect lasts for 1 second
    });
  }

  // Update and draw dig effects
  updateDigEffects(camera: Camera) {
    // Clear previous effects
    this.digEffectGraphics.clear();

    // Update and draw each effect
    for (let i = this.digEffects.length - 1; i >= 0; i--) {
      const effect = this.digEffects[i];

      // Decrease timer
      effect.timer -= 0.05;

      // Remove if expired
      if (effect.timer <= 0) {
        this.digEffects.splice(i, 1);
        continue;
      }

      // Draw effect
      const screenX = effect.x - camera.x;
      const screenY = effect.y - camera.y;
      const alpha = effect.timer; // Fade out over time
      const size = TILE_SIZE * (1 + (1 - effect.timer)); // Grow over time
      const offset = (size - TILE_SIZE) / 2;

      // Draw expanding circle
      this.digEffectGraphics.fill({ color: 0xFFFFFF, alpha: alpha * 0.3 });
      this.digEffectGraphics.circle(
        screenX + TILE_SIZE / 2,
        screenY + TILE_SIZE / 2,
        size / 2
      );

      // Draw cross lines
      this.digEffectGraphics.stroke({ width: 2, color: 0xFFFFFF, alpha: alpha * 0.5 });

      // Horizontal line
      this.digEffectGraphics.moveTo(screenX - offset, screenY + TILE_SIZE / 2);
      this.digEffectGraphics.lineTo(screenX + TILE_SIZE + offset, screenY + TILE_SIZE / 2);

      // Vertical line
      this.digEffectGraphics.moveTo(screenX + TILE_SIZE / 2, screenY - offset);
      this.digEffectGraphics.lineTo(screenX + TILE_SIZE / 2, screenY + TILE_SIZE + offset);
    }
  }
} 
import { Application, Container, Graphics, Text } from 'pixi.js';
import { CHUNK_SIZE, TILE_SIZE, VIEW_DISTANCE } from './constants';
import { Player } from './Player';
import { ChunkManager } from './ChunkManager';
import { Camera } from './Camera';

export class DebugRenderer {
  container: Container;
  gridGraphics: Graphics;
  playerBoundaryGraphics: Graphics;
  chunkBoundariesGraphics: Graphics;
  infoText: Text;
  showDebug = true;

  constructor(private app: Application) {
    this.container = new Container();
    this.container.zIndex = 1000; // Always on top

    // Graphics for tile grid
    this.gridGraphics = new Graphics();

    // Graphics for player boundary
    this.playerBoundaryGraphics = new Graphics();

    // Graphics for chunk boundaries
    this.chunkBoundariesGraphics = new Graphics();

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
  }

  update(player: Player, chunkManager: ChunkManager, camera: Camera, stats: any) {
    if (!this.showDebug) return;

    // Clear all graphics
    this.gridGraphics.clear();
    this.playerBoundaryGraphics.clear();
    this.chunkBoundariesGraphics.clear();

    // Remove any previous text labels
    while (this.chunkBoundariesGraphics.children.length > 0) {
      this.chunkBoundariesGraphics.removeChildAt(0);
    }

    // Draw grid
    this.drawGrid(camera);

    // Draw player boundary
    this.drawPlayerBoundary(player, camera);

    // Draw chunk boundaries and generation radius
    this.drawChunkBoundaries(chunkManager, camera, player);

    // Update info text
    this.updateInfoText(player, chunkManager, camera, stats);
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

        this.chunkBoundariesGraphics.rect(screenX, screenY, chunkWidth, chunkHeight);

        if (isGenerated) {
          // Green for generated chunks
          this.chunkBoundariesGraphics.stroke({ width: 2, color: isVisible ? 0x00FF00 : 0x008800 });
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

  private updateInfoText(player: Player, chunkManager: ChunkManager, camera: Camera, stats: any) {
    // Calculate chunk coords
    const chunkWidth = CHUNK_SIZE * TILE_SIZE;
    const chunkHeight = CHUNK_SIZE * TILE_SIZE;
    const playerChunkX = Math.floor(player.x / chunkWidth);
    const playerChunkY = Math.floor(player.y / chunkHeight);

    const debugInfo = [
      `FPS: ${stats.fps}`,
      `Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})`,
      `Player Chunk: (${playerChunkX}, ${playerChunkY})`,
      `Camera: (${Math.floor(camera.x)}, ${Math.floor(camera.y)})`,
      `Chunks: ${stats.chunkCount} total, ${stats.visibleChunks} visible`,
      `Queue: ${stats.queuedChunks} chunks`,
      `Press F3 to toggle debug view`
    ];

    this.infoText.text = debugInfo.join('\n');
  }
} 
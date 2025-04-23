import './style.css'
import { Application, Container } from 'pixi.js';
import { createNoise2D } from 'simplex-noise';
import { Player } from './Player';
import { Camera } from './Camera';
import { ChunkManager } from './ChunkManager';
import { WORLD_HEIGHT, TILE_SIZE, CHUNK_SIZE } from './constants';
import { DebugRenderer } from './DebugRenderer';

// Debug information object
interface Stats {
  fps: number;
  chunkCount: number;
  visibleChunks: number;
  playerPos: { x: number, y: number };
  cameraPos: { x: number, y: number };
  queuedChunks: number;
  lastGameTick: number;
}

// Asynchronous IIFE
(async () => {
  console.log("Starting 2DCraft...");

  // Create a PixiJS application
  const app = new Application();

  // Initialize the application
  await app.init({
    background: 0x87ceeb, // Sky blue background
    resizeTo: window,
    antialias: true,
    powerPreference: 'high-performance',
  });

  // Add the application's canvas to the DOM body
  document.body.appendChild(app.canvas);

  // Setup noise generator with a fixed seed for consistency
  const noise2D = createNoise2D();

  // Initialize game systems
  const chunkManager = new ChunkManager(app, noise2D);
  const camera = new Camera(app);
  const player = new Player();

  // Configure game tick interval (milliseconds)
  chunkManager.setTickInterval(1000); // 1 second between ticks

  // Create player container - this should be added AFTER the chunk container
  // so the player appears on top of the terrain
  const playerContainer = new Container();
  app.stage.addChild(playerContainer);

  // Add player to the scene
  playerContainer.addChild(player.sprite);

  // Initialize player position - start above ground
  const startX = Math.floor(app.screen.width / 2);
  const startY = Math.floor(WORLD_HEIGHT * TILE_SIZE / 3);

  console.log(`Setting player at position: (${startX}, ${startY})`);
  player.x = startX;
  player.y = startY;
  player.sprite.position.set(player.x, player.y);

  // Initialize debug renderer
  const debugRenderer = new DebugRenderer(app);

  // Force load initial chunks around the player
  const playerChunkX = Math.floor(player.x / (CHUNK_SIZE * TILE_SIZE));
  const playerChunkY = Math.floor(player.y / (CHUNK_SIZE * TILE_SIZE));
  console.log(`Player starting in chunk: (${playerChunkX}, ${playerChunkY})`);

  // Generate a wider area initially to ensure player doesn't fall through
  chunkManager.forceLoadChunksAroundPosition(player.x, player.y);

  // Initial camera position
  camera.x = player.x - app.screen.width / 2;
  camera.y = player.y - app.screen.height / 2;

  // Update the container position based on the camera
  chunkManager.updateChunkPositions(camera.x, camera.y);

  // Game state
  let frameCount = 0;
  let lastPlayerX = player.x;
  let lastPlayerY = player.y;
  let lastTickTime = Date.now();

  // Update player position relative to camera
  function updatePlayerPosition() {
    // Player sprite is in screen space
    player.sprite.position.set(player.x - camera.x, player.y - camera.y);
  }

  // Debug info
  const stats: Stats = {
    fps: 0,
    chunkCount: 0,
    visibleChunks: 0,
    playerPos: { x: 0, y: 0 },
    cameraPos: { x: 0, y: 0 },
    queuedChunks: 0,
    lastGameTick: 0
  };

  function updateStats() {
    stats.chunkCount = chunkManager.chunks.size;
    stats.visibleChunks = chunkManager.visibleChunks.size;
    stats.playerPos = { x: Math.floor(player.x / TILE_SIZE), y: Math.floor(player.y / TILE_SIZE) };
    stats.cameraPos = { x: Math.floor(camera.x / TILE_SIZE), y: Math.floor(camera.y / TILE_SIZE) };
    stats.queuedChunks = chunkManager.chunksToGenerate.length;

    // Update FPS counter every second
    if (frameCount % 60 === 0) {
      stats.fps = Math.round(app.ticker.FPS);

      // Log stats
      console.log('FPS:', stats.fps, 'Chunks:', stats.chunkCount, 'Visible:', stats.visibleChunks);
      console.log(`Player at (${player.x}, ${player.y}), grounded: ${player.grounded}`);
      console.log(`Last game tick: ${stats.lastGameTick}ms ago`);
    }
  }

  // Handle keyboard controls
  const keys: Record<string, boolean> = {};
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  // Track if player is actively digging (for dig radius display)
  let isDigging = false;

  // Add mouse down/up handling for digging
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left mouse button
      isDigging = true;
      // Get cursor position from debug renderer and try to dig
      tryDigAtCursor();
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // Left mouse button
      isDigging = false;
    }
  });

  window.addEventListener('mousemove', (e) => {
    // If player is holding down the mouse button, try to dig continuously
    if (isDigging) {
      tryDigAtCursor();
    }
  });

  // Helper function to try digging at cursor position
  function tryDigAtCursor() {
    const hoverTile = debugRenderer.hoverTile;

    // Try to dig at the cursor position if tile exists
    if (hoverTile.block !== null) {
      const didDig = player.digBlockAtPosition(
        hoverTile.x * TILE_SIZE,
        hoverTile.y * TILE_SIZE,
        chunkManager.chunks,
        keys
      );

      // If the dig was successful, update the chunk texture
      if (didDig) {
        // Visual feedback for successful digging
        console.log(`Dug block at (${hoverTile.x}, ${hoverTile.y})`);

        // Show visual dig effect
        debugRenderer.showDigEffect(hoverTile.x, hoverTile.y);

        // Get chunk coordinates from the tile position
        const chunkX = Math.floor(hoverTile.x / CHUNK_SIZE);
        const chunkY = Math.floor(hoverTile.y / CHUNK_SIZE);
        const key = `${chunkX},${chunkY}`;

        // Update chunk texture if it exists and has been updated
        if (chunkManager.chunks.has(key) && chunkManager.chunks.get(key)!.needsUpdate) {
          chunkManager.chunks.get(key)!.createTexture(app);
        }
      }
    }
  }

  // Add empty click handler to replace the one we're removing
  window.addEventListener('click', (e) => { });

  // Now we can safely remove any older click handlers
  window.removeEventListener('click', tryDigAtCursor);

  // Game loop
  app.ticker.add(() => {
    frameCount++;
    const currentTime = Date.now();
    stats.lastGameTick = currentTime - lastTickTime;

    // Process chunk generation queue (more chunks per frame when game starts)
    const chunksPerFrame = frameCount < 60 ? 5 : 2;
    chunkManager.processChunkQueue(chunksPerFrame);

    // Calculate player velocity
    const playerVx = player.x - lastPlayerX;
    const playerVy = player.y - lastPlayerY;

    // Update last position
    lastPlayerX = player.x;
    lastPlayerY = player.y;

    // Update player
    player.update(chunkManager.chunks, keys);

    // Process game ticks for all active chunks
    chunkManager.processGameTick(currentTime, player);

    // Update player's chunk and direction info in the chunk manager
    chunkManager.updatePlayerDirection(player.x, player.y, player.vx, player.vy);

    // Update debug renderer with isDigging state
    debugRenderer.isDigging = isDigging;

    // Update camera to follow player
    camera.follow(player.x + player.width / 2, player.y + player.height / 2);

    // Update visible chunks based on camera position
    chunkManager.updateVisibleChunks(camera.x, camera.y);

    // Update chunk positions based on camera
    chunkManager.updateChunkPositions(camera.x, camera.y);

    // Update player position relative to camera (screen position)
    updatePlayerPosition();

    // Update stats
    updateStats();

    // Update debug visuals
    debugRenderer.update(player, chunkManager, camera, stats);

    // Emergency check: if player falls below a certain point, reset position
    if (player.y > WORLD_HEIGHT * TILE_SIZE * 2) {
      console.log("Player fell too far, resetting position");
      player.x = app.screen.width / 2;
      player.y = 0;
      player.vy = 0;
    }
  });
})();
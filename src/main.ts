import * as THREE from 'three';
import { World } from './game/world/World';
import { InstancedRenderer } from './game/renderer/InstancedRenderer';
import { Chunk } from './game/world/Chunk';
import { CameraController } from './game/controllers/CameraController';
import { InputController } from './game/controllers/InputController';
import { DebugInfo } from './game/utils/DebugInfo';
import { Player } from './game/entities/Player';
import { GameTick } from './game/systems/GameTick';

// Initial buffer distance for world generation
const WORLD_BUFFER = 5;
// Calculate maximum number of blocks that could be visible
const maxBlocksX = Math.ceil(window.innerWidth / 16) + WORLD_BUFFER * 2;
const maxBlocksY = Math.ceil(window.innerHeight / 16) + WORLD_BUFFER * 2;
const maxTilesPerBlock = maxBlocksX * maxBlocksY * 4; // Extra buffer for safety

// Initialize game world
// const seed = Math.random().toString();
const seed = "1234567890";
const world = new World(seed);

// Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background color

// Create perspective camera
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);

// Create fog for distance fading in perspective mode
scene.fog = new THREE.Fog(0x9FDFFF, 40, 120); // Brighter blue fog that starts further away

// Add subtle ambient occlusion for depth perception
const aoTex = new THREE.TextureLoader().load('./textures/blocks/ao_map.png');
aoTex.wrapS = THREE.RepeatWrapping;
aoTex.wrapT = THREE.RepeatWrapping;

// Set renderer with proper pixel ratio
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: true,
  preserveDrawingBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Force 1:1 pixel ratio for sharpness
renderer.sortObjects = true; // Enable sorting by renderOrder
renderer.outputColorSpace = THREE.SRGBColorSpace; // More balanced color space
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Subtle tone mapping for balance
renderer.toneMappingExposure = 1.2; // Increased from 0.9 to 1.2 for overall brightness
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
document.body.appendChild(renderer.domElement);

// Initialize controllers and utilities - true = use perspective mode
const cameraController = new CameraController(camera, 1, true);
const inputController = new InputController();
const debugInfo = new DebugInfo();

// Set scene reference for debug info to render chunk borders
debugInfo.setScene(scene);

// Initialize input controller with renderer element
inputController.initialize(renderer.domElement);

// Block renderer (rendered in front of background)
const instRenderer = new InstancedRenderer(scene, maxTilesPerBlock);

// Initialize game tick system with 1000ms tick rate (1 second)
const gameTick = new GameTick(world, instRenderer, 1000);
gameTick.start();

// Create player at position (0, 30) - a bit above ground level to give time to fall
const player = new Player(scene, 0, 10);

// Add CSS to maintain pixel perfection
const style = document.createElement('style');
style.textContent = `
  canvas {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
`;
document.head.appendChild(style);

// Helper to convert world coordinates to chunk coordinates
function worldToChunkCoords(x: number, y: number) {
  const chunkX = Math.floor(x / Chunk.SIZE);
  const chunkY = Math.floor(y / Chunk.SIZE);
  const localX = ((x % Chunk.SIZE) + Chunk.SIZE) % Chunk.SIZE;
  const localY = ((y % Chunk.SIZE) + Chunk.SIZE) % Chunk.SIZE;
  return { chunkX, chunkY, localX, localY };
}

// After initializing controllers and player, connect them
inputController.setReferences(cameraController, world, player, debugInfo, scene);

// Register debug callbacks for world, player, and input controller
debugInfo.onDebugToggle((enabled) => {
  world.handleDebugToggle(enabled);
  player.handleDebugToggle(enabled);
});

// Register player as a handler for block interactions
inputController.onBlockInteraction((event) => {
  // Get the current block at this position
  const oldBlock = world.getBlockAt(event.blockX, event.blockY);

  // Handle the interaction through the player
  player.handleBlockInteraction(event.type, event.blockX, event.blockY, world);

  // Get the new block after the interaction
  const newBlock = world.getBlockAt(event.blockX, event.blockY);
});

// Register fly mode callbacks
inputController.onFlyModeToggle((event) => {
  player.handleFlyModeToggle(event.enabled);
});

// Register hotbar selection callbacks
inputController.onHotbarSelection((index) => {
  player.handleHotbarSelection(index);
});

// Register hotbar scroll callbacks
inputController.onHotbarScroll((direction) => {
  player.handleHotbarScroll(direction);
});

function animate(timestamp: number) {
  requestAnimationFrame(animate);

  // Update input controller first
  inputController.update();

  // Update player physics and controls
  player.update(world, inputController.getKeys());

  // Handle walk over events
  player.handleWalkOver(world);

  // Update game tick system
  gameTick.update(timestamp);

  // Get player position for camera to follow
  const playerPos = player.getPosition();

  // Update camera to follow player
  cameraController.setPosition(playerPos.x, playerPos.y);

  // Update world chunks based on player position
  world.update(playerPos.x, playerPos.y);

  // Get current chunks
  const chunks = world.getChunks();
  const chunkCount = chunks.length;

  // Get block at mouse position (from hover block)
  const hoverBlock = inputController.getHoverBlock();
  const blockX = hoverBlock ? hoverBlock.x : Math.floor(playerPos.x);
  const blockY = hoverBlock ? hoverBlock.y : Math.floor(playerPos.y);
  const block = world.getBlockAt(blockX, blockY);

  // Get biome information at mouse position
  const biome = world.getBiomeManager().getBiomeAt(blockX, blockY);
  const biomeInfo = biome ? biome.name : 'None';
  const heightAtPos = world.getWorldGenerator().getHeightAt(blockX);

  // Get chunk information
  const { chunkX, chunkY } = worldToChunkCoords(blockX, blockY);

  // Add chunk information to debugging
  document.title = `Game World - Chunks: ${chunkCount} - Biome: ${biomeInfo}`;

  // Get selected block from inventory
  const selectedBlock = player.getSelectedBlock();

  // Update debug info with camera, view, and biome information
  debugInfo.update(
    block.name,
    blockX,
    blockY,
    playerPos,
    camera,
    cameraController.getViewSize(),
    player.getVelocity(),
    player.isGrounded(),
    `${biomeInfo} (Chunk: ${chunkX},${chunkY})`,
    heightAtPos,
    player.isFlyModeEnabled(),
    selectedBlock
  );

  // Update chunk borders if enabled
  if (debugInfo.isChunkBordersVisible()) {
    debugInfo.updateChunkBorders(chunks);
  }

  // Render with camera position and camera
  instRenderer.render(world, cameraController.getPosition(), camera);

  // Final render of the scene
  renderer.render(scene, camera);
}

// Start animation loop with timestamp
animate(performance.now());

// Handle window resize
window.addEventListener('resize', () => {
  cameraController.handleResize();
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
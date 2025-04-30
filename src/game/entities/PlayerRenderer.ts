import * as THREE from 'three';
import { Player } from './Player';
import { TextureKeys } from './PlayerTypes';

export class PlayerRenderer {
  private player: Player;
  private mesh: THREE.Mesh;

  // Player textures
  private readonly textureInfo: Array<{ key: TextureKeys, path: string }> = [
    { key: 'leftStill', path: './textures/entity/player/2d/player_1.png' },
    { key: 'rightStill', path: './textures/entity/player/2d/player_2.png' },
    { key: 'leftRunning', path: './textures/entity/player/2d/player_3.png' },
    { key: 'rightRunning', path: './textures/entity/player/2d/player_4.png' }
  ];

  // Loaded textures
  private textures: Record<TextureKeys, THREE.Texture | null> = {
    leftStill: null,
    rightStill: null,
    leftRunning: null,
    rightRunning: null
  };

  // Animation properties
  private animationTimer = 0;
  private readonly baseAnimationSpeed = 0.1;
  private readonly minAnimationSpeed = 0.05;
  private readonly maxAnimationSpeed = 0.3;
  private currentAnimFrame = 0;
  private lastAnimationTime = 0;
  private wasMovingLastFrame = false;

  // Debug
  private debugMode = false;

  constructor(scene: THREE.Scene, player: Player) {
    this.player = player;

    // Create player mesh with texture
    const geometry = new THREE.PlaneGeometry(player.getWidth(), player.getHeight());

    // Create material with default color
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      transparent: true
    });

    // Load all textures
    this.loadTextures(material);

    // Calculate initial z-position based on player position
    const position = player.getPosition();
    const layerStep = 0.05;
    const zPos = -Math.floor(position.y) * layerStep;

    // Create and position the mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(position.x, position.y, zPos + 0.1);
    scene.add(this.mesh);

    // Initialize animation timer
    this.lastAnimationTime = performance.now();
    this.currentAnimFrame = 1; // Start with walking/running frame
  }

  public update(): void {
    // Update animation
    this.updateAnimationTimer();

    // Update mesh position and texture
    this.updateMeshPosition();
    this.updateTexture();
  }

  private loadTextures(material: THREE.MeshBasicMaterial): void {
    const textureLoader = new THREE.TextureLoader();

    // Load all player textures using the textureInfo array
    this.textureInfo.forEach((info, index) => {
      textureLoader.load(
        info.path,
        (texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          this.textures[info.key] = texture;

          // If this is the first texture loaded, apply it as default
          if (index === 0 && !material.map) {
            material.map = texture;
            material.needsUpdate = true;
          }
        },
        undefined,
        () => console.log(`Failed to load ${info.key} texture`)
      );
    });
  }

  private updateAnimationTimer(): void {
    const now = performance.now();
    const deltaTime = now - this.lastAnimationTime;
    this.lastAnimationTime = now;

    // Get player velocity
    const velocity = this.player.getVelocity();

    // Determine if moving
    const isMoving = Math.abs(velocity.x) > 0.01;

    // Calculate animation speed based on horizontal velocity
    const speedPercentage = Math.min(1, Math.abs(velocity.x) / 0.25); // 0.25 is max speed
    const currentAnimationSpeed = this.minAnimationSpeed +
      (this.maxAnimationSpeed - this.minAnimationSpeed) * speedPercentage;

    // Check if player just started moving
    if (isMoving && !this.wasMovingLastFrame) {
      // Immediately show running frame when starting to move
      this.currentAnimFrame = 1;
      this.animationTimer = 0;
    }

    // Update animation for continuous movement
    if (isMoving) {
      this.animationTimer += deltaTime * currentAnimationSpeed;

      // When timer passes threshold, switch animation frame and reset timer
      if (this.animationTimer > 50) {
        this.currentAnimFrame = 1 - this.currentAnimFrame; // Toggle between 0 and 1
        this.animationTimer = 0;
      }
    } else {
      // Reset animation when not moving
      this.animationTimer = 0;
      this.currentAnimFrame = 0; // Use still frame when not moving
    }

    // Update movement tracking flag
    this.wasMovingLastFrame = isMoving;
  }

  private updateMeshPosition(): void {
    // Get player position
    const position = this.player.getPosition();

    // Calculate z-position based on y-coordinate
    const layerStep = 0.05;
    const zPos = -Math.floor(position.y) * layerStep;

    // Update the mesh position to match the player's position
    this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = zPos + 0.1; // Keep the player slightly in front of terrain
  }

  private updateTexture(): void {
    if (!(this.mesh.material instanceof THREE.MeshBasicMaterial)) return;

    // Get player velocity and direction
    const velocity = this.player.getVelocity();
    const facingLeft = this.player.isFacingLeft();

    // Determine if moving (based on horizontal velocity)
    const isMoving = Math.abs(velocity.x) > 0.01;

    // Select the appropriate texture based on direction, movement, and animation frame
    if (facingLeft) {
      if (isMoving) {
        // When moving, alternate between still and running frames
        if (this.currentAnimFrame === 0 && this.textures.leftStill) {
          this.mesh.material.map = this.textures.leftStill;
          this.mesh.material.needsUpdate = true;
        } else if (this.currentAnimFrame === 1 && this.textures.leftRunning) {
          this.mesh.material.map = this.textures.leftRunning;
          this.mesh.material.needsUpdate = true;
        }
      } else if (this.textures.leftStill) {
        // When standing still, always use still frame
        this.mesh.material.map = this.textures.leftStill;
        this.mesh.material.needsUpdate = true;
      }
    } else {
      if (isMoving) {
        // When moving, alternate between still and running frames
        if (this.currentAnimFrame === 0 && this.textures.rightStill) {
          this.mesh.material.map = this.textures.rightStill;
          this.mesh.material.needsUpdate = true;
        } else if (this.currentAnimFrame === 1 && this.textures.rightRunning) {
          this.mesh.material.map = this.textures.rightRunning;
          this.mesh.material.needsUpdate = true;
        }
      } else if (this.textures.rightStill) {
        // When standing still, always use still frame
        this.mesh.material.map = this.textures.rightStill;
        this.mesh.material.needsUpdate = true;
      }
    }
  }

  // Public methods
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }
} 
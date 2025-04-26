import * as THREE from 'three';
import { World } from '../world/World';
import { Block } from '../blocks/Block';
import { blockRegistry } from '../blocks';
import { Inventory, InventoryItem } from './Inventory';

export class Player {
  // Player position in world coordinates
  private position: THREE.Vector2;
  // Player velocity
  private velocity: THREE.Vector2;
  // Player dimensions
  private readonly width = 0.8; // Slightly smaller than block to allow squeezing through narrow spaces
  private readonly height = 1.8; // Slightly smaller than 2 blocks for realism

  // World reference for collision checks
  private world?: World;

  // Advanced physics constants
  private readonly gravity = 0.025; // Slightly increased for better feel
  private readonly jumpForce = 0.35; // Initial jump velocity
  private readonly moveSpeed = 0.075; // Base horizontal acceleration
  private readonly maxSpeed = 0.25; // Maximum horizontal velocity
  private readonly airControl = 0.3; // How much control player has mid-air (0-1)
  private readonly groundAcceleration = 0.15; // How quickly player accelerates on ground
  private readonly airAcceleration = 0.05; // How quickly player accelerates in air
  private readonly coyoteTime = 150; // Time in ms player can jump after leaving platform
  private readonly jumpBufferTime = 200; // Time in ms to buffer a jump input before landing

  // Physics state
  private friction = 0.85; // Default friction - will be modified by block type
  private grounded = false;
  private facingLeft = false;
  private lastGroundedTime = 0; // For coyote time
  private lastJumpPressedTime = 0; // For jump buffering
  private wasGroundedLastFrame = false; // Track state changes
  private timeInAir = 0; // Track how long player has been airborne

  // Simple grounded detection with hysteresis
  private groundCheckDistance = 0.1; // Distance below player to check for ground
  private groundHysteresisFrames = 5; // How many frames to keep grounded state after leaving ground
  private groundHysteresisCounter = 0; // Counter for ground hysteresis

  // Fly mode
  private flyMode = false;
  private readonly flySpeed = 1;

  // Collision detection
  private readonly maxRayCount = 5; // Number of rays to cast for collision detection
  private readonly skinWidth = 0.02; // Small buffer to prevent floating point issues
  private readonly velocityEpsilon = 0.001; // Threshold to consider velocity as zero
  private readonly maxSlopeAngle = 45; // Maximum angle player can walk up in degrees
  private readonly slopeSlideSpeed = 0.1; // Speed of sliding down slopes that are too steep

  // Debug
  private debugColliders: THREE.LineSegments;
  private debugMode = false;
  private debugRays: THREE.Line[] = [];

  // Player mesh
  private mesh: THREE.Mesh;

  // Inventory system
  private inventory: Inventory;

  // Mining and building properties
  private readonly interactionDistance = 3; // Max distance for mining/placing blocks

  constructor(scene: THREE.Scene, x: number, y: number) {
    this.position = new THREE.Vector2(x, y);
    this.velocity = new THREE.Vector2(0, 0);
    this.inventory = new Inventory();

    // Create player mesh with texture
    const geometry = new THREE.PlaneGeometry(this.width, this.height);

    // Try to load the player texture, fall back to color if texture can't load
    const textureLoader = new THREE.TextureLoader();
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      transparent: true
    });

    textureLoader.load(
      './assets/textures/player.png',
      (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        material.map = texture;
        material.needsUpdate = true;
      },
      undefined,
      () => {
        // Texture load error - use fallback color
        material.color.set(0xFF0000);
        console.log('Failed to load player texture, using fallback color');
      }
    );

    // Calculate initial z-position based on y-coordinate to match the InstancedRenderer's formula
    const layerStep = 0.05;
    const zPos = -Math.floor(y) * layerStep;

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.position.x, this.position.y, zPos + 0.1); // Put player slightly in front of terrain
    scene.add(this.mesh);

    // Debug collision visualization
    const debugGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.width, this.height, 0.1));
    const debugMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00 });
    this.debugColliders = new THREE.LineSegments(debugGeometry, debugMaterial);
    this.debugColliders.position.set(this.position.x, this.position.y, zPos + 0.2);
    this.debugColliders.visible = this.debugMode;
    scene.add(this.debugColliders);

    // Create array for debug rays
    for (let i = 0; i < this.maxRayCount * 4; i++) {
      const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, zPos + 0.3),
        new THREE.Vector3(0, 0, zPos + 0.3)
      ]);
      const rayLine = new THREE.Line(
        rayGeometry,
        new THREE.LineBasicMaterial({ color: 0xFF0000 })
      );
      rayLine.visible = this.debugMode;
      scene.add(rayLine);
      this.debugRays.push(rayLine);
    }
  }

  public update(world: World, keys: { [key: string]: boolean }) {
    // Store reference to the world for collision checks
    this.world = world;

    // Handle different physics modes
    if (this.flyMode) {
      this.handleFlyInput(keys);
      this.applyFlyPhysics();
    } else {
      this.handleInput(keys);
      this.applyPhysics();
      this.detectCollisions(world);
    }

    // Update mesh
    this.updateMesh();

    // Update air time - track how long player has been airborne
    if (!this.grounded) {
      this.timeInAir += 16.67; // Approx ms per frame at 60fps
    } else {
      this.timeInAir = 0;
    }
  }

  private handleInput(keys: { [key: string]: boolean }) {
    // Handle horizontal movement
    const accelerationRate = this.grounded ? this.groundAcceleration : this.airAcceleration;

    // Left/right movement
    if (keys.a) {
      // Apply acceleration left based on whether we're grounded
      this.velocity.x -= this.moveSpeed * accelerationRate;
      this.facingLeft = true;
    }
    if (keys.d) {
      // Apply acceleration right based on whether we're grounded
      this.velocity.x += this.moveSpeed * accelerationRate;
      this.facingLeft = false;
    }

    // Limit horizontal speed
    this.velocity.x = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocity.x));

    // Jump with improved timing (using space instead of w)
    if (keys.space) {
      this.lastJumpPressedTime = Date.now();

      // Can jump if:
      // 1. On the ground (use the gameplay grounded state, not UI state), OR
      // 2. Within coyote time window
      if (this.grounded || (Date.now() - this.lastGroundedTime < this.coyoteTime)) {
        this.jump();
      }
    }
  }

  private jump() {
    // Check if there's a block directly above us before jumping
    const bounds = this.getPlayerBounds();
    const rayCount = 3;
    const raySpacing = (bounds.right - bounds.left) / (rayCount - 1);

    // Check for blocks directly above the player
    let canJump = true;
    for (let i = 0; i < rayCount; i++) {
      const rayOriginX = bounds.left + i * raySpacing;
      const topY = bounds.top;

      const blockX = Math.floor(rayOriginX);
      const blockY = Math.ceil(topY); // Get the block above

      // Only perform this check if we're very close to a ceiling
      if (blockY - topY < 0.2) {
        const block = this.world?.getBlockAt(blockX, blockY);
        if (block && block.isSolid) {
          // Block directly above, can't jump
          canJump = false;
          if (this.debugMode) {
            console.log(`Cannot jump - block directly above at (${blockX}, ${blockY})`);
          }
          break;
        }
      }
    }

    if (canJump) {
      this.velocity.y = this.jumpForce;
      this.grounded = false;
      this.groundHysteresisCounter = 0; // Reset hysteresis when jumping

      if (this.debugMode) console.log("Player jumped");
    }
  }

  private handleFlyInput(keys: { [key: string]: boolean }) {
    // Reset velocity in fly mode for precise control
    this.velocity.x = 0;
    this.velocity.y = 0;

    if (keys.a) {
      this.velocity.x -= this.flySpeed;
      this.facingLeft = true;
    }
    if (keys.d) {
      this.velocity.x += this.flySpeed;
      this.facingLeft = false;
    }
    if (keys.w) {
      this.velocity.y += this.flySpeed;
    }
    if (keys.s) {
      this.velocity.y -= this.flySpeed;
    }
  }

  private applyPhysics() {
    // Store previous position for debug purposes
    const previousPosition = this.position.clone();
    const previousVelocity = this.velocity.clone();

    // Handle grounded state differently
    if (this.grounded) {
      // Force y velocity to exactly zero when grounded
      this.velocity.y = 0;

      // Apply ground friction to horizontal movement
      this.velocity.x *= this.friction;
    } else {
      // Apply gravity
      this.velocity.y -= this.gravity;

      // Apply air friction to horizontal movement
      const airFriction = 0.98; // Air has less friction
      this.velocity.x *= airFriction;
    }

    // Limit the maximum falling speed to prevent tunneling through blocks
    const maxFallSpeed = 0.5;
    if (this.velocity.y < -maxFallSpeed) {
      this.velocity.y = -maxFallSpeed;
    }

    // Clean up very small velocities to prevent jitter
    // Only clean up horizontal velocity when it's very small
    if (Math.abs(this.velocity.x) < this.velocityEpsilon) {
      this.velocity.x = 0;
    }

    // For vertical velocity, only clean up when not in air
    if (this.grounded && Math.abs(this.velocity.y) < this.velocityEpsilon) {
      this.velocity.y = 0;
    }

    // Update position based on velocity
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Log position changes in debug mode
    if (this.debugMode && (
      Math.abs(previousPosition.y - this.position.y) > 0.0001 ||
      Math.abs(previousVelocity.y - this.velocity.y) > 0.0001)) {
      console.log(`Position Y changed: ${previousPosition.y.toFixed(6)} -> ${this.position.y.toFixed(6)}`);
      console.log(`Velocity Y changed: ${previousVelocity.y.toFixed(6)} -> ${this.velocity.y.toFixed(6)}`);
      console.log(`Grounded: ${this.grounded}`);
    }
  }

  private applyFlyPhysics() {
    // In fly mode, just update position based on input velocity
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  private detectCollisions(world: World) {
    // Store previous grounded state
    const wasGrounded = this.grounded;

    // Reset physics properties
    this.friction = 0.85; // Default friction if no block collision

    // Define layerStep to match the renderer
    const layerStep = 0.05;

    // Get player bounds
    const bounds = this.getPlayerBounds();

    // Perform horizontal collision detection
    this.detectHorizontalCollisions(world, bounds, layerStep);

    // After handling horizontal collisions, update bounds
    const boundsAfterHorizontal = this.getPlayerBounds();

    // Perform vertical collision detection and update grounded state
    const onGround = this.detectVerticalCollisions(world, boundsAfterHorizontal, layerStep);

    // Apply hysteresis to grounded state
    this.updateGroundedState(onGround, wasGrounded);
  }

  private getPlayerBounds() {
    return {
      left: this.position.x - this.width / 2 + this.skinWidth,
      right: this.position.x + this.width / 2 - this.skinWidth,
      bottom: this.position.y - this.height / 2 + this.skinWidth,
      top: this.position.y + this.height / 2 - this.skinWidth
    };
  }

  private detectHorizontalCollisions(world: World, bounds: any, layerStep: number) {
    // Number of rays to cast for collision detection
    const rayCount = this.maxRayCount;

    // Distance between rays
    const raySpacing = (bounds.top - bounds.bottom) / (rayCount - 1);

    // Determine ray origin positions
    const rayOrigins = [];
    for (let i = 0; i < rayCount; i++) {
      rayOrigins.push(bounds.bottom + i * raySpacing);
    }

    // Determine ray direction and distance based on velocity
    const rayDirection = this.velocity.x > 0 ? 1 : -1;
    const rayDistance = Math.abs(this.velocity.x) + this.skinWidth * 2;
    const origin = this.velocity.x > 0 ? bounds.right : bounds.left;

    // Cast rays for horizontal collision
    let hitDistance = Infinity;
    let hitBlockFriction = this.friction;
    let hitBlock: Block | null = null;

    for (let i = 0; i < rayCount; i++) {
      const rayOriginY = rayOrigins[i];
      const startX = origin;
      const endX = origin + rayDirection * rayDistance;

      // Update debug ray visualization if debug mode is on
      if (this.debugMode) {
        // Calculate z-position based on y-coordinate (match renderer's formula)
        const rayZ = -Math.floor(rayOriginY) * layerStep;

        const positions = this.debugRays[i].geometry.attributes.position;
        positions.setXYZ(0, startX, rayOriginY, rayZ + 0.3);
        positions.setXYZ(1, endX, rayOriginY, rayZ + 0.3);
        positions.needsUpdate = true;
      }

      // Check all integer x positions along the ray
      const startBlockX = Math.floor(startX);
      const endBlockX = Math.floor(endX);
      const xInc = rayDirection;

      for (let blockX = startBlockX; rayDirection > 0 ? blockX <= endBlockX : blockX >= endBlockX; blockX += xInc) {
        // Skip the starting block
        if (blockX === startBlockX && startX !== startBlockX) continue;

        const blockY = Math.floor(rayOriginY);

        // Get the block at this position
        const block = world.getBlockAt(blockX, blockY);

        if (block && block.isSolid) {
          // Calculate the exact hit distance
          const exactHitX = rayDirection > 0 ? blockX : blockX + 1;
          const currentHitDistance = Math.abs(exactHitX - startX);

          if (currentHitDistance < hitDistance) {
            hitDistance = currentHitDistance;
            hitBlockFriction = block.friction !== undefined ? block.friction : 0.85;
            hitBlock = block;
          }

          // No need to check further blocks if we hit something
          break;
        }
      }
    }

    // Update friction from the hit block
    if (hitBlock && hitDistance < Infinity) {
      this.friction = hitBlockFriction;
    }

    // Apply collision resolution if we hit something
    if (hitDistance < rayDistance) {
      // Apply horizontal collision resolution
      const collisionOffset = hitDistance - this.skinWidth;
      this.position.x += rayDirection * (collisionOffset - rayDistance);
      this.velocity.x = 0;

      if (this.debugMode) {
        console.log(`Horizontal collision with ${hitBlock?.name || 'unknown'}, friction: ${this.friction}`);
      }
    }

  }

  private detectVerticalCollisions(world: World, bounds: any, layerStep: number): boolean {
    // Initialize ground hit flag
    let groundHit = false;

    // Number of rays to cast for collision detection
    const rayCount = this.maxRayCount;

    // Distance between rays
    const raySpacing = (bounds.right - bounds.left) / (rayCount - 1);

    // Setup ray origins across bottom or top of player depending on direction
    const rayOrigins = [];
    for (let i = 0; i < rayCount; i++) {
      rayOrigins.push(bounds.left + i * raySpacing);
    }

    // UPWARD COLLISION DETECTION
    //---------------------------
    if (this.velocity.y > 0) {
      // Check for ceiling collisions
      const topY = bounds.top;
      const rayDistance = this.velocity.y + this.skinWidth * 2;

      for (let i = 0; i < rayCount; i++) {
        const rayOriginX = rayOrigins[i];
        const startY = topY;
        const endY = topY + rayDistance;

        // Update debug ray visualization if debug mode is on
        if (this.debugMode) {
          // Calculate z-position based on top y-coordinate
          const rayZ = -Math.floor(startY) * layerStep;

          const positions = this.debugRays[i + rayCount].geometry.attributes.position;
          positions.setXYZ(0, rayOriginX, startY, rayZ + 0.3);
          positions.setXYZ(1, rayOriginX, endY, rayZ + 0.3);
          positions.needsUpdate = true;
        }

        // Find the first solid block above the player
        const startBlockY = Math.floor(startY);
        const endBlockY = Math.floor(endY);

        for (let blockY = startBlockY + 1; blockY <= endBlockY; blockY++) {
          const blockX = Math.floor(rayOriginX);
          const block = world.getBlockAt(blockX, blockY);

          if (block && block.isSolid) {
            // Calculate the exact hit distance to block bottom
            const blockBottomY = blockY;
            const hitDistance = blockBottomY - startY;

            // If we'd hit the ceiling, adjust position and velocity
            if (hitDistance <= rayDistance) {
              // Move to just below the ceiling
              this.position.y += hitDistance - rayDistance - this.skinWidth;
              // Stop upward movement
              this.velocity.y = 0;

              if (this.debugMode) {
                console.log(`Ceiling collision at (${blockX}, ${blockY})`);
              }
            }

            break; // Found a block, stop checking higher
          }
        }
      }
    }

    // DOWNWARD COLLISION DETECTION
    //----------------------------
    if (this.velocity.y <= 0) {
      // Check for floor collisions
      const bottomY = bounds.bottom;
      // Add extra distance for more reliable ground detection
      const rayDistance = Math.max(Math.abs(this.velocity.y) + this.skinWidth * 2, this.groundCheckDistance);

      for (let i = 0; i < rayCount; i++) {
        const rayOriginX = rayOrigins[i];
        const startY = bottomY;
        const endY = bottomY - rayDistance;

        // Update debug ray visualization if debug mode is on
        if (this.debugMode) {
          // Calculate z-position based on bottom y-coordinate
          const rayZ = -Math.floor(startY) * layerStep;

          const positions = this.debugRays[i].geometry.attributes.position;
          positions.setXYZ(0, rayOriginX, startY, rayZ + 0.3);
          positions.setXYZ(1, rayOriginX, endY, rayZ + 0.3);
          positions.needsUpdate = true;
        }

        // Find the first solid block below the player
        const startBlockY = Math.floor(startY);
        const endBlockY = Math.floor(endY);

        for (let blockY = startBlockY; blockY >= endBlockY; blockY--) {
          const blockX = Math.floor(rayOriginX);

          // Get the block at this position
          const block = world.getBlockAt(blockX, blockY);

          if (block && block.isSolid) {
            // Calculate the exact hit distance to block top
            const blockTopY = blockY + 1;
            const hitDistance = Math.abs(startY - blockTopY);

            // If we'd hit the ground, adjust position and velocity
            if (hitDistance <= rayDistance) {
              // Move to just above the ground
              this.position.y = blockTopY + this.height / 2;
              // Stop downward movement
              this.velocity.y = 0;

              // Update friction based on the block
              if (block.friction !== undefined) {
                this.friction = block.friction;
              }

              // Flag as grounded
              groundHit = true;

              if (this.debugMode) {
                console.log(`Ground collision at (${blockX}, ${blockY}), block: ${block.name}`);
              }
            }

            break; // Found a block, stop checking lower
          }
        }
      }
    }

    // Return whether we hit ground
    return groundHit;
  }

  private updateMesh() {
    // Calculate z-position based on y-coordinate to match the InstancedRenderer's formula
    const layerStep = 0.05;
    const zPos = -Math.floor(this.position.y) * layerStep;

    // Update the mesh position to match the player's position
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
    this.mesh.position.z = zPos + 0.1; // Keep the player slightly in front of terrain

    // Flip the mesh based on facing direction
    if (this.facingLeft && this.mesh.scale.x > 0) {
      this.mesh.scale.x = -Math.abs(this.mesh.scale.x);
    } else if (!this.facingLeft && this.mesh.scale.x < 0) {
      this.mesh.scale.x = Math.abs(this.mesh.scale.x);
    }

    // Update debug collider position
    if (this.debugMode) {
      this.debugColliders.position.x = this.position.x;
      this.debugColliders.position.y = this.position.y;
      this.debugColliders.position.z = zPos + 0.2; // Keep debug visuals in front of player

      // Make debug rays visible
      for (const ray of this.debugRays) {
        ray.visible = true;
      }
    } else {
      // Hide debug rays
      for (const ray of this.debugRays) {
        ray.visible = false;
      }
    }
  }

  private mineBlock(world: World, x: number, y: number): void {
    const block = world.getBlockAt(x, y);

    // Debug info
    if (this.debugMode) {
      console.log(`Mining block: ${block.name} (ID: ${block.id}) at (${x}, ${y})`);
    }

    // Don't mine air or non-mineable blocks
    if (block.id === 0) {
      if (this.debugMode) console.log(`Cannot mine air blocks!`);
      return; // Air has ID 0
    }

    // Add to inventory
    this.inventory.addItem(block.id);

    // Replace with air in the world (ID 0 is air)
    world.setBlockAt(x, y, 0);
  }

  private placeBlock(world: World, x: number, y: number): void {
    // Check if we have any blocks in inventory
    const selectedItem = this.inventory.getSelectedItem();
    if (!selectedItem) {
      if (this.debugMode) console.log(`No blocks in inventory to place!`);
      return;
    }

    const targetBlock = world.getBlockAt(x, y);

    // Only place if current block is air
    if (targetBlock.id !== 0) {
      if (this.debugMode) console.log(`Cannot place block on non-air block (${targetBlock.name})!`);
      return;
    }

    // Check if placing block would overlap with player
    if (this.wouldBlockOverlapPlayer(x, y)) {
      if (this.debugMode) console.log(`Cannot place block inside player!`);
      return;
    }

    if (this.debugMode) {
      console.log(`Placing block ID ${selectedItem.blockId} at (${x}, ${y})`);
    }

    world.setBlockAt(x, y, selectedItem.blockId);

    // Remove from inventory
    this.inventory.removeItem(selectedItem.blockId);
  }

  private wouldBlockOverlapPlayer(blockX: number, blockY: number): boolean {
    // Convert block coordinates to world coordinates (center of block)
    const blockCenterX = blockX + 0.5;
    const blockCenterY = blockY + 0.5;

    // Get player bounds
    const bounds = this.getPlayerBounds();

    // Check if block overlaps with player bounds
    const blockLeft = blockX;
    const blockRight = blockX + 1;
    const blockBottom = blockY;
    const blockTop = blockY + 1;

    return (
      bounds.right > blockLeft &&
      bounds.left < blockRight &&
      bounds.top > blockBottom &&
      bounds.bottom < blockTop
    );
  }

  public getPosition(): THREE.Vector2 {
    return this.position.clone();
  }

  public isGrounded(): boolean {
    return this.grounded;
  }

  public getVelocity(): THREE.Vector2 {
    return this.velocity.clone();
  }

  public isFlyModeEnabled(): boolean {
    return this.flyMode;
  }

  public getInventory(): InventoryItem[] {
    return this.inventory.getItems();
  }

  public getSelectedBlock(): InventoryItem | null {
    return this.inventory.getSelectedItem();
  }

  // Methods to handle callbacks from InputController
  public handleDebugToggle(enabled: boolean): void {
    this.debugMode = enabled;
    this.debugColliders.visible = this.debugMode;
    this.inventory.setDebugMode(enabled);
  }

  public handleFlyModeToggle(enabled: boolean): void {
    this.flyMode = enabled;
  }

  public handleHotbarSelection(index: number): void {
    this.inventory.selectHotbarSlot(index);
  }

  public handleHotbarScroll(direction: number): void {
    this.inventory.scrollHotbar(direction);
  }

  public handleBlockInteraction(type: 'mine' | 'place', x: number, y: number, world: World): void {
    if (this.debugMode) {
      console.log(`Player handling ${type} interaction at (${x}, ${y})`);
    }

    // Make sure the world reference is set
    this.world = world;

    // Calculate distance to the block
    const distance = Math.sqrt(
      Math.pow(this.position.x - (x + 0.5), 2) +
      Math.pow(this.position.y - (y + 0.5), 2)
    );

    // Verify the block is within interaction range
    // In 2.5D mode we're more tolerant of the distance
    if (distance > this.interactionDistance * 1.5) {
      if (this.debugMode) {
        console.log(`Block too far away: ${distance.toFixed(2)} > ${this.interactionDistance}`);
      }
      return;
    }

    if (type === 'mine') {
      this.mineBlock(world, x, y);
    } else if (type === 'place') {
      this.placeBlock(world, x, y);
    }
  }

  /**
   * Simple grounded state update with hysteresis
   */
  private updateGroundedState(onGround: boolean, wasGrounded: boolean) {
    // If we're on ground, reset hysteresis counter
    if (onGround) {
      this.groundHysteresisCounter = this.groundHysteresisFrames;
      this.grounded = true;
    }
    // If not on ground but hysteresis is still active, count down
    else if (this.groundHysteresisCounter > 0) {
      this.groundHysteresisCounter--;
      this.grounded = true; // Stay grounded during hysteresis
    }
    // If hysteresis counter is depleted, we're no longer grounded
    else {
      this.grounded = false;
    }

    // Track state changes for jump and fall events
    if (!this.wasGroundedLastFrame && this.grounded) {
      // Just landed
      if (this.debugMode) console.log("Player landed");

      // Apply buffered jump if we pressed jump shortly before landing
      if (Date.now() - this.lastJumpPressedTime < this.jumpBufferTime) {
        this.jump();
      }
    }
    else if (this.wasGroundedLastFrame && !this.grounded) {
      // Just left ground, store time for coyote time
      this.lastGroundedTime = Date.now();
      if (this.debugMode) console.log("Player left ground");
    }

    // Update wasGroundedLastFrame for next frame
    this.wasGroundedLastFrame = this.grounded;
  }

  // Add a method to get the actual gameplay grounded state when needed
  public isGameplayGrounded(): boolean {
    return this.grounded;
  }
} 
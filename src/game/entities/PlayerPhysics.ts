import * as THREE from 'three';
import { World } from '../world/World';
import { Block } from '../blocks/Block';
import { Player } from './Player';
import { PHYSICS_CONSTANTS } from './PlayerTypes';

export class PlayerPhysics {
  private player: Player;

  // Physics constants
  private readonly gravity = PHYSICS_CONSTANTS.GRAVITY;
  private readonly jumpForce = PHYSICS_CONSTANTS.JUMP_FORCE;
  private readonly moveSpeed = PHYSICS_CONSTANTS.MOVE_SPEED;
  private readonly maxSpeed = PHYSICS_CONSTANTS.MAX_SPEED;
  private readonly groundAcceleration = PHYSICS_CONSTANTS.GROUND_ACCELERATION;
  private readonly airAcceleration = PHYSICS_CONSTANTS.AIR_ACCELERATION;
  private readonly coyoteTime = PHYSICS_CONSTANTS.COYOTE_TIME;
  private readonly jumpBufferTime = PHYSICS_CONSTANTS.JUMP_BUFFER_TIME;
  private readonly maxFallSpeed = PHYSICS_CONSTANTS.MAX_FALL_SPEED;

  // Physics state
  private friction = PHYSICS_CONSTANTS.DEFAULT_FRICTION;
  private grounded = false;
  private lastGroundedTime = 0;
  private lastJumpPressedTime = 0;
  private wasGroundedLastFrame = false;

  // Fly mode
  private flyMode = false;
  private readonly flySpeed = 1;

  // Collision detection
  private readonly skinWidth = 0.02;
  private readonly velocityEpsilon = PHYSICS_CONSTANTS.VELOCITY_EPSILON;

  // Debug
  private debugMode = false;

  constructor(player: Player) {
    this.player = player;
  }

  public update(world: World, keys: { [key: string]: boolean }): void {
    // Handle different physics modes
    if (this.flyMode) {
      this.handleFlyInput(keys);
      this.applyFlyPhysics();
    } else {
      // Important: Move physics before input handling
      this.applyPhysics();
      this.handleInput(keys);

      // Apply collisions after all movement is calculated
      this.moveWithCollisions(world);
    }
  }

  private handleInput(keys: { [key: string]: boolean }): void {
    const velocity = this.player.getVelocity();
    const accelerationRate = this.grounded ? this.groundAcceleration : this.airAcceleration;
    let newVelocityX = velocity.x;

    // Left/right movement with consistent acceleration
    if (keys.a && !keys.d) {
      // Apply acceleration left based on whether we're grounded
      newVelocityX -= this.moveSpeed * accelerationRate;
    } else if (keys.d && !keys.a) {
      // Apply acceleration right based on whether we're grounded
      newVelocityX += this.moveSpeed * accelerationRate;
    } else if (this.grounded) {
      // Apply friction when no movement keys are pressed and player is on ground
      newVelocityX *= this.friction;
    }

    // Limit horizontal speed
    newVelocityX = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, newVelocityX));

    // Set the new velocity
    this.player.setVelocity(newVelocityX, velocity.y);

    // Handle jump input
    if (keys.space) {
      this.lastJumpPressedTime = Date.now();

      // Can jump if on ground or within coyote time window
      if (this.grounded || (Date.now() - this.lastGroundedTime < this.coyoteTime)) {
        // Check if we have space to jump
        if (this.canJumpWithoutHittingCeiling(this.player.getWorld()!)) {
          this.jump();
        } else if (this.debugMode) {
          console.log("Cannot jump - ceiling block detected");
        }
      }
    }
  }

  private canJumpWithoutHittingCeiling(world: World): boolean {
    const bounds = this.player.getPlayerBounds();
    const jumpHeight = this.jumpForce * 1.5; // Approximate max jump height

    // Check multiple points along the top of the player
    const checkPoints = [bounds.left + 0.1, bounds.left + (bounds.right - bounds.left) / 2, bounds.right - 0.1];

    for (const x of checkPoints) {
      // Check blocks in potential jump path
      for (let offsetY = 0.1; offsetY <= jumpHeight; offsetY += 0.25) {
        const blockX = Math.floor(x);
        const blockY = Math.floor(bounds.top + offsetY);

        const block = world.getBlockAt(blockX, blockY);
        if (block && block.isSolid) {
          return false;
        }
      }
    }

    return true;
  }

  private jump(): void {
    const velocity = this.player.getVelocity();
    this.player.setVelocity(velocity.x, this.jumpForce);
    this.grounded = false;

    if (this.debugMode) console.log("Player jumped");
  }

  private handleFlyInput(keys: { [key: string]: boolean }): void {
    // Reset velocity in fly mode for precise control
    let velocityX = 0;
    let velocityY = 0;

    if (keys.a) velocityX -= this.flySpeed;
    if (keys.d) velocityX += this.flySpeed;
    if (keys.w) velocityY += this.flySpeed;
    if (keys.s) velocityY -= this.flySpeed;

    this.player.setVelocity(velocityX, velocityY);
  }

  private applyPhysics(): void {
    const velocity = this.player.getVelocity();

    let newVelocityX = velocity.x;
    let newVelocityY = velocity.y;

    if (this.grounded) {
      // Force y velocity to zero when grounded
      newVelocityY = 0;
    } else {
      // Apply gravity
      newVelocityY -= this.gravity;

      // Apply air resistance to horizontal movement
      const airFriction = 0.98;
      newVelocityX *= airFriction;

      // Cap fall speed
      if (newVelocityY < -this.maxFallSpeed) {
        newVelocityY = -this.maxFallSpeed;
      }
    }

    // Clean up very small velocities to prevent jitter
    if (Math.abs(newVelocityX) < this.velocityEpsilon) {
      newVelocityX = 0;
    }

    // Update velocity but DON'T update position yet
    // Position will be updated during collision detection
    this.player.setVelocity(newVelocityX, newVelocityY);
  }

  private applyFlyPhysics(): void {
    const position = this.player.getPosition();
    const velocity = this.player.getVelocity();

    // In fly mode, just update position based on input velocity
    this.player.setPosition(
      position.x + velocity.x,
      position.y + velocity.y
    );
  }

  private moveWithCollisions(world: World): void {
    // Save previous grounded state
    const wasGrounded = this.grounded;

    // Reset grounded flag
    this.grounded = false;

    // Move and collide in two steps to allow sliding along surfaces

    // Step 1: Move and check horizontal collisions
    this.moveWithHorizontalCollisions(world);

    // Step 2: Move and check vertical collisions
    this.moveWithVerticalCollisions(world);

    // Update grounded state
    if (!wasGrounded && this.grounded) {
      // We just landed
      if (this.debugMode) console.log("Player landed");

      // Check for buffered jump
      if (Date.now() - this.lastJumpPressedTime < this.jumpBufferTime) {
        if (this.canJumpWithoutHittingCeiling(world)) {
          this.jump();
        }
      }
    }
    else if (wasGrounded && !this.grounded) {
      // We just left the ground, store time for coyote time
      this.lastGroundedTime = Date.now();
      if (this.debugMode) console.log("Player left ground");
    }

    // Update for next frame
    this.wasGroundedLastFrame = this.grounded;
  }

  private moveWithHorizontalCollisions(world: World): void {
    const position = this.player.getPosition();
    const velocity = this.player.getVelocity();

    // Skip if no horizontal movement
    if (Math.abs(velocity.x) < this.velocityEpsilon) {
      return;
    }

    // Calculate new position
    const newX = position.x + velocity.x;

    // Get player bounds
    const width = this.player.getWidth();
    const height = this.player.getHeight();
    const halfWidth = width / 2 - this.skinWidth;
    const halfHeight = height / 2 - this.skinWidth;

    // Direction we're moving
    const movingRight = velocity.x > 0;

    // Check if we hit a wall
    const edgeX = movingRight ? position.x + halfWidth : position.x - halfWidth;
    const targetEdgeX = movingRight ? newX + halfWidth : newX - halfWidth;

    // Check for collisions at various heights on the player's body
    const checkPoints = [
      position.y - halfHeight + 0.1, // Near bottom
      position.y,                    // Middle 
      position.y + halfHeight - 0.1  // Near top
    ];

    // Track collision status
    let collision = false;
    let collisionX = 0;

    // Find the collision closest to the player
    for (const checkY of checkPoints) {
      // Get block positions to check
      const startBlockX = Math.floor(edgeX);
      const endBlockX = Math.floor(targetEdgeX);
      const blockY = Math.floor(checkY);

      // Skip if we're not crossing a block boundary
      if (startBlockX === endBlockX) continue;

      // Determine which blocks to check based on movement direction
      const blocksToCheck = [];
      if (movingRight) {
        for (let x = startBlockX + 1; x <= endBlockX; x++) {
          blocksToCheck.push(x);
        }
      } else {
        for (let x = startBlockX; x >= endBlockX; x--) {
          blocksToCheck.push(x);
        }
      }

      // Check each block
      for (const blockX of blocksToCheck) {
        const block = world.getBlockAt(blockX, blockY);

        if (block && block.isSolid) {
          collision = true;

          // The exact position of the collision
          collisionX = movingRight ? blockX : blockX + 1;

          // If block has friction, use it
          if (block.friction !== undefined) {
            this.friction = block.friction;
          }

          break;
        }
      }

      if (collision) break;
    }

    // Handle collision
    if (collision) {
      // Calculate the new position to place the player against the wall
      const adjustedX = movingRight ?
        collisionX - halfWidth - this.skinWidth :
        collisionX + halfWidth + this.skinWidth;

      // Update position and zero out velocity in that direction
      this.player.setPosition(adjustedX, position.y);
      this.player.setVelocity(0, velocity.y);

      if (this.debugMode) {
        console.log(`Horizontal collision at x=${collisionX}`);
      }
    } else {
      // No collision, move freely
      this.player.setPosition(newX, position.y);
    }
  }

  private moveWithVerticalCollisions(world: World): void {
    const position = this.player.getPosition();
    const velocity = this.player.getVelocity();

    // Calculate new position
    const newY = position.y + velocity.y;

    // Get player bounds
    const width = this.player.getWidth();
    const height = this.player.getHeight();
    const halfWidth = width / 2 - this.skinWidth;
    const halfHeight = height / 2 - this.skinWidth;

    // Moving up or down?
    const movingUp = velocity.y > 0;

    // Edge we're checking (top or bottom)
    const edgeY = movingUp ? position.y + halfHeight : position.y - halfHeight;
    const targetEdgeY = movingUp ? newY + halfHeight : newY - halfHeight;

    // Check for collisions at various points across the player's width
    const checkPoints = [
      position.x - halfWidth + 0.1, // Left edge
      position.x,                   // Middle
      position.x + halfWidth - 0.1  // Right edge
    ];

    // Track collision status
    let collision = false;
    let collisionY = 0;
    let collisionFriction = this.friction;

    // Find the collision closest to the player
    for (const checkX of checkPoints) {
      // Get block positions to check
      const blockX = Math.floor(checkX);
      const startBlockY = Math.floor(edgeY);
      const endBlockY = Math.floor(targetEdgeY);

      // Skip if we're not crossing a block boundary
      if (startBlockY === endBlockY) continue;

      // Determine which blocks to check based on movement direction
      const blocksToCheck = [];
      if (movingUp) {
        for (let y = startBlockY + 1; y <= endBlockY; y++) {
          blocksToCheck.push(y);
        }
      } else {
        for (let y = startBlockY; y >= endBlockY; y--) {
          blocksToCheck.push(y);
        }
      }

      // Check each block
      for (const blockY of blocksToCheck) {
        const block = world.getBlockAt(blockX, blockY);

        if (block && block.isSolid) {
          collision = true;

          // The exact position of the collision
          collisionY = movingUp ? blockY : blockY + 1;

          // If block has friction, use it
          if (block.friction !== undefined) {
            collisionFriction = block.friction;
          }

          break;
        }
      }

      if (collision) break;
    }

    // Handle collision
    if (collision) {
      // Calculate the new position based on collision
      const adjustedY = movingUp ?
        collisionY - halfHeight - this.skinWidth :
        collisionY + halfHeight + this.skinWidth;

      // Update position and zero out velocity in that direction
      this.player.setPosition(position.x, adjustedY);
      this.player.setVelocity(velocity.x, 0);

      // If we hit the ground, update grounded state and friction
      if (!movingUp) {
        this.grounded = true;
        this.friction = collisionFriction;

        if (this.debugMode) {
          console.log(`Floor collision at y=${collisionY}, friction=${this.friction}`);
        }
      } else if (this.debugMode) {
        console.log(`Ceiling collision at y=${collisionY}`);
      }
    } else {
      // No collision, move freely
      this.player.setPosition(position.x, newY);

      // Check for "nearly on ground" case for smoother movement on flat ground
      if (velocity.y <= 0) {
        this.checkForNearGround(world);
      }
    }
  }

  private checkForNearGround(world: World): void {
    // Current position
    const position = this.player.getPosition();

    // Player bounds
    const width = this.player.getWidth();
    const height = this.player.getHeight();
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Check points at the bottom of the player
    const checkPoints = [
      position.x - halfWidth + 0.1,
      position.x,
      position.x + halfWidth - 0.1
    ];

    // The block row just below the player
    const bottomY = position.y - halfHeight;
    const blockYBelow = Math.floor(bottomY) - 1;

    // How close we need to be to snap to ground
    const groundSnapThreshold = 0.15;

    for (const checkX of checkPoints) {
      const blockX = Math.floor(checkX);
      const block = world.getBlockAt(blockX, blockYBelow);

      if (block && block.isSolid) {
        // Calculate distance to top of block
        const blockTop = blockYBelow + 1;
        const distance = Math.abs(bottomY - blockTop);

        if (distance <= groundSnapThreshold) {
          // Snap to ground
          const newY = blockTop + halfHeight + this.skinWidth;
          this.player.setPosition(position.x, newY);
          this.player.setVelocity(this.player.getVelocity().x, 0);
          this.grounded = true;

          // Set friction from block
          if (block.friction !== undefined) {
            this.friction = block.friction;
          }

          if (this.debugMode) {
            console.log(`Snapped to ground at y=${blockTop}, distance=${distance}`);
          }

          break;
        }
      }
    }
  }

  // Public methods
  public isGrounded(): boolean {
    return this.grounded;
  }

  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  public setFlyMode(enabled: boolean): void {
    this.flyMode = enabled;
  }
} 
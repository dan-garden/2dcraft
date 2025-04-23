import { Graphics } from 'pixi.js';
import { Chunk } from './Chunk';
import { TILE_SIZE, CHUNK_SIZE, MAX_DIG_RADIUS } from './constants';
import { Block, blockRegistry } from './blocks';

export class Player {
  sprite: Graphics;
  width = TILE_SIZE;
  height = TILE_SIZE * 2;
  vx = 0;
  vy = 0;
  grounded = false;
  x = 0;
  y = 0;
  // Track previous position to prevent clipping
  prevY = 0;
  // Track maximum jump height
  jumpStartY = 0;
  maxJumpHeight = TILE_SIZE * 2;
  jumping = false;

  // Player physics properties with more natural values
  gravity = 0.25;         // Increased for faster falling
  maxSpeed = 4;           // Maximum horizontal speed
  acceleration = 0.2;     // How quickly player accelerates
  deceleration = 0.3;     // How quickly player decelerates when not pressing keys
  jumpStrength = 6;       // Jump initial velocity
  airControl = 0.1;       // Reduced control in air (multiplier for acceleration)

  constructor() {
    // Create a simple player graphics using modern PixiJS v8 methods
    this.sprite = new Graphics();

    // Draw player as a red rectangle
    this.sprite.fill({ color: 0xFF0000 });
    this.sprite.rect(0, 0, this.width, this.height);

    // Add a face to make player direction clear
    this.sprite.fill({ color: 0xFFFFFF });
    this.sprite.circle(this.width * 0.7, this.height * 0.3, 3); // Right eye
    this.sprite.circle(this.width * 0.3, this.height * 0.3, 3); // Left eye
    this.sprite.fill({ color: 0x000000 });
    this.sprite.rect(this.width * 0.3, this.height * 0.6, this.width * 0.4, 2); // Mouth
  }

  update(chunks: Map<string, Chunk>, keys: Record<string, boolean>) {
    // Store previous position for collision resolution
    this.prevY = this.y;

    // Get block below player for friction calculation
    const blockBelowPlayer = this.getBlockBelow(chunks);
    const friction = blockBelowPlayer ? blockBelowPlayer.friction : 1.0;

    // Handle horizontal movement with acceleration and deceleration
    const moveLeft = keys['ArrowLeft'] || keys['a'];
    const moveRight = keys['ArrowRight'] || keys['d'];

    // Determine acceleration based on ground vs air
    const currentAccel = this.grounded ? this.acceleration : this.acceleration * this.airControl;

    if (moveLeft) {
      // Accelerate left
      this.vx -= currentAccel;
      // Cap at max speed
      if (this.vx < -this.maxSpeed) {
        this.vx = -this.maxSpeed;
      }
    } else if (moveRight) {
      // Accelerate right
      this.vx += currentAccel;
      // Cap at max speed
      if (this.vx > this.maxSpeed) {
        this.vx = this.maxSpeed;
      }
    } else {
      // Apply deceleration when no keys pressed - adjusted by friction
      const currentDecel = this.deceleration * friction;

      if (this.vx > 0) {
        this.vx -= currentDecel;
        if (this.vx < 0) this.vx = 0;
      } else if (this.vx < 0) {
        this.vx += currentDecel;
        if (this.vx > 0) this.vx = 0;
      }
    }

    // Apply gravity
    if (!this.grounded) {
      this.vy += this.gravity;
    } else if (keys['ArrowUp'] || keys['w'] || keys[' ']) {
      // Start jump
      this.vy = -this.jumpStrength;
      this.grounded = false;
      this.jumping = true;
      this.jumpStartY = this.y;
    }

    // Limit jump height
    if (this.jumping && this.y < this.jumpStartY - this.maxJumpHeight) {
      this.vy = Math.max(this.vy, 0); // Stop rising if max height reached
      this.jumping = false;
    }

    // Apply velocity with smaller steps to prevent clipping
    const steps = Math.max(1, Math.ceil(Math.abs(this.vy) / TILE_SIZE));
    const stepY = this.vy / steps;

    for (let i = 0; i < steps; i++) {
      this.y += stepY;
      const collisionsY = this.checkCollisions(chunks, false, true);

      if (collisionsY.bottom) {
        this.grounded = true;
        this.jumping = false;
        this.vy = 0;
        this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE;
        break;
      } else if (collisionsY.top) {
        this.vy = 0;
        this.jumping = false;
        break;
      }
    }

    // Check if movement is valid on horizontal surfaces
    const canMoveHorizontally = this.canMoveHorizontally(chunks);

    if (canMoveHorizontally) {
      // Apply horizontal movement with smaller steps
      const horizontalSteps = Math.max(1, Math.ceil(Math.abs(this.vx) / (TILE_SIZE / 2)));
      const stepX = this.vx / horizontalSteps;

      for (let i = 0; i < horizontalSteps; i++) {
        this.x += stepX;
        const collisionsX = this.checkCollisions(chunks, true, false);

        if (collisionsX.left || collisionsX.right) {
          // Bounce back slightly and stop momentum
          this.x -= stepX;
          this.vx = 0;
          break;
        }
      }

      // Check if player is still on ground after moving horizontally
      if (this.grounded) {
        this.checkIfStillGrounded(chunks);
      }
    } else {
      this.vx = 0;
    }

    // Update sprite position
    this.sprite.position.set(this.x, this.y);
  }

  canMoveHorizontally(chunks: Map<string, Chunk>): boolean {
    // Check if there's a flat surface to walk on
    const feetY = this.y + this.height;
    const leftX = this.x - 1;
    const rightX = this.x + this.width + 1;
    const directionX = this.vx > 0 ? 1 : -1;

    // If not grounded, allow movement
    if (!this.grounded) return true;

    // Check if there's ground in front of the player
    const frontX = this.vx > 0 ? rightX : leftX;
    const frontBlock = this.getBlockAt(frontX, feetY - TILE_SIZE / 2, chunks);

    // Allow moving if there's no obstacle at player level
    if (frontBlock.isCollidable()) {
      return false; // There's a block in the way
    }

    // Always allow movement when there's no obstacle - this lets player fall off edges
    return true;
  }

  checkCollisions(chunks: Map<string, Chunk>, checkHorizontal = true, checkVertical = true) {
    const result = { top: false, right: false, bottom: false, left: false };

    // Check collision with ground
    const feetY = this.y + this.height;
    const headY = this.y;
    const leftX = this.x;
    const rightX = this.x + this.width;

    // Enhanced collision points
    const checkPoints = [];

    // Add vertical check points
    if (checkVertical) {
      // Bottom collision points
      checkPoints.push({ x: leftX + 2, y: feetY });
      checkPoints.push({ x: rightX - 2, y: feetY });
      checkPoints.push({ x: leftX + this.width / 2, y: feetY });

      // Top collision points
      checkPoints.push({ x: leftX + 2, y: headY });
      checkPoints.push({ x: rightX - 2, y: headY });
      checkPoints.push({ x: leftX + this.width / 2, y: headY });
    }

    // Add horizontal check points
    if (checkHorizontal) {
      // Left collision points
      checkPoints.push({ x: leftX, y: headY + 5 });
      checkPoints.push({ x: leftX, y: feetY - 5 });
      checkPoints.push({ x: leftX, y: headY + this.height / 2 });

      // Right collision points
      checkPoints.push({ x: rightX, y: headY + 5 });
      checkPoints.push({ x: rightX, y: feetY - 5 });
      checkPoints.push({ x: rightX, y: headY + this.height / 2 });
    }

    for (const point of checkPoints) {
      const block = this.getBlockAt(point.x, point.y, chunks);
      if (block.isCollidable()) {
        // Determine collision side
        if (checkVertical) {
          if (point.y >= feetY - 5) result.bottom = true;
          else if (point.y <= headY + 5) result.top = true;
        }

        if (checkHorizontal) {
          if (point.x <= leftX + 5) result.left = true;
          else if (point.x >= rightX - 5) result.right = true;
        }
      }
    }

    return result;
  }

  getBlockAt(x: number, y: number, chunks: Map<string, Chunk>): Block {
    // Convert world coordinates to chunk coordinates
    const cx = Math.floor(x / (CHUNK_SIZE * TILE_SIZE));
    const cy = Math.floor(y / (CHUNK_SIZE * TILE_SIZE));
    const key = `${cx},${cy}`;

    if (!chunks.has(key)) {
      return blockRegistry.air;
    }

    const chunk = chunks.get(key)!;

    // Make sure the chunk is generated
    if (!chunk.isGenerated) {
      return blockRegistry.air;
    }

    // Convert world coordinates to tile coordinates within the chunk
    const tileX = Math.floor((x - cx * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);
    const tileY = Math.floor((y - cy * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);

    // If coordinates are within the current chunk, use the chunk's getTile method
    if (tileX >= 0 && tileX < CHUNK_SIZE && tileY >= 0 && tileY < CHUNK_SIZE) {
      return chunk.getTile(tileX, tileY);
    }

    // Handle boundary cases by looking at adjacent chunks
    let adjacentCx = cx;
    let adjacentCy = cy;
    let adjacentTileX = tileX;
    let adjacentTileY = tileY;

    // Adjust chunk and tile coordinates based on overflow
    if (tileX >= CHUNK_SIZE) {
      adjacentCx = cx + 1;
      adjacentTileX = 0; // First tile of next chunk
    }

    if (tileY >= CHUNK_SIZE) {
      adjacentCy = cy + 1;
      adjacentTileY = 0; // First tile of chunk below
    }

    // Check the adjacent chunk
    const adjacentKey = `${adjacentCx},${adjacentCy}`;
    if (chunks.has(adjacentKey) && chunks.get(adjacentKey)!.isGenerated) {
      return chunks.get(adjacentKey)!.getTile(adjacentTileX, adjacentTileY);
    }

    // Default to air if no valid tile was found
    return blockRegistry.air;
  }

  checkIfStillGrounded(chunks: Map<string, Chunk>) {
    const feetY = this.y + this.height + 1; // Check one pixel below feet
    const leftX = this.x + 2;
    const rightX = this.x + this.width - 2;
    const middleX = this.x + this.width / 2;

    // Check if there's ground beneath the player at multiple points
    const hasGroundLeft = this.getBlockAt(leftX, feetY, chunks).isCollidable();
    const hasGroundRight = this.getBlockAt(rightX, feetY, chunks).isCollidable();
    const hasGroundMiddle = this.getBlockAt(middleX, feetY, chunks).isCollidable();

    // If there's no ground under any of these points, player should start falling
    if (!hasGroundLeft && !hasGroundRight && !hasGroundMiddle) {
      this.grounded = false;
    }
  }

  // Method to dig/break blocks
  digBlock(chunks: Map<string, Chunk>): boolean {
    // Position for the block below the player's feet
    const feetY = this.y + this.height;
    const targetY = feetY + TILE_SIZE; // Block directly below feet
    const middleX = this.x + this.width / 2;

    // Get block coordinates
    const cx = Math.floor(middleX / (CHUNK_SIZE * TILE_SIZE));
    const cy = Math.floor(targetY / (CHUNK_SIZE * TILE_SIZE));
    const key = `${cx},${cy}`;

    // Calculate tile coordinates within the chunk
    const tileX = Math.floor((middleX - cx * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);
    const tileY = Math.floor((targetY - cy * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);

    // Check if the chunk exists
    if (!chunks.has(key)) {
      return false;
    }

    const chunk = chunks.get(key)!;

    // Make sure the chunk is generated
    if (!chunk.isGenerated) {
      return false;
    }

    // Get the block at the target position
    const block = chunk.getTile(tileX, tileY);

    // If it's not air (already dug) and is solid, replace it with air
    if (block.id !== blockRegistry.air.id && block.isCollidable()) {
      return chunk.setTile(tileX, tileY, blockRegistry.air.id);
    }

    return false;
  }

  // Method to dig blocks at a specific world position within a radius
  digBlockAtPosition(worldX: number, worldY: number, chunks: Map<string, Chunk>): boolean {
    // Get player's center position
    const playerCenterX = this.x + this.width / 2;
    const playerCenterY = this.y + this.height / 2;

    // Calculate distance from player to target position
    const dx = worldX - playerCenterX;
    const dy = worldY - playerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if the target is within digging radius
    if (distance > MAX_DIG_RADIUS) {
      console.log(`Target too far: ${distance.toFixed(2)} > ${MAX_DIG_RADIUS}`);
      return false;
    }

    // Convert world coordinates to chunk coordinates
    const cx = Math.floor(worldX / (CHUNK_SIZE * TILE_SIZE));
    const cy = Math.floor(worldY / (CHUNK_SIZE * TILE_SIZE));
    const key = `${cx},${cy}`;

    if (!chunks.has(key)) {
      return false;
    }

    const chunk = chunks.get(key)!;

    // Make sure the chunk is generated
    if (!chunk.isGenerated) {
      return false;
    }

    // Calculate tile coordinates within the chunk
    const tileX = Math.floor((worldX - cx * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);
    const tileY = Math.floor((worldY - cy * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);

    // Get the block at the target position
    const block = chunk.getTile(tileX, tileY);

    // If it's not air (already dug) and is solid, replace it with air
    if (block.id !== blockRegistry.air.id && block.isCollidable()) {
      return chunk.setTile(tileX, tileY, blockRegistry.air.id);
    }

    return false;
  }

  // Helper method to get the block below the player
  getBlockBelow(chunks: Map<string, Chunk>): Block | null {
    const feetY = this.y + this.height + 1; // One pixel below feet
    const middleX = this.x + this.width / 2;

    // Convert world coordinates to chunk coordinates
    const cx = Math.floor(middleX / (CHUNK_SIZE * TILE_SIZE));
    const cy = Math.floor(feetY / (CHUNK_SIZE * TILE_SIZE));
    const key = `${cx},${cy}`;

    if (!chunks.has(key)) {
      return null;
    }

    const chunk = chunks.get(key)!;

    // Make sure the chunk is generated
    if (!chunk.isGenerated) {
      return null;
    }

    // Convert world coordinates to tile coordinates within the chunk
    const tileX = Math.floor((middleX - cx * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);
    const tileY = Math.floor((feetY - cy * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE);

    // Check if coordinates are valid
    if (tileX < 0 || tileX >= CHUNK_SIZE || tileY < 0 || tileY >= CHUNK_SIZE) {
      return null;
    }

    return chunk.getTile(tileX, tileY);
  }
} 
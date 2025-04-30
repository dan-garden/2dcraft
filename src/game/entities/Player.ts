import * as THREE from 'three';
import { World } from '../world/World';
import { Inventory, InventoryItem } from './Inventory';
import { PlayerPhysics } from './PlayerPhysics';
import { PlayerRenderer } from './PlayerRenderer';
import { PlayerBounds } from './PlayerTypes';

export class Player {
  // Core properties
  private position: THREE.Vector2;
  private velocity: THREE.Vector2;
  private readonly width = 0.8;
  private readonly height = 1.8;
  private facingLeft = false;
  private flyMode = false;
  private debugMode = false;

  // Component references
  private world?: World;
  private physics: PlayerPhysics;
  private renderer: PlayerRenderer;
  private inventory: Inventory;

  // Block interaction
  private readonly interactionDistance = 5;

  // Block breaking state
  private breakingBlock: { x: number, y: number } | null = null;
  private lastBreakingTime: number = 0;
  private readonly BREAKING_INTERVAL = 100; // ms between breaking progress updates

  constructor(scene: THREE.Scene, x: number, y: number) {
    this.position = new THREE.Vector2(x, y);
    this.velocity = new THREE.Vector2(0, 0);

    // Initialize components
    this.inventory = new Inventory();
    this.renderer = new PlayerRenderer(scene, this);
    this.physics = new PlayerPhysics(this);
  }

  public update(world: World, keys: { [key: string]: boolean }) {
    // Store reference to the world
    this.world = world;

    // Handle input
    this.handleInput(keys);

    // Update physics
    this.physics.update(world, keys);

    // Update block breaking progress
    this.updateBlockBreaking(world);

    // Update renderer
    this.renderer.update();
  }

  private handleInput(keys: { [key: string]: boolean }) {
    // Handle direction (facing left/right)
    if (keys.a) {
      this.facingLeft = true;
    }
    if (keys.d) {
      this.facingLeft = false;
    }
  }

  private mineBlock(world: World, x: number, y: number): void {
    const block = world.getBlockAt(x, y);

    // Don't mine air
    if (block.id === 'air') return;

    // Add to inventory
    this.inventory.addItem(block.id);

    // Replace with air in the world (ID 0 is air)
    world.setBlockAt(x, y, 'air');

    // Call onAfterBreak after the block is broken
    if (block.onAfterBreak) {
      block.onAfterBreak(world, x, y, this);
    }
  }

  private placeBlock(world: World, x: number, y: number): void {
    // Check if we have any blocks in inventory
    const selectedItem = this.inventory.getSelectedItem();
    if (!selectedItem) return;

    const targetBlock = world.getBlockAt(x, y);

    // Only place if current block is air
    if (targetBlock.id !== 'air') return;

    // Check if placing block would overlap with player
    if (this.wouldBlockOverlapPlayer(x, y)) return;

    world.setBlockAt(x, y, selectedItem.blockId);

    // Remove from inventory
    this.inventory.removeItem(selectedItem.blockId);
  }

  private wouldBlockOverlapPlayer(blockX: number, blockY: number): boolean {
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

  public getPlayerBounds(): PlayerBounds {
    const skinWidth = 0.02;
    return {
      left: this.position.x - this.width / 2 + skinWidth,
      right: this.position.x + this.width / 2 - skinWidth,
      bottom: this.position.y - this.height / 2 + skinWidth,
      top: this.position.y + this.height / 2 - skinWidth,
    };
  }

  // Public getters/setters
  public getPosition(): THREE.Vector2 {
    return this.position.clone();
  }

  public setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  public getVelocity(): THREE.Vector2 {
    return this.velocity.clone();
  }

  public setVelocity(x: number, y: number): void {
    this.velocity.x = x;
    this.velocity.y = y;
  }

  public isFacingLeft(): boolean {
    return this.facingLeft;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public isGrounded(): boolean {
    return this.physics.isGrounded();
  }

  public isFlyModeEnabled(): boolean {
    return this.flyMode;
  }

  public isDebugModeEnabled(): boolean {
    return this.debugMode;
  }

  public getInventory(): Inventory {
    return this.inventory;
  }

  public getSelectedBlock(): InventoryItem | null {
    return this.inventory.getSelectedItem();
  }

  public getWorld(): World | undefined {
    return this.world;
  }

  // Input controller callback methods
  public handleDebugToggle(enabled: boolean): void {
    this.debugMode = enabled;
    this.inventory.setDebugMode(enabled);
    this.physics.setDebugMode(enabled);
    this.renderer.setDebugMode(enabled);
  }

  public handleFlyModeToggle(enabled: boolean): void {
    this.flyMode = enabled;
    this.physics.setFlyMode(enabled);
  }

  public handleHotbarSelection(index: number): void {
    this.inventory.selectHotbarSlot(index);
  }

  public handleHotbarScroll(direction: number): void {
    this.inventory.scrollHotbar(direction);
  }

  public handleBlockInteraction(type: 'mine' | 'place' | 'rightClick', x: number, y: number, world: World): void {
    // Calculate distance to the block
    const distance = Math.sqrt(
      Math.pow(this.position.x - (x + 0.5), 2) +
      Math.pow(this.position.y - (y + 0.5), 2)
    );

    // Verify the block is within interaction range
    if (distance > this.interactionDistance * 1.5) return;

    const block = world.getBlockAt(x, y);

    if (type === 'mine') {
      // Don't mine air
      if (block.id === 'air') return;

      // Check if the block can be mined
      if (block.onBeforeBreak && !block.onBeforeBreak(world, x, y, this)) {
        return; // Block prevents being mined
      }

      // Start breaking the block
      block.setBeingBroken(world, x, y, true);
      this.breakingBlock = { x, y };
      this.lastBreakingTime = performance.now();

      // In debug mode, instantly break the block
      if (this.debugMode) {
        this.mineBlock(world, x, y);
        block.resetBreakingState(world, x, y);
        this.breakingBlock = null;
      }
    } else if (type === 'place') {
      // Only place if current block is air
      if (block.id !== 'air') return;

      // Check if we have any blocks in inventory
      const selectedItem = this.inventory.getSelectedItem();
      if (!selectedItem) return;

      // Check if placing block would overlap with player
      if (this.wouldBlockOverlapPlayer(x, y)) return;

      world.setBlockAt(x, y, selectedItem.blockId);

      // Remove from inventory
      this.inventory.removeItem(selectedItem.blockId);
    } else if (type === 'rightClick') {
      // Call the block's onRightClick method if it exists
      if (block.onRightClick) {
        block.onRightClick(world, x, y, this);
      }
    }
  }

  public getInteractionDistance(): number {
    return this.interactionDistance;
  }

  // New method to handle player walking over blocks
  public handleWalkOver(world: World): void {
    // Get the block the player is standing on
    const blockX = Math.floor(this.position.x);
    const blockY = Math.floor(this.position.y - 0.1); // Slightly below player to get the block they're standing on
    const block = world.getBlockAt(blockX, blockY);

    // Call onWalkOver if it exists
    if (block.onWalkOver) {
      block.onWalkOver(world, blockX, blockY, this);
    }
  }

  // New method to handle mouse hovering over blocks
  public handleMouseHover(world: World, x: number, y: number): void {
    const block = world.getBlockAt(x, y);

    // If we were breaking a different block, reset its breaking state
    if (this.breakingBlock && (this.breakingBlock.x !== x || this.breakingBlock.y !== y)) {
      const oldBlock = world.getBlockAt(this.breakingBlock.x, this.breakingBlock.y);
      oldBlock.resetBreakingState(world, this.breakingBlock.x, this.breakingBlock.y);
      this.breakingBlock = null;
    }

    // Call onMouseHover if it exists
    if (block.onMouseHover) {
      block.onMouseHover(world, x, y, this);
    }
  }

  private updateBlockBreaking(world: World): void {
    if (!this.breakingBlock || !this.world) return;

    const { x, y } = this.breakingBlock;
    const block = world.getBlockAt(x, y);

    // Skip if block is air or not being broken
    if (block.id === 'air' || !block.isBeingBroken(world, x, y)) return;

    const currentTime = performance.now();
    if (currentTime - this.lastBreakingTime < this.BREAKING_INTERVAL) return;

    this.lastBreakingTime = currentTime;

    // In debug mode, instantly break the block
    if (this.debugMode) {
      this.mineBlock(world, x, y);
      block.resetBreakingState(world, x, y);
      this.breakingBlock = null;
      return;
    }

    // Get the selected tool (for now, just use the selected block)
    const selectedTool = this.inventory.getSelectedItem();
    const toolId = selectedTool ? selectedTool.blockId : null;

    // Check if we have the required tool
    const hasRequiredTool = block.requiredToolId === null || block.requiredToolId === toolId;
    if (!hasRequiredTool) {
      block.resetBreakingState(world, x, y);
      this.breakingBlock = null;
      return;
    }

    // Calculate breaking progress increment based on hardness
    // Higher hardness = slower breaking
    const progressIncrement = 0.1 / block.hardness;

    // Update breaking progress
    const newProgress = block.getBreakingProgress(world, x, y) + progressIncrement;
    block.setBreakingProgress(world, x, y, newProgress);

    // If progress reaches 100%, break the block
    if (newProgress >= 1) {
      this.mineBlock(world, x, y);
      block.resetBreakingState(world, x, y);
      this.breakingBlock = null;
    }
  }

  // Add a method to stop breaking a block
  public stopBreakingBlock(world: World): void {
    if (this.breakingBlock) {
      const { x, y } = this.breakingBlock;
      const block = world.getBlockAt(x, y);
      block.resetBreakingState(world, x, y);
      this.breakingBlock = null;
    }
  }
} 
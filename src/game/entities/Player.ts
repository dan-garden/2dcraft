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

  constructor(scene: THREE.Scene, x: number, y: number) {
    this.position = new THREE.Vector2(x, y);
    this.velocity = new THREE.Vector2(0, 0);

    // Initialize components
    this.inventory = new Inventory();
    this.inventory.initializeWithBlocks(100);

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
    if (block.id === 0) return;

    // Add to inventory
    this.inventory.addItem(block.id);

    // Replace with air in the world (ID 0 is air)
    world.setBlockAt(x, y, 0);
  }

  private placeBlock(world: World, x: number, y: number): void {
    // Check if we have any blocks in inventory
    const selectedItem = this.inventory.getSelectedItem();
    if (!selectedItem) return;

    const targetBlock = world.getBlockAt(x, y);

    // Only place if current block is air
    if (targetBlock.id !== 0) return;

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

  public getInventory(): InventoryItem[] {
    return this.inventory.getItems();
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

  public handleBlockInteraction(type: 'mine' | 'place', x: number, y: number, world: World): void {
    // Calculate distance to the block
    const distance = Math.sqrt(
      Math.pow(this.position.x - (x + 0.5), 2) +
      Math.pow(this.position.y - (y + 0.5), 2)
    );

    // Verify the block is within interaction range
    if (distance > this.interactionDistance * 1.5) return;

    if (type === 'mine') {
      this.mineBlock(world, x, y);
    } else if (type === 'place') {
      this.placeBlock(world, x, y);
    }
  }

  public getInteractionDistance(): number {
    return this.interactionDistance;
  }
} 
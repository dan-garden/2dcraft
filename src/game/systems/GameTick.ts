import { World } from '../world/World';
import { InstancedRenderer, VisibleBlock } from '../renderer/InstancedRenderer';
import { Block } from '../blocks/Block';
import { BlockRegistry } from '../blocks/BlockRegistry';

export class GameTick {
  private world: World;
  private renderer: InstancedRenderer;
  private lastTick: number = 0;
  private tickRate: number = 1000; // Milliseconds between ticks (1 second by default)
  private accumulator: number = 0;
  private isRunning: boolean = false;

  constructor(world: World, renderer: InstancedRenderer, tickRate: number = 1000) {
    this.world = world;
    this.renderer = renderer;
    this.tickRate = tickRate;
    this.lastTick = performance.now();
  }

  /**
   * Start the game tick system
   */
  public start(): void {
    this.isRunning = true;
  }

  /**
   * Stop the game tick system
   */
  public stop(): void {
    this.isRunning = false;
  }

  /**
   * Set the tick rate in milliseconds
   */
  public setTickRate(rate: number): void {
    this.tickRate = rate;
  }

  /**
   * Update method to be called each frame
   * @param currentTime Current timestamp
   */
  public update(currentTime: number): void {
    if (!this.isRunning) return;

    // Calculate delta time
    const deltaTime = currentTime - this.lastTick;
    this.accumulator += deltaTime;
    this.lastTick = currentTime;

    // Check if it's time for a tick
    if (this.accumulator >= this.tickRate) {
      this.processTick(this.tickRate);
      this.accumulator -= this.tickRate;
    }
  }

  /**
   * Process a single game tick
   * @param deltaTime Time elapsed since last tick
   */
  private processTick(deltaTime: number): void {
    // Get the currently visible blocks from the renderer
    const visibleBlocks: VisibleBlock[] = this.renderer.getVisibleBlocks();
    const registry = BlockRegistry.getInstance();

    // Process each visible block
    visibleBlocks.forEach(({ x, y, blockId }: VisibleBlock) => {
      // Get the block definition
      const blockDef = registry.getById(blockId);

      // Call onTick if the block has it
      if (blockDef && blockDef.onTick) {
        blockDef.onTick(this.world, x, y, deltaTime);
      }
    });
  }
} 
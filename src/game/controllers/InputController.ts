import * as THREE from 'three';
import { CameraController } from './CameraController';
import { World } from '../world/World';
import { Player } from '../entities/Player';
import { DebugInfo } from '../utils/DebugInfo';

interface BlockInteractionEvent {
  type: 'mine' | 'place';
  blockX: number;
  blockY: number;
}

// Event interfaces for callbacks
export interface DebugToggleEvent {
  enabled: boolean;
}

export interface FlyModeToggleEvent {
  enabled: boolean;
}

export class InputController {
  private keys: { [key: string]: boolean };
  private mousePosition: THREE.Vector2;
  private screenMousePosition: THREE.Vector2;
  private mouseState: { left: boolean, right: boolean };
  private lastMouseState: { left: boolean, right: boolean };
  private debugMode: boolean = false;
  private hoverBlock: { x: number, y: number } | null = null;
  private blockInteractionCallbacks: ((event: BlockInteractionEvent) => void)[] = [];
  private debugToggleCallbacks: ((event: DebugToggleEvent) => void)[] = [];
  private flyModeToggleCallbacks: ((event: FlyModeToggleEvent) => void)[] = [];
  private hotbarSelectionCallbacks: ((index: number) => void)[] = [];
  private hotbarScrollCallbacks: ((direction: number) => void)[] = [];

  // Track debug specific command keys
  private debugCommandKeys: { [key: string]: boolean } = {
    b: false,  // Place a tree at mouse cursor position
    d: false   // Debug structure system
  };

  // Configurable properties
  private interactionDistance = 5; // Maximum distance for block interaction

  // External references
  private cameraController: CameraController | null = null;
  private world: World | null = null;
  private player: Player | null = null;
  private debugInfo: DebugInfo | null = null;

  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false
    };
    this.mousePosition = new THREE.Vector2();
    this.screenMousePosition = new THREE.Vector2();
    this.mouseState = {
      left: false,
      right: false
    };
    this.lastMouseState = {
      left: false,
      right: false
    };

    // Set up global event handlers
    this.initializeKeyboardEvents();
  }

  /**
   * Set external references needed for input processing
   */
  public setReferences(cameraController: CameraController, world: World, player: Player, debugInfo: DebugInfo) {
    this.cameraController = cameraController;
    this.world = world;
    this.player = player;
    this.debugInfo = debugInfo;
  }

  /**
   * Set up keyboard events that don't depend on the canvas
   */
  private initializeKeyboardEvents() {
    // Global key handlers
    document.addEventListener('keydown', (e) => {
      // WASD movement keys
      if (e.key.toLowerCase() in this.keys) {
        this.keys[e.key.toLowerCase()] = true;
      }

      // Space key for jumping
      if (e.key === ' ') {
        this.keys['space'] = true;
      }

      // F key for fly mode toggle
      if (e.key === 'f' && this.player) {
        const flyMode = this.player.isFlyModeEnabled();
        // Toggle fly mode through callback
        this.flyModeToggleCallbacks.forEach(callback => {
          callback({
            enabled: !flyMode
          });
        });
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key.toLowerCase() in this.keys) {
        this.keys[e.key.toLowerCase()] = false;
      }

      // Space key for jumping
      if (e.key === ' ') {
        this.keys['space'] = false;
      }
    });
  }

  /**
   * Initialize canvas-specific event handlers
   */
  initialize(element: HTMLElement) {
    // Mouse move event
    element.addEventListener('mousemove', (event) => {
      // Store normalized screen coordinates (-1 to 1)
      this.screenMousePosition.x = (event.clientX / element.clientWidth) * 2 - 1;
      this.screenMousePosition.y = -(event.clientY / element.clientHeight) * 2 + 1;

      // Convert to world coordinates
      if (this.cameraController) {
        this.mousePosition = this.cameraController.getWorldPositionFromScreen(
          this.screenMousePosition.x,
          this.screenMousePosition.y
        );

        // Update hover block
        this.updateHoverBlock();
      }
    });

    // Mouse click events
    element.addEventListener('mousedown', (event) => {
      // Left click (mine)
      if (event.button === 0) {
        this.mouseState.left = true;
      }
      // Right click (place)
      if (event.button === 2) {
        this.mouseState.right = true;
        // Prevent context menu from appearing
        event.preventDefault();
      }

      // Process click with hover block
      this.processClick();
    });

    element.addEventListener('mouseup', (event) => {
      // Left click (mine)
      if (event.button === 0) {
        this.mouseState.left = false;
      }
      // Right click (place)
      if (event.button === 2) {
        this.mouseState.right = false;
      }
    });

    // Prevent context menu from appearing on right-click
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Global mouseup to ensure we catch releases outside the canvas
    document.addEventListener('mouseup', (event) => {
      if (event.button === 0) {
        this.mouseState.left = false;
      }
      if (event.button === 2) {
        this.mouseState.right = false;
      }
    });

    // Block selection with number keys and mouse wheel
    document.addEventListener('keydown', (e) => {
      // Forward key events to player for inventory management
      if (!isNaN(parseInt(e.key)) && parseInt(e.key) >= 1 && parseInt(e.key) <= 9) {
        const index = parseInt(e.key) - 1;
        this.hotbarSelectionCallbacks.forEach(callback => {
          callback(index);
        });
      }
    });

    // Scroll wheel for hotbar selection
    element.addEventListener('wheel', (e) => {
      const direction = e.deltaY > 0 ? 1 : -1;
      this.hotbarScrollCallbacks.forEach(callback => {
        callback(direction);
      });
    });

    // Add debug command listeners 
    document.addEventListener('keydown', (e) => {
      if (e.key in this.debugCommandKeys) {
        this.debugCommandKeys[e.key] = true;

        // Only process these commands in debug mode
        if (this.isDebugMode()) {
          this.processDebugCommand(e.key);
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key in this.debugCommandKeys) {
        this.debugCommandKeys[e.key] = false;
      }
    });
  }

  /**
   * Update which block the mouse is hovering over
   */
  private updateHoverBlock() {
    if (!this.player || !this.world) return;

    const playerPos = this.player.getPosition();

    // Calculate the block coordinates
    const blockX = Math.floor(this.mousePosition.x);
    const blockY = Math.floor(this.mousePosition.y);

    // Calculate distance from player to this block
    const distance = Math.sqrt(
      Math.pow(playerPos.x - (blockX + 0.5), 2) +
      Math.pow(playerPos.y - (blockY + 0.5), 2)
    );

    // If in debug mode, ignore distance restrictions
    if (this.isDebugMode()) {
      this.hoverBlock = { x: blockX, y: blockY };

      // if (this.isDebugMode()) {
      //   console.log(`Hovering over block at (${blockX}, ${blockY}), distance: ${distance.toFixed(2)}`);
      // }
    }
    // If not in debug mode, only allow interaction within range
    else if (distance <= this.interactionDistance) {
      this.hoverBlock = { x: blockX, y: blockY };
    } else {
      this.hoverBlock = null;
    }
  }

  /**
   * Process mouse clicks on blocks
   */
  private processClick() {
    if (!this.hoverBlock || !this.world) return;

    const { x, y } = this.hoverBlock;

    // Get the block to see if it's mine-able/placeable
    const block = this.world.getBlockAt(x, y);

    if (this.isDebugMode()) {
      // console.log(`Clicked on block: ${block.name} (ID: ${block.id}) at (${x}, ${y})`);
      // console.log(`Mouse state: left=${this.mouseState.left}, right=${this.mouseState.right}`);
    }

    // Left click = mine
    if (this.mouseState.left && !this.lastMouseState.left) {
      if (block.id !== 0) { // Don't mine air
        if (this.isDebugMode()) console.log(`Mining block at (${x}, ${y})`);

        // Notify all callbacks
        this.blockInteractionCallbacks.forEach(callback => {
          callback({
            type: 'mine',
            blockX: x,
            blockY: y
          });
        });
      }
    }

    // Right click = place
    if (this.mouseState.right && !this.lastMouseState.right) {
      if (block.id === 0) { // Only place on air
        if (this.isDebugMode()) console.log(`Placing block at (${x}, ${y})`);

        // Notify all callbacks
        this.blockInteractionCallbacks.forEach(callback => {
          callback({
            type: 'place',
            blockX: x,
            blockY: y
          });
        });
      }
    }

    // Update last mouse state
    this.lastMouseState.left = this.mouseState.left;
    this.lastMouseState.right = this.mouseState.right;
  }

  /**
   * Register a callback for block interactions
   */
  onBlockInteraction(callback: (event: BlockInteractionEvent) => void) {
    this.blockInteractionCallbacks.push(callback);
  }

  /**
   * Register a callback for debug mode toggling
   */
  onDebugToggle(callback: (event: DebugToggleEvent) => void) {
    this.debugToggleCallbacks.push(callback);
  }

  /**
   * Register a callback for fly mode toggling
   */
  onFlyModeToggle(callback: (event: FlyModeToggleEvent) => void) {
    this.flyModeToggleCallbacks.push(callback);
  }

  /**
   * Register a callback for hotbar selection
   */
  onHotbarSelection(callback: (index: number) => void) {
    this.hotbarSelectionCallbacks.push(callback);
  }

  /**
   * Register a callback for hotbar scrolling
   */
  onHotbarScroll(callback: (direction: number) => void) {
    this.hotbarScrollCallbacks.push(callback);
  }

  /**
   * Get the current keyboard state
   */
  getKeys(): { [key: string]: boolean } {
    return { ...this.keys };
  }

  /**
   * Get the mouse position in screen coordinates
   */
  getScreenMousePosition(): THREE.Vector2 {
    return this.screenMousePosition.clone();
  }

  /**
   * Get the mouse position in world coordinates
   */
  getMousePosition(): THREE.Vector2 {
    return this.mousePosition.clone();
  }

  /**
   * Get the current state of mouse buttons
   */
  getMouseState(): { left: boolean, right: boolean, position: THREE.Vector2 } {
    return {
      left: this.mouseState.left,
      right: this.mouseState.right,
      position: this.mousePosition.clone()
    };
  }

  /**
   * Get the currently hovered block
   */
  getHoverBlock(): { x: number, y: number } | null {
    return this.hoverBlock;
  }

  /**
   * Get the current debug mode state from DebugInfo
   */
  isDebugMode(): boolean {
    return this.debugInfo ? this.debugInfo.isDebugMode() : false;
  }

  /**
   * Update input state - call this every frame
   */
  update() {
    // Process click state changes
    if (this.mouseState.left !== this.lastMouseState.left ||
      this.mouseState.right !== this.lastMouseState.right) {
      this.processClick();
    }

    // Update last mouse state
    this.lastMouseState.left = this.mouseState.left;
    this.lastMouseState.right = this.mouseState.right;
  }

  /**
   * Process debug commands
   */
  private processDebugCommand(key: string) {
    if (!this.world || !this.player) return;

    switch (key) {
      case 'b':
        // Generate a tree at mouse cursor position
        if (this.hoverBlock) {
          const { x, y } = this.hoverBlock;
          console.log(`Attempting to place oak_tree at cursor position (${x}, ${y})`);

          const biome = this.world.getBiomeGenerator().getBiomeAt(x, 0);
          console.log(`Current biome: ${biome.id} (${biome.name})`);

          // Log valid biomes for oak_tree
          const structures = this.world.getStructureGenerator()['structures'];
          console.log(structures);
          if (structures) {
            const oakTree = structures.find(s => s.id === 'oak_tree');
            if (oakTree) {
              console.log(`Tree valid biomes: ${oakTree.validBiomes.join(', ')}`);
              console.log(`Tree pattern:`, oakTree.pattern);
            }
          }

          const success = this.world.generateStructure('oak_tree', x, y);
          console.log(`Structure generation ${success ? 'successful' : 'failed'}`);
        } else {
          console.log(`No block hovered to place oak_tree`);
        }
        break;

      case 'd':
        // Debug the structure system
        console.log("Debugging structure system...");
        this.world.debugStructureSystem();
        break;
    }
  }
} 
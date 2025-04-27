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

// Define key binding action types
type KeyAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'jump'
  | 'toggleFly'
  | 'toggleBlockSelector'
  | 'hotbar1'
  | 'hotbar2'
  | 'hotbar3'
  | 'hotbar4'
  | 'hotbar5'
  | 'hotbar6'
  | 'hotbar7'
  | 'hotbar8'
  | 'hotbar9'
  | 'debugTree'
  | 'debugStructure';

export class InputController {
  // Input state
  private keyState: { [key: string]: boolean } = {};
  private mousePosition: THREE.Vector2 = new THREE.Vector2();
  private screenMousePosition: THREE.Vector2 = new THREE.Vector2();
  private mouseState: { left: boolean, right: boolean } = { left: false, right: false };
  private lastMouseState: { left: boolean, right: boolean } = { left: false, right: false };
  private hoverBlock: { x: number, y: number } | null = null;

  // Key bindings map (key -> action)
  private keyBindings: { [key: string]: KeyAction } = {
    'w': 'moveUp',
    'arrowup': 'moveUp',
    's': 'moveDown',
    'arrowdown': 'moveDown',
    'a': 'moveLeft',
    'arrowleft': 'moveLeft',
    'd': 'moveRight',
    'arrowright': 'moveRight',
    ' ': 'jump',
    'f': 'toggleFly',
    'h': 'toggleBlockSelector',
    '1': 'hotbar1',
    '2': 'hotbar2',
    '3': 'hotbar3',
    '4': 'hotbar4',
    '5': 'hotbar5',
    '6': 'hotbar6',
    '7': 'hotbar7',
    '8': 'hotbar8',
    '9': 'hotbar9',
    'b': 'debugTree',
    'o': 'debugStructure'
  };

  // Block selection visual indicator
  private blockSelector: THREE.LineSegments;
  private blockSelectorVisible: boolean = true;

  // External references
  private cameraController: CameraController | null = null;
  private world: World | null = null;
  private player: Player | null = null;
  private debugInfo: DebugInfo | null = null;
  private scene: THREE.Scene | null = null;

  // Event callbacks
  private blockInteractionCallbacks: ((event: BlockInteractionEvent) => void)[] = [];
  private debugToggleCallbacks: ((event: DebugToggleEvent) => void)[] = [];
  private flyModeToggleCallbacks: ((event: FlyModeToggleEvent) => void)[] = [];
  private hotbarSelectionCallbacks: ((index: number) => void)[] = [];
  private hotbarScrollCallbacks: ((direction: number) => void)[] = [];

  constructor() {
    // Initialize block selector wireframe
    const selectorGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.05, 1.05, 1.05));
    const selectorMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00, // Bright yellow for better visibility
      linewidth: 2, // Thicker lines (note: this has limited support)
      transparent: true,
      opacity: 0.8
    });
    this.blockSelector = new THREE.LineSegments(selectorGeometry, selectorMaterial);
    this.blockSelector.renderOrder = 999; // Render on top of everything else
    this.blockSelector.visible = false;

    // Initialize global keyboard listeners
    this.initializeGlobalEvents();
  }

  /**
   * Set external references needed for input processing
   */
  public setReferences(cameraController: CameraController, world: World, player: Player, debugInfo: DebugInfo, scene?: THREE.Scene) {
    this.cameraController = cameraController;
    this.world = world;
    this.player = player;
    this.debugInfo = debugInfo;

    // Add block selector to scene if provided
    if (scene) {
      this.scene = scene;
      scene.add(this.blockSelector);
    }
  }

  /**
   * Set up global event handlers that don't depend on the canvas
   */
  private initializeGlobalEvents() {
    // Global key handlers
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keyState[key] = true;

      // Process action if key is bound
      if (key in this.keyBindings) {
        this.processKeyAction(this.keyBindings[key], true);
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keyState[key] = false;

      // Process action deactivation if needed
      if (key in this.keyBindings) {
        this.processKeyAction(this.keyBindings[key], false);
      }
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
  }

  /**
   * Process an action based on key press/release
   */
  private processKeyAction(action: KeyAction, isPressed: boolean): void {
    // Only handle certain actions on key press, not on continuous hold
    if (isPressed) {
      switch (action) {
        // Toggle actions (process on key press only)
        case 'toggleFly':
          if (this.player) {
            const flyMode = this.player.isFlyModeEnabled();
            this.flyModeToggleCallbacks.forEach(callback => {
              callback({ enabled: !flyMode });
            });
          }
          break;

        case 'toggleBlockSelector':
          const isVisible = this.toggleBlockSelector();
          console.log(`Block selector ${isVisible ? 'visible' : 'hidden'}`);
          break;

        // Hotbar selection
        case 'hotbar1': case 'hotbar2': case 'hotbar3':
        case 'hotbar4': case 'hotbar5': case 'hotbar6':
        case 'hotbar7': case 'hotbar8': case 'hotbar9':
          const index = parseInt(action.replace('hotbar', '')) - 1;
          this.hotbarSelectionCallbacks.forEach(callback => {
            callback(index);
          });
          break;

        // Debug commands (only in debug mode)
        case 'debugTree':
        case 'debugStructure':
          if (this.isDebugMode()) {
            this.processDebugAction(action);
          }
          break;
      }
    }

    // Other actions like movement are handled continuously via getKeys()
  }

  /**
   * Process debug actions
   */
  private processDebugAction(action: KeyAction): void {
    if (!this.world || !this.player) return;

    switch (action) {
      case 'debugTree':
        // Generate a tree at mouse cursor position
        if (this.hoverBlock) {
          const { x, y } = this.hoverBlock;
          console.log(`Attempting to place oak_tree at cursor position (${x}, ${y})`);

          const biome = this.world.getBiomeGenerator().getBiomeAt(x, 0);
          console.log(`Current biome: ${biome.id} (${biome.name})`);

          const success = this.world.generateStructure('oak_tree', x, y);
          console.log(`Structure generation ${success ? 'successful' : 'failed'}`);
        }
        break;

      case 'debugStructure':
        // Debug the structure system
        console.log("Debugging structure system...");
        this.world.debugStructureSystem();
        break;
    }
  }

  /**
   * Initialize canvas-specific event handlers
   */
  initialize(element: HTMLElement) {
    // Mouse move event
    element.addEventListener('mousemove', (event) => this.handleMouseMove(event, element));

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

    // Scroll wheel for hotbar selection
    element.addEventListener('wheel', (e) => {
      const direction = e.deltaY > 0 ? 1 : -1;
      this.hotbarScrollCallbacks.forEach(callback => {
        callback(direction);
      });
    });
  }

  /**
   * Handle mouse movement and update hover block
   */
  private handleMouseMove(event: MouseEvent, element: HTMLElement) {
    // Store actual client mouse position
    const clientX = event.clientX;
    const clientY = event.clientY;

    // Store normalized screen coordinates (-1 to 1)
    this.screenMousePosition.x = (clientX / element.clientWidth) * 2 - 1;
    this.screenMousePosition.y = -(clientY / element.clientHeight) * 2 + 1;

    if (this.cameraController && this.world) {
      // Use raycasting for 2.5D mode
      const raycaster = new THREE.Raycaster();
      const camera = this.cameraController['camera']; // Access the camera from controller

      // Set up raycaster from camera through mouse point
      raycaster.setFromCamera(
        new THREE.Vector2(this.screenMousePosition.x, this.screenMousePosition.y),
        camera
      );

      // Raycast to find intersection with game world
      const intersection = this.calculateRayIntersection(raycaster);

      if (intersection) {
        this.mousePosition.x = intersection.x;
        this.mousePosition.y = intersection.y;
        this.updateHoverBlock();
      }
    }
  }

  /**
   * Calculate ray intersection with the game world
   */
  private calculateRayIntersection(raycaster: THREE.Raycaster): THREE.Vector3 | null {
    if (!this.cameraController) return null;

    const layerStep = 0.05; // Match the layerStep in InstancedRenderer
    const rayOrigin = raycaster.ray.origin.clone();
    const rayDirection = raycaster.ray.direction.clone().normalize();
    const maxDistance = 100; // Maximum ray distance

    // Find intersection with blocks
    let closestIntersection = null;
    let closestDistanceSq = Infinity;

    // Check collision with a range of y-coordinates (from camera y - 20 to camera y + 20)
    const cameraY = this.cameraController.getPosition().y;
    const yStart = Math.floor(cameraY) - 20;
    const yEnd = Math.floor(cameraY) + 20;

    for (let y = yStart; y <= yEnd; y++) {
      // Calculate z-offset for this row of blocks
      const zPos = -y * layerStep;

      // Create a plane at this z-position
      const gamePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -zPos);
      const intersectionPoint = new THREE.Vector3();

      // Find intersection with this plane
      if (raycaster.ray.intersectPlane(gamePlane, intersectionPoint)) {
        // Check if this is the closest intersection
        const distanceSq = intersectionPoint.distanceToSquared(rayOrigin);

        if (distanceSq < closestDistanceSq) {
          // Only update if this y matches the plane y we're checking
          const blockY = Math.floor(intersectionPoint.y);
          if (blockY === y) {
            closestDistanceSq = distanceSq;
            closestIntersection = intersectionPoint;
          }
        }
      }
    }

    return closestIntersection;
  }

  /**
   * Update which block the mouse is hovering over
   */
  private updateHoverBlock() {
    if (!this.player || !this.world) return;

    const playerPos = this.player.getPosition();
    const interactionDistance = this.player.getInteractionDistance();

    // Get block coordinates from world position
    const blockX = Math.floor(this.mousePosition.x);
    const blockY = Math.floor(this.mousePosition.y);

    // Calculate distance from player to this block
    const distance = Math.sqrt(
      Math.pow(playerPos.x - (blockX + 0.5), 2) +
      Math.pow(playerPos.y - (blockY + 0.5), 2)
    );

    // Determine if block is valid to hover
    const withinInteractionRange = distance <= interactionDistance;
    const isDebugMode = this.isDebugMode();

    // In debug mode or within range, show hover
    if (isDebugMode || withinInteractionRange) {
      this.hoverBlock = { x: blockX, y: blockY };
      this.updateBlockSelector(blockX, blockY, withinInteractionRange);

      // Update debug info if available
      if (this.debugInfo && this.world) {
        const block = this.world.getBlockAt(blockX, blockY);
        this.debugInfo.updateHoverInfo(block.name, blockX, blockY);
      }
    } else {
      this.hoverBlock = null;
      if (this.blockSelector) {
        this.blockSelector.visible = false;
      }
    }
  }

  /**
   * Update block selector position and visibility
   */
  private updateBlockSelector(blockX: number, blockY: number, inRange: boolean) {
    if (!this.blockSelectorVisible || !this.scene) return;

    const layerStep = 0.05; // Match the layerStep in InstancedRenderer
    const zPos = -blockY * layerStep;

    this.blockSelector.position.set(blockX + 0.5, blockY + 0.5, zPos);

    // Show selector based on range and debug mode
    const isDebugMode = this.isDebugMode();
    const showSelector = inRange || isDebugMode;

    this.blockSelector.visible = showSelector && this.blockSelectorVisible;

    // Update color based on range (in debug mode)
    if (this.blockSelector.material instanceof THREE.LineBasicMaterial) {
      if (isDebugMode) {
        this.blockSelector.material.color.set(inRange ? 0xffff00 : 0xff0000);
      } else {
        this.blockSelector.material.color.set(0xffff00);
      }
    }
  }

  /**
   * Toggle the visibility of the block selector
   */
  public toggleBlockSelector(visible?: boolean): boolean {
    if (visible !== undefined) {
      this.blockSelectorVisible = visible;
    } else {
      this.blockSelectorVisible = !this.blockSelectorVisible;
    }

    if (this.blockSelector) {
      this.blockSelector.visible = this.blockSelectorVisible && this.hoverBlock !== null;
    }

    return this.blockSelectorVisible;
  }

  /**
   * Process mouse clicks on blocks
   */
  private processClick() {
    if (!this.hoverBlock || !this.world || !this.player) return;

    const { x, y } = this.hoverBlock;
    const playerPos = this.player.getPosition();
    const interactionDistance = this.player.getInteractionDistance();

    // Calculate distance from player to this block
    const distance = Math.sqrt(
      Math.pow(playerPos.x - (x + 0.5), 2) +
      Math.pow(playerPos.y - (y + 0.5), 2)
    );

    // In normal mode, only allow interaction within range
    if (distance > interactionDistance && !this.isDebugMode()) return;

    // Get the block
    const block = this.world.getBlockAt(x, y);

    // Handle debug logging if needed
    if (this.isDebugMode()) {
      console.log(`Clicked on block: ${block.name} (ID: ${block.id}) at (${x}, ${y})`);
      console.log(`Distance to player: ${distance.toFixed(2)}, Max range: ${interactionDistance}`);
    }

    // Left click = mine (only if state changed)
    if (this.mouseState.left && !this.lastMouseState.left) {
      if (block.id !== 0) { // Don't mine air
        this.blockInteractionCallbacks.forEach(callback => {
          callback({ type: 'mine', blockX: x, blockY: y });
        });
      }
    }

    // Right click = place (only if state changed)
    if (this.mouseState.right && !this.lastMouseState.right) {
      if (block.id === 0) { // Only place on air
        this.blockInteractionCallbacks.forEach(callback => {
          callback({ type: 'place', blockX: x, blockY: y });
        });
      }
    }
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
   * Get the current movement key states
   */
  getKeys(): { [key: string]: boolean } {
    // Return movement keys based on mapped actions rather than direct key access
    return {
      w: this.isActionActive('moveUp'),
      a: this.isActionActive('moveLeft'),
      s: this.isActionActive('moveDown'),
      d: this.isActionActive('moveRight'),
      space: this.isActionActive('jump')
    };
  }

  /**
   * Check if a particular action is currently active (any bound key is pressed)
   */
  private isActionActive(action: KeyAction): boolean {
    // Find any key bound to this action that is currently pressed
    for (const [key, boundAction] of Object.entries(this.keyBindings)) {
      if (boundAction === action && this.keyState[key]) {
        return true;
      }
    }
    return false;
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
   * Rebind a key to a different action
   */
  rebindKey(key: string, action: KeyAction): void {
    this.keyBindings[key.toLowerCase()] = action;
  }

  /**
   * Get all current key bindings
   */
  getKeyBindings(): { [key: string]: KeyAction } {
    return { ...this.keyBindings };
  }
} 
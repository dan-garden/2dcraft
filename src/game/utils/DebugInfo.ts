import * as THREE from 'three';
import { Chunk } from '../world/Chunk';

// Interface for inventory item to align with Player's implementation
interface InventoryItem {
  blockId: number;
  count: number;
}

// Define a debug toggle callback type
export type DebugToggleCallback = (enabled: boolean) => void;

export class DebugInfo {
  private element: HTMLDivElement;
  private cameraInfo: HTMLDivElement;
  private renderInfo: HTMLDivElement;
  private worldInfo: HTMLDivElement;
  private viewInfo: HTMLDivElement;
  private playerInfo: HTMLDivElement;
  private playerPositionInfo: HTMLDivElement;
  private biomeInfo: HTMLDivElement;
  private inventoryInfo: HTMLDivElement;
  private lightingInfo: HTMLDivElement;
  private chunkBordersButton: HTMLButtonElement;
  private toggleButton!: HTMLButtonElement;
  private showChunkBorders: boolean = false;
  private chunkBorderMeshes: THREE.LineSegments[] = [];
  private scene: THREE.Scene | null = null;
  private debugMode: boolean = false;
  private isMinimized: boolean = false;
  
  // Registry of debug mode listeners
  private debugToggleListeners: DebugToggleCallback[] = [];

  constructor() {
    // Create toggle button that's always visible
    this.toggleButton = document.createElement('button');
    this.createToggleButton();

    // Create main debug panel (initially hidden)
    this.element = document.createElement('div');
    this.element.style.position = 'fixed';
    this.element.style.top = '10px';
    this.element.style.left = '10px';
    this.element.style.color = 'white';
    this.element.style.fontFamily = 'monospace';
    this.element.style.fontSize = '10px'; // Smaller font
    this.element.style.backgroundColor = 'rgba(0,0,0,0.5)';
    this.element.style.padding = '5px';
    this.element.style.borderRadius = '5px';
    this.element.style.display = 'none'; // Initially hidden
    this.element.style.flexDirection = 'column';
    this.element.style.gap = '2px'; // Smaller gap
    this.element.style.maxWidth = '250px'; // Limit width
    this.element.style.maxHeight = '80vh'; // Limit height
    this.element.style.overflowY = 'auto'; // Allow scrolling

    // Create header with minimize button
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '5px';
    
    const title = document.createElement('div');
    title.textContent = 'Debug Info';
    title.style.fontWeight = 'bold';
    
    const minimizeButton = document.createElement('button');
    minimizeButton.textContent = '-';
    minimizeButton.style.backgroundColor = '#555';
    minimizeButton.style.color = 'white';
    minimizeButton.style.border = 'none';
    minimizeButton.style.borderRadius = '3px';
    minimizeButton.style.width = '20px';
    minimizeButton.style.height = '20px';
    minimizeButton.style.cursor = 'pointer';
    minimizeButton.addEventListener('click', () => this.toggleMinimize());
    
    header.appendChild(title);
    header.appendChild(minimizeButton);
    this.element.appendChild(header);

    // Create info elements
    this.cameraInfo = this.createInfoElement();
    this.renderInfo = this.createInfoElement();
    this.worldInfo = this.createInfoElement();
    this.viewInfo = this.createInfoElement();
    this.playerInfo = this.createInfoElement();
    this.playerPositionInfo = this.createInfoElement();
    this.biomeInfo = this.createInfoElement();
    this.inventoryInfo = this.createInfoElement();
    this.lightingInfo = this.createInfoElement();

    // Create chunk borders toggle button
    this.chunkBordersButton = document.createElement('button');
    this.chunkBordersButton.innerText = 'Chunks: OFF';
    this.chunkBordersButton.style.backgroundColor = '#444';
    this.chunkBordersButton.style.color = 'white';
    this.chunkBordersButton.style.border = '1px solid #666';
    this.chunkBordersButton.style.borderRadius = '3px';
    this.chunkBordersButton.style.padding = '3px 6px';
    this.chunkBordersButton.style.cursor = 'pointer';
    this.chunkBordersButton.style.marginTop = '5px';
    this.chunkBordersButton.style.fontSize = '10px';
    this.chunkBordersButton.addEventListener('click', () => this.toggleChunkBorders());

    // Add all elements to the container
    this.element.appendChild(this.worldInfo);
    this.element.appendChild(this.playerPositionInfo);
    this.element.appendChild(this.playerInfo);
    this.element.appendChild(this.biomeInfo);
    this.element.appendChild(this.inventoryInfo);
    this.element.appendChild(this.cameraInfo);
    this.element.appendChild(this.renderInfo);
    this.element.appendChild(this.viewInfo);
    this.element.appendChild(this.lightingInfo);
    this.element.appendChild(this.chunkBordersButton);
    
    document.body.appendChild(this.element);
  }

  // Create the persistent toggle button in the corner
  private createToggleButton() {
    this.toggleButton.textContent = 'Debug';
    this.toggleButton.style.position = 'fixed';
    this.toggleButton.style.top = '10px';
    this.toggleButton.style.right = '10px';
    this.toggleButton.style.backgroundColor = 'rgba(0,0,0,0.5)';
    this.toggleButton.style.color = 'white';
    this.toggleButton.style.border = '1px solid #666';
    this.toggleButton.style.borderRadius = '3px';
    this.toggleButton.style.padding = '5px 10px';
    this.toggleButton.style.cursor = 'pointer';
    this.toggleButton.style.zIndex = '1000';
    this.toggleButton.addEventListener('click', () => this.toggleDebugMode());
    
    document.body.appendChild(this.toggleButton);
  }

  // Create a standard info element with consistent styling
  private createInfoElement(): HTMLDivElement {
    const element = document.createElement('div');
    element.style.marginBottom = '2px';
    element.style.whiteSpace = 'nowrap';
    element.style.overflow = 'hidden';
    element.style.textOverflow = 'ellipsis';
    return element;
  }

  // Toggle between minimized and full view
  private toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    
    // Show only header when minimized
    const children = Array.from(this.element.children);
    for (let i = 1; i < children.length; i++) {
      (children[i] as HTMLElement).style.display = this.isMinimized ? 'none' : '';
    }

    // Update the minimize button text
    const minimizeButton = children[0].children[1] as HTMLButtonElement;
    minimizeButton.textContent = this.isMinimized ? '+' : '-';
    
    // Adjust container size
    if (this.isMinimized) {
      this.element.style.maxHeight = 'auto';
      this.element.style.maxWidth = 'auto';
    } else {
      this.element.style.maxHeight = '80vh';
      this.element.style.maxWidth = '250px';
    }
  }

  // Toggle debug mode with the button
  private toggleDebugMode() {
    this.setDebugMode(!this.debugMode);
  }

  // Register a callback for debug mode toggle
  public onDebugToggle(callback: DebugToggleCallback): void {
    this.debugToggleListeners.push(callback);
  }

  // Get current debug mode state
  public isDebugMode(): boolean {
    return this.debugMode;
  }

  // Method to set debug mode - central source of truth
  setDebugMode(enabled: boolean): void {
    if (this.debugMode === enabled) return; // No change
    
    this.debugMode = enabled;
    this.element.style.display = enabled ? 'flex' : 'none';
    
    // Update toggle button appearance
    this.toggleButton.style.backgroundColor = enabled 
      ? 'rgba(0,150,0,0.7)' 
      : 'rgba(0,0,0,0.5)';
    
    console.log(`Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    
    // Notify all registered listeners
    this.debugToggleListeners.forEach(callback => {
      callback(enabled);
    });
  }

  update(
    blockName: string, 
    x: number, 
    y: number, 
    cameraPos?: THREE.Vector2, 
    camera?: THREE.Camera,
    viewSize?: { width: number; height: number },
    playerVelocity?: THREE.Vector2,
    isGrounded?: boolean,
    biomeName?: string,
    heightAtPosition?: number,
    isFlyMode?: boolean,
    selectedBlock?: InventoryItem | null,
    lightCount?: number
  ) {
    if (!this.debugMode) return; // Skip updates if debug mode is off
    
    this.worldInfo.textContent = `Block: ${blockName} (${x}, ${y})`;
    
    if (cameraPos) {
      this.playerPositionInfo.textContent = `Pos: (${cameraPos.x.toFixed(1)}, ${cameraPos.y.toFixed(1)})`;
      this.cameraInfo.textContent = `Cam: (${cameraPos.x.toFixed(1)}, ${cameraPos.y.toFixed(1)})`;
    }

    if (camera instanceof THREE.OrthographicCamera) {
      this.renderInfo.textContent = `View: L:${camera.left.toFixed(1)} R:${camera.right.toFixed(1)} T:${camera.top.toFixed(1)} B:${camera.bottom.toFixed(1)}`;
    }

    if (viewSize) {
      this.viewInfo.textContent = `View: ${viewSize.width.toFixed(1)} x ${viewSize.height.toFixed(1)}`;
    }

    if (playerVelocity) {
      let playerStateText = '';
      
      if (isFlyMode !== undefined) {
        playerStateText = `FLY:${isFlyMode ? 'ON' : 'OFF'} | `;
      }
      
      if (isGrounded !== undefined) {
        playerStateText += `Ground:${isGrounded}`;
      }
      
      this.playerInfo.textContent = `Vel: (${playerVelocity.x.toFixed(2)}, ${playerVelocity.y.toFixed(2)}) | ${playerStateText}`;
    }
    
    if (biomeName && heightAtPosition !== undefined) {
      this.biomeInfo.textContent = `Biome: ${biomeName} | Height: ${heightAtPosition.toFixed(1)}`;
    } else {
      this.biomeInfo.textContent = '';
    }
    
    // Update inventory info
    if (selectedBlock) {
      this.inventoryInfo.textContent = `Block: #${selectedBlock.blockId} (${selectedBlock.count})`;
    } else {
      this.inventoryInfo.textContent = 'No block selected';
    }
    
    // Update lighting info
    if (lightCount !== undefined) {
      this.lightingInfo.textContent = `Lights: ${lightCount} active`;
    } else {
      this.lightingInfo.textContent = 'Lighting: -';
    }
  }

  // Initialize scene reference required for rendering chunk borders
  setScene(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Toggle chunk borders visibility
  private toggleChunkBorders() {
    this.showChunkBorders = !this.showChunkBorders;
    this.chunkBordersButton.innerText = `Chunks: ${this.showChunkBorders ? 'ON' : 'OFF'}`;
    
    // Update visibility of existing borders
    this.chunkBorderMeshes.forEach(mesh => {
      if (mesh) mesh.visible = this.showChunkBorders;
    });
  }

  // Method to check if chunk borders should be visible
  isChunkBordersVisible(): boolean {
    return this.showChunkBorders;
  }

  // Render chunk borders based on visible chunks
  updateChunkBorders(chunks: { x: number, y: number }[] | any[]) {
    if (!this.scene) return;
    
    // Clean up old borders
    this.clearChunkBorders();
    
    if (!this.showChunkBorders) return;
    
    // Create new borders for each chunk
    chunks.forEach(chunk => {
      const chunkX = typeof chunk.x === 'number' ? chunk.x : chunk.chunkX;
      const chunkY = typeof chunk.y === 'number' ? chunk.y : chunk.chunkY;
      
      if (chunkX !== undefined && chunkY !== undefined) {
        const border = this.createChunkBorderMesh(chunkX, chunkY);
        this.scene!.add(border);
        this.chunkBorderMeshes.push(border);
      }
    });
  }
  
  // Clear all chunk border meshes
  private clearChunkBorders() {
    if (!this.scene) return;
    
    this.chunkBorderMeshes.forEach(mesh => {
      if (mesh) {
        this.scene!.remove(mesh);
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        } else if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        }
      }
    });
    
    this.chunkBorderMeshes = [];
  }
  
  // Create a border mesh for a chunk
  private createChunkBorderMesh(chunkX: number, chunkY: number): THREE.LineSegments {
    const chunkSize = Chunk.SIZE;
    const worldX = chunkX * chunkSize;
    const worldY = chunkY * chunkSize;
    
    // Create geometry for a square outline
    const points = [
      // Bottom edge
      new THREE.Vector3(worldX, worldY, 0.2),
      new THREE.Vector3(worldX + chunkSize, worldY, 0.2),
      
      // Right edge
      new THREE.Vector3(worldX + chunkSize, worldY, 0.2),
      new THREE.Vector3(worldX + chunkSize, worldY + chunkSize, 0.2),
      
      // Top edge
      new THREE.Vector3(worldX + chunkSize, worldY + chunkSize, 0.2),
      new THREE.Vector3(worldX, worldY + chunkSize, 0.2),
      
      // Left edge
      new THREE.Vector3(worldX, worldY + chunkSize, 0.2),
      new THREE.Vector3(worldX, worldY, 0.2)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const borderMesh = new THREE.LineSegments(geometry, material);
    borderMesh.visible = this.showChunkBorders;
    
    return borderMesh;
  }
} 
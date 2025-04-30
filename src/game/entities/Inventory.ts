import * as THREE from 'three';
import { BlockRegistry } from '../blocks/BlockRegistry';

// Interface for inventory item
export interface InventoryItem {
  blockId: string;
  count: number;
}

export class Inventory {
  private hotbar: (InventoryItem | null)[] = Array(9).fill(null);
  private mainInventory: (InventoryItem | null)[] = Array(27).fill(null); // 3 rows of 9
  private selectedIdx = 0;
  private uiContainer: HTMLDivElement | null = null;
  private inventoryContainer: HTMLDivElement | null = null;
  private isInventoryOpen = false;
  private debugMode = false;
  private draggedItem: { item: InventoryItem, source: 'hotbar' | 'main', index: number } | null = null;
  private ghostImage: HTMLDivElement | null = null;
  private lastHoveredSlot: HTMLDivElement | null = null;

  constructor() {
    this.createInventoryUI();
    this.updateUI();
  }

  // Create the inventory UI container
  private createInventoryUI() {
    // Create hotbar container for main screen
    const mainHotbarContainer = document.createElement('div');
    mainHotbarContainer.id = 'main-hotbar';
    mainHotbarContainer.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 4px;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 5px;
      border-radius: 5px;
      z-index: 1000;
    `;
    document.body.appendChild(mainHotbarContainer);
    this.uiContainer = mainHotbarContainer;

    // Create main inventory container (initially hidden)
    const inventoryContainer = document.createElement('div');
    inventoryContainer.id = 'main-inventory';
    inventoryContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: none;
      flex-direction: column;
      gap: 4px;
      background-color: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 5px;
      z-index: 1001;
    `;
    document.body.appendChild(inventoryContainer);
    this.inventoryContainer = inventoryContainer;

    // Create main inventory rows container
    const inventoryRows = document.createElement('div');
    inventoryRows.id = 'inventory-rows';
    inventoryRows.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
    inventoryContainer.appendChild(inventoryRows);

    // Create main inventory rows
    for (let i = 0; i < 3; i++) {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        gap: 4px;
      `;
      inventoryRows.appendChild(row);
    }

    // Create hotbar container for inventory popup
    const inventoryHotbarContainer = document.createElement('div');
    inventoryHotbarContainer.id = 'inventory-hotbar';
    inventoryHotbarContainer.style.cssText = `
      display: flex;
      gap: 4px;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 5px;
      border-radius: 5px;
      margin-top: 10px;
    `;
    inventoryContainer.appendChild(inventoryHotbarContainer);
  }

  // Update the inventory UI
  public updateUI() {
    if (!this.uiContainer || !this.inventoryContainer) {
      this.createInventoryUI();
      return;
    }

    // Clear existing slots
    this.uiContainer.innerHTML = '';
    const inventoryRows = this.inventoryContainer.querySelector('#inventory-rows');
    const inventoryHotbar = this.inventoryContainer.querySelector('#inventory-hotbar');

    if (inventoryRows) {
      inventoryRows.innerHTML = '';
      // Recreate inventory rows
      for (let i = 0; i < 3; i++) {
        const row = document.createElement('div');
        row.style.cssText = `
          display: flex;
          gap: 4px;
        `;
        inventoryRows.appendChild(row);
      }
    }

    if (inventoryHotbar) {
      inventoryHotbar.innerHTML = '';
    }

    const registry = BlockRegistry.getInstance();

    // Update main inventory
    if (inventoryRows) {
      const rows = inventoryRows.children;
      for (let i = 0; i < 3; i++) {
        const row = rows[i];
        for (let j = 0; j < 9; j++) {
          const index = i * 9 + j;
          const item = this.mainInventory[index];
          const slot = this.createSlot(item, false, 'main', index);
          row.appendChild(slot);
        }
      }
    }

    // Update both hotbars
    this.hotbar.forEach((item, index) => {
      const mainSlot = this.createSlot(item, index === this.selectedIdx, 'hotbar', index);
      this.uiContainer!.appendChild(mainSlot);

      if (inventoryHotbar) {
        const inventorySlot = this.createSlot(item, index === this.selectedIdx, 'hotbar', index);
        inventoryHotbar.appendChild(inventorySlot);
      }
    });
  }

  private createSlot(item: InventoryItem | null, isSelected: boolean, type: 'hotbar' | 'main', index: number): HTMLDivElement {
    const slot = document.createElement('div');
    slot.style.cssText = `
      width: 40px;
      height: 40px;
      background-color: ${isSelected ? '#555' : '#333'};
      border: 2px solid ${isSelected ? '#fff' : '#555'};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: monospace;
      color: white;
      font-size: 10px;
      position: relative;
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      user-select: none;
      transition: border-color 0.1s ease;
    `;

    // Add drag and drop event listeners
    slot.addEventListener('mousedown', (e) => this.handleDragStart(e, type, index));
    slot.addEventListener('mouseup', (e) => this.handleDragEnd(e, type, index));
    slot.addEventListener('mouseover', (e) => this.handleDragOver(e, type, index));
    slot.addEventListener('mouseout', () => this.handleDragOut(slot));

    if (item) {
      const registry = BlockRegistry.getInstance();
      const block = registry.getById(item.blockId);

      if (block.texturePath) {
        const texture = document.createElement('div');
        if (block.tinted) {
          texture.style.cssText = `
            width: 100%;
            height: 100%;
            background-image: url(${block.texturePath});
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            position: relative;
          `;

          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #${block.color.toString(16).padStart(6, '0')};
            mix-blend-mode: multiply;
            opacity: 1;
          `;
          texture.appendChild(overlay);
        } else {
          texture.style.cssText = `
            width: 100%;
            height: 100%;
            background-image: url(${block.texturePath});
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
          `;
        }
        slot.appendChild(texture);
      } else {
        const colorBlock = document.createElement('div');
        colorBlock.style.cssText = `
          width: 100%;
          height: 100%;
          background-color: #${block.color.toString(16).padStart(6, '0')};
        `;
        slot.appendChild(colorBlock);
      }

      const count = document.createElement('div');
      count.textContent = item.count.toString();
      count.style.cssText = `
        position: absolute;
        bottom: 2px;
        right: 4px;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 1px 1px 1px black;
        z-index: 1;
      `;
      slot.appendChild(count);
    }

    return slot;
  }

  private createGhostImage(item: InventoryItem): HTMLDivElement {
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      background-color: rgba(0, 0, 0, 0.7);
      border: 2px solid #fff;
      border-radius: 4px;
      pointer-events: none;
      z-index: 1002;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    `;

    const registry = BlockRegistry.getInstance();
    const block = registry.getById(item.blockId);

    if (block.texturePath) {
      const texture = document.createElement('div');
      if (block.tinted) {
        texture.style.cssText = `
          width: 100%;
          height: 100%;
          background-image: url(${block.texturePath});
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
          position: relative;
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #${block.color.toString(16).padStart(6, '0')};
          mix-blend-mode: multiply;
          opacity: 1;
        `;
        texture.appendChild(overlay);
      } else {
        texture.style.cssText = `
          width: 100%;
          height: 100%;
          background-image: url(${block.texturePath});
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
        `;
      }
      ghost.appendChild(texture);
    } else {
      const colorBlock = document.createElement('div');
      colorBlock.style.cssText = `
        width: 100%;
        height: 100%;
        background-color: #${block.color.toString(16).padStart(6, '0')};
      `;
      ghost.appendChild(colorBlock);
    }

    const count = document.createElement('div');
    count.textContent = item.count.toString();
    count.style.cssText = `
      position: absolute;
      bottom: 2px;
      right: 4px;
      font-size: 12px;
      font-weight: bold;
      text-shadow: 1px 1px 1px black;
      z-index: 1;
    `;
    ghost.appendChild(count);

    return ghost;
  }

  private handleDragStart(e: MouseEvent, type: 'hotbar' | 'main', index: number) {
    const item = type === 'hotbar' ? this.hotbar[index] : this.mainInventory[index];
    if (item) {
      this.draggedItem = { item, source: type, index };

      // Create and show ghost image
      this.ghostImage = this.createGhostImage(item);
      document.body.appendChild(this.ghostImage);

      // Add mousemove listener for ghost image
      const moveListener = (e: MouseEvent) => {
        if (this.ghostImage) {
          this.ghostImage.style.left = `${e.clientX}px`;
          this.ghostImage.style.top = `${e.clientY}px`;
        }
      };

      // Add mouseup listener to cleanup
      const upListener = () => {
        document.removeEventListener('mousemove', moveListener);
        document.removeEventListener('mouseup', upListener);
        if (this.ghostImage) {
          document.body.removeChild(this.ghostImage);
          this.ghostImage = null;
        }
      };

      document.addEventListener('mousemove', moveListener);
      document.addEventListener('mouseup', upListener);

      e.preventDefault();
    }
  }

  private handleDragOver(e: MouseEvent, type: 'hotbar' | 'main', index: number) {
    if (this.draggedItem) {
      e.preventDefault();

      // Find the slot element
      const slot = e.currentTarget as HTMLDivElement;

      // Remove highlight from previous slot
      if (this.lastHoveredSlot && this.lastHoveredSlot !== slot) {
        this.lastHoveredSlot.style.borderColor = '#555';
      }

      // Highlight current slot
      slot.style.borderColor = '#fff';
      this.lastHoveredSlot = slot;
    }
  }

  private handleDragOut(slot: HTMLDivElement) {
    if (this.draggedItem) {
      slot.style.borderColor = '#555';
    }
  }

  private handleDragEnd(e: MouseEvent, type: 'hotbar' | 'main', index: number) {
    if (this.draggedItem) {
      const targetItem = type === 'hotbar' ? this.hotbar[index] : this.mainInventory[index];

      // If same item type, try to stack
      if (targetItem && targetItem.blockId === this.draggedItem.item.blockId) {
        targetItem.count += this.draggedItem.item.count;
        if (this.draggedItem.source === 'hotbar') {
          this.hotbar[this.draggedItem.index] = null;
        } else {
          this.mainInventory[this.draggedItem.index] = null;
        }
      } else {
        // Swap items
        if (this.draggedItem.source === 'hotbar') {
          this.hotbar[this.draggedItem.index] = targetItem;
        } else {
          this.mainInventory[this.draggedItem.index] = targetItem;
        }

        if (type === 'hotbar') {
          this.hotbar[index] = this.draggedItem.item;
        } else {
          this.mainInventory[index] = this.draggedItem.item;
        }
      }

      // Reset drag state
      this.draggedItem = null;
      if (this.lastHoveredSlot) {
        this.lastHoveredSlot.style.borderColor = '#555';
        this.lastHoveredSlot = null;
      }
      this.updateUI();
    }
  }

  // Toggle inventory visibility
  public toggleInventory(): void {
    this.isInventoryOpen = !this.isInventoryOpen;
    if (this.inventoryContainer) {
      this.inventoryContainer.style.display = this.isInventoryOpen ? 'flex' : 'none';
    }
  }

  // Add item to inventory
  public addItem(blockId: string): void {
    // First try to add to existing stack in hotbar
    for (let i = 0; i < this.hotbar.length; i++) {
      const item = this.hotbar[i];
      if (item && item.blockId === blockId) {
        item.count++;
        this.updateUI();
        return;
      }
    }

    // Then try to add to existing stack in main inventory
    for (let i = 0; i < this.mainInventory.length; i++) {
      const item = this.mainInventory[i];
      if (item && item.blockId === blockId) {
        item.count++;
        this.updateUI();
        return;
      }
    }

    // If no existing stack found, add to first empty slot in hotbar
    for (let i = 0; i < this.hotbar.length; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { blockId, count: 1 };
        this.updateUI();
        return;
      }
    }

    // If hotbar is full, add to first empty slot in main inventory
    for (let i = 0; i < this.mainInventory.length; i++) {
      if (!this.mainInventory[i]) {
        this.mainInventory[i] = { blockId, count: 1 };
        this.updateUI();
        return;
      }
    }
  }

  // Remove item from inventory
  public removeItem(blockId: string): void {
    // First try to remove from hotbar
    for (let i = 0; i < this.hotbar.length; i++) {
      const item = this.hotbar[i];
      if (item && item.blockId === blockId) {
        item.count--;
        if (item.count <= 0) {
          this.hotbar[i] = null;
        }
        this.updateUI();
        return;
      }
    }

    // Then try to remove from main inventory
    for (let i = 0; i < this.mainInventory.length; i++) {
      const item = this.mainInventory[i];
      if (item && item.blockId === blockId) {
        item.count--;
        if (item.count <= 0) {
          this.mainInventory[i] = null;
        }
        this.updateUI();
        return;
      }
    }
  }

  // Get all inventory items
  public getItems(): InventoryItem[] {
    return [
      ...this.hotbar.filter(item => item !== null) as InventoryItem[],
      ...this.mainInventory.filter(item => item !== null) as InventoryItem[]
    ];
  }

  // Get the currently selected item
  public getSelectedItem(): InventoryItem | null {
    return this.hotbar[this.selectedIdx];
  }

  // Set the selected hotbar slot
  public selectHotbarSlot(index: number): void {
    if (index >= 0 && index < this.hotbar.length) {
      this.selectedIdx = index;
      this.updateUI();
    }
  }

  // Handle hotbar scroll
  public scrollHotbar(direction: number): void {
    this.selectedIdx = (this.selectedIdx + direction + this.hotbar.length) % this.hotbar.length;
    this.updateUI();
  }

  // Set debug mode
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  // Check if inventory is open
  public getInventoryOpen(): boolean {
    return this.isInventoryOpen;
  }
} 
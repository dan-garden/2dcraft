import * as THREE from 'three';
import { BlockRegistry } from '../blocks/BlockRegistry';

// Interface for inventory item
export interface InventoryItem {
  blockId: number;
  count: number;
}

export class Inventory {
  private items: InventoryItem[] = [];
  private selectedIdx = 0;
  private uiContainer: HTMLDivElement | null = null;
  private debugMode = false;

  constructor() {
    this.createInventoryUI();
  }

  // Create the inventory UI container
  private createInventoryUI() {
    const inventoryContainer = document.createElement('div');
    inventoryContainer.id = 'inventory';
    inventoryContainer.style.cssText = `
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
    document.body.appendChild(inventoryContainer);
    this.uiContainer = inventoryContainer;
  }

  // Update the inventory UI with current items
  public updateUI() {
    if (!this.uiContainer) {
      this.createInventoryUI();
      return;
    }

    // Clear existing slots
    this.uiContainer.innerHTML = '';

    const selectedItem = this.getSelectedItem();
    const registry = BlockRegistry.getInstance();

    // Create slots for each inventory item
    this.items.forEach((item: InventoryItem, index: number) => {
      if (!this.uiContainer) return;

      const slot = document.createElement('div');
      slot.style.cssText = `
        width: 40px;
        height: 40px;
        background-color: ${item === selectedItem ? '#555' : '#333'};
        border: 2px solid ${item === selectedItem ? '#fff' : '#555'};
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
      `;

      // Get block from registry
      const block = registry.getById(item.blockId);

      // Create texture image if available
      if (block.texturePath) {
        const texture = document.createElement('div');

        if (block.tinted) {
          // For tinted blocks, we use a simple approach with a colored overlay
          texture.style.cssText = `
            width: 100%;
            height: 100%;
            background-image: url(${block.texturePath});
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            position: relative;
          `;

          // Add color overlay
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
          // For non-tinted blocks, just show the texture
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
        // Fallback to color block if no texture
        const colorBlock = document.createElement('div');
        colorBlock.style.cssText = `
          width: 100%;
          height: 100%;
          background-color: #${block.color.toString(16).padStart(6, '0')};
        `;
        slot.appendChild(colorBlock);
      }

      // Add count
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
      this.uiContainer.appendChild(slot);
    });

    // Add empty slot indicator if inventory is empty
    if (this.items.length === 0 && this.uiContainer) {
      const emptySlot = document.createElement('div');
      emptySlot.style.cssText = `
        width: 40px;
        height: 40px;
        background-color: #333;
        border: 2px solid #555;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        color: #aaa;
        font-size: 10px;
        border-radius: 4px;
      `;
      emptySlot.textContent = 'Empty';
      this.uiContainer.appendChild(emptySlot);
    }
  }

  // Initialize the inventory with blocks
  public initializeWithBlocks(quantity: number = 100): void {
    // Get all blocks from registry
    const registry = BlockRegistry.getInstance();
    const blocks = registry.all();

    // Add each block to inventory (except air which is ID 0)
    blocks.forEach(block => {
      if (block.id === 0) return; // Skip air blocks
      this.items.push({ blockId: block.id, count: quantity });
    });

    // Update the UI
    this.updateUI();

    if (this.debugMode) {
      console.log(`Initialized inventory with ${quantity} of each block type`);
    }
  }

  // Add item to inventory
  public addItem(blockId: number): void {
    // Find the item in inventory
    const existingItem = this.items.find(item => item.blockId === blockId);

    if (existingItem) {
      // Increment count if already exists
      existingItem.count++;
    } else {
      // Add new item if not in inventory
      this.items.push({ blockId, count: 1 });
    }

    this.updateUI();

    if (this.debugMode) {
      console.log(`Added block ID ${blockId} to inventory. Inventory:`, this.items);
    }
  }

  // Remove item from inventory
  public removeItem(blockId: number): void {
    // Find the item index
    const itemIndex = this.items.findIndex(item => item.blockId === blockId);

    if (itemIndex === -1) return;

    const item = this.items[itemIndex];

    // Decrement count
    item.count--;

    // Remove from inventory if count reaches 0
    if (item.count <= 0) {
      this.items.splice(itemIndex, 1);

      // Adjust selected index if needed
      if (this.selectedIdx >= this.items.length) {
        this.selectedIdx = Math.max(0, this.items.length - 1);
      }
    }

    this.updateUI();

    if (this.debugMode) {
      console.log(`Removed block ID ${blockId} from inventory. Remaining inventory:`, this.items);
    }
  }

  // Get all inventory items
  public getItems(): InventoryItem[] {
    return [...this.items];
  }

  // Get the currently selected item
  public getSelectedItem(): InventoryItem | null {
    if (this.items.length === 0) return null;
    return this.items[this.selectedIdx];
  }

  // Set the selected hotbar slot
  public selectHotbarSlot(index: number): void {
    // Validate index
    if (index < 0) return;

    // Set selected block index (but don't exceed inventory size)
    this.selectedIdx = Math.min(index, this.items.length - 1);

    if (this.debugMode) {
      console.log(`Selected hotbar slot ${index}, inventory index: ${this.selectedIdx}`);
    }

    this.updateUI();
  }

  // Handle hotbar scroll
  public scrollHotbar(direction: number): void {
    if (this.items.length === 0) return;

    // Calculate new index with wrapping
    this.selectedIdx = (this.selectedIdx + direction + this.items.length) % this.items.length;

    if (this.debugMode) {
      console.log(`Scrolled hotbar to index: ${this.selectedIdx}`);
    }

    this.updateUI();
  }

  // Set debug mode
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
} 
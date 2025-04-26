import * as THREE from 'three';

export class CameraController {
  private camera: THREE.OrthographicCamera;
  private position: THREE.Vector2;
  private speed: number;
  private zoom: number;
  private blockSize: number = 16; // Each block is 16x16 pixels

  constructor(camera: THREE.OrthographicCamera, speed: number = 1) {
    this.camera = camera;
    this.position = new THREE.Vector2(0, 0);
    this.speed = speed;
    this.zoom = 1;
    this.updateCamera();
  }

  private updateCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Calculate how many blocks can fit in the viewport
    const blocksX = Math.ceil(width / this.blockSize);
    const blocksY = Math.ceil(height / this.blockSize);
    
    this.camera.left = -blocksX / 2;
    this.camera.right = blocksX / 2;
    this.camera.top = blocksY / 2;
    this.camera.bottom = -blocksY / 2;
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
  }

  update(keys: { [key: string]: boolean }) {
    if (keys.w) this.position.y += this.speed;
    if (keys.s) this.position.y -= this.speed;
    if (keys.a) this.position.x -= this.speed;
    if (keys.d) this.position.x += this.speed;

    this.camera.position.x = this.position.x;
    this.camera.position.y = this.position.y;
  }

  setPosition(x: number, y: number) {
    this.position.x = x;
    this.position.y = y;
    this.camera.position.x = x;
    this.camera.position.y = y;
  }

  handleResize() {
    this.updateCamera();
  }

  getPosition(): THREE.Vector2 {
    return this.position.clone();
  }

  getWorldPositionFromScreen(screenX: number, screenY: number): THREE.Vector2 {
    const worldPos = new THREE.Vector2();
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Convert screen coordinates to world coordinates
    const blocksX = Math.ceil(width / this.blockSize);
    const blocksY = Math.ceil(height / this.blockSize);
    
    // Convert normalized screen coordinates (-1 to 1) to world position
    worldPos.x = this.position.x + (screenX * blocksX / 2);
    worldPos.y = this.position.y + (screenY * blocksY / 2);
    return worldPos;
  }

  getViewSize(): { width: number; height: number } {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const blocksX = Math.ceil(width / this.blockSize);
    const blocksY = Math.ceil(height / this.blockSize);
    
    return {
      width: blocksX,
      height: blocksY
    };
  }
} 
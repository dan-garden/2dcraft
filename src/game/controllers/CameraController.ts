import * as THREE from 'three';

export class CameraController {
  private camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private position: THREE.Vector2;
  private speed: number;
  private zoom: number;
  private blockSize: number = 16; // Each block is 16x16 pixels
  private isPerspective: boolean;
  private perspectiveAngle: number = 15; // Slight top-down angle in degrees
  private cameraDistance: number = 30; // Distance from the 2D plane in perspective mode
  private freeCamera: boolean = false; // Controls whether camera is locked to player
  private freeCameraSpeed: number = 2; // Speed multiplier for free camera mode
  private orthoCamera: THREE.OrthographicCamera; // Keep reference to both cameras
  private perspCamera: THREE.PerspectiveCamera; // Keep reference to both cameras

  constructor(camera: THREE.OrthographicCamera | THREE.PerspectiveCamera, speed: number = 1, usePerspective: boolean = false) {
    // Initialize both camera types
    const aspect = window.innerWidth / window.innerHeight;

    // Store the provided camera as perspective camera
    this.perspCamera = camera as THREE.PerspectiveCamera;

    // Create orthographic camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    const blocksX = Math.ceil(width / this.blockSize);
    const blocksY = Math.ceil(height / this.blockSize);
    this.orthoCamera = new THREE.OrthographicCamera(
      -blocksX / 2, blocksX / 2,
      blocksY / 2, -blocksY / 2,
      -1000, 1000
    );

    // Set default camera based on mode
    this.isPerspective = usePerspective;
    this.camera = usePerspective ? this.perspCamera : this.orthoCamera;

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

    if (this.isPerspective) {
      // For perspective camera
      this.perspCamera.fov = 50; // Narrower FOV for less distortion
      this.perspCamera.aspect = width / height;
      this.perspCamera.near = 0.1;
      this.perspCamera.far = 1000;
      this.camera = this.perspCamera;
    } else {
      // For orthographic camera
      this.orthoCamera.left = -blocksX / 2;
      this.orthoCamera.right = blocksX / 2;
      this.orthoCamera.top = blocksY / 2;
      this.orthoCamera.bottom = -blocksY / 2;
      this.orthoCamera.near = -1000;
      this.orthoCamera.far = 1000;
      this.orthoCamera.zoom = this.zoom;
      this.camera = this.orthoCamera;
    }

    this.camera.updateProjectionMatrix();
    this.updateCameraPosition();
  }

  private updateCameraPosition() {
    if (!this.isPerspective) {
      // Direct position for orthographic
      this.orthoCamera.position.x = this.position.x;
      this.orthoCamera.position.y = this.position.y;
      this.orthoCamera.position.z = 100; // Put camera higher to see everything
      this.orthoCamera.lookAt(new THREE.Vector3(this.position.x, this.position.y, 0));
    } else {
      // Position with angle for perspective
      const angleRad = THREE.MathUtils.degToRad(this.perspectiveAngle);
      this.perspCamera.position.x = this.position.x;
      this.perspCamera.position.y = this.position.y - this.cameraDistance * Math.sin(angleRad);
      this.perspCamera.position.z = this.cameraDistance * Math.cos(angleRad);

      // Look at the position
      const target = new THREE.Vector3(this.position.x, this.position.y, 0);
      this.perspCamera.lookAt(target);
    }
  }

  update(keys: { [key: string]: boolean }) {
    if (this.freeCamera) {
      // Free camera movement
      const moveSpeed = this.speed * this.freeCameraSpeed;
      if (keys.w) this.position.y += moveSpeed;
      if (keys.s) this.position.y -= moveSpeed;
      if (keys.a) this.position.x -= moveSpeed;
      if (keys.d) this.position.x += moveSpeed;

      // Additional camera controls in free mode
      if (keys.q) {
        this.perspectiveAngle = Math.min(45, this.perspectiveAngle + 0.5);
        console.log(`Camera angle: ${this.perspectiveAngle.toFixed(1)}°`);
      }
      if (keys.z) {
        this.perspectiveAngle = Math.max(0, this.perspectiveAngle - 0.5);
        console.log(`Camera angle: ${this.perspectiveAngle.toFixed(1)}°`);
      }
      if (keys.r) {
        this.cameraDistance = Math.max(5, this.cameraDistance - 0.5);
        console.log(`Camera distance: ${this.cameraDistance.toFixed(1)}`);
      }
      if (keys.t) {
        this.cameraDistance += 0.5;
        console.log(`Camera distance: ${this.cameraDistance.toFixed(1)}`);
      }

      this.updateCameraPosition();
    }
  }

  setPosition(x: number, y: number) {
    if (!this.freeCamera) {
      this.position.x = x;
      this.position.y = y;
      this.updateCameraPosition();
    }
  }

  handleResize() {
    this.updateCamera();
  }

  getPosition(): THREE.Vector2 {
    return this.position.clone();
  }

  toggleCameraMode() {
    this.isPerspective = !this.isPerspective;
    this.updateCamera();
    console.log(`Camera mode: ${this.isPerspective ? 'Perspective' : 'Orthographic'}`);
    return this.isPerspective;
  }

  // Method to toggle free camera mode
  toggleFreeCamera() {
    this.freeCamera = !this.freeCamera;
    console.log(`Free camera mode: ${this.freeCamera ? 'enabled' : 'disabled'}`);
    return this.freeCamera;
  }

  // Method to check if free camera is enabled
  isFreeCameraEnabled(): boolean {
    return this.freeCamera;
  }

  // Method to get the current camera instance
  getCurrentCamera(): THREE.Camera {
    return this.camera;
  }

  setPerspectiveAngle(degrees: number) {
    this.perspectiveAngle = THREE.MathUtils.clamp(degrees, 0, 45);
    if (this.isPerspective) {
      this.updateCameraPosition();
    }
    return this.perspectiveAngle;
  }

  getWorldPositionFromScreen(screenX: number, screenY: number): THREE.Vector2 {
    const worldPos = new THREE.Vector2();
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (this.isPerspective) {
      // For perspective camera, we need to use raycaster
      const normalizedX = (screenX / width) * 2 - 1;
      const normalizedY = -(screenY / height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(normalizedX, normalizedY), this.camera);

      // In 2.5D view, we need to account for z-offset
      const layerStep = 0.05;

      // Start ray variables
      const rayOrigin = raycaster.ray.origin.clone();
      const rayDirection = raycaster.ray.direction.clone().normalize();

      // Check a range of y-coordinates around the camera position
      const cameraY = this.position.y;
      const yStart = Math.floor(cameraY) - 20;
      const yEnd = Math.floor(cameraY) + 20;

      let foundIntersection = false;
      let closestIntersection = null;
      let closestDistanceSq = Infinity;

      for (let y = yStart; y <= yEnd; y++) {
        // Calculate z-offset for this row of blocks
        const zPos = -y * layerStep;

        // Create a plane at this z-position
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -zPos);
        const intersectionPoint = new THREE.Vector3();

        // Find intersection with this plane
        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
          // Check if this is the closest intersection
          const distanceSq = intersectionPoint.distanceToSquared(rayOrigin);

          if (distanceSq < closestDistanceSq) {
            // Check if the y-coordinate of the intersection point rounds to the plane's y
            const blockY = Math.floor(intersectionPoint.y);

            // Only update if this y matches the plane y we're checking
            if (blockY === y) {
              closestDistanceSq = distanceSq;
              closestIntersection = intersectionPoint;
              foundIntersection = true;
            }
          }
        }
      }

      if (foundIntersection && closestIntersection) {
        // Successfully found the intersection
        worldPos.x = closestIntersection.x;
        worldPos.y = closestIntersection.y;
      } else {
        // Fallback: project using ray direction if no intersection
        const farPoint = raycaster.ray.at(1000, new THREE.Vector3());
        worldPos.x = farPoint.x;
        worldPos.y = farPoint.y;
      }
    } else {
      // For orthographic camera
      const blocksX = Math.ceil(width / this.blockSize);
      const blocksY = Math.ceil(height / this.blockSize);

      // Convert normalized screen coordinates (-1 to 1) to world position
      const normalizedX = (screenX / width) * 2 - 1;
      const normalizedY = -(screenY / height) * 2 + 1;

      worldPos.x = this.position.x + (normalizedX * blocksX / 2);
      worldPos.y = this.position.y + (normalizedY * blocksY / 2);
    }

    return worldPos;
  }

  getViewSize(): { width: number; height: number } {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (this.isPerspective) {
      // Approximate the view size for perspective camera
      const vFOV = THREE.MathUtils.degToRad(this.perspCamera.fov);
      const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * this.perspCamera.aspect);

      // Calculate blocks visible based on camera distance and FOV
      const heightVisible = 2 * Math.tan(vFOV / 2) * this.cameraDistance;
      const widthVisible = 2 * Math.tan(hFOV / 2) * this.cameraDistance;

      return {
        width: Math.ceil(widthVisible),
        height: Math.ceil(heightVisible)
      };
    } else {
      // Orthographic calculation
      const blocksX = Math.ceil(width / this.blockSize);
      const blocksY = Math.ceil(height / this.blockSize);

      return {
        width: blocksX,
        height: blocksY
      };
    }
  }
} 
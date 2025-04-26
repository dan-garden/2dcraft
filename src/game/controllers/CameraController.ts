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

  constructor(camera: THREE.OrthographicCamera | THREE.PerspectiveCamera, speed: number = 1, usePerspective: boolean = false) {
    this.camera = camera;
    this.position = new THREE.Vector2(0, 0);
    this.speed = speed;
    this.zoom = 1;
    this.isPerspective = usePerspective;
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
      const perspCamera = this.camera as THREE.PerspectiveCamera;
      perspCamera.fov = 50; // Narrower FOV for less distortion
      perspCamera.aspect = width / height;
      perspCamera.near = 0.1;
      perspCamera.far = 1000;

      // Position the camera with slight top-down angle
      const angleRad = THREE.MathUtils.degToRad(this.perspectiveAngle);
      this.camera.position.z = this.cameraDistance;
      this.camera.position.y = this.position.y;
      this.camera.position.x = this.position.x;

      // Look at the position slightly ahead of the player
      const target = new THREE.Vector3(this.position.x, this.position.y, 0);
      this.camera.lookAt(target);

      // Apply rotation for top-down angle
      this.camera.rotation.x = -angleRad;
    } else {
      // For orthographic camera
      const orthoCamera = this.camera as THREE.OrthographicCamera;
      orthoCamera.left = -blocksX / 2;
      orthoCamera.right = blocksX / 2;
      orthoCamera.top = blocksY / 2;
      orthoCamera.bottom = -blocksY / 2;
      orthoCamera.near = -1000;
      orthoCamera.far = 1000;
      orthoCamera.zoom = this.zoom;
    }

    this.camera.updateProjectionMatrix();
  }

  update(keys: { [key: string]: boolean }) {
    if (keys.w) this.position.y += this.speed;
    if (keys.s) this.position.y -= this.speed;
    if (keys.a) this.position.x -= this.speed;
    if (keys.d) this.position.x += this.speed;

    // For orthographic camera, directly update position
    if (!this.isPerspective) {
      this.camera.position.x = this.position.x;
      this.camera.position.y = this.position.y;
    } else {
      // For perspective camera, update position and look direction
      this.camera.position.x = this.position.x;
      this.camera.position.y = this.position.y - this.cameraDistance * Math.sin(THREE.MathUtils.degToRad(this.perspectiveAngle));
      this.camera.position.z = this.cameraDistance * Math.cos(THREE.MathUtils.degToRad(this.perspectiveAngle));

      // Look at the player position
      const target = new THREE.Vector3(this.position.x, this.position.y, 0);
      this.camera.lookAt(target);
    }
  }

  setPosition(x: number, y: number) {
    this.position.x = x;
    this.position.y = y;

    if (!this.isPerspective) {
      // Direct position for orthographic
      this.camera.position.x = x;
      this.camera.position.y = y;
    } else {
      // Position with angle for perspective
      this.camera.position.x = x;
      this.camera.position.y = y - this.cameraDistance * Math.sin(THREE.MathUtils.degToRad(this.perspectiveAngle));
      this.camera.position.z = this.cameraDistance * Math.cos(THREE.MathUtils.degToRad(this.perspectiveAngle));

      // Look at the player position
      const target = new THREE.Vector3(x, y, 0);
      this.camera.lookAt(target);
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
    return this.isPerspective;
  }

  setPerspectiveAngle(degrees: number) {
    this.perspectiveAngle = THREE.MathUtils.clamp(degrees, 0, 45);
    if (this.isPerspective) {
      this.updateCamera();
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
      // Use the same layerStep as in InstancedRenderer
      const layerStep = 0.05;

      // Start ray variables
      const rayOrigin = raycaster.ray.origin.clone();
      const rayDirection = raycaster.ray.direction.clone().normalize();
      const maxDistance = 100; // Maximum ray distance

      // Attempt to find intersection with blocks
      let foundIntersection = false;
      let closestIntersection = null;
      let closestDistanceSq = Infinity;

      // Check a range of y-coordinates around the camera position
      const cameraY = this.position.y;
      const yStart = Math.floor(cameraY) - 20;
      const yEnd = Math.floor(cameraY) + 20;

      for (let y = yStart; y <= yEnd; y++) {
        // Calculate z-offset for this row of blocks (match the InstancedRenderer formula)
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
        console.warn("Raycaster failed to intersect with game plane");

        // Calculate a far point along the ray and project to z=0
        const farPoint = raycaster.ray.at(1000, new THREE.Vector3());
        worldPos.x = farPoint.x;
        worldPos.y = farPoint.y;
      }
    } else {
      // For orthographic camera
      const blocksX = Math.ceil(width / this.blockSize);
      const blocksY = Math.ceil(height / this.blockSize);

      // Convert normalized screen coordinates (-1 to 1) to world position
      worldPos.x = this.position.x + (screenX * blocksX / 2);
      worldPos.y = this.position.y + (screenY * blocksY / 2);
    }

    return worldPos;
  }

  getViewSize(): { width: number; height: number } {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (this.isPerspective) {
      // Approximate the view size for perspective camera
      const vFOV = THREE.MathUtils.degToRad((this.camera as THREE.PerspectiveCamera).fov);
      const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * (this.camera as THREE.PerspectiveCamera).aspect);

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
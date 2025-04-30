import { World } from '../world/World';
import { BlockRegistry } from '../blocks/BlockRegistry';
import * as THREE from 'three';
import { CameraController } from '../controllers/CameraController';

// Interface for visible block information
export interface VisibleBlock {
  x: number;
  y: number;
  blockId: number;
}

export class InstancedRenderer {
  private scene: THREE.Scene;
  private meshes: Map<number, THREE.InstancedMesh>;
  private dummy = new THREE.Object3D();
  private renderBuffer = 5; // How many blocks beyond viewport to render
  private visibleBlocks: VisibleBlock[] = [];

  // Store reference to the current block textures for comparison
  private blockTexturePaths: Map<number, string> = new Map();
  private blockMaterials: Map<number, THREE.MeshStandardMaterial> = new Map();
  private breakingStageTextures: THREE.Texture[] = [];
  private breakingMaterial: THREE.MeshStandardMaterial;
  private breakingMeshes: Map<string, THREE.InstancedMesh> = new Map(); // Key format: "x,y"

  // Lighting elements
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private pointLights: Map<string, THREE.PointLight> = new Map();

  // Light optimization settings
  private readonly MAX_LIGHTS = 20; // Maximum number of point lights to render at once
  private readonly LIGHT_DISTANCE_THRESHOLD = 25; // Maximum distance for light to be visible
  private readonly LIGHT_UPDATE_INTERVAL = 5; // Update lights every N frames
  private frameCount = 0; // Counter for frame-based updates
  private lightPool: THREE.PointLight[] = []; // Pool of reusable light objects
  private lightQueue: { x: number, y: number, z: number, color: number, intensity: number, range: number }[] = []; // Queue of lights waiting to be created

  // Depth settings
  private readonly blockDepth = 0.5; // How deep blocks appear in the z-direction
  private readonly layerStep = 0.05; // Small z-offset between blocks for proper rendering order

  constructor(scene: THREE.Scene, maxInstancesPerBlock: number) {
    this.scene = scene;
    this.meshes = new Map<number, THREE.InstancedMesh>();
    this.dummy = new THREE.Object3D();
    this.renderBuffer = 5;

    // Load breaking stage textures
    this.loadBreakingStageTextures();

    // Create a single breaking material that will be shared by all breaking meshes
    this.breakingMaterial = new THREE.MeshStandardMaterial({
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      metalness: 0.0,
      roughness: 0.8,
      flatShading: true,
      blending: THREE.NormalBlending,
      alphaTest: 0.1,
      opacity: 1.0
    });

    // Setup 2.5D lighting with brighter ambient (for surface illumination)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased from 0.6 to 0.8

    // Directional light for sun-like lighting coming in at an angle
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Increased from 0.7 to 0.9
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;

    scene.add(this.ambientLight);
    scene.add(this.directionalLight);

    // Initialize light pool
    this.initializeLightPool();

    this.initializeBlockMeshes(maxInstancesPerBlock);
  }

  private initializeLightPool(): void {
    // Create a pool of reusable lights
    for (let i = 0; i < this.MAX_LIGHTS; i++) {
      const light = new THREE.PointLight(0xffffff, 0, 0, 1.0);
      light.visible = false; // Start with all lights off
      this.scene.add(light);
      this.lightPool.push(light);
    }
  }

  private initializeBlockMeshes(maxInstancesPerBlock: number): void {
    const registry = BlockRegistry.getInstance();
    const blocks = registry.all();
    const baseGeom = new THREE.BoxGeometry(1, 1, this.blockDepth);

    blocks.forEach(block => {
      // Skip creating meshes for air blocks
      if (block.id === 0) return;

      // Create material and store it
      const material = this.createMaterialForBlock(block);
      this.blockMaterials.set(block.id, material);

      // Store the texture path for later comparison
      this.blockTexturePaths.set(block.id, block.texturePath || '');

      const mesh = new THREE.InstancedMesh(baseGeom, material, maxInstancesPerBlock);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.castShadow = block.isSolid && !block.isTransparent;
      mesh.receiveShadow = block.isSolid;
      mesh.renderOrder = block.isTransparent ? 10 : 0;

      this.scene.add(mesh);
      this.meshes.set(block.id, mesh);
    });
  }

  private loadBreakingStageTextures(): void {
    const textureLoader = new THREE.TextureLoader();
    for (let i = 0; i < 10; i++) {
      const texture = textureLoader.load(`./textures/blocks/destroy_stage_${i}.png`);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      this.breakingStageTextures.push(texture);
    }
  }

  /**
   * Creates a material for the given block
   */
  private createMaterialForBlock(block: any): THREE.MeshStandardMaterial {
    const matParams: THREE.MeshStandardMaterialParameters = {
      side: THREE.FrontSide,
      transparent: !block.isSolid || block.isTransparent,
      depthWrite: block.isSolid && !block.isTransparent,
      depthTest: true,
      metalness: 0.0,
      roughness: 0.8,
      flatShading: true
    };

    if (block.texturePath) {
      const tex = new THREE.TextureLoader().load(block.texturePath);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;

      matParams.map = tex;

      if (block.isTransparent) {
        matParams.transparent = true;
        matParams.alphaTest = 0.1;
        matParams.blending = THREE.NormalBlending;
      }

      matParams.color = new THREE.Color(block.tinted ? block.color : 0xffffff);
    } else {
      matParams.color = new THREE.Color(block.color);
    }

    return new THREE.MeshStandardMaterial(matParams);
  }

  private updateBlockMaterialIfNeeded(blockId: number, x: number, y: number, world: World): void {
    const registry = BlockRegistry.getInstance();
    const block = registry.getById(blockId);

    // Skip air blocks
    if (blockId === 0) return;

    // Check if texture path has changed
    const currentTexturePath = this.blockTexturePaths.get(blockId) || '';
    const newTexturePath = block.texturePath || '';

    if (currentTexturePath !== newTexturePath) {
      console.log(`Updating texture for block ${block.name} (ID: ${blockId}): ${currentTexturePath} -> ${newTexturePath}`);

      // Create new material
      const newMaterial = this.createMaterialForBlock(block);

      // Get the mesh
      const mesh = this.meshes.get(blockId);
      if (mesh) {
        // Dispose old material to prevent memory leaks
        const oldMaterial = mesh.material as THREE.MeshStandardMaterial;
        if (oldMaterial.map) {
          oldMaterial.map.dispose();
        }
        oldMaterial.dispose();

        // Update the mesh with new material
        mesh.material = newMaterial;

        // Update our reference maps
        this.blockMaterials.set(blockId, newMaterial);
        this.blockTexturePaths.set(blockId, newTexturePath);
      }
    }

    // Update breaking stage if needed
    const breakingStage = block.getBreakingStage(world, x, y);
    const blockKey = `${x},${y}`;

    if (breakingStage >= 0) {
      let breakingMesh = this.breakingMeshes.get(blockKey);

      if (!breakingMesh) {
        // Create a new breaking mesh if it doesn't exist
        const baseGeom = new THREE.BoxGeometry(1, 1, this.blockDepth);
        breakingMesh = new THREE.InstancedMesh(baseGeom, this.breakingMaterial, 1);
        breakingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        breakingMesh.frustumCulled = false;
        breakingMesh.renderOrder = 100;
        this.scene.add(breakingMesh);
        this.breakingMeshes.set(blockKey, breakingMesh);
      }

      // Update the breaking stage texture
      this.breakingMaterial.map = this.breakingStageTextures[breakingStage];
      this.breakingMaterial.needsUpdate = true;
    } else {
      // Remove breaking mesh if not being broken
      const breakingMesh = this.breakingMeshes.get(blockKey);
      if (breakingMesh) {
        this.scene.remove(breakingMesh);
        breakingMesh.dispose();
        this.breakingMeshes.delete(blockKey);
      }
    }
  }

  private getViewSize(camera: THREE.Camera): { width: number, height: number } {
    if (camera instanceof THREE.OrthographicCamera) {
      return {
        width: camera.right - camera.left,
        height: camera.top - camera.bottom
      };
    } else {
      const perspCamera = camera as THREE.PerspectiveCamera;
      const vFOV = THREE.MathUtils.degToRad(perspCamera.fov);
      const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * perspCamera.aspect);

      // Get camera distance from position.z assuming the camera is looking at z=0
      const cameraDistance = Math.abs(perspCamera.position.z);

      return {
        width: 2 * Math.tan(hFOV / 2) * cameraDistance,
        height: 2 * Math.tan(vFOV / 2) * cameraDistance
      };
    }
  }

  private renderBlock(x: number, y: number, blockId: number, cameraPosition: THREE.Vector2, world: World): void {
    if (blockId === 0) return; // Skip air blocks

    // Check if the block's texture needs updating
    this.updateBlockMaterialIfNeeded(blockId, x, y, world);

    const mesh = this.meshes.get(blockId);
    if (!mesh || mesh.count >= mesh.instanceMatrix.count) return;

    // Z-position calculation for proper layering and parallax effect
    const zPos = -y * this.layerStep - (0.0001 * x);

    this.dummy.position.set(x + 0.5, y + 0.5, zPos);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.updateMatrix();

    // Store the current instance index
    const instanceIdx = mesh.count;

    // Set the matrix for this instance
    mesh.setMatrixAt(instanceIdx, this.dummy.matrix);

    // Check if this specific block in the world is being broken
    const block = world.getBlockAt(x, y);
    const breakingStage = block.getBreakingStage(world, x, y);

    if (breakingStage >= 0) {
      const blockKey = `${x},${y}`;
      const breakingMesh = this.breakingMeshes.get(blockKey);
      if (breakingMesh) {
        // Create a new dummy for the breaking mesh to avoid affecting the block's position
        const breakingDummy = new THREE.Object3D();
        breakingDummy.position.set(x + 0.5, y + 0.5, zPos + 0.1);
        breakingDummy.rotation.set(0, 0, 0);
        breakingDummy.updateMatrix();
        breakingMesh.setMatrixAt(0, breakingDummy.matrix); // Always use index 0 since we only have 1 instance
        breakingMesh.count = 1;
      }
    }

    // Check if this is a light-emitting block
    if (block.lightEmission > 0) {
      const blockKey = `${x},${y}`;

      // Only add to queue if we're not already tracking this light
      if (!this.pointLights.has(blockKey)) {
        // Calculate distance to camera
        const dx = x - cameraPosition.x;
        const dy = y - cameraPosition.y;
        const distanceToCamera = Math.sqrt(dx * dx + dy * dy);

        // Only add lights that are reasonably close to the camera
        if (distanceToCamera < this.LIGHT_DISTANCE_THRESHOLD) {
          // Add to light queue for processing during light update
          this.lightQueue.push({
            x: x + 0.5,
            y: y + 0.5,
            z: zPos + 0.1,
            color: new THREE.Color(block.color).getHex(),
            intensity: block.lightEmission / 15 * 1.2,
            range: block.lightEmission * 2.0
          });
        }
      }
    }

    // Increment the instance count
    mesh.count++;
  }

  /**
   * Process light queue and update lights from the pool
   */
  private updateLights(): void {
    // Sort light queue by closest to camera (if we had camera position available here)
    // For now, just process in order

    // First, reset all unused lights
    for (let i = 0; i < this.lightPool.length; i++) {
      if (!this.lightPool[i].userData.inUse) {
        this.lightPool[i].visible = false;
      }
    }

    // Find available lights in the pool
    const availableLights = this.lightPool.filter(light => !light.userData.inUse);

    // Process as many lights from the queue as we have available in our pool
    const lightsToProcess = Math.min(this.lightQueue.length, availableLights.length);

    for (let i = 0; i < lightsToProcess; i++) {
      const lightData = this.lightQueue.shift(); // Get next light from queue
      const light = availableLights[i];

      if (lightData && light) {
        // Update light properties
        light.position.set(lightData.x, lightData.y, lightData.z);
        light.color.setHex(lightData.color);
        light.intensity = lightData.intensity;
        light.distance = lightData.range;
        light.visible = true;
        light.userData.inUse = true;
        light.userData.key = `${Math.floor(lightData.x)},${Math.floor(lightData.y)}`;

        // Add to tracked lights
        this.pointLights.set(light.userData.key, light);
      }
    }

    // Clear remaining queue if we've reached our limit
    if (this.lightQueue.length > 0 && availableLights.length === 0) {
      console.log(`Dropping ${this.lightQueue.length} lights due to MAX_LIGHTS limit`);
      this.lightQueue.length = 0;
    }
  }

  private cleanupRemovedLightBlocks(world: World, startX: number, endX: number, startY: number, endY: number): void {
    // Only clean up lights periodically, not every frame
    if (this.frameCount % this.LIGHT_UPDATE_INTERVAL !== 0) return;

    this.pointLights.forEach((light, blockKey) => {
      const [x, y] = blockKey.split(',').map(Number);

      // If outside view, mark for removal
      const isOutsideView = x < startX || x > endX || y < startY || y > endY;

      // Check if block still exists and emits light
      let shouldRemove = isOutsideView;

      if (!isOutsideView) {
        const block = world.getBlockAt(x, y);
        shouldRemove = block.lightEmission <= 0;
      }

      if (shouldRemove) {
        // Reset the light rather than removing it
        light.visible = false;
        light.userData.inUse = false;
        this.pointLights.delete(blockKey);
      }
    });
  }

  /**
   * Returns an array of all blocks currently visible in the viewport
   */
  public getVisibleBlocks(): VisibleBlock[] {
    return this.visibleBlocks;
  }

  public render(world: World, cameraPosition: THREE.Vector2, camera: THREE.Camera) {
    // Increment frame counter
    this.frameCount++;

    // Reset all mesh counts
    this.meshes.forEach(mesh => (mesh.count = 0));
    this.breakingMeshes.forEach(mesh => (mesh.count = 0));

    // Clear visible blocks list
    this.visibleBlocks = [];

    // Calculate view dimensions
    const { width: viewWidth, height: viewHeight } = this.getViewSize(camera);

    // Calculate the area to render around the camera (visible area + buffer)
    const startX = Math.floor(cameraPosition.x - viewWidth / 2 - this.renderBuffer);
    const endX = Math.ceil(cameraPosition.x + viewWidth / 2 + this.renderBuffer);
    const startY = Math.floor(cameraPosition.y - viewHeight / 2 - this.renderBuffer);
    const endY = Math.ceil(cameraPosition.y + viewHeight / 2 + this.renderBuffer);

    // Get modified blocks
    const modifiedBlocks = world.getModifiedBlocks();

    // First render modified blocks within view range
    modifiedBlocks.forEach((blockId, key) => {
      const [x, y] = key.split(',').map(Number);

      // Skip blocks outside render area
      if (x < startX || x > endX || y < startY || y > endY) return;

      this.renderBlock(x, y, blockId, cameraPosition, world);

      // Add to visible blocks
      this.visibleBlocks.push({ x, y, blockId });
    });

    // Then render unmodified blocks in the view area
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const blockKey = `${x},${y}`;

        // Skip if block is modified (already rendered)
        if (modifiedBlocks.has(blockKey)) continue;

        const block = world.getBlockAt(x, y);
        this.renderBlock(x, y, block.id, cameraPosition, world);

        // Add to visible blocks
        this.visibleBlocks.push({ x, y, blockId: block.id });
      }
    }

    // Clean up any removed light sources
    this.cleanupRemovedLightBlocks(world, startX, endX, startY, endY);

    // Process light queue and update lights (only every N frames)
    if (this.frameCount % this.LIGHT_UPDATE_INTERVAL === 0) {
      this.updateLights();
    }

    // Update instance matrices for all meshes with instances
    this.meshes.forEach(mesh => {
      if (mesh.count > 0) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    });

    // Update instance matrices for breaking meshes
    this.breakingMeshes.forEach(mesh => {
      if (mesh.count > 0) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    });

    // Update directional light position to follow camera
    this.directionalLight.position.set(
      cameraPosition.x + 5,
      cameraPosition.y + 10,
      7
    );
  }
}

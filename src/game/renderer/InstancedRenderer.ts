import { World } from '../world/World';
import { BlockRegistry } from '../blocks/BlockRegistry';
import * as THREE from 'three';
import { CameraController } from '../controllers/CameraController';

export class InstancedRenderer {
  private scene: THREE.Scene;
  private meshes: Map<number, THREE.InstancedMesh>;
  private dummy = new THREE.Object3D();
  private renderBuffer = 5; // How many blocks beyond viewport to render

  // Lighting elements
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private pointLights: Map<string, THREE.PointLight> = new Map();

  // Depth settings
  private readonly blockDepth = 0.5; // How deep blocks appear in the z-direction
  private readonly layerStep = 0.05; // Small z-offset between blocks for proper rendering order

  constructor(scene: THREE.Scene, maxInstancesPerBlock: number) {
    this.scene = scene;
    this.meshes = new Map<number, THREE.InstancedMesh>();

    // Setup 2.5D lighting with brighter ambient (for surface illumination)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased from 0.6 to 0.8

    // Directional light for sun-like lighting coming in at an angle
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Increased from 0.7 to 0.9
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;

    scene.add(this.ambientLight);
    scene.add(this.directionalLight);

    this.initializeBlockMeshes(maxInstancesPerBlock);
  }

  private initializeBlockMeshes(maxInstancesPerBlock: number): void {
    const registry = BlockRegistry.getInstance();
    const blocks = registry.all();
    const baseGeom = new THREE.BoxGeometry(1, 1, this.blockDepth);

    blocks.forEach(block => {
      // Skip creating meshes for air blocks
      if (block.id === 0) return;

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

      // Create a standard material
      const material = new THREE.MeshStandardMaterial(matParams);

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

  private renderBlock(x: number, y: number, blockId: number): void {
    if (blockId === 0) return; // Skip air blocks

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

    // Check if this is a light-emitting block
    const registry = BlockRegistry.getInstance();
    const block = registry.getById(blockId);

    // Add point light if this block emits light
    if (block.lightEmission > 0) {
      const blockKey = `${x},${y}`;

      // Only create light if it doesn't already exist
      if (!this.pointLights.has(blockKey)) {
        const intensity = block.lightEmission / 15 * 1.2; // Increased from 0.7 to 1.2
        const pointLight = new THREE.PointLight(
          new THREE.Color(block.color).getHex(),
          intensity,
          block.lightEmission * 2.0, // Increased range from 1.5 to 2.0
          1.0 // Reduced decay from 1.2 to 1.0 for wider light spread
        );

        pointLight.position.set(x + 0.5, y + 0.5, zPos + 0.1);
        this.scene.add(pointLight);
        this.pointLights.set(blockKey, pointLight);
      }
    }

    // Increment the instance count
    mesh.count++;
  }

  private cleanupRemovedLightBlocks(world: World, startX: number, endX: number, startY: number, endY: number): void {
    // Clean up any light sources that are no longer present
    this.pointLights.forEach((light, blockKey) => {
      const [x, y] = blockKey.split(',').map(Number);

      // If outside view or not a light block anymore
      if (x < startX || x > endX || y < startY || y > endY) {
        // Outside view, keep light for now
        return;
      }

      // Check if block still exists and emits light
      const block = world.getBlockAt(x, y);
      if (block.lightEmission <= 0) {
        // Remove the light
        this.scene.remove(light);
        light.dispose();
        this.pointLights.delete(blockKey);
      }
    });
  }

  public render(world: World, cameraPosition: THREE.Vector2, camera: THREE.Camera) {
    // Reset all mesh counts
    this.meshes.forEach(mesh => (mesh.count = 0));

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

      this.renderBlock(x, y, blockId);
    });

    // Then render unmodified blocks in the view area
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const blockKey = `${x},${y}`;

        // Skip if block is modified (already rendered)
        if (modifiedBlocks.has(blockKey)) continue;

        const block = world.getBlockAt(x, y);
        this.renderBlock(x, y, block.id);
      }
    }

    // Clean up any removed light sources
    this.cleanupRemovedLightBlocks(world, startX, endX, startY, endY);

    // Update instance matrices for all meshes with instances
    this.meshes.forEach(mesh => {
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

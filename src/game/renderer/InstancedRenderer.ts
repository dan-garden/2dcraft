import { World } from '../world/World';
import { BlockRegistry } from '../blocks/BlockRegistry';
import * as THREE from 'three';

export class InstancedRenderer {
  private scene: THREE.Scene;
  private meshes: Map<number, THREE.InstancedMesh>;
  private dummy = new THREE.Object3D();
  private renderBuffer = 5; // How many blocks beyond viewport to render

  // Lighting elements
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;

  // Depth settings
  private readonly blockDepth = 0.5; // How deep blocks appear in the z-direction
  private readonly layerStep = 0.05; // Small z-offset between blocks for proper rendering order

  constructor(scene: THREE.Scene, maxInstancesPerBlock: number) {
    this.scene = scene;
    this.meshes = new Map<number, THREE.InstancedMesh>();

    // Setup lighting for 2.5D effect
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
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
      const cameraDistance = 30;

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

    mesh.setMatrixAt(mesh.count++, this.dummy.matrix);
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

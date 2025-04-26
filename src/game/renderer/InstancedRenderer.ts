import { World } from '../world/World';
import { BlockRegistry } from '../blocks/BlockRegistry';
import * as THREE from 'three';
import { Chunk } from '../world/Chunk';

export class InstancedRenderer {
  private scene: THREE.Scene;
  private meshes: Map<number, THREE.InstancedMesh>;
  private dummy = new THREE.Object3D();
  private frustum = new THREE.Frustum();
  private projScreenMatrix = new THREE.Matrix4();
  private renderBuffer = 5; // How many blocks beyond viewport to render

  constructor(scene: THREE.Scene, maxInstancesPerBlock: number) {
    this.scene = scene;
    this.meshes = new Map<number, THREE.InstancedMesh>();
    const registry = BlockRegistry.getInstance();
    const blocks = registry.all();
    const baseGeom = new THREE.PlaneGeometry(1, 1);

    blocks.forEach(block => {
      const matParams: THREE.MeshBasicMaterialParameters = {
        side: THREE.DoubleSide,
        transparent: !block.isSolid || block.isTransparent,
        depthWrite: block.isSolid && !block.isTransparent,
        depthTest: true,
        precision: 'highp',
        toneMapped: true // Enable tone mapping for balanced contrast
      };

      if (block.texturePath) {
        const tex = new THREE.TextureLoader().load(block.texturePath);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;

        // Don't premultiply alpha for transparent textures
        tex.premultiplyAlpha = !block.isTransparent;

        // Improve texture contrast with correct colorspace
        tex.colorSpace = THREE.SRGBColorSpace;

        matParams.map = tex;

        if (block.isTransparent) {
          matParams.transparent = true;
          matParams.alphaTest = 0.01;
          matParams.blending = THREE.NormalBlending;
        }

        if (block.tinted) {
          matParams.color = new THREE.Color(block.color);
          matParams.vertexColors = false;

          if (block.isTransparent) {
            matParams.blending = THREE.NormalBlending;
            matParams.alphaTest = 0.01;
          }
        } else {
          // For untinted textures, use exact colors from texture
          matParams.color = new THREE.Color(0xffffff);
          matParams.vertexColors = false;
        }
      } else {
        matParams.color = new THREE.Color(block.color);
        matParams.vertexColors = false;
      }

      const material = new THREE.MeshBasicMaterial(matParams);
      const mesh = new THREE.InstancedMesh(baseGeom, material, maxInstancesPerBlock);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;

      // Set z-position for proper layering
      // Since THREE.js renders in order of z-index (negative values are further away)
      // Ensure blocks are always in front of the background
      if (block.id === 0) { // Air blocks
        // Don't render air blocks - they're handled by parallax background
        mesh.renderOrder = -10; // Lower render order than solid blocks
      } else if (block.isTransparent) {
        // Transparent blocks should render after solid blocks
        mesh.renderOrder = 10;
      } else {
        // Solid blocks
        mesh.renderOrder = 0;
      }

      scene.add(mesh);
      this.meshes.set(block.id, mesh);
    });
  }

  public render(world: World, cameraPosition: THREE.Vector2, camera: THREE.Camera) {
    // Reset all mesh counts
    this.meshes.forEach(mesh => (mesh.count = 0));

    // Update frustum
    this.projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

    // Get view size from camera
    const viewWidth = (camera as THREE.OrthographicCamera).right - (camera as THREE.OrthographicCamera).left;
    const viewHeight = (camera as THREE.OrthographicCamera).top - (camera as THREE.OrthographicCamera).bottom;

    const modifiedBlocks = world.getModifiedBlocks();

    // Calculate the area to render around the camera (visible area + buffer)
    const startX = Math.floor(cameraPosition.x - viewWidth / 2 - this.renderBuffer);
    const endX = Math.ceil(cameraPosition.x + viewWidth / 2 + this.renderBuffer);
    const startY = Math.floor(cameraPosition.y - viewHeight / 2 - this.renderBuffer);
    const endY = Math.ceil(cameraPosition.y + viewHeight / 2 + this.renderBuffer);

    // First render modified blocks
    modifiedBlocks.forEach((blockId, key) => {
      // Skip rendering air blocks - they're handled by the parallax background
      if (blockId === 0) return;

      const [x, y] = key.split(',').map(Number);
      const mesh = this.meshes.get(blockId);
      if (!mesh || mesh.count >= mesh.instanceMatrix.count) return;

      // Only render modified blocks that are within render area
      if (x < startX || x > endX || y < startY || y > endY) {
        return;
      }

      // Position block in screen coordinates - center block at its position
      this.dummy.position.set(x + 0.5, y + 0.5, 0);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(mesh.count++, this.dummy.matrix);
    });

    // Render blocks in the view area
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const blockKey = `${x},${y}`;

        // Skip if block is modified (already rendered)
        if (modifiedBlocks.has(blockKey)) {
          continue;
        }

        const block = world.getBlockAt(x, y);

        // Skip rendering air blocks - they're handled by the parallax background
        if (block.id === 0) continue;

        const mesh = this.meshes.get(block.id);
        if (!mesh || mesh.count >= mesh.instanceMatrix.count) continue;

        // Position block in screen coordinates - center block at its position
        this.dummy.position.set(x + 0.5, y + 0.5, 0);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(mesh.count++, this.dummy.matrix);
      }
    }

    // Update instance matrices
    this.meshes.forEach(mesh => {
      if (mesh.count > 0) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    });
  }
}

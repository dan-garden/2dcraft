import * as THREE from 'three';
import { World } from '../world/World';
import { Block } from '../blocks/Block';

interface LightSource {
  position: THREE.Vector2;
  color: THREE.Color;
  intensity: number;
  radius: number;
  blockId: number;
}

export class LightingSystem {
  private scene: THREE.Scene;
  private lightSources: Map<string, LightSource> = new Map();
  private lightMesh: THREE.Mesh;
  private maxLights: number = 10;
  
  // Shadow map properties
  private shadowMapSize = 64; // Size of the shadow map in blocks
  private shadowMapTexture: THREE.DataTexture;
  private shadowMapData: Uint8Array;
  private shadowMapOrigin: THREE.Vector2 = new THREE.Vector2();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Initialize shadow map data
    this.shadowMapData = new Uint8Array(this.shadowMapSize * this.shadowMapSize * 4);
    this.shadowMapTexture = new THREE.DataTexture(
      this.shadowMapData,
      this.shadowMapSize,
      this.shadowMapSize,
      THREE.RGBAFormat
    );
    this.shadowMapTexture.needsUpdate = true;
    
    // Create a fullscreen quad for the lighting pass
    const lightGeometry = new THREE.PlaneGeometry(2, 2);
    
    // Create shader material for lighting
    const lightMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uLightPositions: { value: new Float32Array(this.maxLights * 2) },
        uLightColors: { value: new Float32Array(this.maxLights * 3) },
        uLightIntensities: { value: new Float32Array(this.maxLights) },
        uLightRadii: { value: new Float32Array(this.maxLights) },
        uLightCount: { value: 0 },
        uCameraPosition: { value: new THREE.Vector2() },
        uCameraZoom: { value: 1.0 },
        uShadowMap: { value: this.shadowMapTexture }, // Set shadow map texture
        uShadowMapSize: { value: new THREE.Vector2(this.shadowMapSize, this.shadowMapSize) }, // Shadow map dimensions
        uShadowMapOrigin: { value: this.shadowMapOrigin } // World position of top-left corner of shadow map
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uLightPositions[${this.maxLights}];
        uniform vec3 uLightColors[${this.maxLights}];
        uniform float uLightIntensities[${this.maxLights}];
        uniform float uLightRadii[${this.maxLights}];
        uniform int uLightCount;
        uniform vec2 uCameraPosition;
        uniform float uCameraZoom;
        uniform sampler2D uShadowMap;
        uniform vec2 uShadowMapSize;
        uniform vec2 uShadowMapOrigin;
        
        varying vec2 vUv;
        
        // Helper function to check if a block at a position is solid/blocking light
        bool isBlockSolid(vec2 position) {
          // Convert world position to shadow map UV
          vec2 shadowMapPos = position - uShadowMapOrigin;
          vec2 shadowMapUV = shadowMapPos / uShadowMapSize;
          
          // Check if outside shadow map
          if (shadowMapUV.x < 0.0 || shadowMapUV.x > 1.0 || shadowMapUV.y < 0.0 || shadowMapUV.y > 1.0) {
            return false;
          }
          
          // Read from shadow map
          vec4 shadowData = texture2D(uShadowMap, shadowMapUV);
          // A non-zero red channel indicates a solid block
          return shadowData.r > 0.5;
        }
        
        // Perform a ray march to check if light is blocked
        float shadowFactor(vec2 from, vec2 to, float maxSteps) {
          vec2 dir = to - from;
          float dist = length(dir);
          dir = normalize(dir);
          
          // Start slightly away from source
          vec2 pos = from + dir * 0.5;
          float distTraveled = 0.5;
          
          // Maximum number of steps (samples) along path
          float steps = min(maxSteps, dist);
          float stepSize = dist / steps;
          
          // Shadow accumulation with a more natural falloff
          float shadow = 1.0;
          
          // March along the ray
          for (float i = 0.0; i < 20.0; i++) {
            if (i >= steps) break;
            
            // Check if current position is inside a solid block
            vec2 checkPos = floor(pos) + vec2(0.5); // Center of the block
            if (isBlockSolid(checkPos)) {
              // Block detected, reduce light intensity
              shadow *= 0.7; // Allows some light to still pass through
            }
            
            // Move to next position
            pos += dir * stepSize;
            distTraveled += stepSize;
            
            // Stop if we've reached the destination
            if (distTraveled >= dist) break;
          }
          
          return shadow;
        }
        
        void main() {
          // Convert screen UV to world position
          vec2 screenPos = vUv * 2.0 - 1.0; // -1 to 1
          screenPos.x *= uResolution.x / uResolution.y; // Aspect ratio correction
          
          // Screen position to world position
          vec2 worldPos = (screenPos / uCameraZoom) + uCameraPosition;
          
          // Initialize with ambient light (darkness)
          vec3 finalColor = vec3(0.15, 0.15, 0.22); // Dark blue-ish ambient
          
          // Process each light
          for (int i = 0; i < ${this.maxLights}; i++) {
            if (i >= uLightCount) break;
            
            vec2 lightPos = uLightPositions[i];
            vec3 lightColor = uLightColors[i];
            float intensity = uLightIntensities[i];
            float radius = uLightRadii[i];
            
            // Calculate distance to light
            float dist = distance(worldPos, lightPos);
            
            // Only process if within radius (with some extra for soft border)
            if (dist < radius * 1.2) {
              // Apply radial falloff with soft edge
              float attenuation = smoothstep(radius, 0.0, dist);
              
              // Apply subtle pulsing effect
              float pulse = 0.05 * sin(uTime * 2.0 + float(i));
              attenuation *= (1.0 + pulse);
              
              // Check for shadows (ray march from light to current position)
              float shadow = shadowFactor(lightPos, worldPos, 10.0);
              
              // Add light contribution with shadow factor
              finalColor += lightColor * intensity * attenuation * shadow;
            }
          }
          
          // Apply dithering to avoid banding
          vec2 dither = worldPos * 0.5;
          float ditherPattern = fract(sin(dither.x * 12.9898 + dither.y * 78.233) * 43758.5453);
          float ditherAmount = 1.0/255.0;
          finalColor += vec3(ditherPattern * ditherAmount);
          
          // Output the final color
          gl_FragColor = vec4(finalColor, 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    
    this.lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
    this.lightMesh.renderOrder = 100; // Render after everything else
    this.lightMesh.frustumCulled = false;
    scene.add(this.lightMesh);
  }
  
  // Update the lighting system with the current world state
  public update(world: World, cameraPosition: THREE.Vector2, camera: THREE.OrthographicCamera) {
    // Reset light sources for this frame
    this.lightSources.clear();
    
    // Get the view area to check for light sources
    const viewWidth = camera.right - camera.left;
    const viewHeight = camera.top - camera.bottom;
    const renderBuffer = 10; // Buffer for light sources outside the view
    
    // Get the area to check for light sources
    const startX = Math.floor(cameraPosition.x - viewWidth/2 - renderBuffer);
    const endX = Math.ceil(cameraPosition.x + viewWidth/2 + renderBuffer);
    const startY = Math.floor(cameraPosition.y - viewHeight/2 - renderBuffer);
    const endY = Math.ceil(cameraPosition.y + viewHeight/2 + renderBuffer);
    
    // Update shadow map origin to be centered around camera position
    this.shadowMapOrigin.set(
      startX,
      startY
    );
    
    // Generate shadow map from world data
    this.generateShadowMap(world, startX, startY, endX - startX + 1, endY - startY + 1);
    
    // Get modified blocks first
    const modifiedBlocks = world.getModifiedBlocks();
    
    // Check modified blocks for light sources
    modifiedBlocks.forEach((blockId, key) => {
      const [x, y] = key.split(',').map(Number);
      
      // Skip if outside view area
      if (x < startX || x > endX || y < startY || y > endY) {
        return;
      }
      
      const block = world.getBlockAt(x, y);
      if (block.isLightSource) {
        this.addLightSource(block, x, y);
      }
    });
    
    // Check blocks in view area for light sources
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const blockKey = `${x},${y}`;
        
        // Skip if block is modified (already checked)
        if (modifiedBlocks.has(blockKey)) {
          continue;
        }
        
        const block = world.getBlockAt(x, y);
        if (block.isLightSource) {
          this.addLightSource(block, x, y);
        }
      }
    }
    
    // Update shader uniforms with light data
    this.updateShaderUniforms(cameraPosition, camera.zoom);
  }
  
  /**
   * Generate a shadow map from the world data
   * This creates a texture where red channel > 0.5 indicates a solid block
   */
  private generateShadowMap(world: World, startX: number, startY: number, width: number, height: number) {
    // Clear shadow map data
    for (let i = 0; i < this.shadowMapData.length; i += 4) {
      this.shadowMapData[i] = 0;     // R: Solid flag
      this.shadowMapData[i + 1] = 0; // G: Unused
      this.shadowMapData[i + 2] = 0; // B: Unused
      this.shadowMapData[i + 3] = 255; // A: Always fully opaque
    }
    
    // Only update the central area of the shadow map
    const mapWidth = Math.min(width, this.shadowMapSize);
    const mapHeight = Math.min(height, this.shadowMapSize);
    
    // Fill shadow map with world data
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const worldX = startX + x;
        const worldY = startY + y;
        
        // Get block at this position
        const block = world.getBlockAt(worldX, worldY);
        
        // Only solid blocks block light (except for light sources)
        const isSolid = block.isSolid && !block.isLightSource;
        
        // Compute index in the shadow map data
        const index = (y * this.shadowMapSize + x) * 4;
        
        // Set red channel based on solidity
        this.shadowMapData[index] = isSolid ? 255 : 0;
      }
    }
    
    // Update texture
    this.shadowMapTexture.needsUpdate = true;
    
    // Update shadow map origin in shader
    const material = this.lightMesh.material as THREE.ShaderMaterial;
    material.uniforms.uShadowMapOrigin.value.copy(this.shadowMapOrigin);
  }
  
  private addLightSource(block: Block, x: number, y: number) {
    const key = `${x},${y}`;
    
    // Don't add if we've reached max lights
    if (this.lightSources.size >= this.maxLights) {
      return;
    }
    
    this.lightSources.set(key, {
      position: new THREE.Vector2(x + 0.5, y + 0.5), // Center of the block
      color: new THREE.Color(block.lightColor),
      intensity: block.lightIntensity,
      radius: block.lightRadius,
      blockId: block.id
    });
  }
  
  private updateShaderUniforms(cameraPosition: THREE.Vector2, cameraZoom: number) {
    const material = this.lightMesh.material as THREE.ShaderMaterial;
    
    // Convert our light sources into arrays for the shader
    const lightPositions = new Float32Array(this.maxLights * 2);
    const lightColors = new Float32Array(this.maxLights * 3);
    const lightIntensities = new Float32Array(this.maxLights);
    const lightRadii = new Float32Array(this.maxLights);
    
    let lightIndex = 0;
    for (const light of this.lightSources.values()) {
      // Position (x, y)
      lightPositions[lightIndex * 2] = light.position.x;
      lightPositions[lightIndex * 2 + 1] = light.position.y;
      
      // Color (r, g, b)
      lightColors[lightIndex * 3] = light.color.r;
      lightColors[lightIndex * 3 + 1] = light.color.g;
      lightColors[lightIndex * 3 + 2] = light.color.b;
      
      // Intensity and radius
      lightIntensities[lightIndex] = light.intensity;
      lightRadii[lightIndex] = light.radius;
      
      lightIndex++;
    }
    
    // Update all uniforms
    material.uniforms.uLightPositions.value = lightPositions;
    material.uniforms.uLightColors.value = lightColors;
    material.uniforms.uLightIntensities.value = lightIntensities;
    material.uniforms.uLightRadii.value = lightRadii;
    material.uniforms.uLightCount.value = this.lightSources.size;
    material.uniforms.uCameraPosition.value = cameraPosition;
    material.uniforms.uCameraZoom.value = cameraZoom;
    material.uniforms.uTime.value = performance.now() / 1000;
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    
    // Shadow map related uniforms
    material.uniforms.uShadowMap.value = this.shadowMapTexture;
    material.uniforms.uShadowMapSize.value.set(this.shadowMapSize, this.shadowMapSize);
    material.uniforms.uShadowMapOrigin.value.copy(this.shadowMapOrigin);
  }
  
  // Handle window resize
  public handleResize() {
    const material = this.lightMesh.material as THREE.ShaderMaterial;
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }
  
  // Get the number of active light sources
  public getLightCount(): number {
    return this.lightSources.size;
  }
} 
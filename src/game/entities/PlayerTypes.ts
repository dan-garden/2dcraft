// Define texture key type for type safety
export type TextureKeys = 'leftStill' | 'rightStill' | 'leftRunning' | 'rightRunning';

// Define player bounds type
export interface PlayerBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Define physics constants
export const PHYSICS_CONSTANTS = {
  GRAVITY: 0.025,
  JUMP_FORCE: 0.35,
  MOVE_SPEED: 0.075,
  MAX_SPEED: 0.25,
  AIR_CONTROL: 0.3,
  GROUND_ACCELERATION: 0.15,
  AIR_ACCELERATION: 0.05,
  COYOTE_TIME: 150,
  JUMP_BUFFER_TIME: 200,
  DEFAULT_FRICTION: 0.85,
  VELOCITY_EPSILON: 0.001,
  MAX_FALL_SPEED: 0.5
}; 
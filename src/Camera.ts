import { Application } from 'pixi.js';

export class Camera {
  x = 0;
  y = 0;
  targetX = 0;
  targetY = 0;

  constructor(private app: Application) { }

  // Smoothly follow a target
  follow(targetX: number, targetY: number) {
    this.targetX = targetX - this.app.screen.width / 2;
    this.targetY = targetY - this.app.screen.height / 2;

    // Smooth camera movement with lerp (linear interpolation)
    this.x += (this.targetX - this.x) * 0.1;
    this.y += (this.targetY - this.y) * 0.1;

    // Clamp camera to not go above world
    this.y = Math.max(0, this.y);
  }
} 
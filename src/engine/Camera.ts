// ------------------------------------------------------------
// Camera module – implements a 3D perspective camera with smooth interpolation,
// screen-space projection, and cursor-anchored zoom.
/**
 * @file Camera.ts – implements a 3D perspective camera with smooth interpolation and projection utilities.
 */
// ------------------------------------------------------------

export interface ProjectedPoint {
  screenX: number;
  screenY: number;
  scale: number;
  depth: number;
}

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public z: number = -1200;

  public targetX: number = 0;
  public targetY: number = 0;
  public targetZ: number = -1200;

  public focalLength: number = 850;

  public minZ: number = -32000;
  public maxZ: number = 800;

  public width: number = window.innerWidth;
  public height: number = window.innerHeight;

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public get zoom(): number {
    const depth = -this.z + this.focalLength;
    return this.focalLength / Math.max(100, depth);
  }

  public getZoomPercent(): number {
    return Math.round(this.zoom * 100);
  }

  public getTargetZoomPercent(): number {
    const depth = -this.targetZ + this.focalLength;
    return Math.round((this.focalLength / Math.max(100, depth)) * 100);
  }

  /**
   * Sets target zoom to an exact percentage (e.g. 5% to 350%)
   */
  public setZoomPercent(percent: number): void {
    const targetScale = Math.max(0.05, Math.min(3.5, percent / 100));
    const newTargetZ = this.focalLength - (this.focalLength / targetScale);
    this.targetZ = Math.min(this.maxZ, Math.max(this.minZ, newTargetZ));
  }

  /**
   * Step zoom percentage by an increment (e.g. +15% or -15%)
   */
  public stepZoom(percentDelta: number): void {
    const current = this.getTargetZoomPercent();
    this.setZoomPercent(current + percentDelta);
  }

  public update(dt: number): void {
    // Smooth exponential lerp
    const lerpSpeed = Math.min(1, dt * 9.0);
    this.x += (this.targetX - this.x) * lerpSpeed;
    this.y += (this.targetY - this.y) * lerpSpeed;
    this.z += (this.targetZ - this.z) * lerpSpeed;
  }

  /**
   * Projects a 3D world coordinate into 2D screen space with perspective depth scaling
   */
  public project3D(worldX: number, worldY: number, worldZ: number): ProjectedPoint {
    const cx = this.width / 2;
    const cy = this.height / 2;

    const dx = worldX - this.x;
    const dy = worldY - this.y;
    // Depth from camera lens
    const dz = (worldZ - this.z) + this.focalLength;

    // Guard against points behind camera
    const safeDz = Math.max(60, dz);
    const scale = this.focalLength / safeDz;

    const screenX = cx + dx * scale;
    const screenY = cy + dy * scale;

    return {
      screenX,
      screenY,
      scale,
      depth: safeDz
    };
  }

  /**
   * Inverse perspective projection: Unproject 2D screen point back into 3D world at a specified Z-plane
   */
  public screenToWorld(screenX: number, screenY: number, targetZ: number = 0): { x: number; y: number; z: number } {
    const cx = this.width / 2;
    const cy = this.height / 2;

    const dz = (targetZ - this.z) + this.focalLength;
    const safeDz = Math.max(60, dz);
    const scale = this.focalLength / safeDz;

    const worldX = (screenX - cx) / scale + this.x;
    const worldY = (screenY - cy) / scale + this.y;

    return { x: worldX, y: worldY, z: targetZ };
  }

  /**
   * Smoothly pans the camera in the 3D plane
   */
  public panBy(deltaScreenX: number, deltaScreenY: number): void {
    const currentScale = this.focalLength / Math.max(100, -this.z + this.focalLength);
    const worldDeltaX = deltaScreenX / currentScale;
    const worldDeltaY = deltaScreenY / currentScale;

    this.targetX -= worldDeltaX;
    this.targetY -= worldDeltaY;
    this.x -= worldDeltaX;
    this.y -= worldDeltaY;
  }

  /**
   * Continuous, normalized mouse wheel / trackpad scroll zoom.
   * Handles both high-precision trackpads and notched mouse wheels with fine, gentle control.
   */
  public zoomByWheel(deltaY: number, deltaMode: number = 0, screenX?: number, screenY?: number): void {
    // Normalize lines or pages to pixels
    let pixels = deltaY;
    if (deltaMode === 1) pixels *= 28;
    else if (deltaMode === 2) pixels *= 300;

    // Clamp single-event delta to avoid huge sudden jumps on momentum flicks
    const clampedDelta = Math.max(-100, Math.min(100, pixels));

    // Gentle exponential sensitivity:
    // 2px trackpad glide = ~0.15% change (silky smooth, fine control)
    // 100px mouse wheel click = ~7.5% change (controlled, not jarring)
    const sensitivity = 0.00085;
    const factor = Math.exp(-clampedDelta * sensitivity);

    // Current distance from camera plane to focal plane
    const currentDist = -this.targetZ + this.focalLength;
    const newDist = currentDist / factor;

    // Convert new distance back to targetZ
    const newTargetZ = Math.min(this.maxZ, Math.max(this.minZ, this.focalLength - newDist));

    // True 3D Cursor-Anchored Zoom:
    // Move camera in (X, Y) along the line-of-sight ray passing through the cursor
    // so the 3D point under the cursor remains stationary on screen during zoom
    if (screenX !== undefined && screenY !== undefined) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const deltaZ = newTargetZ - this.targetZ;

      this.targetX += (screenX - cx) * (deltaZ / this.focalLength);
      this.targetY += (screenY - cy) * (deltaZ / this.focalLength);
    }

    this.targetZ = newTargetZ;
  }

  public zoomBy(delta: number, screenX?: number, screenY?: number): void {
    this.zoomByWheel(delta, 0, screenX, screenY);
  }

  /**
   * Centers and flies the camera to hover directly in front of a particle or galaxy
   */
  public focusOn(worldX: number, worldY: number, worldZ: number = 0, distance: number = 420): void {
    this.targetX = worldX;
    this.targetY = worldY;
    this.targetZ = worldZ - distance;
  }

  /**
   * Resets camera to wide cosmic overview
   */
  public reset(centerX: number = 0, centerY: number = 0, centerZ: number = 0, overviewDistance: number = 1800): void {
    this.targetX = centerX;
    this.targetY = centerY;
    this.targetZ = centerZ - overviewDistance;
  }
}

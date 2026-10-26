export class Camera {
  public x: number = 0;
  public y: number = 0;
  public zoom: number = 1;

  public targetX: number = 0;
  public targetY: number = 0;
  public targetZoom: number = 1;

  public minZoom: number = 0.2;
  public maxZoom: number = 4.0;

  private width: number = window.innerWidth;
  private height: number = window.innerHeight;

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public update(dt: number): void {
    // Smooth lerp camera movement
    const lerpSpeed = Math.min(1, dt * 10);
    this.x += (this.targetX - this.x) * lerpSpeed;
    this.y += (this.targetY - this.y) * lerpSpeed;
    this.zoom += (this.targetZoom - this.zoom) * lerpSpeed;
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const cx = this.width / 2;
    const cy = this.height / 2;

    const worldX = (screenX - cx - this.x) / this.zoom + cx;
    const worldY = (screenY - cy - this.y) / this.zoom + cy;

    return { x: worldX, y: worldY };
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const cx = this.width / 2;
    const cy = this.height / 2;

    const screenX = (worldX - cx) * this.zoom + cx + this.x;
    const screenY = (worldY - cy) * this.zoom + cy + this.y;

    return { x: screenX, y: screenY };
  }

  public zoomAt(screenX: number, screenY: number, factor: number): void {
    const oldZoom = this.targetZoom;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, oldZoom * factor));

    if (Math.abs(newZoom - oldZoom) < 0.001) return;

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Zoom centered on cursor
    const mouseWorldX = (screenX - cx - this.targetX) / oldZoom + cx;
    const mouseWorldY = (screenY - cy - this.targetY) / oldZoom + cy;

    this.targetZoom = newZoom;
    this.targetX = screenX - cx - (mouseWorldX - cx) * newZoom;
    this.targetY = screenY - cy - (mouseWorldY - cy) * newZoom;
  }

  public panBy(deltaScreenX: number, deltaScreenY: number): void {
    this.targetX += deltaScreenX;
    this.targetY += deltaScreenY;
    this.x += deltaScreenX;
    this.y += deltaScreenY;
  }

  public focusOn(worldX: number, worldY: number, zoomLevel: number = 1.2): void {
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.targetZoom = zoomLevel;
    this.targetX = cx - worldX * zoomLevel;
    this.targetY = cy - worldY * zoomLevel;
  }

  public reset(centerX?: number, centerY?: number): void {
    this.targetZoom = 1;
    this.targetX = centerX !== undefined ? (this.width / 2 - centerX) : 0;
    this.targetY = centerY !== undefined ? (this.height / 2 - centerY) : 0;
  }
}

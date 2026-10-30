// ------------------------------------------------------------
// Camera module – implements a 3D perspective camera with smooth interpolation,
// screen-space projection, cursor-anchored zoom, and full 3D orientation (Spaceship Effect).
/**
 * @file Camera.ts – implements a 3D perspective camera with smooth interpolation, projection utilities,
 * and cinematic spaceship approach and rotation to face sideways particle systems.
 */
// ------------------------------------------------------------

export interface ProjectedPoint {
  screenX: number;
  screenY: number;
  scale: number;
  depth: number;
}

export interface Basis3D {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

function normalizeVector(v: Basis3D): Basis3D {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function crossProduct(a: Basis3D, b: Basis3D): Basis3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function dotProduct(a: Basis3D, b: Basis3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function slerpVector(v1: Basis3D, v2: Basis3D, t: number): Basis3D {
  let dot = dotProduct(v1, v2);
  dot = Math.max(-1, Math.min(1, dot));

  if (dot > 0.9995) {
    const x = v1.x + t * (v2.x - v1.x);
    const y = v1.y + t * (v2.y - v1.y);
    const z = v1.z + t * (v2.z - v1.z);
    return normalizeVector({ x, y, z });
  }

  const theta0 = Math.acos(dot);
  const theta = theta0 * t;
  const sinTheta = Math.sin(theta);
  const sinTheta0 = Math.sin(theta0);

  const s1 = Math.cos(theta) - (dot * sinTheta) / sinTheta0;
  const s2 = sinTheta / sinTheta0;

  return {
    x: s1 * v1.x + s2 * v2.x,
    y: s1 * v1.y + s2 * v2.y,
    z: s1 * v1.z + s2 * v2.z
  };
}

function matrixToQuaternion(
  r: Basis3D, // Right (col 0)
  d: Basis3D, // Down  (col 1)
  f: Basis3D  // Fwd   (col 2)
): Quaternion {
  const m00 = r.x, m01 = d.x, m02 = f.x;
  const m10 = r.y, m11 = d.y, m12 = f.y;
  const m20 = r.z, m21 = d.z, m22 = f.z;

  const trace = m00 + m11 + m22;
  let w: number, x: number, y: number, z: number;

  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1.0);
    w = 0.25 / s;
    x = (m21 - m12) * s;
    y = (m02 - m20) * s;
    z = (m10 - m01) * s;
  } else if (m00 > m11 && m00 > m22) {
    const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
    w = (m21 - m12) / s;
    x = 0.25 * s;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = 0.25 * s;
    z = (m12 + m21) / s;
  } else {
    const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = 0.25 * s;
  }

  const len = Math.hypot(w, x, y, z) || 1;
  return { w: w / len, x: x / len, y: y / len, z: z / len };
}

function slerpQuaternion(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
  let dot = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;
  let w2 = q2.w;
  let x2 = q2.x;
  let y2 = q2.y;
  let z2 = q2.z;

  if (dot < 0) {
    dot = -dot;
    w2 = -w2;
    x2 = -x2;
    y2 = -y2;
    z2 = -z2;
  }

  if (dot > 0.9995) {
    const w = q1.w + t * (w2 - q1.w);
    const x = q1.x + t * (x2 - q1.x);
    const y = q1.y + t * (y2 - q1.y);
    const z = q1.z + t * (z2 - q1.z);
    const len = Math.hypot(w, x, y, z) || 1;
    return { w: w / len, x: x / len, y: y / len, z: z / len };
  }

  const theta0 = Math.acos(Math.min(1, Math.max(-1, dot)));
  const theta = theta0 * t;
  const sinTheta = Math.sin(theta);
  const sinTheta0 = Math.sin(theta0);

  const s1 = Math.cos(theta) - (dot * sinTheta) / sinTheta0;
  const s2 = sinTheta / sinTheta0;

  return {
    w: s1 * q1.w + s2 * w2,
    x: s1 * q1.x + s2 * x2,
    y: s1 * q1.y + s2 * y2,
    z: s1 * q1.z + s2 * z2
  };
}

function quaternionToBasis(q: Quaternion): { right: Basis3D; down: Basis3D; forward: Basis3D } {
  const { w, x, y, z } = q;
  const xx = x * x, yy = y * y, zz = z * z;
  const xy = x * y, xz = x * z, yz = y * z;
  const wx = w * x, wy = w * y, wz = w * z;

  return {
    right: {
      x: 1 - 2 * (yy + zz),
      y: 2 * (xy + wz),
      z: 2 * (xz - wy)
    },
    down: {
      x: 2 * (xy - wz),
      y: 1 - 2 * (xx + zz),
      z: 2 * (yz + wx)
    },
    forward: {
      x: 2 * (xz + wy),
      y: 2 * (yz - wx),
      z: 1 - 2 * (xx + yy)
    }
  };
}

export class Camera {
  public focalLength: number = 850;

  public minZ: number = -95000;
  public maxZ: number = 800;

  // Launch at 7% zoom: depth = focalLength / 0.07 ≈ 12142.86 -> z = focalLength - depth ≈ -11292.86
  public x: number = 0;
  public y: number = 0;
  public z: number = 850 - 850 / 0.07;

  public targetX: number = 0;
  public targetY: number = 0;
  public targetZ: number = 850 - 850 / 0.07;

  public width: number = window.innerWidth;
  public height: number = window.innerHeight;

  // 3D Camera Orientation & Orthonormal Basis
  public rotation: Quaternion = { w: 1, x: 0, y: 0, z: 0 };
  public targetRotation: Quaternion = { w: 1, x: 0, y: 0, z: 0 };

  public right: Basis3D = { x: 1, y: 0, z: 0 };
  public down: Basis3D = { x: 0, y: 1, z: 0 };
  public forward: Basis3D = { x: 0, y: 0, z: 1 };

  // Cosmic Overview Reference Orientation
  public static readonly OVERVIEW_ROTATION: Quaternion = { w: 1, x: 0, y: 0, z: 0 };

  // Current focal anchor point in 3D world space
  public focusPoint: Basis3D = { x: 0, y: 0, z: 0 };
  private activeClusterRot?: Quaternion;

  // Spaceship Approach & Rotation Flight Controller
  private flightActive: boolean = false;
  private flightProgress: number = 0;
  private flightDuration: number = 1.6;
  private flightStartDist: number = 1000;
  private flightStartDir: Basis3D = { x: 0, y: 0, z: -1 };
  private flightStartRot: Quaternion = { w: 1, x: 0, y: 0, z: 0 };

  private flightTargetDist: number = 420;
  private flightTargetDir: Basis3D = { x: 0, y: 0, z: -1 };
  private flightTargetRot: Quaternion = { w: 1, x: 0, y: 0, z: 0 };
  private flightTrackingTarget?: { x: number; y: number; z: number };

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Distance from camera position to current focal anchor along camera forward ray
   */
  public get distanceToFocus(): number {
    const dx = this.focusPoint.x - this.x;
    const dy = this.focusPoint.y - this.y;
    const dz = this.focusPoint.z - this.z;
    return dx * this.forward.x + dy * this.forward.y + dz * this.forward.z;
  }

  public get zoom(): number {
    const dist = Math.max(0, this.distanceToFocus);
    const depth = dist + this.focalLength;
    return this.focalLength / Math.max(100, depth);
  }

  public getZoomPercent(): number {
    return Math.round(this.zoom * 100);
  }

  public getTargetZoomPercent(): number {
    const dx = this.focusPoint.x - this.targetX;
    const dy = this.focusPoint.y - this.targetY;
    const dz = this.focusPoint.z - this.targetZ;
    const targetDist = Math.max(0, dx * this.forward.x + dy * this.forward.y + dz * this.forward.z);
    const depth = targetDist + this.focalLength;
    return Math.round((this.focalLength / Math.max(100, depth)) * 100);
  }

  public getState() {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      targetX: this.targetX,
      targetY: this.targetY,
      targetZ: this.targetZ,
      focalLength: this.focalLength,
      rotation: { ...this.rotation }
    };
  }

  public get yaw(): number {
    return Math.atan2(this.forward.x, this.forward.z);
  }

  public get pitch(): number {
    return Math.asin(-Math.max(-1, Math.min(1, this.forward.y)));
  }

  /**
   * Sets target zoom to an exact percentage (e.g. 2% to 350%)
   */
  public setZoomPercent(percent: number): void {
    this.flightActive = false;
    const targetScale = Math.max(0.015, Math.min(3.5, percent / 100));
    const targetDepth = this.focalLength / targetScale;
    const targetDist = Math.max(50, targetDepth - this.focalLength);

    this.targetX = this.focusPoint.x - targetDist * this.forward.x;
    this.targetY = this.focusPoint.y - targetDist * this.forward.y;
    this.targetZ = this.focusPoint.z - targetDist * this.forward.z;
  }

  /**
   * Step zoom percentage by an increment (e.g. +15% or -15%)
   */
  public stepZoom(percentDelta: number): void {
    const current = this.getTargetZoomPercent();
    this.setZoomPercent(current + percentDelta);
  }

  private updateBasis(): void {
    const basis = quaternionToBasis(this.rotation);
    this.right = basis.right;
    this.down = basis.down;
    this.forward = basis.forward;
  }

  public update(dt: number): void {
    if (this.flightActive) {
      this.flightProgress += dt / this.flightDuration;
      const t = Math.min(1.0, this.flightProgress);
      const s = easeInOutCubic(t);

      // Spaceship Effect:
      // The camera approaches the system first while still viewing it sideways.
      // Once it closes in (past ~38% of the approach), the camera rotates to face
      // the particle system directly from the front!
      const closeInThreshold = 0.38;
      let r = 0;
      if (t >= closeInThreshold) {
        const tRot = (t - closeInThreshold) / (1.0 - closeInThreshold);
        r = easeInOutCubic(tRot);
      }

      this.rotation = slerpQuaternion(this.flightStartRot, this.flightTargetRot, r);
      this.updateBasis();

      const uDir = slerpVector(this.flightStartDir, this.flightTargetDir, r);
      const currentDist = this.flightStartDist + s * (this.flightTargetDist - this.flightStartDist);

      // Track drifting root node coordinates if active
      if (this.flightTrackingTarget) {
        this.focusPoint.x = this.flightTrackingTarget.x;
        this.focusPoint.y = this.flightTrackingTarget.y;
        this.focusPoint.z = this.flightTrackingTarget.z;
      }

      this.x = this.focusPoint.x + currentDist * uDir.x;
      this.y = this.focusPoint.y + currentDist * uDir.y;
      this.z = this.focusPoint.z + currentDist * uDir.z;

      this.targetX = this.x;
      this.targetY = this.y;
      this.targetZ = this.z;

      if (t >= 1.0) {
        this.flightActive = false;
        this.rotation = { ...this.flightTargetRot };
        this.targetRotation = { ...this.flightTargetRot };
        this.updateBasis();
      }
    } else {
      // Frame-rate independent exponential decay
      const lerpFactor = 1 - Math.exp(-9.0 * dt);
      this.x += (this.targetX - this.x) * lerpFactor;
      this.y += (this.targetY - this.y) * lerpFactor;
      this.z += (this.targetZ - this.z) * lerpFactor;
      this.rotation = slerpQuaternion(this.rotation, this.targetRotation, lerpFactor);
      this.updateBasis();
    }
  }

  /**
   * Projects a 3D world coordinate into 2D screen space with full 3D camera orientation
   */
  public project3D(worldX: number, worldY: number, worldZ: number): ProjectedPoint {
    const cx = this.width / 2;
    const cy = this.height / 2;

    const vx = worldX - this.x;
    const vy = worldY - this.y;
    const vz = worldZ - this.z;

    // Transform into camera view coordinate space
    const camX = vx * this.right.x + vy * this.right.y + vz * this.right.z;
    const camY = vx * this.down.x + vy * this.down.y + vz * this.down.z;
    const camZ = vx * this.forward.x + vy * this.forward.y + vz * this.forward.z;

    // Depth from camera lens
    const dz = camZ + this.focalLength;
    const safeDz = Math.max(60, dz);
    const scale = this.focalLength / safeDz;

    const screenX = cx + camX * scale;
    const screenY = cy + camY * scale;

    return {
      screenX,
      screenY,
      scale,
      depth: safeDz
    };
  }

  /**
   * Inverse perspective projection: Unproject 2D screen point back into 3D world with camera orientation
   */
  public screenToWorld(
    screenX: number,
    screenY: number,
    targetZOrDepth: number = 0,
    referencePoint?: Basis3D
  ): { x: number; y: number; z: number } {
    const cx = this.width / 2;
    const cy = this.height / 2;

    let camZ: number;
    if (referencePoint) {
      const dx = referencePoint.x - this.x;
      const dy = referencePoint.y - this.y;
      const dz = referencePoint.z - this.z;
      camZ = dx * this.forward.x + dy * this.forward.y + dz * this.forward.z;
    } else if (Math.abs(this.forward.z) > 0.4) {
      camZ = (targetZOrDepth - this.z) / this.forward.z;
    } else {
      camZ = Math.max(100, this.distanceToFocus);
    }

    const depth = Math.max(60, camZ + this.focalLength);
    const scale = this.focalLength / depth;

    const camX = (screenX - cx) / scale;
    const camY = (screenY - cy) / scale;

    const worldX = this.x + camX * this.right.x + camY * this.down.x + camZ * this.forward.x;
    const worldY = this.y + camX * this.right.y + camY * this.down.y + camZ * this.forward.y;
    const worldZ = this.z + camX * this.right.z + camY * this.down.z + camZ * this.forward.z;

    return { x: worldX, y: worldY, z: worldZ };
  }

  /**
   * Smoothly pans the camera parallel to the current viewing plane
   */
  public panBy(deltaScreenX: number, deltaScreenY: number): void {
    this.flightActive = false;

    const currentScale = this.focalLength / Math.max(100, this.distanceToFocus + this.focalLength);
    const worldDeltaX = deltaScreenX / currentScale;
    const worldDeltaY = deltaScreenY / currentScale;

    const dx = worldDeltaX * this.right.x + worldDeltaY * this.down.x;
    const dy = worldDeltaX * this.right.y + worldDeltaY * this.down.y;
    const dz = worldDeltaX * this.right.z + worldDeltaY * this.down.z;

    this.targetX -= dx;
    this.targetY -= dy;
    this.targetZ -= dz;
    this.x -= dx;
    this.y -= dy;
    this.z -= dz;

    this.focusPoint.x -= dx;
    this.focusPoint.y -= dy;
    this.focusPoint.z -= dz;
  }

  /**
   * Continuous, normalized mouse wheel / trackpad scroll zoom with 3D orientation support.
   */
  public zoomByWheel(deltaY: number, deltaMode: number = 0, screenX?: number, screenY?: number): void {
    this.flightActive = false;

    let pixels = deltaY;
    if (deltaMode === 1) pixels *= 28;
    else if (deltaMode === 2) pixels *= 300;

    const clampedDelta = Math.max(-100, Math.min(100, pixels));
    const sensitivity = 0.00085;
    const factor = Math.exp(-clampedDelta * sensitivity);

    const currentDist = Math.max(50, this.distanceToFocus);
    const newDist = Math.max(50, Math.min(95000, currentDist / factor));
    const deltaDist = currentDist - newDist; // Positive when moving forward/closer

    // True 3D Cursor-Anchored Zoom in camera view coordinates
    if (screenX !== undefined && screenY !== undefined) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const offX = (screenX - cx) * (-deltaDist / this.focalLength);
      const offY = (screenY - cy) * (-deltaDist / this.focalLength);

      this.targetX += offX * this.right.x + offY * this.down.x;
      this.targetY += offX * this.right.y + offY * this.down.y;
      this.targetZ += offX * this.right.z + offY * this.down.z;
    }

    this.targetX += deltaDist * this.forward.x;
    this.targetY += deltaDist * this.forward.y;
    this.targetZ += deltaDist * this.forward.z;

    // Deep space orientation leveling: smoothly level back to cosmic overview when pulling far back
    if (newDist > 3200) {
      const overviewWeight = Math.min(1.0, (newDist - 3200) / 4500);
      this.targetRotation = slerpQuaternion(
        this.activeClusterRot || Camera.OVERVIEW_ROTATION,
        Camera.OVERVIEW_ROTATION,
        overviewWeight
      );
    } else if (this.activeClusterRot) {
      this.targetRotation = this.activeClusterRot;
    }
  }

  public zoomBy(delta: number, screenX?: number, screenY?: number): void {
    this.zoomByWheel(delta, 0, screenX, screenY);
  }

  /**
   * Centers and flies the camera towards a particle or galaxy with the Spaceship Effect:
   * Approaching the sideways system first, and once closing in, rotating smoothly to face
   * the particle system directly from the front.
   */
  public focusOn(
    worldX: number,
    worldY: number,
    worldZ: number = 0,
    distance: number = 420,
    basisU?: Basis3D,
    basisV?: Basis3D,
    trackingTarget?: { x: number; y: number; z: number }
  ): void {
    this.focusPoint = { x: worldX, y: worldY, z: worldZ };
    this.flightTrackingTarget = trackingTarget;

    // Calculate face-on orthonormal orientation for the target system
    let u: Basis3D;
    let v: Basis3D;
    let n: Basis3D;
    let targetRot: Quaternion;

    if (basisU && basisV) {
      u = normalizeVector(basisU);
      let normal = crossProduct(u, basisV);
      const lenN = Math.hypot(normal.x, normal.y, normal.z);
      normal = lenN > 0.001 ? { x: normal.x / lenN, y: normal.y / lenN, z: normal.z / lenN } : { x: 0, y: 0, z: 1 };

      // Ensure normal faces generally forward/towards observer (Nz > 0)
      if (normal.z < 0) {
        normal = { x: -normal.x, y: -normal.y, z: -normal.z };
        u = { x: -u.x, y: -u.y, z: -u.z };
      }
      n = normal;
      v = normalizeVector(crossProduct(n, u));
      targetRot = matrixToQuaternion(u, v, n);
    } else {
      u = { x: 1, y: 0, z: 0 };
      v = { x: 0, y: 1, z: 0 };
      n = { x: 0, y: 0, z: 1 };
      targetRot = Camera.OVERVIEW_ROTATION;
    }

    this.activeClusterRot = targetRot;
    this.flightTargetRot = targetRot;
    this.targetRotation = targetRot;

    // Target viewing position: hovering directly in front along system normal
    this.flightTargetDist = distance;
    this.flightTargetDir = { x: -n.x, y: -n.y, z: -n.z }; // vector from target to camera

    // Initial approach vector from current camera position to target
    const toStartX = this.x - worldX;
    const toStartY = this.y - worldY;
    const toStartZ = this.z - worldZ;
    const startDist = Math.hypot(toStartX, toStartY, toStartZ) || distance;
    this.flightStartDist = Math.max(distance, startDist);
    this.flightStartDir = { x: toStartX / startDist, y: toStartY / startDist, z: toStartZ / startDist };
    this.flightStartRot = { ...this.rotation };

    // Set flight target position
    this.targetX = worldX - distance * n.x;
    this.targetY = worldY - distance * n.y;
    this.targetZ = worldZ - distance * n.z;

    // Adaptive flight duration based on travel distance
    const travelDist = Math.hypot(this.x - this.targetX, this.y - this.targetY, this.z - this.targetZ);
    this.flightDuration = Math.min(2.0, Math.max(0.9, 0.75 + travelDist * 0.0001));
    this.flightProgress = 0;
    this.flightActive = true;
  }

  /**
   * Resets camera to wide cosmic overview (default 7% zoom), smoothly leveling back to the galactic plane.
   */
  public reset(centerX: number = 0, centerY: number = 0, centerZ: number = 0, overviewDistance?: number): void {
    const defaultDist = this.focalLength / 0.07 - this.focalLength;
    const dist = overviewDistance !== undefined ? overviewDistance : defaultDist;

    this.focusPoint = { x: centerX, y: centerY, z: centerZ };
    this.flightTrackingTarget = undefined;
    this.activeClusterRot = undefined;

    this.flightTargetRot = Camera.OVERVIEW_ROTATION;
    this.targetRotation = Camera.OVERVIEW_ROTATION;

    this.flightTargetDist = dist;
    this.flightTargetDir = { x: 0, y: 0, z: -1 }; // along -Z from center to camera

    const toStartX = this.x - centerX;
    const toStartY = this.y - centerY;
    const toStartZ = this.z - centerZ;
    const startDist = Math.hypot(toStartX, toStartY, toStartZ) || dist;
    this.flightStartDist = startDist;
    this.flightStartDir = { x: toStartX / startDist, y: toStartY / startDist, z: toStartZ / startDist };
    this.flightStartRot = { ...this.rotation };

    this.targetX = centerX;
    this.targetY = centerY;
    this.targetZ = centerZ - dist;

    const travelDist = Math.hypot(this.x - this.targetX, this.y - this.targetY, this.z - this.targetZ);
    this.flightDuration = Math.min(2.1, Math.max(1.0, 0.85 + travelDist * 0.00008));
    this.flightProgress = 0;
    this.flightActive = true;
  }
}

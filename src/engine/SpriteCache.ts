import type { ParticleNode } from '../types';

export class SpriteCache {
  private cache = new Map<number, HTMLCanvasElement>();
  private dpr: number;

  constructor() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  public getSprite(node: ParticleNode): HTMLCanvasElement {
    let sprite = this.cache.get(node.empID);
    if (!sprite) {
      sprite = this.renderSprite(node);
      this.cache.set(node.empID, sprite);
    }
    return sprite;
  }

  public invalidate(empID?: number): void {
    if (empID !== undefined) {
      this.cache.delete(empID);
    } else {
      this.cache.clear();
    }
  }

  private renderSprite(node: ParticleNode): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const radius = node.coreRadius;
    const padding = 12; // breathing room for subtle glow / outer anti-aliasing
    const maxRadius = radius + 21; // core + location(7) + skill(7) + level(7)
    const size = Math.ceil((maxRadius + padding) * 2 * this.dpr);

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    const cx = (maxRadius + padding);
    const cy = (maxRadius + padding);

    // 1. Soft ambient outer glow for supervisors
    if (node.isSupervisor) {
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, maxRadius + 6);
      glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius + 6, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();
    }

    // 2. Core circle base (crisp modern slate fill + gradient)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    const coreGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(1, '#dbeafe');
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // 3. Avatar clipping and drawing
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.clip();

    if (node.avatarLoaded && node.avatarImg && node.avatarImg.complete && node.avatarImg.naturalWidth > 0) {
      const dSize = (radius - 2) * 2;
      ctx.drawImage(node.avatarImg, cx - dSize / 2, cy - dSize / 2, dSize, dSize);
    } else {
      // High-aesthetic sleek monogram fallback
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      const initials = node.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();

      ctx.fillStyle = '#93c5fd';
      ctx.font = `600 ${Math.max(12, Math.floor(radius * 0.55))}px Outfit, Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials || '?', cx, cy + 1);
    }
    ctx.restore();

    // Subtle inner border for core
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.stroke();

    // 4. Location ring (radius to radius + 7)
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2, false);
    ctx.arc(cx, cy, radius, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = node.locationColor || '#38bdf8';
    ctx.fill();

    // Thin separator
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.stroke();

    // 5. Skill & Level donut segments
    const skillCount = node.skills.length;
    if (skillCount > 0) {
      const sliceAngle = (Math.PI * 2) / skillCount;

      for (let i = 0; i < skillCount; i++) {
        const item = node.skills[i];
        const startRad = i * sliceAngle - Math.PI / 2;
        const endRad = (i + 1) * sliceAngle - Math.PI / 2;

        // Skill Ring (radius + 7 to radius + 14)
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 14, startRad, endRad, false);
        ctx.arc(cx, cy, radius + 7, endRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();

        // Level Ring (radius + 14 to radius + 21)
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 21, startRad, endRad, false);
        ctx.arc(cx, cy, radius + 14, endRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = item.levelColor;
        ctx.fill();

        // Radial dividing seams between slices
        if (skillCount > 1) {
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(startRad) * (radius + 7), cy + Math.sin(startRad) * (radius + 7));
          ctx.lineTo(cx + Math.cos(startRad) * (radius + 21), cy + Math.sin(startRad) * (radius + 21));
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
          ctx.stroke();
        }
      }
    } else {
      // If employee has no listed skills, render subtle translucent outer boundary
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 14, 0, Math.PI * 2, false);
      ctx.arc(cx, cy, radius + 7, Math.PI * 2, 0, true);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
    }

    // Outer boundary ring stroke
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 21, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();

    ctx.restore();
    return canvas;
  }
}

import { Camera } from './engine/Camera';
import { SpriteCache } from './engine/SpriteCache';
import { SpatialHashGrid } from './engine/SpatialHashGrid';
import { Simulation } from './engine/Simulation';
import { Renderer } from './engine/Renderer';
import { UIManager } from './ui/UIManager';
import { DataLoader } from './data/DataLoader';
import { Router, type RouteMatch } from './router/Router';
import type { ParticleNode, SimulationFilters } from './types';

class App {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private spriteCache: SpriteCache;
  private spatialGrid: SpatialHashGrid;
  private simulation: Simulation;
  private renderer: Renderer;
  private uiManager: UIManager;
  private router: Router;

  private currentDataset: 'project' | 'team' = 'project';
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private currentFPS: number = 60;

  // Interaction tracking
  private isPointerDown: boolean = false;
  private isPanning: boolean = false;
  private hasDragged: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private clickedCandidate: ParticleNode | null = null;

  constructor() {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Cannot find particle canvas');
    this.canvas = canvas;

    this.camera = new Camera();
    this.spriteCache = new SpriteCache();
    this.spatialGrid = new SpatialHashGrid(120);
    this.simulation = new Simulation();
    this.renderer = new Renderer(this.canvas, this.spriteCache);
    this.router = new Router();

    this.uiManager = new UIManager({
      onDatasetChange: (mode) => this.switchDataset(mode),
      onFilterChange: (filters) => this.applyFilters(filters),
      onResetCamera: () => this.resetCamera(),
      onTogglePause: () => {
        this.simulation.paused = !this.simulation.paused;
        return this.simulation.paused;
      },
      onSpeedChange: (speed) => {
        this.simulation.speedMultiplier = speed;
      },
      onToggleOrbits: () => {
        this.renderer.showOrbits = !this.renderer.showOrbits;
        return this.renderer.showOrbits;
      },
      onToggleLinks: () => {
        this.renderer.showLinks = !this.renderer.showLinks;
        return this.renderer.showLinks;
      },
      onSelectNode: (empID) => {
        const node = this.simulation.nodeMap.get(empID);
        if (node) {
          this.simulation.selectNode(empID);
          this.camera.focusOn(node.x, node.y, node.z, 380);
          this.uiManager.showNodeDetails(node, this.simulation.nodeMap);
          this.router.updateQuery({ node: empID }, { replace: true });
        }
      },
      onFocusNode3D: (empID) => {
        const node = this.simulation.nodeMap.get(empID);
        if (node) {
          this.simulation.selectNode(empID);
          this.camera.focusOn(node.x, node.y, node.z, 360);
        }
      },
      onZoomChange: (percent) => {
        this.camera.setZoomPercent(percent);
      },
      onZoomStep: (deltaPercent) => {
        this.camera.stepZoom(deltaPercent);
      },
      onCloseNodeDetails: () => {
        this.router.updateQuery({ node: null }, { replace: true });
      }
    });

    this.initEvents();

    // Subscribe to client-side routing changes
    this.router.subscribe((current, previous) => {
      this.handleRouteChange(current, previous);
    });
    this.router.start();

    this.startLoop();
  }

  private handleRouteChange(current: RouteMatch, previous: RouteMatch | null): void {
    const datasetChanged = !previous || previous.dataset !== current.dataset;
    if (datasetChanged) {
      this.currentDataset = current.dataset;
      this.uiManager.setActiveDataset(current.dataset);
      this.loadCurrentData();
    }

    if (current.nodeId !== null) {
      const node = this.simulation.nodeMap.get(current.nodeId);
      if (node) {
        this.simulation.selectNode(node.empID);
        this.camera.focusOn(node.x, node.y, node.z, 380);
        this.uiManager.showNodeDetails(node, this.simulation.nodeMap);
      }
    } else if (previous && previous.nodeId !== null) {
      this.uiManager.closeDetails();
    }
  }

  private switchDataset(mode: 'project' | 'team'): void {
    this.router.navigate(`/${mode}`);
  }

  private loadCurrentData(): void {
    const bounds = { width: window.innerWidth, height: window.innerHeight };
    this.simulation.setBounds(bounds.width, bounds.height);

    const dataset = DataLoader.loadDataset(this.currentDataset, bounds, (empID) => {
      this.spriteCache.invalidate(empID);
    });

    this.simulation.setData(dataset);
    this.spatialGrid.update(this.simulation.nodes);
    this.resetCamera();
  }

  private resetCamera(): void {
    if (this.simulation.roots.length > 0) {
      let sumX = 0;
      let sumY = 0;
      let sumZ = 0;
      for (const root of this.simulation.roots) {
        sumX += root.x;
        sumY += root.y;
        sumZ += root.z;
      }
      const avgX = sumX / this.simulation.roots.length;
      const avgY = sumY / this.simulation.roots.length;
      const avgZ = sumZ / this.simulation.roots.length;

      const overviewDist = this.currentDataset === 'team' ? 1900 : 1250;
      this.camera.reset(avgX, avgY, avgZ, overviewDist);
    } else {
      this.camera.reset(0, 0, 0, 1400);
    }
  }

  private applyFilters(filters: SimulationFilters): void {
    this.simulation.applyFilters(filters);
  }

  private initEvents(): void {
    // Window Resize
    window.addEventListener('resize', () => {
      this.camera.resize(window.innerWidth, window.innerHeight);
      this.renderer.handleResize();
      this.simulation.setBounds(window.innerWidth, window.innerHeight);
    });

    // Pointer Events on Canvas for 3D Navigation & Particle Picking
    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return; // Only trigger for primary left button
      this.canvas.setPointerCapture(e.pointerId);
      this.isPointerDown = true;
      this.hasDragged = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;

      // Screen-space 3D ray-cast hit testing
      const hitNode = this.spatialGrid.queryScreenPoint(e.clientX, e.clientY, this.simulation.nodes);

      if (hitNode) {
        this.clickedCandidate = hitNode;
        this.isPanning = false;
      } else {
        this.clickedCandidate = null;
        this.isPanning = true;
      }
    });

    this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (this.isPointerDown) {
        const moveDist = Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY);
        if (moveDist > 10) {
          this.hasDragged = true;

          // Start dragging the particle once intentional movement occurs
          if (this.clickedCandidate && !this.simulation.draggedNode) {
            this.simulation.startDrag(this.clickedCandidate);
          }
        }

        if (this.simulation.draggedNode) {
          // Unproject mouse movement into 3D world at the node's current Z depth
          const world = this.camera.screenToWorld(e.clientX, e.clientY, this.simulation.draggedNode.z);
          this.simulation.updateDrag(world.x, world.y, world.z);
        } else if (this.isPanning && this.hasDragged) {
          this.camera.panBy(e.movementX, e.movementY);
        }
      } else {
        // Hover state testing in 3D screen space
        const hit = this.spatialGrid.queryScreenPoint(e.clientX, e.clientY, this.simulation.nodes);
        this.simulation.hoverNode(hit ? hit.empID : null);
        this.canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
    });

    const onPointerUp = (e: PointerEvent) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture was already released
      }

      const dist = Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY);
      if (dist > 10) {
        this.hasDragged = true;
      }

      this.simulation.endDrag();
      this.isPanning = false;
    };

    this.canvas.addEventListener('pointerup', onPointerUp);
    this.canvas.addEventListener('pointercancel', onPointerUp);

    // Direct click listener: opens dialog on clean particle click, strictly ignores drag releases
    this.canvas.addEventListener('click', (e: MouseEvent) => {
      if (this.hasDragged) {
        this.hasDragged = false;
        this.clickedCandidate = null;
        return;
      }

      // Query screen point or use candidate captured on pointerdown
      const hit = this.clickedCandidate || this.spatialGrid.queryScreenPoint(e.clientX, e.clientY, this.simulation.nodes);
      if (hit) {
        this.simulation.selectNode(hit.empID);
        this.uiManager.showNodeDetails(hit, this.simulation.nodeMap);
        this.router.updateQuery({ node: hit.empID }, { replace: true });
      }
      this.clickedCandidate = null;
    });

    // Double-click to recenter camera
    this.canvas.addEventListener('dblclick', (e: MouseEvent) => {
      const hit = this.spatialGrid.queryScreenPoint(e.clientX, e.clientY, this.simulation.nodes);
      if (hit) {
        this.camera.focusOn(hit.x, hit.y, hit.z, 360);
      } else {
        this.resetCamera();
      }
    });

    // Mouse Wheel 3D Zoom (Smooth, continuous normalized deep space navigation)
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.camera.zoomByWheel(e.deltaY, e.deltaMode, e.clientX, e.clientY);
    }, { passive: false });
  }

  private startLoop(): void {
    const loop = (currentTime: number) => {
      if (!this.lastTime) this.lastTime = currentTime;
      const dt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Track FPS
      this.frameCount++;
      this.fpsTimer += dt;
      if (this.fpsTimer >= 0.25) {
        this.currentFPS = this.frameCount / this.fpsTimer;
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.uiManager.updateHUD(this.currentFPS, this.simulation.nodes.length, this.camera.zoom);
      }

      // Update 3D Camera & 3D Simulation
      this.camera.update(dt);
      this.simulation.update(dt, this.camera);
      this.spatialGrid.update(this.simulation.nodes);

      // Render 3D Viewport
      this.renderer.render(
        this.simulation.nodes,
        this.simulation.nodeMap,
        this.simulation.roots,
        this.camera,
        currentTime / 1000
      );

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Bootstrap application on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  new App();
});

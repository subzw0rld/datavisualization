/**
 * @file UIManager – wires UI controls (buttons, sliders, dialogs) to the simulation engine.
 * Handles dataset toggles, filter updates, camera controls, and chart rendering.
 */
import Chart from 'chart.js/auto';
import type { ParticleNode, SimulationFilters } from '../types';
import { SKILL_DATA, LEVEL_DATA, LOCATION_DATA } from '../data/metadata';

export interface UIEventListeners {
  onDatasetChange: (mode: 'project' | 'team') => void;
  onFilterChange: (filters: SimulationFilters) => void;
  onResetCamera: () => void;
  onTogglePause: () => boolean;
  onSpeedChange: (speed: number) => void;
  onToggleOrbits: () => boolean;
  onToggleLinks: () => boolean;
  onSelectNode: (empID: number) => void;
  onFocusNode3D: (empID: number) => void;
  onZoomChange: (percent: number) => void;
  onZoomStep: (deltaPercent: number) => void;
  onCloseNodeDetails?: () => void;
  onCycleSearchMatch?: (direction: 1 | -1) => void;
}

export class UIManager {
  private listeners: UIEventListeners;
  private currentFilters: SimulationFilters = {
    skillId: null,
    levelId: null,
    locationId: null,
    searchQuery: ''
  };

  private dialog: HTMLDialogElement | null = null;
  private topBilledChart: Chart | null = null;
  private statusChart: Chart | null = null;

  constructor(listeners: UIEventListeners) {
    this.listeners = listeners;
    this.initDOM();
    this.initLegend();
    this.initDialog();
    this.initCharts();
  }

  private initDOM(): void {
    // Mode toggles
    const projectBtn = document.getElementById('btn-view-project');
    const teamBtn = document.getElementById('btn-view-team');

    projectBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.listeners.onDatasetChange('project');
    });

    teamBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.listeners.onDatasetChange('team');
    });

    // Search input & clear button & match navigation
    const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
    const clearBtn = document.getElementById('search-clear-btn');
    const prevBtn = document.getElementById('search-prev-btn');
    const nextBtn = document.getElementById('search-next-btn');

    searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      this.currentFilters.searchQuery = query;

      if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'inline-flex' : 'none';
      }

      this.listeners.onFilterChange(this.currentFilters);
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const direction = e.shiftKey ? -1 : 1;
        this.listeners.onCycleSearchMatch?.(direction);
      }
    });

    prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.listeners.onCycleSearchMatch?.(-1);
    });

    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.listeners.onCycleSearchMatch?.(1);
    });

    clearBtn?.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      this.currentFilters.searchQuery = '';
      if (clearBtn) clearBtn.style.display = 'none';
      this.listeners.onFilterChange(this.currentFilters);
    });

    // Camera reset
    document.getElementById('btn-recenter')?.addEventListener('click', () => {
      this.listeners.onResetCamera();
    });

    // Play/Pause
    const pauseBtn = document.getElementById('btn-pause');
    pauseBtn?.addEventListener('click', () => {
      const isPaused = this.listeners.onTogglePause();
      if (pauseBtn) {
        pauseBtn.innerHTML = isPaused ? '▶ Resume' : '⏸ Pause';
        pauseBtn.classList.toggle('active', isPaused);
      }
    });

    // Speed buttons
    const speedSelect = document.getElementById('speed-select') as HTMLSelectElement | null;
    speedSelect?.addEventListener('change', () => {
      this.listeners.onSpeedChange(parseFloat(speedSelect.value));
    });

    // Toggle Orbits
    const orbitsBtn = document.getElementById('btn-toggle-orbits');
    orbitsBtn?.addEventListener('click', () => {
      const active = this.listeners.onToggleOrbits();
      orbitsBtn.classList.toggle('active', active);
    });

    // Toggle Links
    const linksBtn = document.getElementById('btn-toggle-links');
    linksBtn?.addEventListener('click', () => {
      const active = this.listeners.onToggleLinks();
      linksBtn.classList.toggle('active', active);
    });

    // Interactive 3D Zoom Slider & Step Buttons
    const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement | null;
    const zoomSliderVal = document.getElementById('zoom-slider-val');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomInBtn = document.getElementById('btn-zoom-in');

    zoomSlider?.addEventListener('input', (e) => {
      const val = Number((e.target as HTMLInputElement).value);
      if (zoomSliderVal) zoomSliderVal.textContent = `${Math.round(val)}%`;
      this.listeners.onZoomChange(val);
    });

    zoomOutBtn?.addEventListener('click', () => {
      this.listeners.onZoomStep(-15);
    });

    zoomInBtn?.addEventListener('click', () => {
      this.listeners.onZoomStep(+15);
    });

    // Legend panel collapse toggle
    const legendPanel = document.getElementById('legend-panel');
    const legendToggle = document.getElementById('legend-toggle');
    legendToggle?.addEventListener('click', () => {
      legendPanel?.classList.toggle('open');
      legendToggle.classList.toggle('open');
    });

    // Keyboard shortcut '/' to search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput?.focus();
      }
    });
  }

  private initLegend(): void {
    const skillList = document.getElementById('legend-skill-list');
    const levelList = document.getElementById('legend-level-list');
    const locationList = document.getElementById('legend-location-list');

    // Populate skills
    if (skillList) {
      skillList.innerHTML = '';
      for (const key of Object.keys(SKILL_DATA)) {
        const id = Number(key);
        const item = SKILL_DATA[id];
        const chip = document.createElement('button');
        chip.className = 'legend-chip';
        chip.dataset.skillId = id.toString();
        chip.innerHTML = `<span class="legend-color-dot" style="background-color: ${item.color}"></span><span>${item.skill}</span>`;
        chip.addEventListener('click', () => {
          if (this.currentFilters.skillId === id) {
            this.currentFilters.skillId = null;
            chip.classList.remove('active');
          } else {
            skillList.querySelectorAll('.legend-chip').forEach((c) => c.classList.remove('active'));
            this.currentFilters.skillId = id;
            chip.classList.add('active');
          }
          this.listeners.onFilterChange(this.currentFilters);
        });
        skillList.appendChild(chip);
      }
    }

    // Populate levels
    if (levelList) {
      levelList.innerHTML = '';
      for (const key of Object.keys(LEVEL_DATA)) {
        const id = Number(key);
        const item = LEVEL_DATA[id];
        const chip = document.createElement('button');
        chip.className = 'legend-chip';
        chip.dataset.levelId = id.toString();
        chip.innerHTML = `<span class="legend-color-dot" style="background-color: ${item.color}"></span><span>${item.level}</span>`;
        chip.addEventListener('click', () => {
          if (this.currentFilters.levelId === id) {
            this.currentFilters.levelId = null;
            chip.classList.remove('active');
          } else {
            levelList.querySelectorAll('.legend-chip').forEach((c) => c.classList.remove('active'));
            this.currentFilters.levelId = id;
            chip.classList.add('active');
          }
          this.listeners.onFilterChange(this.currentFilters);
        });
        levelList.appendChild(chip);
      }
    }

    // Populate locations
    if (locationList) {
      locationList.innerHTML = '';
      for (const key of Object.keys(LOCATION_DATA)) {
        const id = Number(key);
        const item = LOCATION_DATA[id];
        const chip = document.createElement('button');
        chip.className = 'legend-chip';
        chip.dataset.locationId = id.toString();
        chip.innerHTML = `<span class="legend-color-dot" style="background-color: ${item.color}"></span><span>${item.location}</span>`;
        chip.addEventListener('click', () => {
          if (this.currentFilters.locationId === id) {
            this.currentFilters.locationId = null;
            chip.classList.remove('active');
          } else {
            locationList.querySelectorAll('.legend-chip').forEach((c) => c.classList.remove('active'));
            this.currentFilters.locationId = id;
            chip.classList.add('active');
          }
          this.listeners.onFilterChange(this.currentFilters);
        });
        locationList.appendChild(chip);
      }
    }

    // Reset filters button
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      this.currentFilters = {
        skillId: null,
        levelId: null,
        locationId: null,
        searchQuery: ''
      };
      const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
      if (searchInput) searchInput.value = '';

      const clearBtn = document.getElementById('search-clear-btn');
      if (clearBtn) clearBtn.style.display = 'none';

      document.querySelectorAll('.legend-chip').forEach((c) => c.classList.remove('active'));
      this.listeners.onFilterChange(this.currentFilters);
    });
  }

  private initDialog(): void {
    this.dialog = document.getElementById('particle-dialog') as HTMLDialogElement | null;
    if (!this.dialog) return;

    // Close button
    document.getElementById('dialog-close-btn')?.addEventListener('click', () => {
      this.dialog?.close();
    });

    // Listen for dialog close to notify router
    this.dialog.addEventListener('close', () => {
      this.listeners.onCloseNodeDetails?.();
    });

    // Modern Web Guidance fallback for browsers lacking native closedby light-dismiss
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      this.dialog.addEventListener('click', (event: MouseEvent) => {
        if (event.target !== this.dialog) return;
        const rect = this.dialog!.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;

        if (!isDialogContent) {
          this.dialog!.close();
        }
      });
    }
  }

  public getCurrentFilters(): SimulationFilters {
    return { ...this.currentFilters };
  }

  public updateFilterStatus(matchCount: number, searchQuery: string, currentIndex: number = 0): void {
    const searchBox = document.querySelector('.search-box');
    const feedbackEl = document.getElementById('search-feedback');
    const feedbackText = document.getElementById('search-feedback-text');
    const navControls = document.getElementById('search-nav-controls');
    const matchBadge = document.getElementById('search-match-badge');

    const cleanQuery = searchQuery.trim();

    if (cleanQuery.length > 0 && matchCount === 0) {
      searchBox?.classList.add('not-found');
      if (feedbackEl) feedbackEl.style.display = 'flex';
      if (feedbackText) {
        feedbackText.textContent = `No employee found matching "${cleanQuery}"`;
      }
      if (navControls) navControls.style.display = 'none';
    } else {
      searchBox?.classList.remove('not-found');
      if (feedbackEl) feedbackEl.style.display = 'none';

      if (cleanQuery.length > 0 && matchCount > 0) {
        if (navControls) navControls.style.display = 'inline-flex';
        if (matchBadge) {
          matchBadge.textContent = matchCount === 1
            ? '1 match'
            : `${currentIndex + 1} of ${matchCount}`;
        }
      } else {
        if (navControls) navControls.style.display = 'none';
      }
    }
  }

  public setActiveDataset(mode: 'project' | 'team'): void {
    const projectBtn = document.getElementById('btn-view-project');
    const teamBtn = document.getElementById('btn-view-team');
    if (mode === 'project') {
      projectBtn?.classList.add('active');
      projectBtn?.setAttribute('aria-selected', 'true');
      teamBtn?.classList.remove('active');
      teamBtn?.setAttribute('aria-selected', 'false');
    } else {
      teamBtn?.classList.add('active');
      teamBtn?.setAttribute('aria-selected', 'true');
      projectBtn?.classList.remove('active');
      projectBtn?.setAttribute('aria-selected', 'false');
    }
  }

  public closeDetails(): void {
    if (this.dialog && this.dialog.open) {
      this.dialog.close();
    }
  }

  private initCharts(): void {
    const topBilledCanvas = document.getElementById('chart-top-billed') as HTMLCanvasElement | null;
    const statusCanvas = document.getElementById('chart-status') as HTMLCanvasElement | null;

    if (topBilledCanvas) {
      this.topBilledChart = new Chart(topBilledCanvas, {
        type: 'bar',
        data: {
          labels: ['Release 4.1', 'Release 4.2', 'HFS', 'NACM', 'TOC'],
          datasets: [
            {
              label: 'Revenue ($M)',
              data: [1.2, 0.8, 3.4, 0.45, 2.3],
              backgroundColor: 'rgba(56, 189, 248, 0.8)',
              borderColor: '#38bdf8',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            }
          }
        }
      });
    }

    if (statusCanvas) {
      this.statusChart = new Chart(statusCanvas, {
        type: 'radar',
        data: {
          labels: ['Delivery', 'Quality', 'Milestones', 'Budget', 'Innovation'],
          datasets: [
            {
              label: 'Target',
              data: [90, 85, 80, 95, 75],
              borderColor: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.25)',
              borderWidth: 2
            },
            {
              label: 'Current',
              data: [85, 78, 88, 82, 70],
              borderColor: '#ec4899',
              backgroundColor: 'rgba(236, 72, 153, 0.2)',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { size: 10 } }
            }
          },
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              pointLabels: { color: '#cbd5e1', font: { size: 10 } },
              ticks: { display: false }
            }
          }
        }
      });
    }
  }

  public showNodeDetails(node: ParticleNode, nodeMap: Map<number, ParticleNode>): void {
    if (!this.dialog) return;

    // Populate details
    const nameEl = document.getElementById('modal-name');
    const desigEl = document.getElementById('modal-desig');
    const levelEl = document.getElementById('modal-level');
    const locationEl = document.getElementById('modal-location');
    const empIdEl = document.getElementById('modal-empid');
    const avatarEl = document.getElementById('modal-avatar') as HTMLImageElement | null;
    const focusBtn = document.getElementById('btn-modal-focus');

    // Cosmic Insights Elements
    const galaxyNameEl = document.getElementById('modal-galaxy-name');
    const systemMassEl = document.getElementById('modal-system-mass');
    const coordsEl = document.getElementById('modal-coords');
    const distanceEl = document.getElementById('modal-distance');
    const skillsCountEl = document.getElementById('modal-skills-count');
    const clientsListEl = document.getElementById('modal-clients-list');

    const supervisorCard = document.getElementById('modal-supervisor-card');
    const supervisorNameEl = document.getElementById('modal-supervisor-name');
    const superviseeSection = document.getElementById('modal-supervisees-section');
    const superviseeList = document.getElementById('modal-supervisees-list');
    const skillsList = document.getElementById('modal-skills-list');

    if (nameEl) nameEl.textContent = node.name;
    if (desigEl) desigEl.textContent = node.desig;
    if (levelEl) levelEl.textContent = `Level ${node.level}`;
    if (empIdEl) empIdEl.textContent = `ID: ${node.empID}`;
    if (locationEl) {
      locationEl.textContent = node.locationName;
      locationEl.style.borderColor = node.locationColor;
    }

    // Populate Cosmic & Astrophysics Insights
    if (galaxyNameEl) galaxyNameEl.textContent = node.clusterName || 'Cosmic System';
    if (systemMassEl) {
      systemMassEl.textContent = `${node.systemMass.toFixed(1)} M☉ (${node.isRoot ? 'Galaxy Nucleus' : `Orbit Tier ${node.depth}`})`;
    }
    if (coordsEl) {
      coordsEl.textContent = `X: ${Math.round(node.x)}, Y: ${Math.round(node.y)}, Z: ${Math.round(node.z)}`;
    }
    if (distanceEl) {
      distanceEl.textContent = `${Math.round(node.projZ)} units (${Math.round(node.projScale * 100)}% view size)`;
    }
    if (skillsCountEl) {
      skillsCountEl.textContent = `${node.skills.length} skills`;
    }

    // Populate Clients / Accounts
    if (clientsListEl) {
      const clientItems = node.clients && node.clients.length > 0
        ? node.clients
        : ['Core Engineering', 'Enterprise Systems'];
      clientsListEl.innerHTML = clientItems
        .map((c) => `<span class="client-badge">${c}</span>`)
        .join('');
    }

    // 3D Fly-to navigation button
    if (focusBtn) {
      focusBtn.onclick = () => {
        this.dialog?.close();
        this.listeners.onFocusNode3D(node.empID);
      };
    }

    if (avatarEl) {
      avatarEl.src = node.avatarUrl || '/assets/images/emp-images/avatar.png';
      avatarEl.onerror = () => {
        avatarEl.src = '/assets/images/emp-images/avatar.png';
      };
    }

    // Supervisor details
    if (node.supervisorId && nodeMap.has(node.supervisorId)) {
      const supervisor = nodeMap.get(node.supervisorId)!;
      if (supervisorCard && supervisorNameEl) {
        supervisorCard.style.display = 'flex';
        supervisorNameEl.textContent = supervisor.name;
        supervisorCard.onclick = () => {
          this.dialog?.close();
          this.listeners.onSelectNode(supervisor.empID);
        };
      }
    } else if (supervisorCard) {
      supervisorCard.style.display = 'none';
    }

    // Supervisees list
    if (superviseeSection && superviseeList) {
      if (node.children.length > 0) {
        superviseeSection.style.display = 'block';
        superviseeList.innerHTML = '';
        for (const childId of node.children) {
          const child = nodeMap.get(childId);
          if (!child) continue;
          const chip = document.createElement('button');
          chip.className = 'supervisee-chip';
          chip.innerHTML = `<span>${child.name}</span><small>${child.level}</small>`;
          chip.onclick = () => {
            this.dialog?.close();
            this.listeners.onSelectNode(child.empID);
          };
          superviseeList.appendChild(chip);
        }
      } else {
        superviseeSection.style.display = 'none';
      }
    }

    // Skills breakdown
    if (skillsList) {
      skillsList.innerHTML = '';
      for (const s of node.skills) {
        const item = document.createElement('div');
        item.className = 'skill-tag';
        item.innerHTML = `
          <span class="skill-name" style="border-left: 3px solid ${s.color}">${s.name}</span>
          <span class="skill-level" style="background-color: ${s.levelColor}">${s.levelName}</span>
        `;
        skillsList.appendChild(item);
      }
    }

    // Update charts with slight dynamic variations based on employee ID
    if (this.topBilledChart) {
      const seed = (node.empID % 7) + 1;
      this.topBilledChart.data.datasets[0].data = [
        0.5 + seed * 0.4,
        0.8 + seed * 0.2,
        1.5 + seed * 0.5,
        0.3 + seed * 0.1,
        1.2 + seed * 0.3
      ];
      this.topBilledChart.update();
    }

    if (this.statusChart) {
      const seed = (node.empID % 10) * 2;
      this.statusChart.data.datasets[1].data = [
        Math.min(100, 75 + seed),
        Math.min(100, 80 + seed),
        Math.min(100, 70 + seed),
        Math.min(100, 85 + seed),
        Math.min(100, 68 + seed)
      ];
      this.statusChart.update();
    }

    // Open dialog via modern top-layer showModal
    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  public updateHUD(fps: number, nodeCount: number, zoom: number): void {
    const fpsEl = document.getElementById('hud-fps');
    const nodesEl = document.getElementById('hud-nodes');
    const zoomEl = document.getElementById('hud-zoom');
    const zoomSliderVal = document.getElementById('zoom-slider-val');
    const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement | null;

    const zoomPercent = Math.round(zoom * 100);

    if (fpsEl) fpsEl.textContent = `${Math.round(fps)} FPS`;
    if (nodesEl) nodesEl.textContent = `${nodeCount} Nodes`;
    if (zoomEl) zoomEl.textContent = `${zoomPercent}%`;
    if (zoomSliderVal) zoomSliderVal.textContent = `${zoomPercent}%`;

    // Sync slider position if user is not currently dragging it
    if (zoomSlider && document.activeElement !== zoomSlider) {
      zoomSlider.value = Math.max(25, Math.min(280, zoomPercent)).toString();
    }
  }
}

# 🪐 Orbital Particle System — High Performance Data Visualization

A high-performance, interactive 3D orbital particle system designed to visualize organizational structures, reporting hierarchies, individual skill matrices, and locations. Built with TypeScript, HTML5 Canvas, and a dedicated Fastify + Prisma backend API, this project leverages offscreen sprite caching, 3D perspective projection, orbital physics, spatial partitioning, full CRUD API integration, and client-side deep-link routing to deliver fluid 60 FPS animations.

---

## 🌟 Key Features

- **3D Orbital Physics Simulation**:
  - Hierarchical planetary-style orbits where supervisees orbit supervisors around dynamically inclined 3D orbital planes.
  - Smooth physics simulation with velocity damping, orbital momentum, and brownian wander motions for root supervisors.
- **High-Performance Canvas Rendering**:
  - **Offscreen Sprite Caching**: Pre-renders complex multi-ring node graphics (core avatar, location ring, skill distribution, and proficiency level rings) into cached offscreen canvases.
  - **Spatial Hashing**: Screen-space spatial grid partitioning for fast ray-casting and hover hit-testing.
  - **Perspective Projection**: 3D world coordinates transformed to camera view space with dynamic depth scaling, focal length adjustments, and alpha falloff.
  - **Enhanced Realism**: Increased spacing between galaxy clusters for clearer visualization and more accurate orbital dynamics.
- **Backend API & Database Integration**:
  - **Fastify REST API**: High-throughput Node.js/TypeScript backend service running on port 3001 with CORS support.
  - **Prisma ORM & PostgreSQL**: Relational schema handling employees, skills, levels, locations, and dynamic system configurations with automated migrations and seed scripts.
  - **Full Dataset & Metadata CRUD**: Endpoints for datasets (`/api/datasets/:type`), employee management (`GET`, `POST`, `PUT`, `DELETE` on `/api/employees`), metadata caching (`/api/metadata`), and database health checks (`/api/health`).
  - **Frontend Proxy Integration**: Seamless Vite dev proxy forwarding `/api` requests to the Fastify backend server.
- **Deep-Linked Client-Side Routing**:
  - Seamless navigation between views:
    - `/project` or `/#/project`: Focused sub-team visualization (6 nodes).
    - `/team` or `/#/team`: Full organizational cluster visualization (64 nodes).
    - Node deep-links (e.g. `/team?node=1001` or `/project?node=10`): Smooth camera fly-to animation and auto-selection of the specified node.
- **Rich Interactive UI & Glassmorphism Controls**:
  - **Camera Controls**: Orbit drag, 3D tilt, smooth panning, mouse-wheel zoom, and reset center.
  - **Search & Filtering**: Search nodes in real-time by employee name, job title, and skill. Filter across locations, proficiency levels, and skill categories.
  - **Node Inspector Drawer**: Comprehensive profile breakdown with avatar, supervisory relationships, direct reports, and Chart.js skill radar/distribution analytics.
  - **Playback Controls**: Play/pause simulation, simulation speed multiplier (0.5x, 1.0x, 2.0x), and toggleable orbit trajectory rings.
  - **Metrics HUD**: Live FPS counter and active particle count display.

---

## 🏗️ Architecture & Project Structure

```text
├── index.html                   # Main application markup & glassmorphic UI controls
├── package.json                 # Root dependencies, concurrent dev & build scripts
├── tsconfig.json                # Frontend TypeScript configuration
├── vite.config.ts               # Vite build configuration with /api proxy to backend
├── server/                      # Backend API service (Fastify + Prisma)
│   ├── .env                     # Database connection string and server port config
│   ├── package.json             # Backend dependencies and Prisma scripts
│   ├── tsconfig.json            # Server TypeScript configuration
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (Employee, Skill, Level, Location, SystemConfig)
│   │   ├── seed.ts              # Database seeder for organizational and project datasets
│   │   └── seedStress.ts        # Database stress-testing seed scripts
│   └── src/
│       └── index.ts             # Fastify server bootstrap, routes, and Prisma queries
├── src/                         # Frontend client application
│   ├── main.ts                  # Application bootstrap, routing hooks & animation loop
│   ├── types.ts                 # TypeScript interfaces for nodes, catalogs, and engine state
│   ├── style.css                # Modern dark-theme styling, glassmorphism, and responsive layout
│   ├── router/
│   │   └── Router.ts            # SPA history & hash routing with query parameter support
│   ├── services/
│   │   └── ApiService.ts        # Frontend HTTP service communicating with the backend API
│   ├── data/
│   │   ├── DataLoader.ts        # Data ingestion, hierarchy parsing, and orbital calculations
│   │   ├── metadata.ts          # Fallback skill catalogs, level tiers, location color definitions
│   │   ├── projectData.ts       # Fallback project dataset (6 nodes)
│   │   └── teamData.ts          # Fallback organizational dataset (64 nodes)
│   ├── engine/
│   │   ├── Camera.ts            # 3D view camera, target transitions, rotation & zoom
│   │   ├── Simulation.ts        # Physics loop, orbital mechanics, and wander forces
│   │   ├── Renderer.ts          # Canvas draw pipelines, connections, selection rings, & labels
│   │   ├── SpriteCache.ts       # Cached offscreen canvas generation for node glyphs
│   │   └── SpatialHashGrid.ts   # Spatial acceleration structure for hit testing & interactions
│   └── ui/
│       └── UIManager.ts         # HUD bindings, filter menus, inspector drawer, & Chart.js integration
```

---

## 🔌 API Server & Endpoints

The backend is built with [Fastify](https://fastify.dev/) and [Prisma ORM](https://www.prisma.io/) connected to PostgreSQL:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and database connection status |
| `GET` | `/api/metadata` | Skills, levels, locations, and physics configuration rules |
| `GET` | `/api/datasets/:type` | Fetch full dataset records (`project` or `team`) |
| `GET` | `/api/employees/:empID` | Fetch a single employee record by ID |
| `POST` | `/api/employees` | Create or upsert an employee record |
| `PUT` | `/api/employees/:empID` | Update an existing employee record |
| `DELETE` | `/api/employees/:empID` | Delete an employee record |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [PostgreSQL](https://www.postgresql.org/) running locally or accessible via network
- `npm` or any modern package manager (`pnpm`, `yarn`)

### Installation & Database Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/subzw0rld/datavisualization.git
   cd ParticleSystemOptimisationApproach
   ```

2. **Install frontend and backend dependencies:**
   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server && npm install && cd ..
   ```

3. **Configure environment & database:**
   Configure `server/.env` with your PostgreSQL database URL:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/particle_viz?schema=public"
   PORT=3001
   HOST=0.0.0.0
   ```

4. **Initialize database schema and seed data:**
   ```bash
   cd server
   npm run db:push
   npm run db:seed
   cd ..
   ```

### Running Locally

Start both the backend API server and the frontend client concurrently:
```bash
npm run dev
```

- **Backend API**: Runs at `http://localhost:3001`
- **Frontend App**: Runs at `http://localhost:5173` (with Vite proxy forwarding `/api` calls to `:3001`)

Alternatively, run each service independently:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

### Building for Production

Compile both the backend TypeScript server and frontend static bundle:
```bash
npm run build
```

Preview the frontend production bundle:
```bash
npm run preview
```

---

## 🎮 Navigation & Keyboard Shortcuts

| Interaction / Key | Action |
| :--- | :--- |
| **Left Click + Drag** (on background) | Orbit / rotate camera in 3D space |
| **Right Click + Drag** / **Shift + Drag** | Pan camera across the simulation plane |
| **Scroll Wheel / Pinch** | Zoom in / Zoom out |
| **Left Click** (on node) | Focus camera on node and open details drawer |
| **Press `/`** | Quick focus on the search bar |
| **Escape** | Deselect node and close details drawer |
| **Center Button** | Recenter camera to origin |

---

## 🛠️ Tech Stack

- **Frontend Core**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Graphics & Rendering**: HTML5 Canvas 2D API with custom 3D projection algorithms
- **Charts & Metrics**: [Chart.js](https://www.chartjs.org/)
- **Styling**: Modern CSS3 (Glassmorphism, CSS Custom Properties, Flexbox & Grid)
- **Backend Framework**: [Fastify](https://fastify.dev/)
- **ORM & Database**: [Prisma](https://www.prisma.io/) with [PostgreSQL](https://www.postgresql.org/)
- **Process Orchestration**: Concurrently & Wait-on

export type DatasetRoute = 'project' | 'team';

export interface RouteMatch {
  dataset: DatasetRoute;
  nodeId: number | null;
  rawPath: string;
  queryParams: URLSearchParams;
}

export type RouteChangeCallback = (current: RouteMatch, previous: RouteMatch | null) => void;

export class Router {
  private listeners: RouteChangeCallback[] = [];
  private currentRoute: RouteMatch | null = null;
  private isHandlingPopstate: boolean = false;

  constructor() {
    this.handlePopState = this.handlePopState.bind(this);
    this.handleGlobalClick = this.handleGlobalClick.bind(this);

    window.addEventListener('popstate', this.handlePopState);
    window.addEventListener('hashchange', this.handlePopState);
    document.addEventListener('click', this.handleGlobalClick);
  }

  /**
   * Register a route change subscriber
   */
  public subscribe(callback: RouteChangeCallback): () => void {
    this.listeners.push(callback);
    if (this.currentRoute) {
      callback(this.currentRoute, null);
    }
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Start router resolution and initialize starting route
   */
  public start(): void {
    const route = this.resolveCurrentLocation();
    this.setRoute(route, null, false);
  }

  /**
   * Navigate to a route path (e.g. '/project', '/team', '/team/42')
   */
  public navigate(path: string, options: { replace?: boolean; silent?: boolean } = {}): void {
    const url = new URL(path, window.location.origin);
    const targetRoute = this.parsePath(url.pathname, url.search);

    if (
      this.currentRoute &&
      this.currentRoute.dataset === targetRoute.dataset &&
      this.currentRoute.nodeId === targetRoute.nodeId &&
      this.currentRoute.queryParams.toString() === targetRoute.queryParams.toString()
    ) {
      return;
    }

    const fullPath = targetRoute.rawPath + (targetRoute.queryParams.toString() ? `?${targetRoute.queryParams.toString()}` : '');

    if (options.replace) {
      window.history.replaceState(null, '', fullPath);
    } else {
      window.history.pushState(null, '', fullPath);
    }

    this.setRoute(targetRoute, this.currentRoute, options.silent);
  }

  /**
   * Update query parameters (e.g. ?node=42) while preserving or switching base route
   */
  public updateQuery(params: Record<string, string | number | null>, options: { replace?: boolean; silent?: boolean } = {}): void {
    if (!this.currentRoute) return;

    const query = new URLSearchParams(this.currentRoute.queryParams);
    for (const [key, val] of Object.entries(params)) {
      if (val === null || val === undefined || val === '') {
        query.delete(key);
      } else {
        query.set(key, String(val));
      }
    }

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const newPath = `${this.currentRoute.rawPath}${queryString}`;

    const prevRoute = this.currentRoute;
    const targetRoute: RouteMatch = {
      ...this.currentRoute,
      queryParams: query,
      nodeId: query.has('node') ? Number(query.get('node')) : null
    };

    if (options.replace) {
      window.history.replaceState(null, '', newPath);
    } else {
      window.history.pushState(null, '', newPath);
    }

    // Call setRoute to update document title and notify listeners (CR-17)
    this.setRoute(targetRoute, prevRoute, options.silent ?? false);
  }

  /**
   * Get the current active route
   */
  public getCurrentRoute(): RouteMatch | null {
    return this.currentRoute;
  }

  private handlePopState(): void {
    this.isHandlingPopstate = true;
    const nextRoute = this.resolveCurrentLocation();
    this.setRoute(nextRoute, this.currentRoute, false);
    this.isHandlingPopstate = false;
  }

  private handleGlobalClick(e: MouseEvent): void {
    // Ignore non-primary click or modified clicks (cmd, ctrl, shift, alt) for new tab / window opening
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) {
      return;
    }

    const target = (e.target as HTMLElement).closest('a[href], [data-route]');
    if (!target) return;

    const href = target.getAttribute('href') || target.getAttribute('data-route');
    if (!href) return;

    // Ignore external links, mailto, tel, or hash-only links not meant for router
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // Treat internal routes
    if (href.startsWith('/') || href.startsWith('#/')) {
      e.preventDefault();
      this.navigate(href.startsWith('#/') ? href.slice(1) : href);
    }
  }

  private resolveCurrentLocation(): RouteMatch {
    const hash = window.location.hash;
    let pathname = window.location.pathname;
    let search = window.location.search;

    // Support hash-based fallback (e.g. #/team or #/project)
    if (hash && hash.startsWith('#/')) {
      const hashContent = hash.slice(1);
      const qIdx = hashContent.indexOf('?');
      if (qIdx !== -1) {
        pathname = hashContent.slice(0, qIdx);
        search = hashContent.slice(qIdx);
      } else {
        pathname = hashContent;
        search = '';
      }
    }

    return this.parsePath(pathname, search);
  }

  private parsePath(pathname: string, search: string): RouteMatch {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    const queryParams = new URLSearchParams(search);

    let dataset: DatasetRoute = 'project';
    let nodeId: number | null = null;
    let rawPath = '/project';

    // Parse root or unknown path -> defaults to /project
    if (cleanPath === '/' || cleanPath === '') {
      dataset = 'project';
      rawPath = '/project';
      // Normalize URL in browser without adding an extra history step
      if (!this.isHandlingPopstate && window.location.pathname !== '/project' && !window.location.hash) {
        window.history.replaceState(null, '', `/project${search}`);
      }
    } else if (cleanPath.startsWith('/team')) {
      dataset = 'team';
      rawPath = '/team';
      const parts = cleanPath.slice('/team'.length).split('/').filter(Boolean);
      if (parts.length > 0 && !isNaN(Number(parts[0]))) {
        nodeId = Number(parts[0]);
      }
    } else if (cleanPath.startsWith('/project')) {
      dataset = 'project';
      rawPath = '/project';
      const parts = cleanPath.slice('/project'.length).split('/').filter(Boolean);
      if (parts.length > 0 && !isNaN(Number(parts[0]))) {
        nodeId = Number(parts[0]);
      }
    } else {
      // Fallback unknown paths to /project
      dataset = 'project';
      rawPath = '/project';
    }

    // Check query param ?node=... or ?id=...
    if (queryParams.has('node') && !isNaN(Number(queryParams.get('node')))) {
      nodeId = Number(queryParams.get('node'));
    } else if (queryParams.has('id') && !isNaN(Number(queryParams.get('id')))) {
      nodeId = Number(queryParams.get('id'));
    }

    return {
      dataset,
      nodeId,
      rawPath,
      queryParams
    };
  }

  private setRoute(nextRoute: RouteMatch, prevRoute: RouteMatch | null, silent: boolean = false): void {
    this.currentRoute = nextRoute;

    // Update document title
    this.updateTitle(nextRoute);

    if (!silent) {
      for (const listener of this.listeners) {
        listener(nextRoute, prevRoute);
      }
    }
  }

  private updateTitle(route: RouteMatch): void {
    const viewName = route.dataset === 'team' ? 'Team View (5,000 Nodes)' : 'Project View (6 Nodes)';
    document.title = `${viewName} — Orbital Particle System`;
  }

  public destroy(): void {
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('hashchange', this.handlePopState);
    document.removeEventListener('click', this.handleGlobalClick);
    this.listeners = [];
  }
}

export type DatasetName = 'team' | 'project';
const routes: Record<DatasetName, string> = {team: '/team-view', project: '/project-view'};
export function datasetFromPath(): DatasetName {
  return window.location.pathname === routes.project ? 'project' : 'team';
}
export function navigateToDataset(name: DatasetName, replace = false): void {
  const path = routes[name];
  if (window.location.pathname !== path) window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
}

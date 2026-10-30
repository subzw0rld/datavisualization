import type {Graph} from './model.js';
import type {Engine} from './controller.js';
import type {DatasetName} from './router.js';

/** State shared across the controller and views. View-local paging stays in its view. */
export interface AppStore {
  graph: Graph | null;
  engine: Engine | null;
  selected: number;
  activeDataset: DatasetName | null;
}
export const store: AppStore = {graph: null, engine: null, selected: -1, activeDataset: null};

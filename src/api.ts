import type {Dataset} from './model.js';
import type {DatasetName} from './router.js';

/** Owns the in-flight request; switching views cancels the previous network operation. */
export class DatasetApi {
  private controller: AbortController | null = null;
  async load(name: DatasetName): Promise<Dataset> {
    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    try {
      const response = await fetch(`/api/datasets/${name}`, {signal: controller.signal});
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Could not load the ${name} dataset (${response.status}).`);
      }
      return await response.json() as Dataset;
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }
  cancel(): void { this.controller?.abort(); this.controller = null; }
}

import {DirectoryIndex} from './directory.js';
import type {Graph} from './model.js';
import type {Engine} from './controller.js';
import {$, el, text} from './dom.js';

export class DirectoryView {
  private index: DirectoryIndex | null = null;
  private graph: Graph | null = null;
  private engine: Engine | null = null;
  private page = 0;
  private frame: number | null = null;
  constructor(private select: (index: number, focus: boolean) => void) {}
  setDataset(graph: Graph, engine: Engine): void {
    this.graph = graph; this.engine = engine; this.index = new DirectoryIndex(graph); this.page = 0;
    $<HTMLInputElement>('search').value = '';
    $<HTMLSelectElement>('location-filter').replaceChildren(new Option('All locations', ''),
      ...graph.source.locations.map(location => new Option(location.label, location.id)));
    this.render();
  }
  clear(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null; this.index = null; this.graph = null; this.engine = null; this.page = 0;
  }
  queueSearch(): void {
    this.page = 0;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => { this.frame = null; this.render(); });
  }
  previous(): void { this.page = Math.max(0, this.page - 1); this.render(); }
  next(): void { this.page++; this.render(); }
  render(): void {
    const {graph, index, engine} = this;
    if (!graph || !index || !engine) return;
    const query = $<HTMLInputElement>('search').value.toLocaleLowerCase().trim();
    const location = $<HTMLSelectElement>('location-filter').value;
    const matches = index.match(query, location);
    const pages = Math.max(1, Math.ceil(matches.length / index.pageSize));
    this.page = Math.min(this.page, pages - 1);
    engine.matches = query || location ? new Set(matches) : null;
    engine.invalidate();
    text('result-count', `${matches.length} ${matches.length === 1 ? 'PERSON' : 'PEOPLE'}`);
    const fragment = document.createDocumentFragment();
    for (const personIndex of index.page(matches, this.page)) {
      const node = graph.nodes[personIndex];
      const button = el('button', 'person-row');
      button.setAttribute('aria-label', `${node.name}, ${node.title}`);
      const initials = node.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('');
      button.append(el('span', 'person-avatar', initials));
      const copy = el('span', 'person-copy');
      copy.append(el('strong', '', node.name), el('small', '', node.title));
      button.append(copy, el('span', '', '↗'));
      button.addEventListener('click', () => this.select(personIndex, true));
      fragment.append(button);
    }
    if (!matches.length) fragment.append(el('p', 'no-results', 'No people match your search. Try another name, skill, or location.'));
    $('people-list').replaceChildren(fragment); $('people-list').scrollTop = 0;
    text('directory-page', `Page ${this.page + 1} of ${pages}`);
    $<HTMLButtonElement>('directory-previous').disabled = this.page === 0;
    $<HTMLButtonElement>('directory-next').disabled = this.page + 1 >= pages;
  }
}

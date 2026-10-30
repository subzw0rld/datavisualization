import type {Graph, Lookup} from './model.js';
import {$, el} from './dom.js';

export function renderLegend(graph: Graph): void {
  const fragment = document.createDocumentFragment();
  const group = (name: string, items: Lookup[]): void => {
    const section = el('div', 'legend-group'); section.append(el('h3', '', name));
    for (const item of items) {
      const row = el('div', 'legend-entry'), swatch = el('span', 'swatch');
      swatch.style.backgroundColor = item.color;
      row.append(swatch, document.createTextNode(item.label)); section.append(row);
    }
    fragment.append(section);
  };
  group('Locations', graph.source.locations);
  group('Proficiency', graph.source.levels);
  group('Skills', graph.source.skills);
  $('legend-content').replaceChildren(fragment);
}

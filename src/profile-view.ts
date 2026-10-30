import type {Graph} from './model.js';
import type {Engine} from './controller.js';
import {$, el, announce} from './dom.js';
import {showScreen} from './view-state.js';

export class ProfileView {
  constructor(private graph: () => Graph | null, private engine: () => Engine | null,
    private onSelect: (index: number, focus: boolean) => void) {}
  render(index: number): void {
    const graph = this.graph(), engine = this.engine();
    if (!graph || !engine) return;
    const node = graph.nodes[index], card = el('div', 'profile-card');
    const relationButton = (target: number): HTMLButtonElement => {
      const button = el('button', 'relation-button', `${graph.nodes[target].name} ↗`);
      button.addEventListener('click', () => this.onSelect(target, true));
      return button;
    };
    const avatar = el('img', 'profile-avatar');
    avatar.src = `/assets/avatars/${node.avatar}`; avatar.alt = '';
    avatar.addEventListener('error', () => { avatar.hidden = true; }, {once: true});
    const name = el('h2', '', node.name); name.tabIndex = -1;
    card.append(avatar, name, el('p', 'profile-title', node.title));
    card.append(el('span', 'badge', `Grade ${node.grade}`),
      el('span', 'badge', `${node.children.length} direct reports in view`));
    const section = (label: string): HTMLElement => {
      const element = el('section', 'profile-section');
      element.append(el('h3', '', label)); card.append(element); return element;
    };
    section('Location').append(el('p', '', node.location.label));
    section('Reports to').append(node.parent >= 0 ? relationButton(node.parent)
      : el('p', '', 'Group leader · no supervisor in this view'));
    const skills = section(`Skills & proficiency · ${node.resolvedSkills.length}`);
    const levelRanks = new Map(graph.source.levels.map((level, rank) => [level.id, rank + 1]));
    for (const item of node.resolvedSkills) {
      const row = el('div', 'skill-row'), label = el('div', 'skill-label');
      label.append(el('span', '', item.skill.label), el('small', '', item.level.label));
      const track = el('div', 'skill-track'), fill = el('span');
      const rank = levelRanks.get(item.level.id) ?? 0;
      fill.style.width = `${rank / Math.max(1, levelRanks.size) * 100}%`;
      fill.style.backgroundColor = item.skill.color;
      track.append(fill); row.append(label, track); skills.append(row);
    }
    if (!node.resolvedSkills.length) skills.append(el('p', '', 'No skills listed.'));
    const reports = section('Reporting relationships');
    if (node.children.length) for (const child of node.children) reports.append(relationButton(child));
    else reports.append(el('p', '', 'No direct reports in this view.'));
    if (node.reportedCount !== node.children.length) reports.append(el('p', 'small-note',
      `The original data reports ${node.reportedCount} direct report(s); ${node.children.length} are present in this view.`));
    const focusButton = el('button', 'focus-button', 'Center on this person ↗');
    focusButton.addEventListener('click', () => this.engine()?.focus(index));
    card.append(focusButton, el('p', 'small-note',
      'The network continues moving during inspection. Use Pause motion to hold the scene.'));
    $('profile-content').replaceChildren(card); showScreen('profile');
    $('profile-panel').scrollTop = 0; name.focus({preventScroll: true});
    announce(`${node.name} selected. ${engine.running ? 'Simulation continues.' : 'Simulation is paused.'}`);
  }
}

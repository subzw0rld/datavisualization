import {$} from './dom.js';
export type Screen = 'directory' | 'profile' | 'legend';
export function showScreen(next: Screen): void {
  $('directory-panel').hidden = next !== 'directory';
  $('profile-panel').hidden = next !== 'profile';
  $('legend-panel').hidden = next !== 'legend';
  $('directory-tab').setAttribute('aria-pressed', String(next === 'directory'));
  $('legend-tab').setAttribute('aria-pressed', String(next === 'legend'));
}

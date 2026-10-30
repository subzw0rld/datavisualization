export function $(id: string): HTMLElement;
export function $<T extends HTMLElement>(id: string): T;
export function $(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element;
}
export function text(id: string, value: string): void { $(id).textContent = value; }
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = content;
  return node;
}
export function announce(message: string): void { text('announcement', message); }

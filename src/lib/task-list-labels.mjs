/**
 * Gives Markdown task-list checkboxes (`- [ ] item`) an accessible name.
 *
 * GFM renders `<li class="task-list-item"><input type="checkbox" disabled> text</li>`:
 * the checkbox has no label, so a screen reader announces just "checkbox, not checked".
 * This wraps the checkbox and the inline text after it in a <label>, stopping at the
 * first block element (a nested list, for instance), which a <label> may not contain.
 *
 * Runs as a hast plugin of Sätteri, Astro's Markdown/MDX processor (see astro.config.mjs).
 */

/** Elements that end the label: everything that is not phrasing content. */
const BLOCK = new Set([
  'ul', 'ol', 'p', 'div', 'pre', 'blockquote', 'table', 'figure', 'details',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'section', 'aside',
]);

/** @param {any} node */
const isCheckbox = (node) =>
  node?.type === 'element' && node.tagName === 'input' && node.properties?.type === 'checkbox';

/** @param {any} node */
const isTaskItem = (node) => {
  const cls = node?.properties?.className;
  const list = Array.isArray(cls) ? cls : typeof cls === 'string' ? cls.split(/\s+/) : [];
  return node?.type === 'element' && node.tagName === 'li' && list.includes('task-list-item');
};

/**
 * Children with the checkbox and its inline text wrapped in a <label>,
 * or null when there is no checkbox among them.
 * @param {any[]} children
 */
function wrapChildren(children) {
  const start = children.findIndex(isCheckbox);
  if (start < 0) return null;
  let end = start + 1;
  while (end < children.length) {
    const c = children[end];
    if (c.type === 'element' && BLOCK.has(c.tagName)) break;
    end++;
  }
  const label = {
    type: 'element',
    tagName: 'label',
    properties: { className: ['task-list-label'] },
    children: children.slice(start, end),
  };
  return [...children.slice(0, start), label, ...children.slice(end)];
}

/**
 * A copy of a task-list <li> with its checkbox labelled, or null if nothing changes.
 * Tight lists keep the checkbox in the <li>; loose lists keep it in the first <p>.
 * @param {any} li
 */
export function labelTaskItem(li) {
  if (!isTaskItem(li)) return null;
  const children = li.children ?? [];
  const direct = wrapChildren(children);
  if (direct) return { ...li, children: direct };
  const i = children.findIndex((/** @type {any} */ c) => c.type === 'element' && c.tagName === 'p');
  if (i < 0) return null;
  const inner = wrapChildren(children[i].children ?? []);
  if (!inner) return null;
  const next = [...children];
  next[i] = { ...children[i], children: inner };
  return { ...li, children: next };
}

/** Sätteri hast plugin: replaces each task-list <li> with its labelled copy. */
export const taskListLabels = {
  name: 'task-list-labels',
  element: {
    filter: ['li'],
    /** @param {any} node */
    visit(node) {
      return labelTaskItem(node) ?? undefined;
    },
  },
};

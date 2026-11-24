import { describe, expect, it } from 'vitest';
import { labelTaskItem } from '~/lib/task-list-labels.mjs';

const el = (tagName: string, properties: Record<string, unknown>, children: unknown[] = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const text = (value: string) => ({ type: 'text', value });
const checkbox = () => el('input', { type: 'checkbox', disabled: true });
const task = (children: unknown[]) => el('li', { className: ['task-list-item'] }, children);

describe('labelTaskItem', () => {
  it('wraps the checkbox and its text in a label', () => {
    const out = labelTaskItem(task([checkbox(), text(' Login '), el('code', {}, [text('ok')])]));
    expect(out.children).toHaveLength(1);
    expect(out.children[0].tagName).toBe('label');
    expect(out.children[0].children.map((c: any) => c.tagName ?? c.value)).toEqual(['input', ' Login ', 'code']);
  });

  it('stops before a nested list', () => {
    const nested = el('ul', {}, [el('li', {}, [text('child')])]);
    const out = labelTaskItem(task([checkbox(), text(' Parent'), nested]));
    expect(out.children.map((c: any) => c.tagName)).toEqual(['label', 'ul']);
  });

  it('handles loose lists, where the checkbox is inside a paragraph', () => {
    const out = labelTaskItem(task([el('p', {}, [checkbox(), text(' Loose item')])]));
    expect(out.children[0].children[0].tagName).toBe('label');
  });

  it('accepts a class string as well as a class list', () => {
    const li = el('li', { className: 'task-list-item' }, [checkbox(), text(' Item')]);
    expect(labelTaskItem(li)?.children[0].tagName).toBe('label');
  });

  it('leaves ordinary list items alone', () => {
    expect(labelTaskItem(el('li', {}, [text('Plain')]))).toBeNull();
    expect(labelTaskItem(task([text('No checkbox')]))).toBeNull();
  });
});

import { setState, type State } from '~/lib/store';
import { Inline } from './Inline';

export interface Item {
  id: string;
  text: string;
}

export function toggleCheck(id: string, on: boolean) {
  setState((s) => {
    const checks = { ...s.checks };
    if (on) checks[id] = true;
    else delete checks[id];
    return { ...s, checks };
  });
}

export const countDone = (state: State, items: Item[]) => items.filter((i) => state.checks[i.id]).length;

/** A list of persistent checkboxes. */
export function CheckList({ items, state }: { items: Item[]; state: State }) {
  return (
    <ul className="bcc-checks">
      {items.map((item) => (
        <li key={item.id}>
          <label>
            <input type="checkbox" checked={!!state.checks[item.id]} onChange={(e) => toggleCheck(item.id, e.target.checked)} />
            <span>
              <Inline text={item.text} />
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

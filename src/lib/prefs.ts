/**
 * Guide preferences: how the visitor builds (terminal or desktop app), how much detail they want,
 * and which tools they use. The guide adapts by showing or hiding blocks with CSS, driven by
 * `data-*` attributes on <html> that an inline script sets before the page paints (no flash).
 *
 * This module is the single source for the axes, their allowed values and the recommended
 * defaults. The inline head script and the visibility CSS are generated from it, so the three
 * cannot drift apart.
 */

/** Choice axes. The first value listed is not special: `recommended` is the default. */
export const AXES = {
  surface: { values: ['terminal', 'desktop'], recommended: 'terminal' },
  level: { values: ['guided', 'standard', 'expert'], recommended: 'standard' },
  security: { values: ['baseline', 'hardened'], recommended: 'baseline' },
  focus: { values: ['function', 'balanced', 'polish'], recommended: 'balanced' },
  deps: { values: ['lean', 'standard'], recommended: 'standard' },
} as const;

export type Axis = keyof typeof AXES;
export type AxisValue<A extends Axis> = (typeof AXES)[A]['values'][number];

/** Optional tools the playbook uses. `true` = recommended to use it. */
export const TOOLS = { github: true, vercel: true, supabase: true, sentry: true, docker: false } as const;
export type Tool = keyof typeof TOOLS;

export type Prefs = { [A in Axis]: AxisValue<A> } & { tools: Record<Tool, boolean> };

export const AXIS_NAMES = Object.keys(AXES) as Axis[];
export const TOOL_NAMES = Object.keys(TOOLS) as Tool[];

export function defaultPrefs(): Prefs {
  const p = Object.fromEntries(AXIS_NAMES.map((a) => [a, AXES[a].recommended])) as Omit<Prefs, 'tools'>;
  return { ...p, tools: { ...TOOLS } } as Prefs;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Accepts anything (old exports, hand-edited files) and returns valid preferences. */
export function normalizePrefs(raw: unknown): Prefs {
  const d = defaultPrefs();
  if (!isObj(raw)) return d;
  const out = { ...d, tools: { ...d.tools } } as Record<string, unknown> & Prefs;
  for (const a of AXIS_NAMES) {
    if ((AXES[a].values as readonly string[]).includes(raw[a] as string)) out[a] = raw[a] as never;
  }
  const t = isObj(raw.tools) ? raw.tools : {};
  for (const tool of TOOL_NAMES) if (typeof t[tool] === 'boolean') out.tools[tool] = t[tool] as boolean;
  return out;
}

/** True when every choice equals the recommended one. */
export function isRecommended(p: Prefs): boolean {
  const d = defaultPrefs();
  return AXIS_NAMES.every((a) => p[a] === d[a]) && TOOL_NAMES.every((t) => p.tools[t] === d.tools[t]);
}

/** The attributes set on <html>: data-surface="desktop", data-tool-docker="off", ... */
export function prefsAttributes(p: Prefs): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const a of AXIS_NAMES) attrs[`data-${a}`] = p[a];
  for (const t of TOOL_NAMES) attrs[`data-tool-${t}`] = p.tools[t] ? 'on' : 'off';
  return attrs;
}

/**
 * CSS that hides conditional blocks. A block lists the values it is for, e.g.
 * `<div data-only-level="guided standard">` or `data-only-tool="!docker"`. When <html> has no
 * attribute yet (JavaScript off), the recommended value applies.
 */
export function visibilityCss(): string {
  const rules: string[] = [];
  for (const a of AXIS_NAMES) {
    for (const v of AXES[a].values) {
      const html = v === AXES[a].recommended ? `html:is([data-${a}="${v}"],:not([data-${a}]))` : `html[data-${a}="${v}"]`;
      rules.push(`${html} [data-only-${a}]:not([data-only-${a}~="${v}"])`);
    }
  }
  for (const t of TOOL_NAMES) {
    const on = TOOLS[t] ? `html:is([data-tool-${t}="on"],:not([data-tool-${t}]))` : `html[data-tool-${t}="on"]`;
    const off = TOOLS[t] ? `html[data-tool-${t}="off"]` : `html:is([data-tool-${t}="off"],:not([data-tool-${t}]))`;
    rules.push(`${on} [data-only-tool~="!${t}"]`, `${off} [data-only-tool~="${t}"]`);
  }
  return `${rules.join(',\n')} { display: none !important; }`;
}

/**
 * Inline script for <head>: reads the saved preferences from localStorage and sets the
 * attributes before first paint. Self-contained (no imports) and tolerant of blocked storage.
 */
export function headScript(storeKey: string): string {
  const axes = Object.fromEntries(AXIS_NAMES.map((a) => [a, [AXES[a].values, AXES[a].recommended]]));
  return `(function(){var A=${JSON.stringify(axes)},T=${JSON.stringify(TOOLS)},p={};try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
    storeKey,
  )})||'{}');p=s&&s.prefs||{}}catch(e){}var h=document.documentElement;for(var a in A){h.setAttribute('data-'+a,A[a][0].indexOf(p[a])>=0?p[a]:A[a][1])}var t=p.tools||{};for(var k in T){h.setAttribute('data-tool-'+k,(typeof t[k]==='boolean'?t[k]:T[k])?'on':'off')}})();`;
}

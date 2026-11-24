/**
 * Keeps code blocks that scroll sideways reachable by keyboard (WCAG 2.1.1).
 *
 * Expressive Code gives an overflowing <pre> tabindex="0" and role="region", but it only
 * re-checks when the block's box changes size. When the web fonts arrive late, the code can
 * start overflowing without the box resizing, and the block is left unfocusable. This runs
 * the same check once the fonts have loaded.
 */
function markScrollableCode() {
  document.querySelectorAll<HTMLElement>('.expressive-code pre').forEach((pre) => {
    if (pre.scrollWidth > pre.clientWidth && !pre.hasAttribute('tabindex')) {
      pre.setAttribute('tabindex', '0');
      pre.setAttribute('role', 'region');
    }
  });
}

document.fonts.ready.then(markScrollableCode);

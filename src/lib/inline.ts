/** Escapes HTML and turns `backticks` into <code>, for short UI strings that mention commands. */
export function inlineCode(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return esc.replace(/`([^`]+)`/g, '<code>$1</code>');
}

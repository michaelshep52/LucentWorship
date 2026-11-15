/** Destructive builder shortcuts must not leak out of editing fields or dialogs. */
export function getBuilderCommand(event) {
  if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.shiftKey) return null;
  const target = event.target;
  if (target?.isContentEditable || target?.closest?.('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="slider"], [role="dialog"], [role="alertdialog"]')) return null;
  if (event.ctrlKey || event.metaKey) {
    if (event.key === 'd' || event.key === 'D') return 'duplicate';
    if (event.key === 'ArrowUp') return 'move-up';
    if (event.key === 'ArrowDown') return 'move-down';
    return null;
  }
  return event.key === 'Delete' || event.key === 'Backspace' ? 'delete' : null;
}

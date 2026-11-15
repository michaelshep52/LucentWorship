/** Layout-scoped registration. Cleanup from an old route cannot remove a newer guard. */
export function createEditorNavigationGuard() {
  let current = null;
  return {
    registerLeaveGuard(check, onBlocked) {
      const registration = { check, onBlocked };
      current = registration;
      return () => { if (current === registration) current = null; };
    },
    handleLinkClick(event) {
      // Opening a separate tab/window does not discard the current editor.
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (!current) return;
      const reason = current.check();
      if (!reason) return;
      event.preventDefault();
      current.onBlocked(reason);
    },
  };
}

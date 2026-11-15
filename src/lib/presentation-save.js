/** Serialize explicit saves synchronously, before React can disable either Save button.
 * No automatic retries: a rejected request may already have reached the server.
 */
export function createPresentationSaveGuard() {
  let busy = false;
  return {
    isSaving: () => busy,
    async run(work) {
      if (busy) return { status: 'busy' };
      busy = true;
      try { return { status: 'saved', value: await work() }; }
      catch { return { status: 'uncertain' }; }
      finally { busy = false; }
    },
  };
}

/** Browser may show a leave warning; this does not cancel an already-sent request. */
export function protectPendingSave(event, saving) {
  if (!saving) return;
  event.preventDefault();
  event.returnValue = '';
}

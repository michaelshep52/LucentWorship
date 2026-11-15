/** Shared loading boundary for browser and future native audience controllers.
 * Cancellation suppresses stale results; it does not cancel backend transport.
 */
export function loadLivePresentation(id, fetchPresentation, publish) {
  let active = true;
  publish({ status: id ? 'loading' : 'idle', presentation: null, error: '' });
  if (id) {
    Promise.resolve()
      .then(() => active ? fetchPresentation(id) : null)
      .then((rows) => {
        if (!active) return;
        const presentation = rows?.[0];
        if (!presentation || String(presentation.id) !== String(id)) {
          throw new Error('This presentation is no longer available. Select another presentation or retry.');
        }
        if (!Array.isArray(presentation.slides) || presentation.slides.some(slide => !slide || typeof slide !== 'object' || Array.isArray(slide))) {
          throw new Error('This presentation contains invalid slides. Open it in the editor before presenting.');
        }
        publish({ status: 'ready', presentation, error: '' });
      })
      .catch(() => {
        if (active) publish({ status: 'error', presentation: null, error: 'Unable to load this presentation. Check your connection and retry, or select another presentation.' });
      });
  }
  return () => { active = false; };
}

/** One in-flight write; later requests coalesce to the newest detached snapshot.
 * A failed/uncertain write pauses the queue until an explicit user save.
 * Disposing drops queued work, not a write already sent to the server.
 */
export function createSnapshotSaveQueue({ write, onSaved, onState }) {
  let pending = null;
  let active = false;
  let paused = false;
  let disposed = false;
  const notify = phase => { if (!disposed) onState(phase); };
  async function pump() {
    if (active || paused || disposed || !pending) return;
    const snapshot = pending;
    pending = null;
    active = true;
    notify('saving');
    try {
      await write(snapshot);
    } catch {
      active = false;
      if (disposed) return;
      pending = pending || snapshot;
      paused = true;
      notify('paused');
      return;
    }
    active = false;
    if (disposed) return;
    onSaved(snapshot);
    if (pending) void pump();
    else notify('idle');
  }
  return {
    status: () => disposed ? 'closed' : paused ? 'paused' : active ? 'saving' : 'idle',
    hasUnconfirmedWork: () => !disposed && (active || paused || pending !== null),
    request(snapshot, { explicit = false } = {}) {
      if (disposed) return false;
      // Clone before changing queue state so invalid input cannot lose queued work.
      const copy = structuredClone(snapshot);
      if (!copy || typeof copy !== 'object') throw new Error('A document snapshot is required.');
      pending = copy;
      if (explicit) paused = false;
      void pump();
      return true;
    },
    dispose() { disposed = true; pending = null; },
  };
}

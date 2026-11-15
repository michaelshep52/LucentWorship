/** Translate shortcuts only when focus is not being used for editing or a control. */
export function getLiveCommand(event) {
  if (event.defaultPrevented || event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return null;
  const target = event.target;
  if (target?.isContentEditable || target?.closest?.('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="slider"], [role="combobox"]')) return null;
  const commands = { ArrowRight: 'next', ArrowDown: 'next', ' ': 'next', ArrowLeft: 'previous', ArrowUp: 'previous', b: 'blank', B: 'blank', Escape: 'unblank', p: 'presenter', P: 'presenter' };
  return Object.hasOwn(commands, event.key) ? commands[event.key] : null;
}
export function countdownDuration(minutes, seconds) {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 99 || !Number.isInteger(seconds) || seconds < 0 || seconds > 59 || minutes + seconds === 0) {
    throw new Error('Enter 0–99 whole minutes and 0–59 whole seconds, with a duration greater than zero.');
  }
  return minutes * 60 + seconds;
}
/** Deadline-based timer: delayed callbacks cannot stretch the countdown.
 * Generation guards also suppress queued callbacks from a stopped/restarted timer.
 */
export function createCountdownController({ now = () => performance.now(), schedule = callback => setInterval(callback, 250), cancel = handle => clearInterval(handle), onChange }) {
  let handle = null;
  let generation = 0;
  let disposed = false;
  function clear() {
    generation++;
    if (handle !== null) cancel(handle);
    handle = null;
  }
  return {
    start(minutes, seconds) {
      if (disposed) throw new Error('Countdown is closed.');
      const total = countdownDuration(minutes, seconds);
      clear();
      const token = generation;
      const deadline = now() + total * 1000;
      handle = schedule(() => {
        if (disposed || token !== generation) return;
        const remaining = Math.max(0, Math.min(total, Math.ceil((deadline - now()) / 1000)));
        if (!remaining) clear();
        onChange(remaining, remaining > 0);
      });
      onChange(total, true);
    },
    stop() {
      if (disposed) return;
      clear();
      onChange(0, false);
    },
    dispose() { clear(); disposed = true; },
  };
}

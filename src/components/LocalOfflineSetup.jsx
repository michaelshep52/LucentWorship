import { useState } from 'react';

/** Explicit opt-in: never register from the existing cloud app or audience route. */
export default function LocalOfflineSetup() {
  const [status, setStatus] = useState('Offline launch has not been checked in this tab.');
  const [pending, setPending] = useState(false);
  async function prepare() {
    if (pending) return;
    setPending(true);
    try {
      if (!import.meta.env.PROD) throw new Error('Offline launch is available in a production preview build, not the development server.');
      if (!('serviceWorker' in navigator) || !window.isSecureContext) throw new Error('This browser requires HTTPS or localhost for offline launch.');
      const script = new URL('/lucent-local-sw.js', window.location.origin).href;
      const existing = await navigator.serviceWorker.getRegistration('/');
      const previous = existing?.active || existing?.waiting || existing?.installing;
      if (previous && previous.scriptURL !== script) throw new Error('Another offline application controls this address; it was not changed.');
      const registration = await navigator.serviceWorker.register(script, { scope: '/', updateViaCache: 'none' });
      if (registration.installing) {
        const installing = registration.installing;
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => { installing.removeEventListener('statechange', check); reject(new Error('Preparation has not finished. Reconnect and check again before relying on offline launch.')); }, 30000);
          function check() {
            if (!['installed', 'activated', 'redundant'].includes(installing.state)) return;
            clearTimeout(timeout); installing.removeEventListener('statechange', check);
            if (installing.state === 'redundant') reject(new Error('Offline installation failed. Existing local songs were not changed.'));
            else resolve(undefined);
          }
          installing.addEventListener('statechange', check); check();
        });
      }
      if (registration.waiting) setStatus('Offline update downloaded. Close all Lucent tabs before reopening to activate it; do not interrupt a live rehearsal.');
      else if (registration.active) setStatus('Offline app files installed. Verify by reopening this local library without the server. Songs still need separate backups; media and the cloud app are not included.');
      else setStatus('App files downloaded; activation is pending. Check again before relying on offline launch.');
    } catch (error) { setStatus(error.message || 'Offline preparation failed.'); }
    finally { setPending(false); }
  }
  return <section className="my-4 rounded border border-slate-600 p-3" aria-label="Offline launch setup">
    <button className="rounded border border-slate-500 px-3 py-2 disabled:opacity-40" disabled={pending} onClick={prepare}>{pending ? 'Preparing offline launch…' : 'Prepare offline launch'}</button>
    <p role="status" className="mt-2 text-sm">{status}</p>
  </section>;
}

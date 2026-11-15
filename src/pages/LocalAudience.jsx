import { useEffect, useState } from 'react';
import { emptyAudienceState, receiveFreshAudienceState, expireAudienceState, suspendAudienceState } from '../lib/audience-protocol';

export default function LocalAudience() {
  const [display, setDisplay] = useState(emptyAudienceState);
  useEffect(() => {
    const session = new URLSearchParams(window.location.hash.slice(1)).get('session');
    // Invalid/unsupported/closed sessions remain black, with no operator text projected.
    if (!/^[0-9a-f-]{36}$/i.test(session || '') || typeof BroadcastChannel === 'undefined') return;
    let channel;
    try { channel = new BroadcastChannel(`lucent-audience-${session}`); } catch { return; }
    let current = suspendAudienceState(emptyAudienceState(), crypto.randomUUID());
    const send = message => { try { channel.postMessage(message); } catch { current = suspendAudienceState(current, crypto.randomUUID()); setDisplay(current); } };
    const requestFresh = () => { if (!current.stopped && !document.hidden) send({ version: 1, session, type: 'request', requestId: current.awaitingToken || undefined }); };
    const suspend = () => { current = suspendAudienceState(current, crypto.randomUUID()); setDisplay(current); };
    const resume = () => { suspend(); requestFresh(); };
    const visibility = () => { if (document.hidden) suspend(); else resume(); };
    channel.onmessage = event => {
      if (document.hidden) return;
      const next = receiveFreshAudienceState(current, event.data, session, performance.now(), () => crypto.randomUUID());
      if (next === current) return;
      current = next; setDisplay(next);
      if (current.awaitingToken) { requestFresh(); return; }
      send({ version: 1, session, type: 'ack', sequence: next.sequence });
    };
    requestFresh();
    const timer = setInterval(() => {
      if (!current.awaitingToken && expireAudienceState(current, performance.now()) !== current) suspend();
      requestFresh();
    }, 1000);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', suspend);
    window.addEventListener('pageshow', resume);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', suspend); window.removeEventListener('pageshow', resume); channel.close(); };

  }, []);
  return <main className="fixed inset-0 bg-black text-white flex items-center justify-center p-[5vw]" aria-label="Lucent audience output">
    {!display.blank && <p className="whitespace-pre-wrap text-center leading-snug" style={{ fontSize: 'clamp(24px, 4vw, 72px)' }}>{display.content}</p>}
  </main>;
}

import { useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { audienceMessage, isAudienceControl, requestAudienceWindow } from '../lib/audience-protocol';
import { getLiveCommand } from '../lib/live-controls';
import { rehearsalTransition, jumpRehearsalSlide, rehearsalCues } from '../lib/local-library/song-presentation';

export default function LocalRehearsal({ rehearsal, onClose }) {
  const slideRef = useRef(null);
  const [session, setSession] = useState(() => crypto.randomUUID());
  const [audienceStatus, setAudienceStatus] = useState('Not opened');
  const channelRef = useRef(null);
  const sequenceRef = useRef(0);
  const snapshotRef = useRef({ content: '', blank: true });
  const acknowledgedRef = useRef(null);
  const acknowledgedSequenceRef = useRef(-1);
  const publishRef = useRef(null);
  useEffect(() => { slideRef.current?.focus(); }, []);
  const [state, setState] = useState({ index: 0, blank: false });
  const advance = useCallback(command => setState(previous => rehearsalTransition(previous, command, rehearsal.slides.length)), [rehearsal.slides.length]);
  useEffect(() => {
    const handle = event => {
      const command = getLiveCommand(event);
      if (['next', 'previous', 'blank', 'unblank'].includes(command)) { event.preventDefault(); advance(command); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [advance]);
  function jumpToSlide(event) {
    const index = Number(event.target.value);
    if (!Number.isInteger(index) || index < 0 || index >= rehearsal.slides.length) return;
    setState(previous => jumpRehearsalSlide(previous, index, rehearsal.slides.length));
    slideRef.current?.focus();
  }
  const slide = rehearsal.slides[state.index];
  const cues = rehearsalCues(rehearsal.slides, state.index);
  useLayoutEffect(() => { snapshotRef.current = { content: slide?.content || '', blank: state.blank || !slide }; }, [slide, state.blank]);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') { setAudienceStatus('This browser does not support a separate audience channel.'); return; }
    let channel;
    try { channel = new BroadcastChannel(`lucent-audience-${session}`); }
    catch { setAudienceStatus('Audience channel could not be opened.'); return; }
    channelRef.current = channel;
    sequenceRef.current = 0; acknowledgedRef.current = null; acknowledgedSequenceRef.current = -1;
    const publish = (stop = false, replyTo = null) => {
      try { channel.postMessage(audienceMessage(session, ++sequenceRef.current, snapshotRef.current, stop, replyTo)); }
      catch { setAudienceStatus('Audience update failed; output will blank if updates stop.'); }
    };
    publishRef.current = publish;
    channel.onmessage = event => {
      if (!isAudienceControl(event.data, session, sequenceRef.current)) return;
      if (event.data.type === 'request') publish(false, event.data.requestId ?? null);
      else if (event.data.sequence > acknowledgedSequenceRef.current) { acknowledgedSequenceRef.current = event.data.sequence; acknowledgedRef.current = performance.now(); setAudienceStatus('Audience window acknowledged a channel update.'); }
    };
    const timer = setInterval(() => {
      publish();
      if (acknowledgedRef.current !== null && performance.now() - acknowledgedRef.current > 5000) setAudienceStatus('No recent audience acknowledgment. Check the display.');
    }, 1000);
    const stop = () => publish(true);
    const resume = event => { if (event.persisted) { setSession(crypto.randomUUID()); setAudienceStatus('Browser restored the operator page. Reopen the audience window for a fresh session.'); } };
    window.addEventListener('pageshow', resume);
    window.addEventListener('pagehide', stop);
    return () => { stop(); clearInterval(timer); window.removeEventListener('pagehide', stop); window.removeEventListener('pageshow', resume); publishRef.current = null; channelRef.current = null; channel.onmessage = null; channel.close(); };
  }, [session]);
  useEffect(() => { publishRef.current?.(); }, [state.index, state.blank]);
  function openAudience() {
    if (!channelRef.current) { setAudienceStatus('Audience channel is unavailable.'); return; }
    const result = requestAudienceWindow({ origin: window.location.origin, session, openWindow: (...args) => window.open(...args) });
    setAudienceStatus(result.message);
    if (result.opened) publishRef.current?.();
  }
  return <main className="min-h-screen bg-slate-950 text-white p-5 space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-semibold">{rehearsal.title}</h1><p className="text-sm text-amber-200">Text-only rehearsal • experimental separate audience window</p></div>
      <button onClick={openAudience} className="rounded border px-4 py-2">Open audience window</button>
      <button onClick={onClose} className="rounded border px-4 py-2">Back to draft</button></header>
    <div ref={slideRef} tabIndex={0} onClick={event => event.currentTarget.focus()} className="mx-auto max-w-6xl aspect-video flex items-center justify-center bg-black border border-slate-700 p-8" aria-label={state.blank ? 'Blanked rehearsal slide' : 'Rehearsal slide'}>
      {!state.blank && <p className="whitespace-pre-wrap text-center text-2xl md:text-4xl leading-relaxed">{slide?.content || ''}</p>}
    </div>
    <p role="status" className="text-center text-amber-200">{audienceStatus} Move the audience window to the projector. This preview is not hardware-verified; stale updates are designed to blank output at a 10-second threshold (browser timers can be delayed).</p>
    <p role="status" className="text-center text-slate-300">{state.index + 1} / {rehearsal.slides.length} • {slide?.section_label}{state.blank ? ' • blanked' : ''}</p>
    <section aria-label="Operator-only lyric cues" className="grid gap-3 md:grid-cols-2">
      <div className="rounded border border-slate-700 p-4">
        <h2 className="font-semibold">Selected cue • operator only{state.blank ? ' • audience blanked' : ''}</h2>
        <p className="text-sm text-slate-400">{cues.current ? `${cues.current.number}. ${cues.current.label}` : 'No cue available'}</p>
        <p className="whitespace-pre-wrap mt-2">{cues.current?.content || ''}</p>
      </div>
      <div className="rounded border border-slate-700 p-4">
        <h2 className="font-semibold">Up next • operator only</h2>
        <p className="text-sm text-slate-400">{cues.next ? `${cues.next.number}. ${cues.next.label}` : 'End of rehearsal'}</p>
        <p className="whitespace-pre-wrap mt-2">{cues.next?.content || ''}</p>
      </div>
    </section>
    <label className="flex justify-center items-center gap-3 flex-wrap">
      <span>Jump to lyric page</span>
      <select aria-label="Jump to lyric page" value={state.index} onChange={jumpToSlide} className="max-w-full rounded border border-slate-600 bg-slate-900 px-3 py-2">
        {rehearsal.slides.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.section_label} • page {item.source_page}</option>)}
      </select>
    </label>
    <div className="flex justify-center gap-3 flex-wrap">
      <button onClick={() => advance('previous')} disabled={state.index === 0} className="rounded border px-4 py-2 disabled:opacity-40">Previous</button>
      <button onClick={() => advance('blank')} className="rounded border px-4 py-2">{state.blank ? 'Show slide' : 'Blank'}</button>
      <button onClick={() => advance('next')} disabled={state.index >= rehearsal.slides.length - 1} className="rounded border px-4 py-2 disabled:opacity-40">Next</button>
    </div>
    <p className="text-center text-sm text-slate-400">Click the slide to focus keyboard controls: arrow keys or Space navigate without changing blanking, B toggles blanking, Escape shows the slide. Jump directly to any lyric page without changing blanking. Draft changes are retained when you return.</p>
  </main>;
}

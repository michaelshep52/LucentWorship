import { useEffect, useRef, useState } from 'react';
import { createLocalLibrary, inspectLocalLibraryBackup } from '../lib/local-library/repository';
import { openLocalLibraryDatabase } from '../lib/local-library/indexeddb';
import { songEditorDraft, songDocumentFromDraft, newSongDocumentFromDraft, editorNavigationBlock } from '../lib/local-library/song-editor';

import { buildSongRehearsal, parseSectionOrder } from '../lib/local-library/song-presentation';
import LocalRehearsal from '../components/LocalRehearsal';

const buttonStyle = 'rounded border border-slate-500 px-3 py-2 disabled:opacity-40';
const inputStyle = 'w-full rounded border border-slate-500 bg-slate-900 p-2 text-white';

export default function LocalLibrary() {
  const [library, setLibrary] = useState(null);
  const [songs, setSongs] = useState([]);
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(() => songEditorDraft());
  const [rehearsal, setRehearsal] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Opening local storage…');
  const [error, setError] = useState('');
  const [restore, setRestore] = useState(null);
  const alive = useRef(true);
  const operation = useRef(false);

  useEffect(() => {
    let active = true;
    let driver;
    alive.current = true;
    openLocalLibraryDatabase().then(async opened => {
      driver = opened;
      if (!active) { opened.close(); return; }
      const repo = createLocalLibrary(opened);
      const rows = await repo.list('songs', { includeDeleted: true });
      if (active) { setLibrary(repo); setSongs(rows); setMessage('Local library ready. No sign-in or cloud library is required on this screen.'); }
    }).catch(reason => { if (active) { setError(reason.message); setMessage('Local library is unavailable. Nothing was sent to a server.'); } });
    return () => { active = false; alive.current = false; driver?.close(); };
  }, []);

  useEffect(() => {
    const protect = event => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty, busy]);

  async function run(work) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true); setError('');
    try { await work(); } catch (reason) { if (alive.current) setError(reason.message || 'The operation failed.'); }
    finally { operation.current = false; if (alive.current) setBusy(false); }
  }
  async function refresh() {
    const rows = await library.list('songs', { includeDeleted: true });
    if (alive.current) setSongs(rows);
  }
  function choose(next) {
    if (dirty) { setError('Save your changes or choose Discard changes before switching songs.'); return; }
    try { setDraft(songEditorDraft(next)); setRecord(next); setError(''); }
    catch (reason) { setError(reason.message); }
  }
  function edit(field, value) { setDraft(previous => ({ ...previous, [field]: value })); setDirty(true); }
  function editSection(index, field, value) {
    edit('sections', draft.sections.map((section, i) => i === index ? { ...section, [field]: value } : section));
  }
  function save(asCopy = false) { run(async () => {
    const document = asCopy ? newSongDocumentFromDraft(draft, record?.document) : songDocumentFromDraft(draft, record?.document);
    const id = asCopy ? crypto.randomUUID() : record?.id || crypto.randomUUID();
    const saved = await library.save('songs', id, document, { expectedRevision: asCopy ? 0 : record?.revision ?? 0 });
    if (!alive.current) return;
    setRecord(saved); setDraft(songEditorDraft(saved)); setDirty(false); setMessage('Song saved on this device. Export a backup to keep another copy.');
    await refresh();
  }); }
  function discard() {
    try { setDraft(songEditorDraft(record)); setDirty(false); setError(''); } catch (reason) { setError(reason.message); }
  }
  function archive(next, deleted) { run(async () => {
    if (dirty) throw new Error('Save or discard your draft before changing the library.');
    await library.setDeleted('songs', next.id, deleted, { expectedRevision: next.revision });
    if (!alive.current) return;
    if (record?.id === next.id) { setRecord(null); setDraft(songEditorDraft()); }
    setMessage(deleted ? 'Song moved to the recoverable archive.' : 'Song restored.');
    await refresh();
  }); }
  function download() { run(async () => {
    const text = await library.exportBackup();
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `lucent-library-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (alive.current) setMessage('Document-only backup download requested. Check that the file was saved; media files and unsaved edits are not included.');
  }); }
  function previewRestore(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setRestore(null);
    run(async () => {
      if (dirty) throw new Error('Save or discard your draft before restoring.');
      if (file.size > 16 * 1024 * 1024) throw new Error('Backup exceeds the 16 MiB limit.');
      const text = await file.text();
      const summary = inspectLocalLibraryBackup(text);
      if (alive.current) setRestore({ text, summary });
    });
  }
  function confirmRestore() { run(async () => {
    await library.restoreIntoEmptyLibrary(restore.text);
    if (!alive.current) return;
    setRestore(null); setMessage('Documents restored into the empty local library. Media bytes were not included.');
    await refresh();
  }); }

  function previewRehearsal() {
    try {
      const document = songDocumentFromDraft(draft, record?.document);
      setRehearsal(buildSongRehearsal(document, parseSectionOrder(draft.rehearsalOrder, document.sections.length)));
      setError('');
    } catch (reason) { setError(reason.message); }
  }
  if (rehearsal) return <LocalRehearsal rehearsal={rehearsal} onClose={() => setRehearsal(null)} />;

  return <main className="min-h-screen bg-slate-950 text-slate-100 p-5 md:p-8">
    <div className="mx-auto max-w-6xl space-y-5">
      <header><p className="text-sm text-amber-300">Local-first preview • separate from your existing cloud library</p><h1 className="text-3xl font-semibold">Lucent local song library</h1>
        <p className="mt-2 text-slate-300">Draft songs and arrangements on this device without a cloud account. This preview does not yet provide offline app launch or media storage. Separate audience output is experimental and not projector-verified. Clearing browser/site data can remove this library; keep backups.</p>
        <a href="/" className="inline-block mt-2 underline" onClick={event => {
          const reason = editorNavigationBlock({ dirty, busy });
          if (reason) { event.preventDefault(); setError(reason); }
        }}>Return to existing app</a></header>
      <p role="status">{message}</p>{error && <p role="alert" className="rounded border border-red-400 p-3 text-red-200">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button className={buttonStyle} disabled={!library || busy || dirty} onClick={() => choose(null)}>New song</button>
        <button className={buttonStyle} disabled={!library || busy || dirty} onClick={() => run(refresh)}>Refresh library</button>
        <button className={buttonStyle} disabled={!library || busy || dirty} onClick={download}>Download document backup</button>
        <label className={buttonStyle}>Inspect backup <input type="file" accept=".json,application/json" className="block text-sm mt-1" disabled={!library || busy || dirty} onChange={previewRestore}/></label>
      </div>
      {restore && <section className="rounded border border-amber-300 p-4 space-y-2" aria-label="Restore preview">
        <h2 className="font-semibold">Restore preview</h2><p>{restore.summary.totalRecords} documents; media bytes are not included. Restore only succeeds if the entire local library is empty, including archived records. Nothing will be overwritten.</p>
        <button className={buttonStyle} disabled={busy || dirty} onClick={confirmRestore}>Restore into empty library</button>{' '}
        <button className={buttonStyle} disabled={busy} onClick={() => setRestore(null)}>Cancel restore</button>
      </section>}
      <div className="grid md:grid-cols-[18rem_1fr] gap-6">
        <aside className="space-y-3"><h2 className="text-xl">Songs</h2>{!songs.length && <p className="text-slate-400">No local songs yet.</p>}
          {songs.map(song => <div key={song.id} className="rounded border border-slate-700 p-3 space-y-2">
            <p>{typeof song.document.title === 'string' ? song.document.title : 'Unsupported song'}{song.deleted ? ' (archived)' : ''}</p>
            {!song.deleted && <button className={buttonStyle} disabled={busy || dirty} onClick={() => choose(song)}>Edit</button>}{' '}
            <button className={buttonStyle} disabled={busy || dirty} onClick={() => archive(song, !song.deleted)}>{song.deleted ? 'Restore' : 'Archive'}</button>
          </div>)}
        </aside>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); save(); }}>
          <h2 className="text-xl">{record ? 'Edit song' : 'New song'}{dirty ? ' • unsaved' : ''}</h2>
          <fieldset disabled={!library || busy} className="space-y-4">
            <label className="block">Title<input className={inputStyle} value={draft.title} onChange={event => edit('title', event.target.value)} required /></label>
            <label className="block">Artist / writer<input className={inputStyle} value={draft.artist} onChange={event => edit('artist', event.target.value)}/></label>
            {draft.sections.map((section, index) => <section key={index} className="rounded border border-slate-700 p-3 space-y-2">
              <label className="block">Section {index + 1} label<input className={inputStyle} value={section.label || ''} onChange={event => editSection(index, 'label', event.target.value)}/></label>
              <label className="block">Lyrics<textarea className={inputStyle} rows={6} value={section.lyrics} onChange={event => editSection(index, 'lyrics', event.target.value)}/></label>
            </section>)}
            <label className="block">Rehearsal order (optional, e.g. 1,2,1,2)
              <input className={inputStyle} value={draft.rehearsalOrder} onChange={event => edit('rehearsalOrder', event.target.value)} placeholder="Blank uses sections in the order shown" />
              <span className="block text-sm text-slate-400">Saved with this song on this device. Uses these section numbers, not imported arrangement metadata. Repeated numbers repeat a chorus or verse.</span>
            </label>
            <button type="button" className={buttonStyle} onClick={previewRehearsal}>Rehearse current draft</button>{' '}
            <button type="button" className={buttonStyle} onClick={() => edit('sections', [...draft.sections, { type: 'verse', label: `Section ${draft.sections.length + 1}`, lyrics: '' }])}>Add section</button>{' '}
            <button type="submit" className={buttonStyle}>Save on this device</button>{' '}
            {record && <><button type="button" className={buttonStyle} onClick={() => save(true)}>Save draft as a new song</button>{' '}</>}
            <button type="button" className={buttonStyle} disabled={!dirty} onClick={discard}>Discard changes</button>
          </fieldset>
        </form>
      </div>
    </div>
  </main>;
}

# Local song-library preview

This is an opt-in development preview, not a production release. Existing cloud-backed screens remain at `/`; no records are copied from, changed in, or deleted from Supabase.

Using the existing development setup (`npm run dev`), open `/local-library` on the printed local URL. Keep the origin/port stable: browser storage belongs to that origin. This route dynamically loads the local screen rather than the Supabase application, and its shared CSS does not import Google Fonts. No online account is required by the local screen.

## Included
- Local song titles, writers and multiple labeled lyric sections.
- Text-only rehearsal of the current draft with explicit section-number order (including repeated choruses), pagination, previous/next and blank/show controls. Draft state is retained on return; preview does not save or change arrangement metadata.
- Metadata-preserving edits; unsupported song structures are refused, not silently rewritten.
- Save/discard and navigation safeguards, explicit save-as-new-song conflict recovery, recoverable archive/restore, revision conflicts, and manual library refresh.
- Document-only JSON backup downloads and inspection before restoring into an empty library. Media bytes and unsaved edits are excluded.

## Important limits
- The isolated IndexedDB harness passed in actual Chrome. The React preview, audience popup and projector behavior have NOT been verified.
- This route uses the new isolated `lucent-local-library-v1` browser database. Clearing browser/site data can erase it. Export backups; do not entrust the only copy of important content to this preview.
- There is no service-worker app-shell cache yet, so cold launching without a running/reachable web app is not implemented. Local storage does not itself guarantee offline application launch.
- Separate audience output is experimental. No native installer, mobile packaging, media-byte storage, sync service, or Supabase migration is supplied.
- Full project typecheck and 112 Node tests pass. Production build has timed out; aggregate lint is not a release pass. Existing installed packages are used without installing anything.

## Next browser verification
The isolated `tests/browser/local-library.html` persistence harness has passed in Chrome. Next use the development app route and verify: create/save/reopen, rapid double-save, editing without sign-in, switch/discard guards, archive/restore, backup inspection/cancel, failed restore into a populated library, and persistence after restart. Test real browser quota/denial and network-off behavior before declaring offline readiness.

## Experimental separate audience window
From text rehearsal, Open audience window requests a same-origin browser popup at /local-audience. Move it to the projector manually. It shares only current text/blank state over a session-scoped BroadcastChannel on this device; it is not remote mobile control or a cross-device transport.

Initial/invalid sessions render black. State sequence checks reject duplicate/stale messages; explicit operator exit stops the session, and audience-side stale detection is designed to blank after a 10-second threshold. Browser background/sleep timer behavior can delay detection; no guaranteed hardware fail-safe or latency is claimed. Operator acknowledgments mean a message was accepted, not proof that a projector painted it.

Popup-block and unavailable-channel paths report an error rather than claiming success. Returning to the draft stops the session; canceling a navigation prompt does not terminate it. No real popup, BroadcastChannel, monitor or sleep/resume tests have been run. This remains an experimental opt-in preview and must be rehearsed on actual hardware before use in a service.

After audience visibility suspension or stale detection, fresh handshake proof is required before lyrics resume. A restored operator page creates a new session; reopen the audience window. These protections have automated protocol tests but not real-browser lifecycle verification.

Verification update: the isolated persistence harness has now passed in actual Chrome through the supported extension (close/reopen, competing writers, abort rollback, archive/restore, backup scope and overwrite refusal). This is not verification of the React preview or real two-window presentation. The audience receiver additionally checks expiry inside incoming message handling, not only its timer, and requires a new handshake after expiry.

Blanking safety: Next/Previous and arrow/Space navigation retain an intentional blank screen, including at slide boundaries. Use Show slide, B, or Escape explicitly to reveal the selected cue. This behavior has automated transition/protocol regression coverage; actual projector verification is still outstanding.

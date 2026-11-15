# Lucent Worship: local-first product and migration direction

Owner direction, 2026-11-15: downloadable actual apps and Docker; a stronger live-music presentation experience inspired by slide editors and music presentation tools. Prioritize slide creation, lyrics/arrangements, media, dependable audience output, desktop/offline operation, and mobile editing/control. Supabase must not be required.

## Target architecture (not implemented yet)
- Keep shared React editor, lyric/arrangement logic and presentation-state core.
- Desktop native shell first, with separate operator/audience windows, monitor choice and safe blank output. Package per platform, not one universal executable.
- Local library is primary: songs, arrangements, setlists, slides, revision metadata and persistent media bytes, independent of an online account. Use a repository interface; IndexedDB for browser/mobile-web adapter and transactional local database/files for native adapters. Never use transient URLs as durable media storage.
- Optional self-hosted sync service in Docker: application API plus PostgreSQL and persistent object/file storage. Clients talk to the API, never connect directly to PostgreSQL or embed database credentials. Auth applies to shared sync, not local solo use.
- PWA for broad access, with deliberate app-shell caching; native desktop/mobile packages reuse the same core. Packaging alone does not make data available offline.
- No remote music/audio transport promised: MIDI, DAW timing and audio streaming are separate requirements to validate, not inferred from the inspiration.

## Non-destructive migration
1. Inventory existing Supabase schemas, records, asset URLs/bytes and access model through authorized read-only operations. Do not delete/reset or run setup SQL. Current source policy definitions are not evidence of actual deployed security.
2. Produce an export with schema version, counts, stable original identifiers, content checksums and a media manifest. Preserve originals and all user metadata; do not silently discard unfamiliar fields.
3. Validate export in an isolated local library. Missing assets stay explicit; do not label remote URL references offline-ready. Check song sections, arrangements, slide ordering and font/layout/media rendering against original examples.
4. Add adapter boundary and local-first entry path, including no-network first launch. Keep old Supabase adapter available for migration/recovery, not as runtime prerequisite.
5. Reconcile counts and hashes, replay representative services offline, test restart/recovery and backup restore. Ask owner to accept migrated copy before any retirement of old backend. No destructive cleanup is authorized by this plan.
6. Add optional sync with stable operation IDs, revisions, tombstones, conflict visibility and idempotent retries. Do not quietly overwrite newer edits from another device. Test dropped connections and simultaneous edits before claiming multi-device support.

## Release gates
- Passing aggregate lint/typecheck/build, regression tests and real-device UI tests.
- Separate display tested with disconnect/reconnect, sleep/wake, blank/unblank, rapid set changes and media failures.
- Airplane-mode launch, editing, saved set playback and media survive application restart; online login not required for local library.
- Backup/restore and interrupted migration recover without loss. Device storage quota/error paths visible.
- Desktop installers signed/notarized as applicable; mobile signing/store requirements handled separately. No publishing or deployment implied.
- Scripture translations require verified redistribution rights before bundling offline data.

## Implemented checkpoint (development branch, not production-ready)
- Opt-in local song library and text rehearsal, isolated IndexedDB repository, recoverable archive and document-only backup/empty-library restore. The isolated persistence harness passed in actual Chrome.
- Experimental same-device audience popup protocol with blanking, stale-session and fresh-handshake protections. Real popup/projector verification remains outstanding.
- Actual routed PresentationBuilder: validated cancellable loads; ordered/coalesced autosave with explicit recovery after uncertain writes; draft/sidebar protections; guarded keyboard commands; safe duplication and one-step deletion undo.
- Full project typecheck and 112 Node tests pass. Production build still times out; aggregate lint is not yet a release pass. Browser Back/Forward protection, durable draft recovery, native packaging, offline cold launch and persistent media remain open.
- Existing Supabase data/integration is preserved. Local preview does not require it; the legacy cloud app still does. No migration, installation or deployment performed.

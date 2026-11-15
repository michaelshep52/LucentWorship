import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Presentation } from "@/api/entities";
import { Plus, Radio, Save, ArrowLeft, Trash2, Copy, Eye } from "lucide-react";
import { MAX_LYRICS_CHARS_PER_PAGE, PRESENTATION_FONT_PX, paginateLyrics } from "@/lib/presentation-slides";
import { loadLivePresentation } from "@/lib/live-presentation";
import { createSnapshotSaveQueue } from "@/lib/snapshot-save-queue";
import { presentationLeaveReason } from "@/lib/presentation-draft";
import { protectPendingSave } from "@/lib/presentation-save";
import { getBuilderCommand } from "@/lib/builder-shortcuts";
import { duplicateSlideSelection } from "@/lib/slide-selection";
import { deleteSlidesWithUndo, canUndoSlideDeletion, undoSlideDeletion } from "@/lib/slide-deletion";
import SlideEditor from "../components/SlideEditor";
import SlidePreview from "../components/SlidePreview";
import ContentPickerModal from "../components/presentation/ContentPickerModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function PresentationBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const navigation = /** @type {{ registerLeaveGuard: (check: () => string, onBlocked: (reason: string) => void) => () => void } | null} */ (useOutletContext());
  const [presentation, setPresentation] = useState(null);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [deletionUndo, setDeletionUndo] = useState(null);
  const [selectedSlides, setSelectedSlides] = useState(new Set([0])); // multi-select set
  const [lastClickedIndex, setLastClickedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const saveQueue = useRef(null);
  const dirty = Boolean(presentation) && JSON.stringify(presentation) !== savedSnapshot;
  const dirtyRef = useRef(false);
  useLayoutEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  useEffect(() => {
    const protect = event => protectPendingSave(event, dirtyRef.current || Boolean(saveQueue.current?.queue.hasUnconfirmedWork()));
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, []);
  useEffect(() => {
    const queue = createSnapshotSaveQueue({
      write: snapshot => Presentation.update(id, snapshot),
      onSaved: snapshot => setSavedSnapshot(JSON.stringify(snapshot)),
      onState: phase => {
        setSaving(phase === 'saving');
        setSaveError(phase === 'paused' ? 'Save could not be confirmed. Your latest edits are retained here; autosave is paused. Check the library, then use Save explicitly when ready.' : '');
      },
    });
    saveQueue.current = { id, queue };
    setSaving(false); setSaveError('');
    return () => { queue.dispose(); if (saveQueue.current?.queue === queue) saveQueue.current = null; };
  }, [id]);
  useEffect(() => navigation?.registerLeaveGuard(() => {
    const phase = saveQueue.current?.queue.status();
    return presentationLeaveReason({ saving: phase === 'saving', uncertain: phase === 'paused', dirty: dirtyRef.current });
  }, setSaveError), [navigation]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [picker, setPicker] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);

  useEffect(() => {
    setLoadError(''); setDeletionUndo(null);
    if (!id) { setPresentation(null); setLoading(false); setLoadError('No presentation was selected.'); return; }
    return loadLivePresentation(id, selectedId => Presentation.filter({ id: selectedId }), state => {
      setLoading(state.status === 'loading');
      if (state.status === 'loading' || state.status === 'error') setPresentation(null);
      if (state.status === 'error') setLoadError(state.error);
      if (state.status === 'ready') {
        setPresentation(state.presentation);
        setSavedSnapshot(JSON.stringify(state.presentation));
        setSelectedSlide(0); setSelectedSlides(new Set([0])); setLastClickedIndex(0);
      }
    });
  }, [id, loadAttempt]);

  function save(updated, explicit = false) {
    const snapshot = updated || presentation;
    if (!snapshot || String(snapshot.id) !== String(id) || saveQueue.current?.id !== id) {
      setSaveError('The selected presentation is not ready to save.'); return;
    }
    try { saveQueue.current.queue.request(snapshot, { explicit }); }
    catch { setSaveError('This draft could not be prepared for saving. Your edits are retained.'); }
  }

  function navigateFromBuilder(path) {
    const phase = saveQueue.current?.queue.status();
    const reason = presentationLeaveReason({ saving: phase === 'saving', uncertain: phase === 'paused', dirty: dirtyRef.current });
    if (reason) { setSaveError(reason); return; }
    navigate(path);
  }

  function updateField(field, value) {
    setPresentation(p => ({ ...p, [field]: value }));
  }

  // ── Slide click with Ctrl/Cmd and Shift support ──────────────────────────
  function handleSlideClick(e, i) {
    const slides = presentation.slides || [];

    if (e.metaKey || e.ctrlKey) {
      // Ctrl/Cmd: toggle individual slide
      setSelectedSlides(prev => {
        const next = new Set(prev);
        if (next.has(i)) {
          if (next.size > 1) next.delete(i);
        } else {
          next.add(i);
        }
        return next;
      });
      setLastClickedIndex(i);
      setSelectedSlide(i);
    } else if (e.shiftKey) {
      // Shift: range select from lastClickedIndex to i
      const from = Math.min(lastClickedIndex, i);
      const to   = Math.max(lastClickedIndex, i);
      const range = new Set();
      for (let n = from; n <= to; n++) range.add(n);
      setSelectedSlides(range);
      setSelectedSlide(i);
    } else {
      // Normal click: select only this slide
      setSelectedSlides(new Set([i]));
      setSelectedSlide(i);
      setLastClickedIndex(i);
    }
  }

  function addSlide(type = "text") {
    const newSlide = {
      id: Date.now().toString(),
      type,
      content: "",
      subtext: "",
      background_color: "#000000",
      font_size: "large",
      font_px: PRESENTATION_FONT_PX,
      text_align: "center"
    };
    const updated = { ...presentation, slides: [...(presentation.slides || []), newSlide] };
    setPresentation(updated);
    const newIdx = (presentation.slides || []).length;
    setSelectedSlide(newIdx);
    setSelectedSlides(new Set([newIdx]));
    setLastClickedIndex(newIdx);
    save(updated);
  }

  function updateSlide(index, slideData) {
    const slides = [...(presentation.slides || [])];
    slides[index] = slideData;
    const updated = { ...presentation, slides };
    setPresentation(updated);
  }

  function importScriptureSlides(passage) {
    const currentSlide = (presentation.slides || [])[selectedSlide];
    const pages = paginateLyrics(passage.text, MAX_LYRICS_CHARS_PER_PAGE);
    const newSlides = pages.map((pageContent, pageIndex) => ({
      id: `${Date.now()}-scripture-${pageIndex}`,
      type: "scripture",
      content: pageContent,
      subtext: pages.length > 1
        ? `${passage.reference} (${passage.translation}) (${pageIndex + 1}/${pages.length})`
        : `${passage.reference} (${passage.translation})`,
      background_color: currentSlide?.background_color || "#000000",
      background_image: currentSlide?.background_image || "",
      font_size: "large",
      font_px: PRESENTATION_FONT_PX,
      text_align: currentSlide?.text_align || "center",
    }));

    const nextSlides = [...(presentation.slides || [])];
    const shouldReplaceCurrent =
      currentSlide?.type === "scripture" &&
      !currentSlide?.content &&
      !currentSlide?.subtext;

    if (shouldReplaceCurrent) {
      nextSlides.splice(selectedSlide, 1, ...newSlides);
      setPresentation((current) => ({ ...current, slides: nextSlides }));
      setSelectedSlide(selectedSlide);
      return;
    }

    nextSlides.splice(selectedSlide + 1, 0, ...newSlides);
    setPresentation((current) => ({ ...current, slides: nextSlides }));
    setSelectedSlide(selectedSlide + 1);
  }

  // ── Single slide ops ─────────────────────────────────────────────────────
  function deleteIndices(indices) {
    try {
      const result = deleteSlidesWithUndo(presentation, indices);
      setPresentation(result.document); setDeletionUndo(result.checkpoint);
      setSelectedSlide(result.selectedIndex); setSelectedSlides(new Set([result.selectedIndex])); setLastClickedIndex(result.selectedIndex);
      save(result.document);
    } catch (error) { setSaveError(error.message); }
  }

  function deleteSlide(index) { deleteIndices([index]); }

  function undoDeletion() {
    try {
      const restored = undoSlideDeletion(presentation, deletionUndo);
      setPresentation(restored); setDeletionUndo(null);
      setSelectedSlide(0); setSelectedSlides(new Set([0])); setLastClickedIndex(0);
      save(restored);
    } catch (error) { setSaveError(error.message); }
  }

  function duplicateIndices(indices) {
    try {
      const result = duplicateSlideSelection(presentation.slides || [], indices);
      const updated = { ...presentation, slides: result.slides };
      setPresentation(updated);
      setSelectedSlides(new Set(result.selectedIndices));
      setSelectedSlide(result.selectedIndices[0]); setLastClickedIndex(result.selectedIndices[0]);
      save(updated);
    } catch (error) { setSaveError(error.message); }
  }

  function duplicateSlide(index) { duplicateIndices([index]); }

  function moveSlide(index, dir) {
    const slides = [...(presentation.slides || [])];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    [slides[index], slides[newIdx]] = [slides[newIdx], slides[index]];
    const updated = { ...presentation, slides };
    setPresentation(updated);
    setSelectedSlide(newIdx);
    setSelectedSlides(new Set([newIdx]));
    setLastClickedIndex(newIdx);
    save(updated);
  }

  // ── Multi-slide ops ──────────────────────────────────────────────────────
  function deleteSelectedSlides() { deleteIndices([...selectedSlides]); }

  function duplicateSelectedSlides() { duplicateIndices([...selectedSlides]); }

  function moveSelectedSlides(dir) {
    const sorted = [...selectedSlides].sort((a, b) => a - b);
    const slides = [...(presentation.slides || [])];
    if (dir === -1 && sorted[0] === 0) return;
    if (dir === 1 && sorted[sorted.length - 1] === slides.length - 1) return;

    const selSet = new Set(sorted);
    // Build new array by moving selected slides
    const result = [...slides];
    if (dir === -1) {
      for (const i of sorted) {
        [result[i - 1], result[i]] = [result[i], result[i - 1]];
      }
    } else {
      for (const i of [...sorted].reverse()) {
        [result[i + 1], result[i]] = [result[i], result[i + 1]];
      }
    }
    const newSelected = new Set(sorted.map(i => i + dir));
    const updated = { ...presentation, slides: result };
    setPresentation(updated);
    setSelectedSlides(newSelected);
    const newFocus = selectedSlide + dir;
    setSelectedSlide(newFocus);
    setLastClickedIndex(newFocus);
    save(updated);
  }

  // ── Drag and drop ────────────────────────────────────────────────────────
  function handleDragStart(start) {
    setDraggingIndex(start.source.index);
  }

  function handleDragEnd(result) {
    setDraggingIndex(null);
    if (!result.destination) return;
    const from = result.source.index;
    const to   = result.destination.index;
    if (from === to) return;

    const slides = [...(presentation.slides || [])];

    if (selectedSlides.has(from) && selectedSlides.size > 1) {
      // Multi-drag: keep selected slides in their RELATIVE order, insert as a block at destination
      const sorted = [...selectedSlides].sort((a, b) => a - b);
      const moving = sorted.map(i => slides[i]);

      // Build result array without the moving slides
      const remaining = slides.filter((_, i) => !selectedSlides.has(i));

      // Figure out where to insert: destination index in the ORIGINAL array,
      // adjusted for how many selected slides were before it
      const selectedBefore = sorted.filter(i => i < to).length;
      const insertAt = Math.min(to - selectedBefore, remaining.length);

      remaining.splice(insertAt, 0, ...moving);

      const newSelected = new Set(moving.map((_, idx) => insertAt + idx));
      const updated = { ...presentation, slides: remaining };
      setPresentation(updated);
      setSelectedSlides(newSelected);
      setSelectedSlide(insertAt);
      setLastClickedIndex(insertAt);
      save(updated);
    } else {
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved);
      const updated = { ...presentation, slides };
      setPresentation(updated);
      setSelectedSlide(to);
      setSelectedSlides(new Set([to]));
      setLastClickedIndex(to);
      save(updated);
    }
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (!presentation || picker || String(presentation.id) !== String(id)) return;
      const command = getBuilderCommand(e);
      if (!command) return;
      e.preventDefault();
      if (command === 'duplicate') selectedSlides.size > 1 ? duplicateSelectedSlides() : duplicateSlide(selectedSlide);
      if (command === 'delete') selectedSlides.size > 1 ? deleteSelectedSlides() : deleteSlide(selectedSlide);
      if (command === 'move-up') moveSelectedSlides(-1);
      if (command === 'move-down') moveSelectedSlides(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentation, selectedSlide, selectedSlides, picker, id]);

  function handlePickerAdd(items) {
    const currentSlide = (presentation.slides || [])[selectedSlide];
    let nextSlides = [...(presentation.slides || [])];
    let insertAt = selectedSlide + 1;
    const newSlides = [];
    const seenSongIds = new Set();

    for (const item of items) {
      if (item.type === "scripture") {
        const { bookmark } = item.payload;
        const pages = paginateLyrics(bookmark.text, MAX_LYRICS_CHARS_PER_PAGE);
        pages.forEach((pageContent, pi) => {
          newSlides.push({
            id: `${Date.now()}-scripture-${pi}-${Math.random()}`,
            type: "scripture",
            content: pageContent,
            subtext: pages.length > 1
              ? `${bookmark.reference} (${bookmark.translation}) (${pi + 1}/${pages.length})`
              : `${bookmark.reference} (${bookmark.translation})`,
            background_color: currentSlide?.background_color || "#000000",
            background_image: currentSlide?.background_image || "",
            font_size: "large",
            font_px: PRESENTATION_FONT_PX,
            text_align: currentSlide?.text_align || "center",
          });
        });
      } else if (item.type === "lyrics") {
        const { content, subtext, song_id, ...rest } = item.payload;
        // Extract song title from subtext (format: "Song Title — Section")
        const songTitle = subtext ? subtext.split(" — ")[0] : "";
        // Insert a title slide before the first section of each song
        if (songTitle && song_id && !seenSongIds.has(song_id)) {
          seenSongIds.add(song_id);
          newSlides.push({
            id: `${Date.now()}-title-${song_id}`,
            type: "text",
            content: songTitle,
            subtext: "",
            background_color: currentSlide?.background_color || "#000000",
            background_image: currentSlide?.background_image || "",
            font_size: "large",
            font_px: PRESENTATION_FONT_PX,
            text_align: currentSlide?.text_align || "center",
          });
        }
        const pages = paginateLyrics(content || "", MAX_LYRICS_CHARS_PER_PAGE);
        const effectivePages = pages.length > 0 ? pages : [""];
        effectivePages.forEach((pageContent, pi) => {
          newSlides.push({
            id: `${Date.now()}-lyrics-${pi}-${Math.random()}`,
            background_color: currentSlide?.background_color || "#000000",
            background_image: currentSlide?.background_image || "",
            font_size: "large",
            font_px: PRESENTATION_FONT_PX,
            text_align: currentSlide?.text_align || "center",
            subtext: "",
            ...rest,
            type: "lyrics",
            content: pageContent,
          });
        });
      } else {
        newSlides.push({
          id: `${Date.now()}-${item.type}-${Math.random()}`,
          background_color: currentSlide?.background_color || "#000000",
          background_image: currentSlide?.background_image || "",
          font_size: "large",
          font_px: PRESENTATION_FONT_PX,
          text_align: currentSlide?.text_align || "center",
          subtext: "",
          ...item.payload,
        });
      }
    }

    nextSlides.splice(insertAt, 0, ...newSlides);
    const updated = { ...presentation, slides: nextSlides };
    setPresentation(updated);
    setSelectedSlide(insertAt);
    setSelectedSlides(new Set([insertAt]));
    setLastClickedIndex(insertAt);
    save(updated);
    setPicker(null);
  }

  if (loadError) return <div className="p-6 space-y-3">
    <p role="alert">{loadError} Editing is unavailable until the presentation loads.</p>
    <button onClick={() => setLoadAttempt(value => value + 1)} className="rounded border px-3 py-2">Retry loading</button>
    <button onClick={() => navigate('/presentations')} className="rounded border px-3 py-2">Back to presentations</button>
  </div>;
  if (loading || (presentation && String(presentation.id) !== String(id))) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!presentation) return <div className="p-6 text-muted-foreground">Presentation not found</div>;

  const currentSlide = (presentation.slides || [])[selectedSlide];
  const multiSelected = selectedSlides.size > 1;

  return (
    <div className="flex flex-col h-full">
      {saveError && <p role="alert" className="border border-red-400 p-3 text-red-600">{saveError}</p>}
      {!saving && dirty && <p role="status" className="px-4 py-2 text-sm">Unsaved presentation changes</p>}
      {deletionUndo && <div className="px-4 py-2 flex items-center gap-3 text-sm">
        <button onClick={undoDeletion} disabled={!canUndoSlideDeletion(presentation, deletionUndo)} className="rounded border px-3 py-1 disabled:opacity-50">Undo last slide deletion</button>
        <span>{canUndoSlideDeletion(presentation, deletionUndo) ? 'One-step recovery in this editor session.' : 'Later edits prevent undo without overwriting changes.'}</span>
      </div>}
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigateFromBuilder("/presentations")} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <input
          value={presentation.title}
          onChange={e => updateField("title", e.target.value)}
          className="flex-1 bg-transparent text-foreground font-semibold text-lg focus:outline-none border-b border-transparent focus:border-primary/50 pb-0.5 transition-colors"
        />
        <select value={presentation.status} onChange={e => updateField("status", e.target.value)}
          className="px-3 py-1.5 bg-secondary border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={() => save(undefined, true)} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={() => navigateFromBuilder(`/live?presentation=${id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Radio className="w-4 h-4" /> Go Live
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slide Panel */}
        <div className="w-48 border-r border-border flex flex-col bg-card">

          {/* Multi-select action bar */}
          {multiSelected && (
            <div className="flex items-center gap-1 px-2 py-1.5 bg-primary/10 border-b border-primary/20">
              <span className="text-[10px] text-primary font-medium flex-1">{selectedSlides.size} selected</span>
              <button onClick={duplicateSelectedSlides} title="Duplicate selected" className="p-1 rounded text-primary hover:bg-primary/20">
                <Copy className="w-3 h-3" />
              </button>
              <button onClick={deleteSelectedSlides} title="Delete selected" className="p-1 rounded text-red-400 hover:bg-red-500/20">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Scrollable slide list */}
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable
              droppableId="slides"
              renderClone={(drag, snapshot, rubric) => {
                const i = rubric.source.index;
                const slide = (presentation.slides || [])[i];
                const isMulti = selectedSlides.has(i) && selectedSlides.size > 1;
                const count = selectedSlides.size;
                return (
                  <div
                    ref={drag.innerRef}
                    {...drag.draggableProps}
                    {...drag.dragHandleProps}
                    style={{ ...drag.draggableProps.style, width: "160px" }}
                  >
                    {isMulti ? (
                      // Stacked card effect
                      <div className="relative" style={{ height: "100px" }}>
                        {/* Card 3 (back) */}
                        <div className="absolute inset-0 rounded-lg border-2 border-primary/40 bg-card overflow-hidden"
                          style={{ transform: "rotate(4deg) scale(0.92)", top: "6px", left: "4px", zIndex: 1 }} />
                        {/* Card 2 (middle) */}
                        <div className="absolute inset-0 rounded-lg border-2 border-primary/60 bg-card overflow-hidden"
                          style={{ transform: "rotate(2deg) scale(0.96)", top: "3px", left: "2px", zIndex: 2 }} />
                        {/* Card 1 (front — actual slide) */}
                        <div className="absolute inset-0 rounded-lg border-2 border-primary overflow-hidden shadow-2xl shadow-primary/50"
                          style={{ zIndex: 3 }}>
                          <SlidePreview slide={slide} small />
                          <div className="absolute inset-0 bg-primary/70 flex flex-col items-center justify-center">
                            <span className="text-white font-bold text-2xl leading-none">{count}</span>
                            <span className="text-white/90 text-[10px] mt-0.5">slides</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-primary overflow-hidden shadow-2xl shadow-primary/50">
                        <SlidePreview slide={slide} small />
                      </div>
                    )}
                  </div>
                );
              }}
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0"
                >
                  {(presentation.slides || []).map((slide, i) => {
                    const isActive   = selectedSlide === i;
                    const isSelected = selectedSlides.has(i);
                    const isBeingDragged = draggingIndex !== null && isSelected && selectedSlides.size > 1;
                    return (
                      <Draggable key={slide.id || String(i)} draggableId={slide.id || String(i)} index={i}>
                        {(drag, snapshot) => {
                          // Collapse non-clone selected slides into thin bars while dragging
                          if (isBeingDragged && !snapshot.isDragging) {
                            return (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className="rounded border border-primary/50 bg-primary/10 transition-all duration-150"
                                style={{ ...drag.draggableProps.style, height: "6px" }}
                              />
                            );
                          }
                          return (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              onClick={e => handleSlideClick(e, i)}
                              className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-150
                                ${snapshot.isDragging ? "opacity-0" : ""}
                                ${isActive ? "border-primary shadow-lg shadow-primary/20" : ""}
                                ${isSelected && !isActive ? "border-primary/70" : ""}
                                ${!isSelected ? "border-transparent hover:border-primary/30" : ""}
                              `}
                            >
                              <SlidePreview slide={slide} small />
                              {/* Hover-only controls */}
                              <div className="absolute top-1 right-1 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={e => { e.stopPropagation(); duplicateSlide(i); }} className="p-1 bg-black/80 rounded text-white hover:bg-blue-600" title="Duplicate">
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button onClick={e => { e.stopPropagation(); deleteSlide(i); }} className="p-1 bg-black/80 rounded text-white hover:bg-red-600" title="Delete">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              {/* Slide number */}
                              <div className="absolute bottom-1 left-1 text-xs text-white/60 bg-black/40 px-1 rounded">{i + 1}</div>
                            </div>
                          );
                        }}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add slide */}
          <div className="flex-shrink-0 p-2 border-t border-border bg-card space-y-1">
            <p className="text-[15px] text-muted-foreground px-1 mb-1">Add slide</p>
            {[
              { type: "lyrics",    label: "🎵 Lyrics" },
              { type: "scripture", label: "📖 Scripture" },
              { type: "text",      label: "T  Text" },
              { type: "countdown", label: "⏱ Countdown" },
            ].map(({ type, label }) => (
              <button key={type} onClick={() => setPicker(type)}
                className="w-full py-1.5 text-l bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground rounded transition-colors text-left px-2">
                {label}
              </button>
            ))}
            <button onClick={() => addSlide("blank")}
              className="w-full py-1.5 text-l bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground rounded transition-colors text-left px-2">
              ☐  Blank
            </button>
          </div>
        </div>

        {/* Main: Preview + Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview — 60% */}
          <div className="flex items-center justify-center bg-black/50 p-4" style={{flex: "0 0 60%"}}>
            {currentSlide ? (
              <div className="w-full max-w-3xl">
                <SlidePreview slide={currentSlide} />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select or add a slide to preview</p>
              </div>
            )}
          </div>
          {/* Editor — 40% */}
          {currentSlide && (
            <div className="border-t border-border bg-card overflow-hidden p-3" style={{flex: "0 0 40%"}}>
              <SlideEditor
                slide={currentSlide}
                onChange={data => setPresentation(p => { const slides = [...(p.slides || [])]; slides[selectedSlide] = data; return { ...p, slides }; })}
                onImportScripture={importScriptureSlides}
                onSave={() => save(undefined, true)}
              />
            </div>
          )}
        </div>
      </div>

      {picker && (
        <ContentPickerModal
          defaultTab={picker}
          onAdd={handlePickerAdd}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
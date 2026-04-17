import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Presentation } from "@/api/entities";
import { Plus, Radio, Save, ArrowLeft, Trash2, ChevronUp, ChevronDown, Eye } from "lucide-react";
import { MAX_LYRICS_CHARS_PER_PAGE, PRESENTATION_FONT_PX, paginateLyrics } from "@/lib/presentation-slides";
import SlideEditor from "../components/SlideEditor";
import SlidePreview from "../components/SlidePreview";

export default function PresentationBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState(null);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPresentation(); }, [id]);

  async function loadPresentation() {
    setLoading(true);
    const data = await Presentation.filter({ id });
    if (data?.[0]) setPresentation(data[0]);
    setLoading(false);
  }

  async function save(updated) {
    setSaving(true);
    await Presentation.update(id, updated || presentation);
    setSaving(false);
  }

  function updateField(field, value) {
    setPresentation(p => ({ ...p, [field]: value }));
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
    setSelectedSlide((presentation.slides || []).length);
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

  function deleteSlide(index) {
    const slides = [...(presentation.slides || [])];
    slides.splice(index, 1);
    const updated = { ...presentation, slides };
    setPresentation(updated);
    setSelectedSlide(Math.max(0, index - 1));
    save(updated);
  }

  function moveSlide(index, dir) {
    const slides = [...(presentation.slides || [])];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    [slides[index], slides[newIdx]] = [slides[newIdx], slides[index]];
    const updated = { ...presentation, slides };
    setPresentation(updated);
    setSelectedSlide(newIdx);
    save(updated);
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!presentation) return <div className="p-6 text-muted-foreground">Presentation not found</div>;

  const currentSlide = (presentation.slides || [])[selectedSlide];

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate("/presentations")} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
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
        <button onClick={() => save()} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={() => navigate(`/live?presentation=${id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Radio className="w-4 h-4" /> Go Live
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slide Panel */}
        <div className="w-48 border-r border-border flex flex-col bg-card overflow-auto">
          <div className="p-2 space-y-1">
            {(presentation.slides || []).map((slide, i) => (
              <div key={slide.id || i}
                onClick={() => setSelectedSlide(i)}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border transition-all duration-150 ${selectedSlide === i ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-primary/30"}`}>
                <SlidePreview slide={slide} small />
                <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${selectedSlide === i ? "opacity-0" : ""}`}>
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); moveSlide(i, -1); }} className="p-1 bg-black/50 rounded text-white hover:bg-black/80">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); moveSlide(i, 1); }} className="p-1 bg-black/50 rounded text-white hover:bg-black/80">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteSlide(i); }} className="p-1 bg-red-600/70 rounded text-white hover:bg-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-1 left-1 text-xs text-white/60 bg-black/40 px-1 rounded">{i + 1}</div>
              </div>
            ))}
          </div>
          {/* Add slide */}
          <div className="p-2 border-t border-border mt-auto sticky bottom-0 bg-card">
            <div className="grid grid-cols-2 gap-1">
              {["text", "lyrics", "scripture", "blank"].map(type => (
                <button key={type} onClick={() => addSlide(type)}
                  className="py-1.5 text-xs bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground rounded transition-colors capitalize">
                  + {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main: Preview + Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center bg-black/50 p-4">
            {currentSlide ? (
              <div className="w-full max-w-3xl aspect-video">
                <SlidePreview slide={currentSlide} />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select or add a slide to preview</p>
              </div>
            )}
          </div>
          {/* Editor */}
          {currentSlide && (
            <div className="h-64 border-t border-border bg-card overflow-auto p-4">
              <SlideEditor
                slide={currentSlide}
                onChange={data => updateSlide(selectedSlide, data)}
                onImportScripture={importScriptureSlides}
                onSave={() => save()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

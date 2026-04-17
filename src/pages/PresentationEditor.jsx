import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Presentation } from "@/api/entities";
import { ArrowLeft, Plus, Play, Save, Trash2, Image, Type, BookOpen, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAX_LYRICS_CHARS_PER_PAGE, PRESENTATION_FONT_PX, paginateLyrics } from "@/lib/presentation-slides";
import SlideEditor from "../components/presentation/SlideEditor";
import SlidePreview from "../components/presentation/SlidePreview";
import SongPicker from "../components/presentation/SongPicker";

export default function PresentationEditor() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const presId = window.location.pathname.split("/presentations/")[1];
  const isNew = presId === "new";

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [date, setDate] = useState("");
  const [slides, setSlides] = useState([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);

  useEffect(() => {
    if (!isNew) {
      Presentation.filter({ id: presId }).then((data) => {
        if (data.length > 0) {
          const p = data[0];
          setTitle(p.title);
          setStatus(p.status || "draft");
          setDate(p.date || "");
          setSlides(p.slides || []);
        }
        setLoading(false);
      });
    }
  }, [presId, isNew]);

  function addSlide(type = "text") {
    const newSlide = {
      id: Date.now().toString(),
      type,
      content: "",
      subtext: "",
      background_color: "#0f172a",
      font_size: "large",
      font_px: PRESENTATION_FONT_PX,
      text_align: "center",
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIdx(slides.length);
  }

  function addSongSlides(song) {
    const newSlides = (song.sections || []).flatMap((section, i) => {
      const pages = paginateLyrics(section.lyrics, MAX_LYRICS_CHARS_PER_PAGE);

      return pages.map((pageContent, pageIndex) => ({
        id: `${Date.now()}-${i}-${pageIndex}`,
        type: "lyrics",
        content: pageContent,
        subtext: pages.length > 1
          ? `${song.title} — ${section.label} (${pageIndex + 1}/${pages.length})`
          : `${song.title} — ${section.label}`,
        background_color: "#0f172a",
        font_size: "large",
        font_px: PRESENTATION_FONT_PX,
        text_align: "center",
        song_id: song.id,
        section_index: i,
        page_index: pageIndex,
      }));
    });
    setSlides([...slides, ...newSlides]);
    setShowSongPicker(false);
  }

  function importScriptureSlides(passage) {
    const pages = paginateLyrics(passage.text, MAX_LYRICS_CHARS_PER_PAGE);
    const newSlides = pages.map((pageContent, pageIndex) => ({
      id: `${Date.now()}-scripture-${pageIndex}`,
      type: "scripture",
      content: pageContent,
      subtext: pages.length > 1
        ? `${passage.reference} (${passage.translation}) (${pageIndex + 1}/${pages.length})`
        : `${passage.reference} (${passage.translation})`,
      background_color: activeSlide?.background_color || "#0f172a",
      background_image: activeSlide?.background_image || "",
      font_size: "large",
      font_px: PRESENTATION_FONT_PX,
      text_align: activeSlide?.text_align || "center",
    }));

    const shouldReplaceCurrent =
      activeSlide?.type === "scripture" &&
      !activeSlide?.content &&
      !activeSlide?.subtext;

    const nextSlides = [...slides];

    if (shouldReplaceCurrent) {
      nextSlides.splice(activeSlideIdx, 1, ...newSlides);
      setSlides(nextSlides);
      setActiveSlideIdx(activeSlideIdx);
      return;
    }

    nextSlides.splice(activeSlideIdx + 1, 0, ...newSlides);
    setSlides(nextSlides);
    setActiveSlideIdx(activeSlideIdx + 1);
  }

  function updateSlide(index, data) {
    const updated = [...slides];
    updated[index] = { ...updated[index], ...data };
    setSlides(updated);
  }

  function removeSlide(index) {
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
    setActiveSlideIdx(Math.min(activeSlideIdx, updated.length - 1));
  }

  async function handleSave() {
    setSaving(true);
    const data = { title, status, date: date || undefined, slides };
    if (isNew) {
      const created = await Presentation.create(data);
      navigate(`/presentations/${created.id}`, { replace: true });
    } else {
      await Presentation.update(presId, data);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (showSongPicker) {
    return <SongPicker onSelect={addSongSlides} onCancel={() => setShowSongPicker(false)} />;
  }

  const activeSlide = slides[activeSlideIdx];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/presentations")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Presentation title"
          className="text-lg font-semibold border-none bg-transparent focus-visible:ring-0 px-0 max-w-md"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
        <div className="flex-1" />
        <Button variant="outline" onClick={handleSave} disabled={saving || !title} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
        {slides.length > 0 && !isNew && (
          <Button onClick={() => navigate(`/live/${presId}`)} className="gap-2">
            <Play className="w-4 h-4" /> Go Live
          </Button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Slide list sidebar */}
        <div className="w-56 border-r border-border bg-card overflow-y-auto p-3 space-y-2">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => setActiveSlideIdx(idx)}
              className={`group relative cursor-pointer rounded-lg border-2 transition-all ${
                idx === activeSlideIdx
                  ? "border-primary"
                  : "border-transparent hover:border-border"
              }`}
            >
              <SlidePreview slide={slide} mini />
              <div className="absolute top-1 left-1 bg-background/80 text-[10px] px-1.5 py-0.5 rounded font-mono">
                {idx + 1}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeSlide(idx); }}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/80 rounded p-0.5"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}

          <div className="space-y-1 pt-2 border-t border-border">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => addSlide("text")}>
              <Type className="w-3 h-3" /> Text Slide
            </Button>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => addSlide("title")}>
              <Type className="w-3 h-3" /> Title Slide
            </Button>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => setShowSongPicker(true)}>
              <Music className="w-3 h-3" /> Song Lyrics
            </Button>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => addSlide("scripture")}>
              <BookOpen className="w-3 h-3" /> Scripture
            </Button>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => addSlide("blank")}>
              <Image className="w-3 h-3" /> Blank
            </Button>
          </div>
        </div>

        {/* Main editing area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeSlide ? (
            <>
              <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
                <div className="w-full max-w-3xl">
                  <SlidePreview slide={activeSlide} />
                </div>
              </div>
              <div className="border-t border-border bg-card p-4">
                <SlideEditor
                  slide={activeSlide}
                  onChange={(data) => updateSlide(activeSlideIdx, data)}
                  onImportScripture={importScriptureSlides}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="mb-2">Add slides to get started</p>
                <Button variant="outline" onClick={() => addSlide("title")} className="gap-2">
                  <Plus className="w-4 h-4" /> Add First Slide
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

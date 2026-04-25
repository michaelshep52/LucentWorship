import { useEffect, useRef, useState } from "react";
import { Song, ScriptureBookmark, MediaAsset, getErrorMessage, uploadFile } from "@/api/entities";
import { Music, BookOpen, Image, Upload, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const FONT_SIZES = ["small", "medium", "large", "xlarge"];
const SLIDE_TYPES = ["text", "lyrics", "scripture", "title", "blank", "image"];
const BG_PRESETS = [
  "#000000", "#0f0f1a", "#1a0a2e", "#0a1628",
  "#1a1200", "#0d1a0d", "#1a0a0a", "#ffffff",
];

// Fully controlled — no internal form state. `slide` is the source of truth.
// Changes are sent up immediately via onChange; parent owns the state.
export default function SlideEditor({ slide, onChange, onSave, onImportScripture }) {
  const [songs, setSongs]             = useState([]);
  const [bookmarks, setBookmarks]     = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const fileInputRef                  = useRef(null);

  useEffect(() => {
    Song.list().then(setSongs);
    // Fix: use created_date since updated_date doesn't exist on this table
    ScriptureBookmark.list("-created_date", 200).then(setBookmarks).catch(() => setBookmarks([]));
    MediaAsset.filter({ type: "image" }).then(setMediaAssets).catch(() =>
      MediaAsset.list().then((assets) =>
        setMediaAssets(assets.filter((item) => item.type !== "video"))
      )
    );
  }, []);

  function update(fields) {
    onChange({ ...slide, ...fields });
  }

  function setBgColor(color) {
    update({ background_color: color, background_image: "" });
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile({ file });
      update({ background_image: url });
      setShowBgPicker(false);
    } catch (err) {
      console.error("Upload failed:", err);
      toast({
        title: "Upload failed",
        description: getErrorMessage(err, "The background image could not be uploaded."),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  function importFromSong(songId, sectionIndex) {
    const song = songs.find((s) => s.id === songId);
    if (!song) return;
    const section = song.sections?.[sectionIndex];
    if (!section) return;
    update({
      content: section.lyrics || "",
      subtext: `${song.title} — ${section.label || section.type}`,
      type: "lyrics",
      song_id: songId,
      section_index: sectionIndex,
    });
  }

  if (!slide) return null;

  return (
    <div className="space-y-3">

      {/* Row 1: Type / Font / Align / BG Color */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Type</label>
          <select value={slide.type || "text"} onChange={(e) => update({ type: e.target.value })}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {SLIDE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Font Size</label>
          <select value={slide.font_size || "large"} onChange={(e) => update({ font_size: e.target.value })}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Alignment</label>
          <select value={slide.text_align || "center"} onChange={(e) => update({ text_align: e.target.value })}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {["left", "center", "right"].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">BG Color</label>
          <div className="flex gap-1 flex-wrap items-center">
            {BG_PRESETS.map((color) => (
              <button
                key={color}
                title={color}
                onClick={() => setBgColor(color)}
                className={`w-5 h-5 rounded border-2 transition-transform hover:scale-110 ${
                  slide.background_color === color && !slide.background_image
                    ? "border-primary ring-1 ring-primary"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            {/* Custom colour wheel */}
            <div className="relative w-5 h-5">
              <input
                type="color"
                value={slide.background_color || "#000000"}
                onChange={(e) => setBgColor(e.target.value)}
                title="Custom colour"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className={`w-5 h-5 rounded border-2 pointer-events-none ${
                  !BG_PRESETS.includes(slide.background_color || "") && !slide.background_image
                    ? "border-primary ring-1 ring-primary"
                    : "border-dashed border-border"
                }`}
                style={{ background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: BG Image */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">BG Image:</label>

          <input
            value={slide.background_image || ""}
            onChange={(e) => update({ background_image: e.target.value })}
            placeholder="Paste URL, upload, or pick from media…"
            className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

          {mediaAssets.length > 0 && (
            <button
              onClick={() => setShowBgPicker((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                showBgPicker ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Image className="w-3 h-3" /> Media
            </button>
          )}

          {slide.background_image && (
            <button onClick={() => update({ background_image: "" })} className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {showBgPicker && (
          <div className="bg-background border border-border rounded-lg p-2 max-h-36 overflow-auto">
            <div className="grid grid-cols-6 gap-1.5">
              {mediaAssets.map((asset) => (
                <button key={asset.id}
                  onClick={() => { update({ background_image: asset.file_url }); setShowBgPicker(false); }}
                  className={`aspect-video rounded overflow-hidden border-2 transition-all hover:border-primary ${
                    slide.background_image === asset.file_url ? "border-primary" : "border-transparent"
                  }`} title={asset.name}>
                  <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Content + Subtext */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted-foreground">Main Content</label>
            <span className={`text-xs font-mono ${
              (slide.content || "").length > 180 ? "text-destructive font-bold"
              : (slide.content || "").length > 150 ? "text-yellow-400"
              : "text-muted-foreground"
            }`}>{(slide.content || "").length}/180</span>
          </div>
          <textarea
            value={slide.content || ""}
            onChange={(e) => { if (e.target.value.length <= 180) update({ content: e.target.value }); }}
            rows={3}
            placeholder="Slide text (max 180 characters)..."
            className={`w-full px-2 py-1.5 bg-background border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 resize-none transition-colors ${
              (slide.content || "").length > 150 ? "border-yellow-500/60 focus:ring-yellow-500/50" : "border-border focus:ring-primary"
            }`}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Subtext / Attribution</label>
          <textarea value={slide.subtext || ""} onChange={(e) => update({ subtext: e.target.value })}
            rows={3} placeholder="Optional subtext..."
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>
      </div>

      {/* Row 4: Import helpers + Save */}
      <div className="flex gap-3 items-end flex-wrap">
        {songs.length > 0 && (
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select defaultValue="" onChange={(e) => {
              const [songId, idx] = e.target.value.split("|");
              if (songId) importFromSong(songId, Number(idx));
              e.target.value = "";
            }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Import from song...</option>
              {songs.map((song) => song.sections?.map((section, i) => (
                <option key={`${song.id}|${i}`} value={`${song.id}|${i}`}>
                  {song.title} — {section.label || section.type}
                </option>
              )))}
            </select>
          </div>
        )}

        {bookmarks.length > 0 && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select defaultValue="" onChange={(e) => {
              const bookmark = bookmarks.find((b) => b.id === e.target.value);
              if (bookmark && onImportScripture) {
                onImportScripture(bookmark);
              } else if (bookmark) {
                update({ content: bookmark.text, subtext: `${bookmark.reference} (${bookmark.translation})`, type: "scripture" });
              }
              e.target.value = "";
            }} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Import scripture...</option>
              {bookmarks.map((b) => (
                <option key={b.id} value={b.id}>{b.reference} ({b.translation})</option>
              ))}
            </select>
          </div>
        )}

        <button onClick={onSave} className="ml-auto px-3 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}

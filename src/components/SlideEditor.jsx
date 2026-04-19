import { useEffect, useRef, useState } from "react";
import { ScriptureBookmark, MediaAsset, uploadFile } from "@/api/entities";
import { BookOpen, Upload, Loader2, X, Image } from "lucide-react";

const FONT_SIZES = ["small", "medium", "large", "xlarge"];
const SLIDE_TYPES = ["text", "lyrics", "scripture", "title", "blank", "image"];
const BG_PRESETS = [
  "#000000", "#111111", "#1e1e2e", "#0f172a",
  "#1a0a2e", "#0a1628", "#0d1a0d", "#1a0a0a",
  "#2d1b00", "#ffffff", "#f1f5f9", "#334155",
];

export default function SlideEditor({ slide, onChange, onSave, onImportScripture }) {
  const [bookmarks, setBookmarks]       = useState([]);
  const [mediaAssets, setMediaAssets]   = useState([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [uploading, setUploading]       = useState(false);
  const fileInputRef                    = useRef(null);

  useEffect(() => {
    ScriptureBookmark.list("-created_date", 200).then(setBookmarks).catch(() => setBookmarks([]));
    MediaAsset.filter({ type: "image" }).then(setMediaAssets).catch(() =>
      MediaAsset.list().then(a => setMediaAssets(a.filter(x => x.type !== "video")))
    );
  }, []);

  // Single update function — merges into current slide and calls onChange once
  function set(fields) {
    onChange({ ...slide, ...fields });
  }

  async function handleBgUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Use a local object URL immediately — no Supabase upload needed
    const localUrl = URL.createObjectURL(file);
    set({ background_image: localUrl });
    setShowMediaPicker(false);

    // Also upload to storage in the background so it persists after page reload
    setUploading(true);
    try {
      const { file_url } = await uploadFile({ file });
      set({ background_image: file_url });
    } catch (err) {
      console.error("Background upload failed:", err);
      // Local blob URL will still work this session
    } finally {
      setUploading(false);
    }
  }

  if (!slide) return null;

  return (
    <div className="space-y-3 text-xs">

      {/* Row 1: Type / Font / Align */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-muted-foreground block mb-1">Type</label>
          <select value={slide.type || "text"} onChange={e => set({ type: e.target.value })}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {SLIDE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Font Size</label>
          <select value={slide.font_size || "large"} onChange={e => set({ font_size: e.target.value })}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Alignment</label>
          <select value={slide.text_align || "center"} onChange={e => set({ text_align: e.target.value })}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {["left", "center", "right"].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: BG Color swatches — full row, easy to click */}
      <div>
        <label className="text-muted-foreground block mb-1.5">Background Color</label>
        <div className="flex flex-wrap gap-2 items-center">
          {BG_PRESETS.map(color => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => set({ background_color: color, background_image: "" })}
              className="w-7 h-7 rounded-md border-2 transition-all hover:scale-110 focus:outline-none"
              style={{
                backgroundColor: color,
                borderColor: slide.background_color === color && !slide.background_image ? "hsl(var(--primary))" : "transparent",
                boxShadow: slide.background_color === color && !slide.background_image ? "0 0 0 1px hsl(var(--primary))" : "inset 0 0 0 1px rgba(255,255,255,0.15)",
              }}
            />
          ))}
          {/* Native colour picker */}
          <label className="w-7 h-7 rounded-md cursor-pointer overflow-hidden border border-dashed border-border hover:border-primary transition-colors flex items-center justify-center" title="Custom color">
            <input
              type="color"
              value={slide.background_color || "#000000"}
              onChange={e => set({ background_color: e.target.value, background_image: "" })}
              className="w-10 h-10 opacity-0 absolute cursor-pointer"
            />
            <span className="text-muted-foreground pointer-events-none" style={{fontSize:10}}>+</span>
          </label>
        </div>
      </div>

      {/* Row 3: BG Image */}
      <div>
        <label className="text-muted-foreground block mb-1.5">Background Image</label>
        <div className="flex items-center gap-2">
          <input
            value={slide.background_image || ""}
            onChange={e => set({ background_image: e.target.value })}
            placeholder="Paste image URL…"
            className="flex-1 px-2 py-1.5 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {/* Upload from device */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />

          {/* Pick from media library */}
          {mediaAssets.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMediaPicker(v => !v)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                showMediaPicker ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Image className="w-3 h-3" /> Media
            </button>
          )}

          {/* Clear */}
          {slide.background_image && (
            <button type="button" onClick={() => set({ background_image: "" })}
              className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Media library grid */}
        {showMediaPicker && (
          <div className="mt-2 bg-background border border-border rounded-lg p-2 max-h-32 overflow-auto">
            <div className="grid grid-cols-6 gap-1.5">
              {mediaAssets.map(asset => (
                <button key={asset.id} type="button"
                  onClick={() => { set({ background_image: asset.file_url }); setShowMediaPicker(false); }}
                  className={`aspect-video rounded overflow-hidden border-2 transition-all hover:border-primary ${
                    slide.background_image === asset.file_url ? "border-primary" : "border-transparent"
                  }`}>
                  <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 4: Content + Subtext */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-muted-foreground">Main Content</label>
            <span className={`font-mono ${
              (slide.content || "").length > 180 ? "text-destructive font-bold"
              : (slide.content || "").length > 150 ? "text-yellow-400"
              : "text-muted-foreground"
            }`}>{(slide.content || "").length}/180</span>
          </div>
          <textarea
            value={slide.content || ""}
            onChange={e => { if (e.target.value.length <= 180) set({ content: e.target.value }); }}
            rows={3}
            placeholder="Slide text…"
            className={`w-full px-2 py-1.5 bg-background border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 resize-none ${
              (slide.content || "").length > 150 ? "border-yellow-500/60 focus:ring-yellow-500/50" : "border-border focus:ring-primary"
            }`}
          />
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Subtext / Attribution</label>
          <textarea value={slide.subtext || ""} onChange={e => set({ subtext: e.target.value })}
            rows={3} placeholder="Optional subtext…"
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>
      </div>

      {/* Row 5: Scripture import + Save — no song importer (use the Add Slide picker instead) */}
      <div className="flex gap-3 items-center">
        {bookmarks.length > 0 && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select defaultValue="" onChange={e => {
              const bookmark = bookmarks.find(b => b.id === e.target.value);
              if (!bookmark) return;
              if (onImportScripture) {
                onImportScripture(bookmark);
              } else {
                set({ content: bookmark.text, subtext: `${bookmark.reference} (${bookmark.translation})`, type: "scripture" });
              }
              e.target.value = "";
            }} className="px-2 py-1 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Import scripture…</option>
              {bookmarks.map(b => (
                <option key={b.id} value={b.id}>{b.reference} ({b.translation})</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={onSave} className="ml-auto px-3 py-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors">
          Save Changes
        </button>
      </div>

    </div>
  );
}
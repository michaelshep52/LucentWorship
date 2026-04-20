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
  const [bookmarks, setBookmarks]     = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const fileInputRef                  = useRef(null);

  useEffect(() => {
    ScriptureBookmark.list("-created_date", 200).then(setBookmarks).catch(() => setBookmarks([]));
    MediaAsset.filter({ type: "image" }).then(setMediaAssets).catch(() =>
      MediaAsset.list().then(a => setMediaAssets(a.filter(x => x.type !== "video")))
    );
  }, []);

  function set(fields) { onChange({ ...slide, ...fields }); }

  async function handleBgUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    set({ background_image: localUrl });
    setShowMediaPicker(false);
    setUploading(true);
    try {
      const { file_url } = await uploadFile({ file });
      set({ background_image: file_url });
    } catch (err) {
      console.error("Background upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  if (!slide) return null;

  return (
    <div className="h-full flex flex-col gap-2 text-xs">

      {/* Row 1: Type / Font / Align */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-muted-foreground block mb-1">Type</label>
          <select value={slide.type || "text"} onChange={e => set({ type: e.target.value })}
            className="w-full px-2 py-1 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {SLIDE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Font Size</label>
          <select value={slide.font_size || "large"} onChange={e => set({ font_size: e.target.value })}
            className="w-full px-2 py-1 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Alignment</label>
          <select value={slide.text_align || "center"} onChange={e => set({ text_align: e.target.value })}
            className="w-full px-2 py-1 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {["left", "center", "right"].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: BG Color + BG Image on same line */}
      <div className="flex items-center gap-2">
        {/* Label */}
        <span className="text-muted-foreground shrink-0">Background</span>

        {/* Color wheel (always visible, opens native picker) */}
        <label className="relative shrink-0 cursor-pointer" title="Pick color">
          <div
            className="w-7 h-7 rounded-md border-2 border-border hover:border-primary transition-colors"
            style={{ background: `conic-gradient(red, yellow, lime, cyan, blue, magenta, red)` }}
          />
          <input
            type="color"
            value={slide.background_color || "#000000"}
            onChange={e => set({ background_color: e.target.value, background_image: "" })}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>

        {/* Current color swatch */}
        <div
          className="w-7 h-7 rounded-md border border-border shrink-0"
          style={{ backgroundColor: slide.background_color || "#000000" }}
          title={slide.background_color || "#000000"}
        />

        {/* Presets */}
        <div className="flex gap-1 flex-wrap">
          {BG_PRESETS.map(color => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => set({ background_color: color, background_image: "" })}
              className="w-5 h-5 rounded border-2 transition-all hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: slide.background_color === color && !slide.background_image ? "hsl(var(--primary))" : "transparent",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border shrink-0" />

        {/* Image URL input */}
        <input
          value={slide.background_image || ""}
          onChange={e => set({ background_image: e.target.value })}
          placeholder="Image URL…"
          className="flex-1 min-w-0 px-2 py-1 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Upload */}
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50">
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />

        {/* Media library */}
        {mediaAssets.length > 0 && (
          <button type="button" onClick={() => setShowMediaPicker(v => !v)}
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              showMediaPicker ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}>
            <Image className="w-3 h-3" />
          </button>
        )}

        {/* Clear image */}
        {slide.background_image && (
          <button type="button" onClick={() => set({ background_image: "" })}
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Media library grid (dropdown) */}
      {showMediaPicker && (
        <div className="bg-background border border-border rounded-lg p-2 max-h-24 overflow-auto">
          <div className="grid grid-cols-8 gap-1">
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

      {/* Row 3: Content + Subtext */}
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1">
            <label className="text-muted-foreground">Content</label>
            <span className={`font-mono text-[10px] ${
              (slide.content || "").length > 180 ? "text-destructive font-bold"
              : (slide.content || "").length > 150 ? "text-yellow-400"
              : "text-muted-foreground"
            }`}>{(slide.content || "").length}/180</span>
          </div>
          <textarea
            value={slide.content || ""}
            onChange={e => { if (e.target.value.length <= 180) set({ content: e.target.value }); }}
            placeholder="Slide text…"
            className={`flex-1 min-h-0 w-full px-2 py-1.5 bg-background border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 resize-none ${
              (slide.content || "").length > 150 ? "border-yellow-500/60 focus:ring-yellow-500/50" : "border-border focus:ring-primary"
            }`}
          />
        </div>
        <div className="flex flex-col min-h-0">
          <label className="text-muted-foreground block mb-1">Subtext</label>
          <textarea value={slide.subtext || ""} onChange={e => set({ subtext: e.target.value })}
            placeholder="Optional subtext…"
            className="flex-1 min-h-0 w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>
      </div>

      {/* Row 4: Scripture + Save */}
      <div className="flex gap-2 items-center shrink-0">
        {bookmarks.length > 0 && (
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select defaultValue="" onChange={e => {
              const bookmark = bookmarks.find(b => b.id === e.target.value);
              if (!bookmark) return;
              if (onImportScripture) onImportScripture(bookmark);
              else set({ content: bookmark.text, subtext: `${bookmark.reference} (${bookmark.translation})`, type: "scripture" });
              e.target.value = "";
            }} className="px-2 py-1 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Import scripture…</option>
              {bookmarks.map(b => (
                <option key={b.id} value={b.id}>{b.reference} ({b.translation})</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={onSave} className="ml-auto px-3 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors">
          Save
        </button>
      </div>

    </div>
  );
}
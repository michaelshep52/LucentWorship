import { useState, useEffect } from "react";
import { Song, ScriptureBookmark, MediaAsset } from "@/api/entities";
import { Music, BookOpen, Image } from "lucide-react";

const FONT_SIZES = ["small", "medium", "large", "xlarge"];
const SLIDE_TYPES = ["text", "lyrics", "scripture", "title", "blank", "image"];
const BG_PRESETS = ["#000000", "#0f0f1a", "#1a0a2e", "#0a1628", "#1a1200", "#0d1a0d", "#1a0a0a", "#ffffff"];

export default function SlideEditor({ slide, onChange, onSave }) {
  const [form, setForm] = useState(slide);
  const [songs, setSongs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [showBgPicker, setShowBgPicker] = useState(false);

  useEffect(() => { setForm(slide); }, [slide]);
  useEffect(() => {
    Song.list().then(setSongs);
    ScriptureBookmark.list().then(setBookmarks);
    MediaAsset.filter({ type: "image" }).then(setMediaAssets).catch(() =>
      MediaAsset.list().then(a => setMediaAssets(a.filter(x => x.type !== "video")))
    );
  }, []);

  function update(field, value) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    onChange(updated);
  }

  function importFromSong(songId, sectionIndex) {
    const song = songs.find(s => s.id === songId);
    if (!song) return;
    const section = song.sections?.[sectionIndex];
    if (!section) return;
    const updated = {
      ...form,
      content: section.lyrics || "",
      subtext: `${song.title} — ${section.label || section.type}`,
      type: "lyrics",
      song_id: songId,
      section_index: sectionIndex
    };
    setForm(updated);
    onChange(updated);
  }

  function importFromBookmark(bm) {
    const updated = {
      ...form,
      content: `"${bm.text}"`,
      subtext: `${bm.reference} (${bm.translation})`,
      type: "scripture"
    };
    setForm(updated);
    onChange(updated);
  }

  function setBackgroundMedia(asset) {
    update("background_image", asset.file_url);
    setShowBgPicker(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Type</label>
          <select value={form.type} onChange={e => update("type", e.target.value)}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {SLIDE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Font Size</label>
          <select value={form.font_size || "large"} onChange={e => update("font_size", e.target.value)}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Alignment</label>
          <select value={form.text_align || "center"} onChange={e => update("text_align", e.target.value)}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            {["left","center","right"].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">BG Color</label>
          <div className="flex gap-1 flex-wrap">
            {BG_PRESETS.map(c => (
              <button key={c} onClick={() => { update("background_color", c); update("background_image", ""); }}
                className={`w-5 h-5 rounded border-2 transition-transform hover:scale-110 ${form.background_color === c && !form.background_image ? "border-primary" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
            <input type="color" value={form.background_color || "#000000"}
              onChange={e => { update("background_color", e.target.value); update("background_image", ""); }}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" />
          </div>
        </div>
      </div>

      {/* Background Image Picker */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground whitespace-nowrap">BG Image:</label>
        <input value={form.background_image || ""} onChange={e => update("background_image", e.target.value)}
          placeholder="Paste URL or pick from media..."
          className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        {mediaAssets.length > 0 && (
          <button onClick={() => setShowBgPicker(v => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${showBgPicker ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            <Image className="w-3 h-3" /> Media
          </button>
        )}
        {form.background_image && (
          <button onClick={() => update("background_image", "")} className="text-xs text-muted-foreground hover:text-destructive transition-colors">✕</button>
        )}
      </div>

      {/* Media thumbnail picker */}
      {showBgPicker && (
        <div className="bg-background border border-border rounded-lg p-2 max-h-36 overflow-auto">
          <div className="grid grid-cols-6 gap-1.5">
            {mediaAssets.map(asset => (
              <button key={asset.id} onClick={() => setBackgroundMedia(asset)}
                className={`aspect-video rounded overflow-hidden border-2 transition-all hover:border-primary ${form.background_image === asset.file_url ? "border-primary" : "border-transparent"}`}
                title={asset.name}>
                <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Main Content</label>
          <textarea value={form.content || ""} onChange={e => update("content", e.target.value)}
            rows={3} placeholder="Slide text..."
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Subtext / Attribution</label>
          <textarea value={form.subtext || ""} onChange={e => update("subtext", e.target.value)}
            rows={3} placeholder="Optional subtext..."
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        {songs.length > 0 && (
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select defaultValue="" onChange={e => {
              const [sId, idx] = e.target.value.split("|");
              if (sId) importFromSong(sId, Number(idx));
              e.target.value = "";
            }}
              className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Import from song...</option>
              {songs.map(s => s.sections?.map((sec, i) => (
                <option key={`${s.id}|${i}`} value={`${s.id}|${i}`}>{s.title} — {sec.label || sec.type}</option>
              )))}
            </select>
          </div>
        )}
        {bookmarks.length > 0 && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select defaultValue="" onChange={e => {
              const bm = bookmarks.find(b => b.id === e.target.value);
              if (bm) importFromBookmark(bm);
              e.target.value = "";
            }}
              className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Import scripture...</option>
              {bookmarks.map(bm => <option key={bm.id} value={bm.id}>{bm.reference} ({bm.translation})</option>)}
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
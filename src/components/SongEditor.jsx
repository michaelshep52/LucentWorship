import { useState } from "react";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";

const SECTION_TYPES = ["verse", "chorus", "bridge", "pre-chorus", "intro", "outro", "tag", "interlude"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export default function SongEditor({ song, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: song?.title || "",
    artist: song?.artist || "",
    key: song?.key || "",
    tempo: song?.tempo || "",
    ccli_number: song?.ccli_number || "",
    notes: song?.notes || "",
    tags: (song?.tags || []).join(", "),
    sections: song?.sections || [],
  });
  const [saving, setSaving] = useState(false);

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }
  
  function addSection() {
    const verseCount = form.sections.filter(s => s.type === "verse").length;
    setForm(f => ({
      ...f,
      sections: [...f.sections, { type: "verse", label: `Verse ${verseCount + 1}`, lyrics: "" }]
    }));
  }

  function updateSection(i, field, value) {
    setForm(f => {
      const sections = [...f.sections];
      sections[i] = { ...sections[i], [field]: value };
      return { ...f, sections };
    });
  }

  function removeSection(i) {
    setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }));
  }


  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave({
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      tempo: form.tempo ? Number(form.tempo) : undefined,
    });
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Song Title *</label>
          <input value={form.title} onChange={e => setField("title", e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Artist / Author</label>
          <input value={form.artist} onChange={e => setField("artist", e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Key</label>
          <select value={form.key} onChange={e => setField("key", e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground">
            <option value="">Select key</option>
            {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Tempo (BPM)</label>
          <input type="number" value={form.tempo} onChange={e => setField("tempo", e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">CCLI #</label>
          <input value={form.ccli_number} onChange={e => setField("ccli_number", e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Tags (comma separated)</label>
          <input value={form.tags} onChange={e => setField("tags", e.target.value)}
            placeholder="worship, contemporary, upbeat"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground" />
        </div>
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted-foreground">Lyrics Sections</label>
          <button onClick={addSection} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-3 h-3" /> Add Section
          </button>
        </div>
        <div className="space-y-3">
          {form.sections.map((sec, i) => (
            <div key={i} className="bg-background border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <select value={sec.type} onChange={e => updateSection(i, "type", e.target.value)}
                  className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {SECTION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <input value={sec.label} onChange={e => updateSection(i, "label", e.target.value)}
                  placeholder="Label (e.g. Verse 1)"
                  className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={() => removeSection(i)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea value={sec.lyrics} onChange={e => updateSection(i, "lyrics", e.target.value)}
                placeholder="Enter lyrics..."
                rows={4}
                className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed" />
            </div>
          ))}
          {form.sections.length === 0 && (
            <button onClick={addSection} className="w-full border border-dashed border-border rounded-lg p-4 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
              + Add a section to get started
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => setField("notes", e.target.value)}
          rows={2} placeholder="Internal notes..."
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none" />
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} disabled={saving || !form.title.trim()}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save Song"}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
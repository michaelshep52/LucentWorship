import { useState } from "react";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SECTION_TYPES = ["verse", "chorus", "bridge", "pre-chorus", "intro", "outro", "tag", "interlude"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export default function SongEditor({ song, onSave, onCancel }) {
  const [title, setTitle] = useState(song?.title || "");
  const [artist, setArtist] = useState(song?.artist || "");
  const [key, setKey] = useState(song?.key || "");
  const [tempo, setTempo] = useState(song?.tempo || "");
  const [ccliNumber, setCcliNumber] = useState(song?.ccli_number || "");
  const [notes, setNotes] = useState(song?.notes || "");
  const [tagsInput, setTagsInput] = useState((song?.tags || []).join(", "));
  const [sections, setSections] = useState(
    song?.sections || [{ type: "verse", label: "Verse 1", lyrics: "" }]
  );
  const [saving, setSaving] = useState(false);

  function addSection() {
    setSections([...sections, { type: "verse", label: `Verse ${sections.length + 1}`, lyrics: "" }]);
  }

  function removeSection(index) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function updateSection(index, field, value) {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      title,
      artist,
      key: key || undefined,
      tempo: tempo ? Number(tempo) : undefined,
      ccli_number: ccliNumber || undefined,
      notes: notes || undefined,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      sections,
    });
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {song ? "Edit Song" : "New Song"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Song title" />
          </div>
          <div>
            <Label>Artist / Author</Label>
            <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist name" />
          </div>
          <div>
            <Label>Key</Label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger><SelectValue placeholder="Select key" /></SelectTrigger>
              <SelectContent>
                {KEYS.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tempo (BPM)</Label>
            <Input type="number" value={tempo} onChange={(e) => setTempo(e.target.value)} placeholder="120" />
          </div>
          <div>
            <Label>CCLI Number</Label>
            <Input value={ccliNumber} onChange={(e) => setCcliNumber(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="worship, contemporary, hymn" />
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." rows={2} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sections</h2>
            <Button type="button" variant="outline" size="sm" onClick={addSection} className="gap-1">
              <Plus className="w-3 h-3" /> Add Section
            </Button>
          </div>

          {sections.map((section, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <Select value={section.type} onValueChange={(v) => updateSection(idx, "type", v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={section.label}
                  onChange={(e) => updateSection(idx, "label", e.target.value)}
                  placeholder="Section label"
                  className="flex-1"
                />
                {sections.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSection(idx)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              <Textarea
                value={section.lyrics}
                onChange={(e) => updateSection(idx, "lyrics", e.target.value)}
                placeholder="Enter lyrics for this section..."
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving || !title}>
            {saving ? "Saving..." : song ? "Save Changes" : "Create Song"}
          </Button>
        </div>
      </form>
    </div>
  );
}
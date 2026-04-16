import { useState, useEffect } from "react";
import { ScriptureBookmark } from "@/api/entities";
import { BookOpen, Search, Plus, Trash2, Loader2, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TRANSLATIONS = ["KJV", "NIV", "ESV", "NKJV", "NLT", "NASB", "MSG", "AMP"];

export default function Scripture() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Add form state
  const [reference, setReference] = useState("");
  const [text, setText] = useState("");
  const [translation, setTranslation] = useState("KJV");

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    const data = await ScriptureBookmark.list("-created_date", 500);
    setBookmarks(data);
    setLoading(false);
  }

  async function lookupScripture() {
    if (!reference) return;
    setFetching(true);
    // Prompt user to paste verse text since no AI backend is connected
    const result = window.prompt(`Paste the text for "${reference}" (${translation}):`);
    if (result) setText(result.trim());
    setFetching(false);
  }

  async function handleSave() {
    if (!reference || !text) return;
    await ScriptureBookmark.create({ reference, text, translation });
    setReference("");
    setText("");
    setShowAdd(false);
    setLoading(true);
    await loadBookmarks();
  }

  async function handleDelete(id) {
    await ScriptureBookmark.delete(id);
    setLoading(true);
    await loadBookmarks();
  }

  const filtered = bookmarks.filter(
    (b) => !search || b.reference?.toLowerCase().includes(search.toLowerCase()) || b.text?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scripture</h1>
          <p className="text-muted-foreground text-sm mt-1">Saved scripture passages</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Scripture
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Scripture</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Reference</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="John 3:16" />
                </div>
                <div>
                  <Label>Translation</Label>
                  <Select value={translation} onValueChange={setTranslation}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRANSLATIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={lookupScripture} disabled={fetching || !reference} className="gap-2">
                {fetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                Look up verse
              </Button>
              <div>
                <Label>Scripture Text</Label>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Enter or look up scripture text..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!reference || !text}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search scripture..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {bookmarks.length === 0 ? "No saved scripture yet" : "No matches found"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-xl p-5 group hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookMarked className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">{b.reference}</h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {b.translation || "KJV"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">"{b.text}"</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(b.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
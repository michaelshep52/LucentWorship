import { useState, useEffect } from "react";
import { Song } from "@/api/entities";
import { Plus, Search, Music, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SongCard from "../components/songs/SongCard";
import SongEditor from "../components/songs/SongEditor";

export default function Songs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadSongs();
  }, []);

  async function loadSongs() {
    const data = await Song.list("-updated_date", 500);
    setSongs(data);
    setLoading(false);
  }

  const allTags = [...new Set(songs.flatMap((s) => s.tags || []))];

  const filtered = songs.filter((s) => {
    const matchSearch =
      !search ||
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.artist?.toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || (s.tags || []).includes(selectedTag);
    return matchSearch && matchTag;
  });

  function handleNew() {
    setEditingSong(null);
    setShowEditor(true);
  }

  function handleEdit(song) {
    setEditingSong(song);
    setShowEditor(true);
  }

  async function handleSave(songData) {
    if (editingSong) {
      await Song.update(editingSong.id, songData);
    } else {
      await Song.create(songData);
    }
    setShowEditor(false);
    setEditingSong(null);
    setLoading(true);
    await loadSongs();
  }

  async function handleDelete(id) {
    await Song.delete(id);
    setLoading(true);
    await loadSongs();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (showEditor) {
    return (
      <SongEditor
        song={editingSong}
        onSave={handleSave}
        onCancel={() => { setShowEditor(false); setEditingSong(null); }}
      />
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Song Library</h1>
          <p className="text-muted-foreground text-sm mt-1">{songs.length} songs</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="w-4 h-4" /> Add Song
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
              {selectedTag === tag && <X className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <Music className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            {songs.length === 0 ? "No songs yet" : "No songs match your search"}
          </p>
          {songs.length === 0 && (
            <Button variant="outline" onClick={handleNew} className="gap-2">
              <Plus className="w-4 h-4" /> Add your first song
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onEdit={() => handleEdit(song)}
              onDelete={() => handleDelete(song.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
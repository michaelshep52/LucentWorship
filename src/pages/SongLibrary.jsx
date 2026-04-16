import { useState, useEffect } from "react";
import { Song } from "@/api/entities";
import { Music, Plus, Search, Tag, Edit2, Trash2, X, Loader2 } from "lucide-react";
import SongEditor from "../components/SongEditor";

export default function SongLibrary() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [editingSong, setEditingSong] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  
  useEffect(() => {
    loadSongs();
    if (urlParams.get('new') === '1') setShowEditor(true);
  }, []);

  async function loadSongs() {
    setLoading(true);
    const data = await Song.list('-updated_date');
    setSongs(data);
    setLoading(false);
  }

  async function deleteSong(id) {
    if (!confirm("Delete this song?")) return;
    await Song.delete(id);
    setSongs(s => s.filter(x => x.id !== id));
  }

  const allTags = [...new Set(songs.flatMap(s => s.tags || []))].sort();

  const filtered = songs.filter(s => {
    const matchSearch = !search || s.title?.toLowerCase().includes(search.toLowerCase()) || s.artist?.toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || (s.tags || []).includes(selectedTag);
    return matchSearch && matchTag;
  });

  const sectionColors = { verse: "bg-blue-500/20 text-blue-300", chorus: "bg-purple-500/20 text-purple-300", bridge: "bg-teal/20 text-teal-300" };

  return (
    <div className="flex h-full">
      {/* Song List */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-playfair">Song Library</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{songs.length} songs</p>
          </div>
          <button
            onClick={() => { setEditingSong(null); setShowEditor(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Song
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or artist..."
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center">
              {allTags.slice(0, 6).map(tag => (
                <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTag === tag ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                  <Tag className="w-3 h-3" /> {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Song Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Music className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No songs found</p>
            <button onClick={() => { setEditingSong(null); setShowEditor(true); }}
              className="mt-3 text-primary text-sm hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add your first song
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(song => (
              <div key={song.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{song.title}</h3>
                    {song.artist && <p className="text-xs text-muted-foreground mt-0.5">{song.artist}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button onClick={() => { setEditingSong(song); setShowEditor(true); }}
                      className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteSong(song.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sections preview */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {(song.sections || []).map((s, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${sectionColors[s.type] || "bg-muted text-muted-foreground"}`}>
                      {s.label || s.type}
                    </span>
                  ))}
                </div>

                {/* Tags */}
                {(song.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {song.tags.map(t => (
                      <span key={t} className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">#{t}</span>
                    ))}
                  </div>
                )}

                {song.key && (
                  <div className="mt-2 pt-2 border-t border-border flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Key: <span className="text-foreground font-medium">{song.key}</span></span>
                    {song.ccli_number && <span className="text-xs text-muted-foreground">CCLI: {song.ccli_number}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Song Editor Drawer */}
      {showEditor && (
        <div className="w-[480px] border-l border-border bg-card flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">{editingSong ? "Edit Song" : "New Song"}</h2>
            <button onClick={() => setShowEditor(false)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-5">
            <SongEditor
              song={editingSong}
              onSave={async (data) => {
                if (editingSong) {
                  await Song.update(editingSong.id, data);
                } else {
                  await Song.create(data);
                }
                await loadSongs();
                setShowEditor(false);
              }}
              onCancel={() => setShowEditor(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
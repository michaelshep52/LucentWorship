import { useState, useEffect } from "react";
import { Song } from "@/api/entities";
import { ArrowLeft, Search, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SongPicker({ onSelect, onCancel }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Song.list("-updated_date", 500).then((data) => {
      setSongs(data);
      setLoading(false);
    });
  }, []);

  const filtered = songs.filter(
    (s) => !search || s.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Add Song Lyrics</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Music className="w-8 h-8 mx-auto mb-2" />
          <p>No songs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((song) => (
            <button
              key={song.id}
              onClick={() => onSelect(song)}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-left hover:border-primary/30 transition-all flex items-center gap-3"
            >
              <Music className="w-4 h-4 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground">
                  {song.artist || "Unknown"} · {song.sections?.length || 0} sections
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
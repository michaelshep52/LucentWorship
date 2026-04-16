import { Music, Edit, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SongCard({ song, onEdit, onDelete }) {
  const sectionCount = song.sections?.length || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300 group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Music className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{song.title}</h3>
          {song.artist && (
            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {song.key && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Key: {song.key}
          </span>
        )}
        {song.tempo && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {song.tempo} BPM
          </span>
        )}
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          {sectionCount} section{sectionCount !== 1 ? "s" : ""}
        </span>
      </div>

      {(song.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {song.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Tag className="w-2.5 h-2.5" /> {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onEdit}>
          <Edit className="w-3 h-3 mr-1" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
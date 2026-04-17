import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScriptureBookmark } from "@/api/entities";

export default function SlideEditor({ slide, onChange, onImportScripture }) {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    ScriptureBookmark.list("-updated_date", 200).then(setBookmarks).catch(() => setBookmarks([]));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-2">
        <Label className="text-xs text-muted-foreground">Content</Label>
        <Textarea
          value={slide.content || ""}
          onChange={(event) => onChange({ content: event.target.value })}
          placeholder="Slide content..."
          rows={3}
          className="mt-1 font-mono text-sm"
        />
      </div>
      <div className="md:col-span-2 space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Subtitle / Reference</Label>
          <Input
            value={slide.subtext || ""}
            onChange={(event) => onChange({ subtext: event.target.value })}
            placeholder="Optional subtitle"
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Size</Label>
            <Select value={slide.font_size || "large"} onValueChange={(value) => onChange({ font_size: value })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="xlarge">X-Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Align</Label>
            <Select value={slide.text_align || "center"} onValueChange={(value) => onChange({ text_align: value })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Background</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={slide.background_color || "#0f172a"}
                onChange={(event) => onChange({ background_color: event.target.value })}
                className="w-10 h-9 rounded border border-border cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Background Image URL</Label>
          <Input
            value={slide.background_image || ""}
            onChange={(event) => onChange({ background_image: event.target.value })}
            placeholder="https://..."
            className="mt-1"
          />
        </div>

        {bookmarks.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Import Saved Scripture</Label>
            <Select
              value=""
              onValueChange={(value) => {
                const bookmark = bookmarks.find((item) => item.id === value);
                if (bookmark) onImportScripture?.(bookmark);
              }}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose saved scripture..." /></SelectTrigger>
              <SelectContent>
                {bookmarks.map((bookmark) => (
                  <SelectItem key={bookmark.id} value={bookmark.id}>
                    {bookmark.reference} ({bookmark.translation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

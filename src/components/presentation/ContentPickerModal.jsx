import { useState, useEffect, useRef } from "react";
import { Song, ScriptureBookmark } from "@/api/entities";
import {
  Music, BookOpen, Type, Timer, Search, X, ChevronRight,
  Play, Hash, FileText, Plus, Check
} from "lucide-react";

// ─── Slide mini-preview ──────────────────────────────────────────────────────
function MiniSlide({ bgColor = "#000", bgImage, children }) {
  return (
    <div
      className="w-full aspect-video rounded-md overflow-hidden flex items-center justify-center relative"
      style={{
        backgroundColor: bgColor,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {bgImage && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative z-10 text-center px-2">{children}</div>
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "lyrics",    label: "Lyrics",     icon: Music },
  { id: "scripture", label: "Scripture",  icon: BookOpen },
  { id: "text",      label: "Text",       icon: Type },
  { id: "countdown", label: "Countdown",  icon: Timer },
];

// ─── Main modal ──────────────────────────────────────────────────────────────
export default function ContentPickerModal({ defaultTab = "lyrics", onAdd, onClose }) {
  const [tab, setTab]           = useState(defaultTab);
  const [songs, setSongs]       = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [expandedSong, setExpandedSong] = useState(null);
  const [selected, setSelected] = useState([]); // [{type, payload}]
  const searchRef               = useRef(null);

  useEffect(() => {
    Promise.all([
      Song.list("-updated_date", 500),
      ScriptureBookmark.list("-updated_date", 200).catch(() => []),
    ]).then(([s, b]) => {
      setSongs(s);
      setBookmarks(b);
      setLoading(false);
    });
  }, []);

  // Reset search when switching tabs
  useEffect(() => {
    setSearch("");
    setExpandedSong(null);
    searchRef.current?.focus();
  }, [tab]);

  function toggleSection(songId, sectionIndex, song, section) {
    const key = `${songId}|${sectionIndex}`;
    const already = selected.find(s => s.key === key);
    if (already) {
      setSelected(s => s.filter(x => x.key !== key));
    } else {
      setSelected(s => [...s, {
        key,
        type: "lyrics",
        payload: {
          content: section.lyrics || "",
          subtext: `${song.title} — ${section.label || section.type}`,
          type: "lyrics",
          song_id: songId,
          section_index: sectionIndex,
        }
      }]);
    }
  }

  function toggleBookmark(bookmark) {
    const key = `scripture|${bookmark.id}`;
    const already = selected.find(s => s.key === key);
    if (already) {
      setSelected(s => s.filter(x => x.key !== key));
    } else {
      setSelected(s => [...s, {
        key,
        type: "scripture",
        payload: { bookmark }
      }]);
    }
  }

  function addAllSections(song) {
    const newItems = (song.sections || []).map((section, i) => {
      const key = `${song.id}|${i}`;
      return {
        key,
        type: "lyrics",
        payload: {
          content: section.lyrics || "",
          subtext: `${song.title} — ${section.label || section.type}`,
          type: "lyrics",
          song_id: song.id,
          section_index: i,
        }
      };
    }).filter(item => !selected.find(s => s.key === item.key));
    setSelected(s => [...s, ...newItems]);
  }

  function handleAddText(e) {
    e.preventDefault();
    const text = e.target.content.value.trim();
    if (!text) return;
    onAdd([{
      type: "text",
      payload: { content: text, subtext: "", type: "text" }
    }]);
  }

  function handleAddCountdown(e) {
    e.preventDefault();
    const minutes = parseInt(e.target.minutes.value) || 5;
    const label   = e.target.label.value.trim() || "Starting Soon";
    onAdd([{
      type: "countdown",
      payload: { content: label, subtext: `${minutes}:00`, type: "countdown", duration_minutes: minutes }
    }]);
  }

  function commitSelected() {
    if (selected.length > 0) onAdd(selected);
  }

  // ── Filtered lists
  const q = search.toLowerCase();
  const filteredSongs     = songs.filter(s =>
    !q || s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q)
  );
  const filteredBookmarks = bookmarks.filter(b =>
    !q || b.reference?.toLowerCase().includes(q) || b.text?.toLowerCase().includes(q)
  );

  // ── Section type colours
  const sectionColor = (type) => {
    const map = { verse: "blue", chorus: "purple", bridge: "green", pre: "yellow", outro: "red", intro: "teal" };
    return map[type?.toLowerCase()] || "gray";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">Add Content</h2>
            <p className="text-xs text-muted-foreground">Pick slides to add to your presentation</p>
          </div>
          {selected.length > 0 && (
            <button
              onClick={commitSelected}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add {selected.length} slide{selected.length !== 1 ? "s" : ""}
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-border">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                tab === id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search bar (lyrics + scripture only) */}
          {(tab === "lyrics" || tab === "scripture") && (
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={tab === "lyrics" ? "Search songs…" : "Search scripture…"}
                  className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-1 space-y-2">

            {/* ── LYRICS ── */}
            {tab === "lyrics" && (
              loading ? <Spinner /> :
              filteredSongs.length === 0 ? <Empty icon={Music} label="No songs found" /> :
              filteredSongs.map(song => {
                const isOpen = expandedSong === song.id;
                const songSections = song.sections || [];
                const selectedCount = songSections.filter((_, i) => selected.find(s => s.key === `${song.id}|${i}`)).length;

                return (
                  <div key={song.id} className="border border-border rounded-xl overflow-hidden">
                    {/* Song header row */}
                    <button
                      onClick={() => setExpandedSong(isOpen ? null : song.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {song.artist || "Unknown"} · {songSections.length} sections
                        </p>
                      </div>
                      {selectedCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                          {selectedCount} selected
                        </span>
                      )}
                      {songSections.length > 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); addAllSections(song); }}
                          className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors mr-1"
                        >
                          All
                        </button>
                      )}
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    </button>

                    {/* Expanded sections grid */}
                    {isOpen && songSections.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-background/40 border-t border-border">
                        {songSections.map((section, i) => {
                          const key = `${song.id}|${i}`;
                          const isSel = !!selected.find(s => s.key === key);
                          const color = sectionColor(section.type);
                          return (
                            <button
                              key={key}
                              onClick={() => toggleSection(song.id, i, song, section)}
                              className={`relative rounded-lg border-2 overflow-hidden transition-all hover:scale-[1.02] ${
                                isSel ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/40"
                              }`}
                            >
                              <MiniSlide bgColor="#0f0f1a">
                                <p className="text-white text-[9px] leading-tight line-clamp-4 px-1">
                                  {section.lyrics?.slice(0, 120) || "—"}
                                </p>
                              </MiniSlide>
                              <div className="px-2 py-1.5 bg-card flex items-center gap-1.5">
                                <span className={`text-[9px] font-bold uppercase tracking-wide text-${color}-400`}>
                                  {section.label || section.type}
                                </span>
                              </div>
                              {isSel && (
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* ── SCRIPTURE ── */}
            {tab === "scripture" && (
              loading ? <Spinner /> :
              filteredBookmarks.length === 0
                ? <Empty icon={BookOpen} label="No saved scripture found. Add bookmarks in the Scripture Browser." />
                : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredBookmarks.map(bm => {
                      const key = `scripture|${bm.id}`;
                      const isSel = !!selected.find(s => s.key === key);
                      return (
                        <button
                          key={bm.id}
                          onClick={() => toggleBookmark(bm)}
                          className={`relative rounded-xl border-2 overflow-hidden transition-all hover:scale-[1.02] text-left ${
                            isSel ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <MiniSlide bgColor="#0a1628">
                            <p className="text-white text-[9px] leading-snug line-clamp-5 px-1">
                              {bm.text?.slice(0, 150) || ""}
                            </p>
                          </MiniSlide>
                          <div className="px-2.5 py-2 bg-card">
                            <p className="text-xs font-semibold truncate">{bm.reference}</p>
                            <p className="text-[10px] text-muted-foreground">{bm.translation}</p>
                          </div>
                          {isSel && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )
            )}

            {/* ── TEXT ── */}
            {tab === "text" && (
              <form onSubmit={handleAddText} className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">Create a custom text slide.</p>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Slide content</label>
                  <textarea
                    name="content"
                    rows={4}
                    maxLength={180}
                    placeholder="Type your text here…"
                    autoFocus
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
                {/* Preview */}
                <div className="max-w-xs">
                  <p className="text-xs text-muted-foreground mb-1">Preview</p>
                  <MiniSlide bgColor="#000">
                    <p className="text-white text-xs">Your text will appear here</p>
                  </MiniSlide>
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Add Text Slide
                </button>
              </form>
            )}

            {/* ── COUNTDOWN ── */}
            {tab === "countdown" && (
              <form onSubmit={handleAddCountdown} className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">Add a countdown timer slide.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Minutes</label>
                    <input
                      name="minutes"
                      type="number"
                      defaultValue={5}
                      min={1}
                      max={60}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Label</label>
                    <input
                      name="label"
                      type="text"
                      defaultValue="Starting Soon"
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                {/* Preview */}
                <div className="max-w-xs">
                  <p className="text-xs text-muted-foreground mb-1">Preview</p>
                  <MiniSlide bgColor="#0f0f1a">
                    <div className="text-center">
                      <p className="text-white/60 text-[10px] mb-0.5">Starting Soon</p>
                      <p className="text-white font-bold text-xl font-mono">5:00</p>
                    </div>
                  </MiniSlide>
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Add Countdown Slide
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Footer — sticky add button when items are selected */}
        {selected.length > 0 && (tab === "lyrics" || tab === "scripture") && (
          <div className="px-5 py-3 border-t border-border bg-card/80 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {selected.length} slide{selected.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected([])}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
              <button
                onClick={commitSelected}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add {selected.length} slide{selected.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function Empty({ icon: Icon, label }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
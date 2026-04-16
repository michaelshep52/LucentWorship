import { useState, useEffect } from "react";
import { ScriptureBookmark } from "@/api/entities";
import { BookOpen, Search, Bookmark, Trash2, Loader2, ChevronRight } from "lucide-react";

const TRANSLATIONS = ["NKJV", "NIV", "ESV", "NLT", "MSG", "God's Word"];

const BIBLE_BOOKS = {
  "Old Testament": [
    { name: "Genesis", chapters: 50 }, { name: "Exodus", chapters: 40 }, { name: "Leviticus", chapters: 27 },
    { name: "Numbers", chapters: 36 }, { name: "Deuteronomy", chapters: 34 }, { name: "Joshua", chapters: 24 },
    { name: "Judges", chapters: 21 }, { name: "Ruth", chapters: 4 }, { name: "1 Samuel", chapters: 31 },
    { name: "2 Samuel", chapters: 24 }, { name: "1 Kings", chapters: 22 }, { name: "2 Kings", chapters: 25 },
    { name: "1 Chronicles", chapters: 29 }, { name: "2 Chronicles", chapters: 36 }, { name: "Ezra", chapters: 10 },
    { name: "Nehemiah", chapters: 13 }, { name: "Esther", chapters: 10 }, { name: "Job", chapters: 42 },
    { name: "Psalms", chapters: 150 }, { name: "Proverbs", chapters: 31 }, { name: "Ecclesiastes", chapters: 12 },
    { name: "Song of Solomon", chapters: 8 }, { name: "Isaiah", chapters: 66 }, { name: "Jeremiah", chapters: 52 },
    { name: "Lamentations", chapters: 5 }, { name: "Ezekiel", chapters: 48 }, { name: "Daniel", chapters: 12 },
    { name: "Hosea", chapters: 14 }, { name: "Joel", chapters: 3 }, { name: "Amos", chapters: 9 },
    { name: "Obadiah", chapters: 1 }, { name: "Jonah", chapters: 4 }, { name: "Micah", chapters: 7 },
    { name: "Nahum", chapters: 3 }, { name: "Habakkuk", chapters: 3 }, { name: "Zephaniah", chapters: 3 },
    { name: "Haggai", chapters: 2 }, { name: "Zechariah", chapters: 14 }, { name: "Malachi", chapters: 4 }
  ],
  "New Testament": [
    { name: "Matthew", chapters: 28 }, { name: "Mark", chapters: 16 }, { name: "Luke", chapters: 24 },
    { name: "John", chapters: 21 }, { name: "Acts", chapters: 28 }, { name: "Romans", chapters: 16 },
    { name: "1 Corinthians", chapters: 16 }, { name: "2 Corinthians", chapters: 13 }, { name: "Galatians", chapters: 6 },
    { name: "Ephesians", chapters: 6 }, { name: "Philippians", chapters: 4 }, { name: "Colossians", chapters: 4 },
    { name: "1 Thessalonians", chapters: 5 }, { name: "2 Thessalonians", chapters: 3 }, { name: "1 Timothy", chapters: 6 },
    { name: "2 Timothy", chapters: 4 }, { name: "Titus", chapters: 3 }, { name: "Philemon", chapters: 1 },
    { name: "Hebrews", chapters: 13 }, { name: "James", chapters: 5 }, { name: "1 Peter", chapters: 5 },
    { name: "2 Peter", chapters: 3 }, { name: "1 John", chapters: 5 }, { name: "2 John", chapters: 1 },
    { name: "3 John", chapters: 1 }, { name: "Jude", chapters: 1 }, { name: "Revelation", chapters: 22 }
  ]
};

const ALL_BOOKS = [...BIBLE_BOOKS["Old Testament"], ...BIBLE_BOOKS["New Testament"]];

export default function ScriptureBrowser() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [verseFrom, setVerseFrom] = useState(1);
  const [verseTo, setVerseTo] = useState(1);
  const [translation, setTranslation] = useState("NKJV");
  const [fetchedText, setFetchedText] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [tags, setTags] = useState("");
  const [step, setStep] = useState("book"); // book | chapter | verse | result
  const [bookSearch, setBookSearch] = useState("");

  useEffect(() => { loadBookmarks(); }, []);

  async function loadBookmarks() {
    setLoading(true);
    const data = await ScriptureBookmark.list('-created_date');
    setBookmarks(data);
    setLoading(false);
  }

  function selectBook(book) {
    setSelectedBook(book);
    setSelectedChapter(null);
    setFetchedText(null);
    setStep("chapter");
  }

  function selectChapter(ch) {
    setSelectedChapter(ch);
    setVerseFrom(1);
    setVerseTo(1);
    setFetchedText(null);
    setStep("verse");
  }

  async function fetchVerse() {
    if (!selectedBook || !selectedChapter) return;
    setFetching(true);
    setFetchedText(null);
    const ref = verseFrom === verseTo
      ? `${selectedBook.name} ${selectedChapter}:${verseFrom}`
      : `${selectedBook.name} ${selectedChapter}:${verseFrom}-${verseTo}`;
    // Prompt user to enter verse text manually since no AI backend is connected
    const text = window.prompt(`Enter the text for ${ref} (${translation}):`);
    if (!text) { setFetching(false); return; }
    setFetchedText({ reference: ref, text: text.trim(), translation });
    setStep("result");
    setFetching(false);
  }

  async function saveBookmark() {
    if (!fetchedText) return;
    await ScriptureBookmark.create({
      reference: fetchedText.reference,
      text: fetchedText.text,
      translation: fetchedText.translation,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean)
    });
    setTags("");
    setFetchedText(null);
    setStep("book");
    loadBookmarks();
  }

  async function deleteBookmark(id) {
    if (!confirm("Remove this bookmark?")) return;
    await ScriptureBookmark.delete(id);
    setBookmarks(b => b.filter(x => x.id !== id));
  }

  const filteredBooks = ALL_BOOKS.filter(b => !bookSearch || b.name.toLowerCase().includes(bookSearch.toLowerCase()));

  const chapterCount = selectedBook?.chapters || 0;

  return (
    <div className="flex h-full">
      {/* Left Panel: Bible Navigator */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        {/* Translation Selector */}
        <div className="p-4 border-b border-border">
          <label className="text-xs text-muted-foreground block mb-1">Translation</label>
          <div className="flex flex-wrap gap-1.5">
            {TRANSLATIONS.map(t => (
              <button key={t} onClick={() => setTranslation(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${translation === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Step Navigator */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border text-xs text-muted-foreground">
          <button onClick={() => setStep("book")} className={`hover:text-foreground transition-colors ${step === "book" ? "text-primary font-medium" : ""}`}>Books</button>
          {selectedBook && <>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => setStep("chapter")} className={`hover:text-foreground transition-colors ${step === "chapter" ? "text-primary font-medium" : ""}`}>{selectedBook.name}</button>
          </>}
          {selectedChapter && <>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => setStep("verse")} className={`hover:text-foreground transition-colors ${step === "verse" ? "text-primary font-medium" : ""}`}>Ch. {selectedChapter}</button>
          </>}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto">
          {/* Book Selection */}
          {step === "book" && (
            <div className="p-3">
              <input value={bookSearch} onChange={e => setBookSearch(e.target.value)}
                placeholder="Search books..." 
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-3" />
              {Object.entries(BIBLE_BOOKS).map(([testament, books]) => {
                const visible = books.filter(b => !bookSearch || b.name.toLowerCase().includes(bookSearch.toLowerCase()));
                if (!visible.length) return null;
                return (
                  <div key={testament} className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">{testament}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {visible.map(book => (
                        <button key={book.name} onClick={() => selectBook(book)}
                          className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${selectedBook?.name === book.name ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                          {book.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chapter Selection */}
          {step === "chapter" && selectedBook && (
            <div className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">{selectedBook.name} — Select Chapter</p>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: chapterCount }, (_, i) => i + 1).map(ch => (
                  <button key={ch} onClick={() => selectChapter(ch)}
                    className={`py-1.5 rounded text-xs font-medium transition-colors ${selectedChapter === ch ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verse Selection */}
          {step === "verse" && selectedBook && selectedChapter && (
            <div className="p-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground">{selectedBook.name} {selectedChapter} — Select Verse(s)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">From Verse</label>
                  <input type="number" min={1} value={verseFrom} onChange={e => setVerseFrom(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">To Verse</label>
                  <input type="number" min={verseFrom} value={verseTo} onChange={e => setVerseTo(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <button onClick={fetchVerse} disabled={fetching}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {fetching ? "Fetching..." : `Fetch ${translation}`}
              </button>
            </div>
          )}

          {/* Result */}
          {step === "result" && fetchedText && (
            <div className="p-4 space-y-3">
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="text-xs font-semibold text-gold mb-2">{fetchedText.reference} · {fetchedText.translation}</p>
                <p className="text-sm text-foreground leading-relaxed italic">"{fetchedText.text}"</p>
              </div>
              <input value={tags} onChange={e => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={saveBookmark}
                className="w-full py-2 bg-gold/80 text-background rounded-lg text-sm font-semibold hover:bg-gold transition-colors flex items-center justify-center gap-1.5">
                <Bookmark className="w-4 h-4" /> Save Bookmark
              </button>
              <button onClick={() => { setStep("verse"); setFetchedText(null); }}
                className="w-full py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs hover:bg-secondary/80 transition-colors">
                ← Back to Verse Selector
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Saved Bookmarks */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold text-foreground font-playfair mb-6">Saved Scripture</h1>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />)}</div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No bookmarks yet</p>
            <p className="text-sm text-muted-foreground mt-1">Browse the Bible on the left to save verses</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 gap-4 space-y-4">
            {bookmarks.map(bm => (
              <div key={bm.id} className="bg-card border border-border rounded-xl p-5 break-inside-avoid group hover:border-gold/40 transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gold">{bm.reference}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{bm.translation}</p>
                  </div>
                  <button onClick={() => deleteBookmark(bm.id)}
                    className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground leading-relaxed italic">"{bm.text}"</p>
                {(bm.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {bm.tags.map(t => (
                      <span key={t} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronRight, Loader2, Save, Search, Trash2 } from "lucide-react";
import { ScriptureBookmark } from "@/api/entities";
import { BOOKS, DESIRED_TRANSLATION_LABELS, getBookOptionsByTestament, resolveLastChapterNumber } from "@/lib/bible-api";
import { toast } from "@/components/ui/use-toast";

export default function ScriptureBrowser() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verseFrom, setVerseFrom] = useState(1);
  const [verseTo, setVerseTo] = useState(1);
  const [translation, setTranslation] = useState("KJV");
  const [scriptureText, setScriptureText] = useState("");
  const [step, setStep] = useState("book");
  const [bookSearch, setBookSearch] = useState("");

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    setLoading(true);
    try {
      const data = await ScriptureBookmark.list("-updated_date", 200);
      setBookmarks(data);
    } finally {
      setLoading(false);
    }
  }

  function selectBook(book) {
    setSelectedBook(book);
    setSelectedChapter(1);
    setVerseFrom(1);
    setVerseTo(1);
    setScriptureText("");
    setStep("chapter");
  }

  function selectChapter(chapter) {
    setSelectedChapter(chapter);
    setVerseFrom(1);
    setVerseTo(1);
    setScriptureText("");
    setStep("entry");
  }

  function buildReference() {
    if (!selectedBook) return "";
    return verseFrom === verseTo
      ? `${selectedBook.commonName} ${selectedChapter}:${verseFrom}`
      : `${selectedBook.commonName} ${selectedChapter}:${verseFrom}-${verseTo}`;
  }

  async function saveScripture() {
    if (!selectedBook || !scriptureText.trim()) return;

    setSaving(true);

    try {
      await ScriptureBookmark.create({
        reference: buildReference(),
        translation,
        book: selectedBook.commonName,
        chapter: selectedChapter,
        verse_from: verseFrom,
        verse_to: verseTo,
        text: scriptureText.trim(),
      });

      setScriptureText("");
      setStep("book");
      await loadBookmarks();
      toast({ title: "Scripture saved", description: buildReference() });
    } catch (error) {
      console.error(error);
      toast({
        title: "Save failed",
        description: error.message || "The scripture could not be saved.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteBookmark(id) {
    if (!confirm("Remove this scripture entry?")) return;
    await ScriptureBookmark.delete(id);
    setBookmarks((current) => current.filter((item) => item.id !== id));
  }

  const filteredBooks = useMemo(
    () => BOOKS.filter((book) => !bookSearch || book.commonName.toLowerCase().includes(bookSearch.toLowerCase())),
    [bookSearch]
  );

  const booksByTestament = useMemo(() => getBookOptionsByTestament(filteredBooks), [filteredBooks]);
  const chapterCount = resolveLastChapterNumber(selectedBook);

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <label className="text-xs text-muted-foreground block mb-1">Translation</label>
          <div className="flex flex-wrap gap-1.5">
            {DESIRED_TRANSLATION_LABELS.map((label) => (
              <button
                key={label}
                onClick={() => setTranslation(label)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  translation === label ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 py-2 border-b border-border text-xs text-muted-foreground">
          <button onClick={() => setStep("book")} className={`hover:text-foreground transition-colors ${step === "book" ? "text-primary font-medium" : ""}`}>Books</button>
          {selectedBook && <>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => setStep("chapter")} className={`hover:text-foreground transition-colors ${step === "chapter" ? "text-primary font-medium" : ""}`}>{selectedBook.commonName}</button>
          </>}
          {selectedBook && selectedChapter && <>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => setStep("entry")} className={`hover:text-foreground transition-colors ${step === "entry" ? "text-primary font-medium" : ""}`}>Ch. {selectedChapter}</button>
          </>}
        </div>

        <div className="flex-1 overflow-auto">
          {step === "book" && (
            <div className="p-3">
              <input
                value={bookSearch}
                onChange={(event) => setBookSearch(event.target.value)}
                placeholder="Search books..."
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-3"
              />
              {Object.entries(booksByTestament).map(([testament, testamentBooks]) => {
                if (!testamentBooks.length) return null;

                return (
                  <div key={testament} className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">{testament}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {testamentBooks.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => selectBook(book)}
                          className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${
                            selectedBook?.id === book.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          {book.commonName}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === "chapter" && selectedBook && (
            <div className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">{selectedBook.commonName} - Select Chapter</p>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: chapterCount }, (_, index) => index + 1).map((chapter) => (
                  <button
                    key={chapter}
                    onClick={() => selectChapter(chapter)}
                    className={`py-1.5 rounded text-xs font-medium transition-colors ${
                      selectedChapter === chapter ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {chapter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "entry" && selectedBook && (
            <div className="p-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground">{selectedBook.commonName} {selectedChapter} - Enter Verse(s)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">From Verse</label>
                  <input
                    type="number"
                    min={1}
                    value={verseFrom}
                    onChange={(event) => setVerseFrom(Number(event.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">To Verse</label>
                  <input
                    type="number"
                    min={verseFrom}
                    value={verseTo}
                    onChange={(event) => setVerseTo(Number(event.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Scripture Text</label>
                <textarea
                  value={scriptureText}
                  onChange={(event) => setScriptureText(event.target.value)}
                  rows={8}
                  placeholder={`Paste or type ${buildReference()} (${translation})`}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                />
              </div>
              <button
                onClick={saveScripture}
                disabled={saving || !scriptureText.trim()}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : `Save ${translation}`}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold text-foreground font-playfair mb-6">Saved Scripture</h1>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 bg-card rounded-xl animate-pulse" />)}</div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No scripture saved yet</p>
            <p className="text-sm text-muted-foreground mt-1">Choose a translation, book, chapter, and verse range on the left, then paste the text.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 gap-4 space-y-4">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-card border border-border rounded-xl p-5 break-inside-avoid group hover:border-gold/40 transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gold">{bookmark.reference}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bookmark.translation} · {bookmark.book} {bookmark.chapter}:{bookmark.verse_from}{bookmark.verse_to && bookmark.verse_to !== bookmark.verse_from ? `-${bookmark.verse_to}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{bookmark.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

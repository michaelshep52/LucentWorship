const API_BASES = [
  "https://raw.githubusercontent.com/wldeh/bible-api/master/bibles",
  "https://raw.githubusercontent.com/wldeh/bible-api/main/bibles",
];

const DESIRED_TRANSLATIONS = [
  { label: "KJV", id: "en-kjv" },
  { label: "NKJV", id: "en-nkjv" },
  { label: "NIV", id: "en-niv" },
  { label: "NLT", id: "en-nlt" },
  { label: "CSB", id: "en-csb" },
  { label: "NASB", id: "en-nasb" },
  { label: "ESV", id: "en-esv" },
  { label: "GW", id: "en-gw" },
  { label: "AMP", id: "en-amp" },
  { label: "LEB", id: "en-leb" },
  { label: "MSG", id: "en-msg" },
  { label: "ASV", id: "en-asv" },
  { label: "CEB", id: "en-ceb" },
  { label: "GNT", id: "en-gnt" },
  { label: "MEV", id: "en-mev" },
  { label: "TLV", id: "en-tlv" },
];

export const DESIRED_TRANSLATION_LABELS = DESIRED_TRANSLATIONS.map((item) => item.label);

export const BOOKS = [
  { id: "genesis", name: "Genesis", commonName: "Genesis", numberOfChapters: 50, order: 1 },
  { id: "exodus", name: "Exodus", commonName: "Exodus", numberOfChapters: 40, order: 2 },
  { id: "leviticus", name: "Leviticus", commonName: "Leviticus", numberOfChapters: 27, order: 3 },
  { id: "numbers", name: "Numbers", commonName: "Numbers", numberOfChapters: 36, order: 4 },
  { id: "deuteronomy", name: "Deuteronomy", commonName: "Deuteronomy", numberOfChapters: 34, order: 5 },
  { id: "joshua", name: "Joshua", commonName: "Joshua", numberOfChapters: 24, order: 6 },
  { id: "judges", name: "Judges", commonName: "Judges", numberOfChapters: 21, order: 7 },
  { id: "ruth", name: "Ruth", commonName: "Ruth", numberOfChapters: 4, order: 8 },
  { id: "1-samuel", name: "1 Samuel", commonName: "1 Samuel", numberOfChapters: 31, order: 9 },
  { id: "2-samuel", name: "2 Samuel", commonName: "2 Samuel", numberOfChapters: 24, order: 10 },
  { id: "1-kings", name: "1 Kings", commonName: "1 Kings", numberOfChapters: 22, order: 11 },
  { id: "2-kings", name: "2 Kings", commonName: "2 Kings", numberOfChapters: 25, order: 12 },
  { id: "1-chronicles", name: "1 Chronicles", commonName: "1 Chronicles", numberOfChapters: 29, order: 13 },
  { id: "2-chronicles", name: "2 Chronicles", commonName: "2 Chronicles", numberOfChapters: 36, order: 14 },
  { id: "ezra", name: "Ezra", commonName: "Ezra", numberOfChapters: 10, order: 15 },
  { id: "nehemiah", name: "Nehemiah", commonName: "Nehemiah", numberOfChapters: 13, order: 16 },
  { id: "esther", name: "Esther", commonName: "Esther", numberOfChapters: 10, order: 17 },
  { id: "job", name: "Job", commonName: "Job", numberOfChapters: 42, order: 18 },
  { id: "psalms", name: "Psalms", commonName: "Psalms", numberOfChapters: 150, order: 19 },
  { id: "proverbs", name: "Proverbs", commonName: "Proverbs", numberOfChapters: 31, order: 20 },
  { id: "ecclesiastes", name: "Ecclesiastes", commonName: "Ecclesiastes", numberOfChapters: 12, order: 21 },
  { id: "song-of-solomon", name: "Song of Solomon", commonName: "Song of Solomon", numberOfChapters: 8, order: 22 },
  { id: "isaiah", name: "Isaiah", commonName: "Isaiah", numberOfChapters: 66, order: 23 },
  { id: "jeremiah", name: "Jeremiah", commonName: "Jeremiah", numberOfChapters: 52, order: 24 },
  { id: "lamentations", name: "Lamentations", commonName: "Lamentations", numberOfChapters: 5, order: 25 },
  { id: "ezekiel", name: "Ezekiel", commonName: "Ezekiel", numberOfChapters: 48, order: 26 },
  { id: "daniel", name: "Daniel", commonName: "Daniel", numberOfChapters: 12, order: 27 },
  { id: "hosea", name: "Hosea", commonName: "Hosea", numberOfChapters: 14, order: 28 },
  { id: "joel", name: "Joel", commonName: "Joel", numberOfChapters: 3, order: 29 },
  { id: "amos", name: "Amos", commonName: "Amos", numberOfChapters: 9, order: 30 },
  { id: "obadiah", name: "Obadiah", commonName: "Obadiah", numberOfChapters: 1, order: 31 },
  { id: "jonah", name: "Jonah", commonName: "Jonah", numberOfChapters: 4, order: 32 },
  { id: "micah", name: "Micah", commonName: "Micah", numberOfChapters: 7, order: 33 },
  { id: "nahum", name: "Nahum", commonName: "Nahum", numberOfChapters: 3, order: 34 },
  { id: "habakkuk", name: "Habakkuk", commonName: "Habakkuk", numberOfChapters: 3, order: 35 },
  { id: "zephaniah", name: "Zephaniah", commonName: "Zephaniah", numberOfChapters: 3, order: 36 },
  { id: "haggai", name: "Haggai", commonName: "Haggai", numberOfChapters: 2, order: 37 },
  { id: "zechariah", name: "Zechariah", commonName: "Zechariah", numberOfChapters: 14, order: 38 },
  { id: "malachi", name: "Malachi", commonName: "Malachi", numberOfChapters: 4, order: 39 },
  { id: "matthew", name: "Matthew", commonName: "Matthew", numberOfChapters: 28, order: 40 },
  { id: "mark", name: "Mark", commonName: "Mark", numberOfChapters: 16, order: 41 },
  { id: "luke", name: "Luke", commonName: "Luke", numberOfChapters: 24, order: 42 },
  { id: "john", name: "John", commonName: "John", numberOfChapters: 21, order: 43 },
  { id: "acts", name: "Acts", commonName: "Acts", numberOfChapters: 28, order: 44 },
  { id: "romans", name: "Romans", commonName: "Romans", numberOfChapters: 16, order: 45 },
  { id: "1-corinthians", name: "1 Corinthians", commonName: "1 Corinthians", numberOfChapters: 16, order: 46 },
  { id: "2-corinthians", name: "2 Corinthians", commonName: "2 Corinthians", numberOfChapters: 13, order: 47 },
  { id: "galatians", name: "Galatians", commonName: "Galatians", numberOfChapters: 6, order: 48 },
  { id: "ephesians", name: "Ephesians", commonName: "Ephesians", numberOfChapters: 6, order: 49 },
  { id: "philippians", name: "Philippians", commonName: "Philippians", numberOfChapters: 4, order: 50 },
  { id: "colossians", name: "Colossians", commonName: "Colossians", numberOfChapters: 4, order: 51 },
  { id: "1-thessalonians", name: "1 Thessalonians", commonName: "1 Thessalonians", numberOfChapters: 5, order: 52 },
  { id: "2-thessalonians", name: "2 Thessalonians", commonName: "2 Thessalonians", numberOfChapters: 3, order: 53 },
  { id: "1-timothy", name: "1 Timothy", commonName: "1 Timothy", numberOfChapters: 6, order: 54 },
  { id: "2-timothy", name: "2 Timothy", commonName: "2 Timothy", numberOfChapters: 4, order: 55 },
  { id: "titus", name: "Titus", commonName: "Titus", numberOfChapters: 3, order: 56 },
  { id: "philemon", name: "Philemon", commonName: "Philemon", numberOfChapters: 1, order: 57 },
  { id: "hebrews", name: "Hebrews", commonName: "Hebrews", numberOfChapters: 13, order: 58 },
  { id: "james", name: "James", commonName: "James", numberOfChapters: 5, order: 59 },
  { id: "1-peter", name: "1 Peter", commonName: "1 Peter", numberOfChapters: 5, order: 60 },
  { id: "2-peter", name: "2 Peter", commonName: "2 Peter", numberOfChapters: 3, order: 61 },
  { id: "1-john", name: "1 John", commonName: "1 John", numberOfChapters: 5, order: 62 },
  { id: "2-john", name: "2 John", commonName: "2 John", numberOfChapters: 1, order: 63 },
  { id: "3-john", name: "3 John", commonName: "3 John", numberOfChapters: 1, order: 64 },
  { id: "jude", name: "Jude", commonName: "Jude", numberOfChapters: 1, order: 65 },
  { id: "revelation", name: "Revelation", commonName: "Revelation", numberOfChapters: 22, order: 66 },
];

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Bible API request failed (${response.status})`);
  }
  return response.json();
}

async function fetchJsonWithFallback(paths) {
  let lastError = null;

  for (const path of paths) {
    for (const base of API_BASES) {
      try {
        return await fetchJson(`${base}${path}`);
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error("Bible API request failed.");
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchAvailableTranslations() {
  return DESIRED_TRANSLATIONS.map((item) => ({
    id: item.id,
    shortName: item.label,
    version: item.label,
    description: "",
    language: "English",
  }));
}

export async function fetchTranslationBooks() {
  return BOOKS;
}

export async function fetchScripturePassage({
  translationId,
  bookId,
  chapterNumber,
  verseFrom,
  verseTo,
}) {
  const startVerse = Math.max(1, Number(verseFrom) || 1);
  const endVerse = Math.max(startVerse, Number(verseTo) || startVerse);
  const book = BOOKS.find((item) => item.id === bookId);
  const translation = (await fetchAvailableTranslations()).find((item) => item.id === translationId);

  if (!book) {
    throw new Error("Unknown Bible book.");
  }

  if (!translation) {
    throw new Error("Selected translation is not available.");
  }

  let chapterData;
  try {
    chapterData = await fetchJsonWithFallback([
      `/${translationId}/books/${bookId}/chapters/${chapterNumber}.json`,
    ]);
  } catch (error) {
    if (String(error?.message || "").includes("(404)")) {
      throw new Error(`${translation.shortName} is not available for ${book.commonName} ${chapterNumber} in this source.`);
    }
    throw error;
  }

  const verses = (chapterData.data || [])
    .filter((item) => {
      const verse = Number(item.verse);
      return verse >= startVerse && verse <= endVerse;
    })
    .map((item) => ({
      verse: Number(item.verse),
      text: normalizeText(item.text),
    }));

  const verseLines = verses
    .filter((item) => item.text)
    .map((item) => `${item.verse}. ${item.text}`);

  if (!verseLines.length) {
    throw new Error("No verses were returned for that reference.");
  }

  const reference = startVerse === endVerse
    ? `${book.commonName} ${chapterNumber}:${startVerse}`
    : `${book.commonName} ${chapterNumber}:${startVerse}-${endVerse}`;

  return {
    reference,
    translation: translation.shortName,
    text: verseLines.join("\n"),
    bookName: book.commonName,
  };
}

export function getBookOptionsByTestament(books) {
  return {
    "Old Testament": books.filter((book) => Number(book.order) <= 39),
    "New Testament": books.filter((book) => Number(book.order) > 39),
  };
}

export function resolveFirstChapterNumber() {
  return 1;
}

export function resolveLastChapterNumber(book) {
  return Number(book?.numberOfChapters) || 1;
}

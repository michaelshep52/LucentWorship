import mammoth from "mammoth";

const SECTION_NAME_MAP = {
  verse: "verse",
  chorus: "chorus",
  bridge: "bridge",
  tag: "tag",
  intro: "intro",
  outro: "outro",
  interlude: "interlude",
  "pre-chorus": "pre-chorus",
  prechorus: "pre-chorus",
};

const SECTION_HEADER_REGEX = /^(?:\[\s*)?(verse|chorus|bridge|tag|intro|outro|interlude|pre-chorus|prechorus)(?:\s+([a-z0-9]+))?(?:\s*\])?(?:\s*:)?(?:\s+\|?.*)?$/i;
const CHORD_TOKEN_REGEX = /^[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug)?(?:[0-9]{0,2})?(?:\/[A-G](?:#|b)?)?$/i;

function normalizeText(text) {
  return text.replace(/\r/g, "").replace(/\u00a0/g, " ").trim();
}

function titleFromFileName(fileName) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupSectionLyrics(text) {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isChordToken(token) {
  const cleaned = token.replace(/^[([{'"`]+|[)\]}",.:;!?'"`]+$/g, "");
  if (!cleaned) return false;
  return CHORD_TOKEN_REGEX.test(cleaned);
}

function isChordLine(line) {
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(isChordToken);
}

function stripInlineChordMarkers(line) {
  return line
    .replace(/\[([^\]]+)\]/g, (match, chord) => (isChordToken(chord.trim()) ? "" : match))
    .replace(/\(([A-G][^)]*)\)/gi, (match, chord) => (isChordToken(chord.trim()) ? "" : match))
    .replace(/\s{2,}/g, " ")
    .trimEnd();
}

function stripChordsFromLyrics(text) {
  return cleanupSectionLyrics(
    text
      .split("\n")
      .filter((line) => !isChordLine(line.trim()))
      .map((line) => stripInlineChordMarkers(line))
      .join("\n")
  );
}

function parseMetadataLine(line, metadata) {
  const match = line.match(/^(title|artist|author|key|tempo|bpm|ccli|ccli number|tags)\s*:\s*(.+)$/i);
  if (!match) return false;

  const [, rawKey, rawValue] = match;
  const value = rawValue.trim();
  const key = rawKey.toLowerCase();

  if (key === "title") metadata.title = value;
  if (key === "artist" || key === "author") metadata.artist = value;
  if (key === "key") metadata.key = value;
  if (key === "tempo" || key === "bpm") metadata.tempo = Number(value) || undefined;
  if (key === "ccli" || key === "ccli number") metadata.ccli_number = value;
  if (key === "tags") metadata.tags = value.split(",").map((tag) => tag.trim()).filter(Boolean);

  return true;
}

function parseSectionHeader(line) {
  const match = line.match(SECTION_HEADER_REGEX);
  if (!match) return null;

  const [, rawType, suffix] = match;
  const type = SECTION_NAME_MAP[rawType.toLowerCase()];
  if (!type) return null;

  return {
    type,
    suffix: suffix || "",
    label: sectionLabel(type, suffix || "", { verse: 0 }),
  };
}

function sectionLabel(type, suffix, counts) {
  if (type === "verse") {
    if (suffix) {
      return `Verse ${suffix.toUpperCase()}`;
    }
    counts.verse += 1;
    return `Verse ${counts.verse}`;
  }

  if (suffix) {
    return `${type.charAt(0).toUpperCase() + type.slice(1)} ${suffix.toUpperCase()}`;
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function buildSections(rawSections) {
  const counts = { verse: 0 };

  return rawSections
    .map((section) => {
      const lyricsWithChords = cleanupSectionLyrics(section.lyrics);
      const lyrics = stripChordsFromLyrics(lyricsWithChords);

      if (!lyricsWithChords) return null;

      return {
        type: section.type,
        label: section.label || sectionLabel(section.type, section.suffix, counts),
        lyrics,
        lyricsWithChords,
      };
    })
    .filter(Boolean);
}

export function parseSongContent(text, fileName = "Imported Song.txt") {
  const normalized = normalizeText(text);
  const lines = normalized.split("\n");
  const metadata = { tags: [] };
  const rawSections = [];
  let currentSection = null;
  let titleCaptured = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (currentSection) currentSection.lyrics.push("");
      continue;
    }

    const sectionHeader = parseSectionHeader(line);

    if (!titleCaptured && !currentSection && !parseMetadataLine(line, metadata) && !sectionHeader) {
      metadata.title = metadata.title || line;
      titleCaptured = true;
      continue;
    }

    if (!currentSection && parseMetadataLine(line, metadata)) {
      continue;
    }

    if (sectionHeader) {
      currentSection = {
        type: sectionHeader.type,
        suffix: sectionHeader.suffix,
        label: sectionHeader.label,
        lyrics: [],
      };
      rawSections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = {
        type: "verse",
        label: "Verse 1",
        lyrics: [],
      };
      rawSections.push(currentSection);
    }

    currentSection.lyrics.push(rawLine);
  }

  const sections = buildSections(
    rawSections.map((section) => ({
      ...section,
      lyrics: section.lyrics.join("\n"),
    }))
  );

  const lyricSections = sections.map(({ lyricsWithChords: _drop, ...section }) => section);
  const musicianSections = sections.map(({ lyricsWithChords, ...section }) => ({
    ...section,
    lyrics: lyricsWithChords,
  }));

  return {
    title: metadata.title || titleFromFileName(fileName),
    artist: metadata.artist || "",
    key: metadata.key || "",
    tempo: metadata.tempo,
    ccli_number: metadata.ccli_number || "",
    tags: metadata.tags || [],
    sections: lyricSections,
    musicianSections,
  };
}

export async function parseSongFile(file) {
  const lowerName = file.name.toLowerCase();
  let text = "";

  if (lowerName.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    text = result.value;
  } else {
    text = await file.text();
  }

  return parseSongContent(text, file.name);
}

function extractGoogleDocId(url) {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || null;
}

export async function parseGoogleDoc(url) {
  const docId = extractGoogleDocId(url);

  if (!docId) {
    throw new Error("Invalid Google Docs link.");
  }

  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  const response = await fetch(exportUrl);

  if (!response.ok) {
    throw new Error("Google Doc could not be fetched. Make sure link sharing is enabled.");
  }

  const text = await response.text();
  return parseSongContent(text, `GoogleDoc-${docId}.txt`);
}

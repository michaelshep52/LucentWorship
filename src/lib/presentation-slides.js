export const PRESENTATION_FONT_PX = 30;
export const MAX_LYRICS_CHARS_PER_PAGE = 180;

function normalizeBlock(text) {
  return text.replace(/\r/g, "").trim();
}

function splitLongLine(line, maxChars) {
  const words = line.split(/\s+/).filter(Boolean);
  const chunks = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);

    if (word.length <= maxChars) {
      current = word;
      continue;
    }

    let remaining = word;
    while (remaining.length > maxChars) {
      chunks.push(remaining.slice(0, maxChars));
      remaining = remaining.slice(maxChars);
    }
    current = remaining;
  }

  if (current) chunks.push(current);
  return chunks;
}

export function paginateLyrics(content, maxChars = MAX_LYRICS_CHARS_PER_PAGE) {
  const lines = normalizeBlock(content).split("\n");
  const pages = [];
  let currentPage = [];
  let currentLength = 0;

  function flushPage() {
    if (!currentPage.length) return;
    pages.push(currentPage.join("\n").trim());
    currentPage = [];
    currentLength = 0;
  }

  function addLine(line) {
    const extraLength = (currentPage.length ? 1 : 0) + line.length;
    if (currentLength + extraLength > maxChars) {
      flushPage();
    }
    currentPage.push(line);
    currentLength += (currentPage.length > 1 ? 1 : 0) + line.length;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      if (currentPage.length && currentPage[currentPage.length - 1] !== "") {
        addLine("");
      }
      continue;
    }

    if (line.length <= maxChars) {
      addLine(line);
      continue;
    }

    for (const chunk of splitLongLine(line, maxChars)) {
      addLine(chunk);
    }
  }

  flushPage();
  return pages.filter(Boolean);
}

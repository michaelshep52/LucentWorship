import { paginateLyrics, PRESENTATION_FONT_PX } from '../presentation-slides.js';

/** Rehearsal order is explicit and 1-based for people; repeated sections are allowed. */
export function parseSectionOrder(text, sectionCount) {
  if (!Number.isInteger(sectionCount) || sectionCount < 1 || sectionCount > 1000) throw new Error('A rehearsal needs 1–1,000 song sections.');
  if (typeof text !== 'string') throw new Error('Section order must be a comma-separated list.');
  if (!text.trim()) return Array.from({ length: sectionCount }, (_, index) => index);
  const tokens = text.split(',').map(token => token.trim());
  if (tokens.length > 1000 || tokens.some(token => !/^\d+$/.test(token) || !Number.isSafeInteger(Number(token)) || Number(token) < 1 || Number(token) > sectionCount)) throw new Error(`Use section numbers from 1 to ${sectionCount}, separated by commas.`);
  return tokens.map(token => Number(token) - 1);
}
export function buildSongRehearsal(document, sectionOrder) {
  if (!document || typeof document.title !== 'string' || !document.title.trim() || !Array.isArray(document.sections)) throw new Error('A titled song with sections is required.');
  if (!Array.isArray(sectionOrder) || !sectionOrder.length || sectionOrder.length > 1000) throw new Error('Choose a rehearsal section order.');
  const slides = [];
  for (const [occurrence, index] of sectionOrder.entries()) {
    if (!Number.isInteger(index) || index < 0 || index >= document.sections.length) throw new Error('The rehearsal references an unavailable section.');
    const section = document.sections[index];
    if (!section || typeof section.lyrics !== 'string') throw new Error(`Section ${index + 1} has invalid lyrics.`);
    const pages = paginateLyrics(section.lyrics);
    if (!pages.length) throw new Error(`Section ${index + 1} has no lyrics. Add lyrics or remove it from the rehearsal order.`);
    for (const [pageIndex, content] of pages.entries()) {
      slides.push({
        id: `rehearsal-${occurrence}-${pageIndex}`,
        type: 'text', content, subtext: '', background_color: '#000000', font_px: PRESENTATION_FONT_PX, text_align: 'center',
        section_label: typeof section.label === 'string' && section.label ? section.label : `Section ${index + 1}`,
        source_section_index: index, source_page: pageIndex + 1,
      });
      if (slides.length > 2000) throw new Error('Rehearsal exceeds 2,000 slides; split the song or shorten the order.');
    }
  }
  return { title: document.title.trim(), slides, scope: 'text-only-rehearsal' };
}
export function rehearsalTransition(state, command, count) {
  if (!Number.isInteger(count) || count < 1) return { index: 0, blank: true };
  const index = Math.max(0, Math.min(count - 1, Number.isInteger(state.index) ? state.index : 0));
  // Navigation must not accidentally reveal lyrics while the operator has blanked output.
  if (command === 'next') return { index: Math.min(index + 1, count - 1), blank: Boolean(state.blank) };
  if (command === 'previous') return { index: Math.max(index - 1, 0), blank: Boolean(state.blank) };
  if (command === 'blank') return { index, blank: !state.blank };
  if (command === 'unblank') return { index, blank: false };
  return { index, blank: Boolean(state.blank) };
}

/** Cue a specific lyric page without implicitly revealing blanked output. */
export function jumpRehearsalSlide(state, index, count) {
  if (!Number.isInteger(count) || count < 1 || !Number.isInteger(index) || index < 0 || index >= count) throw new Error('That rehearsal slide is no longer available.');
  return { index, blank: Boolean(state.blank) };
}

/** Read-only operator cues, separate from the audience payload and blanking state. */
export function rehearsalCues(slides, index) {
  if (!Array.isArray(slides) || !Number.isInteger(index) || index < 0 || index >= slides.length) return { current: null, next: null };
  const cue = position => {
    const slide = slides[position];
    if (!slide || typeof slide.content !== 'string') return null;
    return { number: position + 1, label: typeof slide.section_label === 'string' ? slide.section_label : 'Lyric page', content: slide.content };
  };
  return { current: cue(index), next: cue(index + 1) };
}

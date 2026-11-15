import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSongContent, parseSongFile } from '../src/lib/song-import.js';

test('explicit title preserves first lyric line', () => {
  const song = parseSongContent('Title: Test\nFirst lyric line\nSecond lyric line');
  assert.equal(song.title, 'Test');
  assert.equal(song.sections[0].lyrics, 'First lyric line\nSecond lyric line');
});
test('unnumbered verses receive distinct sequential labels', () => {
  const song = parseSongContent('Test\nVerse\nOne\nVerse\nTwo');
  assert.deepEqual(song.sections.map(s => s.label), ['Verse 1', 'Verse 2']);
});
test('plain title and metadata remain supported', () => {
  const song = parseSongContent('Test\nArtist: Writer\nVerse 2\nSome lyrics\nChorus\nMore lyrics');
  assert.equal(song.artist, 'Writer');
  assert.deepEqual(song.sections.map(s => s.label), ['Verse 2', 'Chorus']);
});
test('musician copy retains chords while audience lyrics omit them', () => {
  const song = parseSongContent('Test\nVerse\nC G Am F\n[C]Some [G]lyrics');
  assert.equal(song.sections[0].lyrics, 'Some lyrics');
  assert.equal(song.musicianSections[0].lyrics, 'C G Am F\n[C]Some [G]lyrics');
});
test('text import does not need document conversion library', async () => {
  const song = await parseSongFile({ name: 'test.txt', text: async () => 'Title: Test\nFirst line' });
  assert.equal(song.sections[0].lyrics, 'First line');
});
test('empty input falls back to filename without sections', () => {
  const song = parseSongContent('', 'Sunday_Song.txt');
  assert.equal(song.title, 'Sunday Song');
  assert.deepEqual(song.sections, []);
});

test('implicit and explicit verses advance subsequent numbering', () => {
  assert.deepEqual(parseSongContent('Title: Test\nFirst lyric\nVerse\nSecond lyric').sections.map(s => s.label), ['Verse 1', 'Verse 2']);
  assert.deepEqual(parseSongContent('Test\nVerse 3\nFirst lyric\nVerse\nSecond lyric').sections.map(s => s.label), ['Verse 3', 'Verse 4']);
});

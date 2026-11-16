import test from 'node:test';
import assert from 'node:assert/strict';
import {songEditorDraft,songDocumentFromDraft,newSongDocumentFromDraft} from '../src/lib/local-library/song-editor.js';
const record={document:{id:'old',title:'Song',artist:'',sections:[{lyrics:'Verse'},{lyrics:'Chorus'}],arrangement:['legacy'],metadata:{keep:true}}};
test('local rehearsal order survives saving and reopening without replacing imported arrangement',()=>{
 const draft=songEditorDraft(record);draft.rehearsalOrder='1, 2, 2, 1';
 const saved=songDocumentFromDraft(draft,record.document);
 assert.equal(songEditorDraft({document:saved}).rehearsalOrder,'1, 2, 2, 1');
 assert.deepEqual(saved.arrangement,['legacy']);assert.deepEqual(saved.metadata,{keep:true});
 assert.equal(newSongDocumentFromDraft(draft,record.document).id,undefined);
});
test('invalid or stale section references prevent saving rather than losing the arrangement',()=>{
 const draft=songEditorDraft(record);draft.rehearsalOrder='1, 3';
 assert.throws(()=>songDocumentFromDraft(draft,record.document));
 draft.rehearsalOrder='2';draft.sections.pop();
 assert.throws(()=>songDocumentFromDraft(draft,record.document));
 assert.equal(record.document.sections.length,2);
});
test('blank order retains default section ordering and unsupported stored order is preserved',()=>{
 assert.equal(songEditorDraft(record).rehearsalOrder,'');
 assert.equal(songDocumentFromDraft(songEditorDraft(record),record.document).lucent_rehearsal_order,'');
 assert.throws(()=>songEditorDraft({document:{...record.document,lucent_rehearsal_order:[1,2]}}));
});

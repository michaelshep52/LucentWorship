import test from 'node:test';
import assert from 'node:assert/strict';
import {filterLocalSongs} from '../src/lib/local-library/song-search.js';
const rows=[{id:'a',deleted:false,document:{title:'Grâce',artist:'Anna',sections:[{lyrics:'Hope is here'}]}},{id:'b',deleted:true,document:{title:'Joy',artist:'Bea',sections:[{lyrics:'Hope returns'}]}},{id:'c',deleted:false,document:{title:17,sections:null}}];
test('search finds literal words across title artist and lyrics regardless of case or accents',()=>{
 assert.deepEqual(filterLocalSongs(rows,'GRACE anna hope').map(r=>r.id),['a']);
 assert.deepEqual(filterLocalSongs(rows,'hope').map(r=>r.id),['a','b']);
 assert.deepEqual(filterLocalSongs(rows,'  ').map(r=>r.id),['a','b','c']);
 assert.deepEqual(filterLocalSongs(rows,'[.*]'),[]);
});
test('archive filter is independent from search and preserves original records',()=>{
 const before=structuredClone(rows);
 assert.deepEqual(filterLocalSongs(rows,'hope','active').map(r=>r.id),['a']);
 assert.deepEqual(filterLocalSongs(rows,'hope','archived').map(r=>r.id),['b']);
 assert.equal(filterLocalSongs(rows,'hope')[0],rows[0]);assert.deepEqual(rows,before);
});
test('unsupported song fields do not crash search; invalid search inputs are explicit',()=>{
 assert.equal(filterLocalSongs(rows).length,3);
 assert.throws(()=>filterLocalSongs(rows,'','missing'));assert.throws(()=>filterLocalSongs(rows,null));
});

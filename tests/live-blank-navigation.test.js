import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/pages/LiveMode.jsx',import.meta.url),'utf8');
test('actual cloud LiveMode navigation does not clear operator blanking',()=>{
 const go=source.slice(source.indexOf('  const go ='),source.indexOf('  useEffect(() => {\n    function handleKey'));
 assert.doesNotMatch(go,/setIsBlack/);
 const handlers=[...source.matchAll(/onClick=\{\(\) => \{ setCurrentIndex\((i|idx)\); \}\}/g)];
 assert.equal(handlers.length,3);
 assert.equal((source.match(/setIsBlack\(false\)/g)||[]).length,1);
 assert.match(source,/if \(command === "unblank"\) setIsBlack\(false\)/);
});
test('LiveMode explains that cue navigation preserves black output',()=>{
 assert.match(source,/Output blanked\. Selecting or advancing slides only cues them/);
 assert.match(source,/onClick=\{\(\) => setIsBlack\(b => !b\)\}/);
});
test('both live previews have an immediate nonanimated blackout above exiting slide animations',()=>{
 assert.equal((source.match(/isBlack && <div aria-hidden="true" className="absolute inset-0 z-20 bg-black pointer-events-none"/g)||[]).length,2);
});

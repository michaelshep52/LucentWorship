import { rehearsalTransition } from '../src/lib/local-library/song-presentation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyAudienceState, audienceMessage, receiveAudienceState, expireAudienceState, isAudienceControl, requestAudienceWindow, suspendAudienceState, receiveFreshAudienceState } from '../src/lib/audience-protocol.js';
const session = 'session-a';
const message = (seq, content = 'Lyrics') => audienceMessage(session, seq, { content, blank: false });

test('audience starts black and receives only its scoped session', () => {
  const empty = emptyAudienceState();assert.equal(empty.blank,true);
  assert.equal(receiveAudienceState(empty,message(1),'other',0),empty);
  const live = receiveAudienceState(empty,message(1),session,100);
  assert.equal(live.content,'Lyrics');assert.equal(live.blank,false);
});
test('out-of-order and duplicate updates cannot restore stale lyrics or refresh the timeout', () => {
  const latest = receiveAudienceState(emptyAudienceState(),message(5,'New'),session,100);
  assert.equal(receiveAudienceState(latest,message(4,'Old'),session,200),latest);
  assert.equal(receiveAudienceState(latest,message(5,'Duplicate'),session,300),latest);
  assert.equal(latest.lastReceived,100);
});
test('blank messages omit lyric content and loss of heartbeat blanks the display', () => {
  assert.equal(audienceMessage(session,1,{ content:'Secret words',blank:true }).content,'');
  const live = receiveAudienceState(emptyAudienceState(),message(1),session,100);
  assert.equal(expireAudienceState(live,10099).blank,false);
  const expired = expireAudienceState(live,10100);
  assert.equal(expired.blank,true);assert.equal(expired.content,'');
  assert.equal(receiveAudienceState(expired,message(2,'Recovered'),session,11000).content,'Recovered');
});
test('stop is terminal and queued updates cannot re-light a closed session', () => {
  const live = receiveAudienceState(emptyAudienceState(),message(1),session,0);
  const stopped = receiveAudienceState(live,audienceMessage(session,2,{ content:'Lyrics',blank:false },true),session,10);
  assert.equal(stopped.stopped,true);assert.equal(stopped.blank,true);assert.equal(stopped.content,'');
  assert.equal(receiveAudienceState(stopped,message(3),session,20),stopped);
});
test('malformed payloads and future protocol versions are rejected', () => {
  const empty = emptyAudienceState();
  for (const patch of [{version:2},{sequence:-1},{sequence:1.5},{content:{}},{content:'x'.repeat(2001)},{blank:'false'},{type:'unknown'}]) assert.equal(receiveAudienceState(empty,{...message(1),...patch},session,0),empty);
  assert.throws(() => audienceMessage(session,-1));
});
test('control channel rejects foreign and impossible acknowledgments', () => {
  assert.equal(isAudienceControl({version:1,session,type:'request'},session,2),true);
  assert.equal(isAudienceControl({version:1,session,type:'ack',sequence:2},session,2),true);
  assert.equal(isAudienceControl({version:1,session,type:'ack',sequence:3},session,2),false);
  assert.equal(isAudienceControl({version:1,session:'other',type:'request'},session,2),false);
});
test('operator stop uses pagehide, not cancelable beforeunload navigation', () => {
  const source = readFileSync(new URL('../src/components/LocalRehearsal.jsx',import.meta.url),'utf8');
  assert.match(source,/addEventListener\('pagehide', stop\)/);
  assert.doesNotMatch(source,/addEventListener\('beforeunload', stop\)/);
  assert.match(source,/event\.data\.sequence > acknowledgedSequenceRef\.current/);
});


test('popup block and exceptions are reported without claiming a display opened', () => {
  const args = { origin: 'http://localhost:5173', session: '12345678-1234-1234-1234-123456789abc' };
  assert.equal(requestAudienceWindow({ ...args, openWindow: () => null }).opened,false);
  assert.equal(requestAudienceWindow({ ...args, openWindow: () => { throw new Error('blocked'); } }).opened,false);
  assert.equal(requestAudienceWindow({ ...args, origin: 'file:///tmp/', openWindow: () => assert.fail('must not open') }).opened,false);
});
test('popup request uses same-origin audience route and does not expose slide content', () => {
  const popup = { opener: {} }; let requested;
  const result = requestAudienceWindow({ origin:'http://localhost:5173', session:'12345678-1234-1234-1234-123456789abc', openWindow: (...args) => { requested=args;return popup; } });
  assert.equal(result.opened,true);
  assert.equal(popup.opener,null);
  const url = new URL(requested[0]);assert.equal(url.origin,'http://localhost:5173');assert.equal(url.pathname,'/local-audience');assert.equal(url.search,'');
  assert.match(result.message,/Waiting/);
});


test('resume handshake rejects queued higher-sequence states until fresh proof arrives', () => {
  const live = receiveAudienceState(emptyAudienceState(),message(5),session,0);
  const paused = suspendAudienceState(live,'fresh-token');
  assert.equal(paused.blank,true);assert.equal(paused.content,'');
  assert.equal(receiveAudienceState(paused,message(6,'Queued old words'),session,20000),paused);
  assert.equal(receiveAudienceState(paused,{...message(7),replyTo:'old-token'},session,20001),paused);
  const fresh = receiveAudienceState(paused,{...message(8,'Current words'),replyTo:'fresh-token'},session,20002);
  assert.equal(fresh.content,'Current words');assert.equal(fresh.awaitingToken,null);
  assert.equal(receiveAudienceState(fresh,message(6,'Queued old words'),session,20003),fresh);
});
test('terminal stop remains safe through suspension and token renewal', () => {
  const stopped = receiveAudienceState(emptyAudienceState(),audienceMessage(session,2,{},true),session,0);
  const resumed = suspendAudienceState(stopped,'new-token');
  assert.equal(receiveAudienceState(resumed,{...message(3),replyTo:'new-token'},session,1),resumed);
  assert.equal(resumed.blank,true);
});
test('request tokens and handshake token lengths are bounded', () => {
  assert.equal(isAudienceControl({version:1,session,type:'request',requestId:'valid'},session,2),true);
  for(const requestId of ['',{},'x'.repeat(101)]) assert.equal(isAudienceControl({version:1,session,type:'request',requestId},session,2),false);
  assert.throws(() => suspendAudienceState(emptyAudienceState(),''));
});
test('operator rotates back-cache sessions and publishes only committed React state', () => {
  const source=readFileSync(new URL('../src/components/LocalRehearsal.jsx',import.meta.url),'utf8');
  assert.match(source,/event\.persisted/);assert.match(source,/setSession\(crypto\.randomUUID\(\)\)/);
  assert.match(source,/useLayoutEffect\(\(\) => \{ snapshotRef\.current/);
  const audience=readFileSync(new URL('../src/pages/LocalAudience.jsx',import.meta.url),'utf8');
  assert.match(audience,/if \(document\.hidden\) return/);
  assert.match(audience,/addEventListener\('visibilitychange'/);
});


test('queued heartbeat before delayed timeout task cannot revive stale audience content', () => {
  const live = receiveAudienceState(emptyAudienceState(), message(1), session, 0);
  const expired = receiveFreshAudienceState(live, message(2, 'Queued stale'), session, 10000, () => 'new-proof');
  assert.equal(expired.blank, true); assert.equal(expired.sequence, 1);
  assert.equal(expired.awaitingToken, 'new-proof');
  const fresh = receiveFreshAudienceState(expired, {...message(3,'Current'),replyTo:'new-proof'}, session,10001,()=>assert.fail('reuse challenge'));
  assert.equal(fresh.content,'Current'); assert.equal(fresh.awaitingToken,null);
});
test('message freshness guard preserves timely updates and terminal stop', () => {
  const live=receiveAudienceState(emptyAudienceState(),message(1),session,0);
  assert.equal(receiveFreshAudienceState(live,message(2,'Timely'),session,9999,()=>assert.fail('not expired')).content,'Timely');
  const stopped=receiveFreshAudienceState(live,audienceMessage(session,2,{},true),session,10000,()=> 'challenge');
  assert.equal(stopped.stopped,true);assert.equal(stopped.blank,true);
});


test('blanked navigation stays black across the rehearsal-to-audience message path', () => {
  const navigated=rehearsalTransition({index:0,blank:true},'next',2);
  const payload=audienceMessage(session,1,{content:'Next private cue',blank:navigated.blank});
  assert.equal(payload.content,'');
  const received=receiveAudienceState(emptyAudienceState(),payload,session,0);
  assert.equal(received.blank,true);assert.equal(received.content,'');
  const shown=rehearsalTransition(navigated,'unblank',2);
  const visible=receiveAudienceState(received,audienceMessage(session,2,{content:'Next private cue',blank:shown.blank}),session,1);
  assert.equal(visible.content,'Next private cue');
});

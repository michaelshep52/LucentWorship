export const AUDIENCE_TIMEOUT_MS = 10000;
export function emptyAudienceState() {
  return { sequence: -1, lastReceived: null, content: '', blank: true, stopped: false, awaitingToken: null };
}
export function audienceMessage(session, sequence, { content = '', blank = true } = {}, stop = false, replyTo = null) {
  if (typeof session !== 'string' || !session || !Number.isSafeInteger(sequence) || sequence < 0 || typeof content !== 'string' || content.length > 2000 || typeof blank !== 'boolean') throw new Error('Invalid audience state.');
  return { version: 1, session, sequence, type: stop ? 'stop' : 'state', content: blank || stop ? '' : content, blank: blank || stop, replyTo };
}
export function receiveAudienceState(previous, message, session, now) {
  if (previous.stopped || !Number.isFinite(now) || !message || message.version !== 1 || message.session !== session || !['state','stop'].includes(message.type) || !Number.isSafeInteger(message.sequence) || message.sequence <= previous.sequence || message.sequence < 0 || typeof message.content !== 'string' || message.content.length > 2000 || typeof message.blank !== 'boolean') return previous;
  if (previous.awaitingToken && message.type !== 'stop' && message.replyTo !== previous.awaitingToken) return previous;
  const stopped = message.type === 'stop';
  return { sequence: message.sequence, lastReceived: now, content: message.blank || stopped ? '' : message.content, blank: message.blank || stopped, stopped, awaitingToken: null };
}
export function suspendAudienceState(previous, token) {
  if (typeof token !== 'string' || !token || token.length > 100) throw new Error('A fresh audience handshake token is required.');
  return { ...previous, content: '', blank: true, lastReceived: null, awaitingToken: token };
}
// Check freshness in the message task too: queued messages can run before a delayed timer.
export function receiveFreshAudienceState(previous, message, session, now, createToken) {
  const expired = previous.lastReceived !== null && (!Number.isFinite(now) || now < previous.lastReceived || now - previous.lastReceived >= AUDIENCE_TIMEOUT_MS);
  const ready = !previous.stopped && !previous.awaitingToken && expired
    ? suspendAudienceState(previous, createToken())
    : previous;
  return receiveAudienceState(ready, message, session, now);
}
export function expireAudienceState(previous, now) {
  if (previous.lastReceived === null || now - previous.lastReceived >= AUDIENCE_TIMEOUT_MS) return { ...previous, blank: true, content: '' };
  return previous;
}
export function isAudienceControl(message, session, latestSequence) {
  return Boolean(message && message.version === 1 && message.session === session && ((message.type === 'request' && (message.requestId === undefined || (typeof message.requestId === 'string' && message.requestId.length > 0 && message.requestId.length <= 100))) || (message.type === 'ack' && Number.isSafeInteger(message.sequence) && message.sequence >= 0 && message.sequence <= latestSequence)));
}

/** Popup requests stay synchronous with the user's click; null/throws are failures. */
export function requestAudienceWindow({ origin, session, openWindow }) {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(session)) throw new Error('Invalid session');
    const url = new URL('/local-audience', origin);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported origin');
    url.hash = new URLSearchParams({ session }).toString();
    const popup = openWindow(url.toString(), `lucent-audience-${session}`, 'popup,width=1280,height=720');
    if (!popup) return { opened: false, message: 'Popup blocked. Allow this site to open the audience window and retry.' };
    popup.opener = null;
    return { opened: true, message: 'Window requested. Waiting for an audience acknowledgment.' };
  } catch {
    return { opened: false, message: 'Audience window could not be opened. Check browser popup permissions and retry.' };
  }
}

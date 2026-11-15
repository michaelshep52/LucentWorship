/** Browser persistence adapter. Use on a stable app origin; never a live backend.
 * Transaction callbacks may await only this transaction's requests, not network work.
 */
export function openLocalLibraryDatabase({ indexedDB = globalThis.indexedDB, name = 'lucent-local-library-v1' } = {}) {
  if (!indexedDB) return Promise.reject(new Error('Local storage is unavailable in this browser.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    let rejected = false;
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('documents')) db.createObjectStore('documents', { keyPath: 'key' });
    };
    request.onerror = () => reject(request.error || new Error('Unable to open local library.'));
    request.onblocked = () => {
      rejected = true;
      reject(new Error('Close other Lucent windows and retry opening your local library.'));
    };
    request.onsuccess = () => {
      const db = request.result;
      if (rejected) { db.close(); return; }
      db.onversionchange = () => db.close();
      resolve({
        close: () => db.close(),
        transaction(mode, work) {
          return new Promise((resolveTransaction, rejectTransaction) => {
            let result;
            let failure;
            const transaction = db.transaction('documents', mode);
            const store = transaction.objectStore('documents');
            const wrap = request => new Promise((resolveRequest, rejectRequest) => {
              request.onsuccess = () => resolveRequest(request.result);
              request.onerror = () => rejectRequest(request.error || new Error('Local library operation failed.'));
            });
            transaction.oncomplete = () => resolveTransaction(result);
            transaction.onabort = () => rejectTransaction(failure || transaction.error || new Error('Local library transaction was aborted.'));
            // Completion is reported only on commit, never merely on put success.
            Promise.resolve().then(() => work({
              get: key => wrap(store.get(key)),
              getAll: () => wrap(store.getAll()),
              put: value => wrap(store.put(value)),
            })).then(value => { result = value; }).catch(error => {
              failure = error;
              try { transaction.abort(); } catch { rejectTransaction(error); }
            });
          });
        },
      });
    };
  });
}

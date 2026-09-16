// CloudStore: the only code that knows about localStorage and /api/.
// Loaded as a classic script before app.js. Exposes window.CloudStore.
(function (root) {
  'use strict';

  var CACHE_KEY = 'household-expenses-v1';
  var META_KEY = 'household-expenses-v1.meta';
  var DEBOUNCE_MS = 1000;

  function AuthError() { this.name = 'AuthError'; this.message = 'Signed out'; }
  AuthError.prototype = Object.create(Error.prototype);
  function NetworkError(message) { this.name = 'NetworkError'; this.message = message || 'Network error'; }
  NetworkError.prototype = Object.create(Error.prototype);

  var meta = readMeta();          // { version, dirty, savedAt }
  var timer = null;               // debounce timer id
  var inFlight = false;           // a PUT is running
  var queued = false;             // data changed while a PUT was running
  var status = 'saved';           // saved | unsaved | offline | disconnected
  var replaceHandlers = [];
  var statusHandlers = [];

  // ---------- local cache ----------

  function readMeta() {
    var fallback = { version: null, dirty: false, savedAt: null };
    try {
      var raw = localStorage.getItem(META_KEY);
      return raw ? Object.assign(fallback, JSON.parse(raw)) : fallback;
    } catch (e) { return fallback; }
  }
  function writeMeta() { localStorage.setItem(META_KEY, JSON.stringify(meta)); }
  function readCache() {
    var raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function writeCache(data) { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); }

  // ---------- notifications ----------

  function setStatus(next) {
    status = next;
    statusHandlers.forEach(function (fn) { try { fn(next, meta.savedAt); } catch (e) { /* listener error must not break saving */ } });
  }
  function notifyReplace(data, reason) {
    replaceHandlers.forEach(function (fn) { try { fn(data, reason); } catch (e) { /* same */ } });
  }
  function failureStatus(err) {
    if (err instanceof AuthError) return 'disconnected';
    return meta.dirty ? 'unsaved' : 'offline';
  }

  // ---------- network ----------

  function request(method, path, body, extra) {
    var init = Object.assign({
      method: method,
      credentials: 'same-origin',
      redirect: 'manual',
      headers: body === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
    }, extra || {});
    if (body !== undefined) init.body = JSON.stringify(body);
    return fetch(path, init).then(null, function (e) {
      throw new NetworkError(e && e.message);
    }).then(function (res) {
      var redirected = res.status >= 300 && res.status < 400;
      if (res.type === 'opaqueredirect' || res.status === 401 || res.status === 403 || redirected) throw new AuthError();
      return res;
    });
  }

  function adoptRemote(remote) {
    writeCache(remote.data);
    meta = { version: remote.version, dirty: false, savedAt: remote.updatedAt || null };
    writeMeta();
  }

  function fetchRemote() {
    return request('GET', '/api/doc').then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new NetworkError('HTTP ' + res.status);
      return res.json();
    });
  }

  function putNow(keepalive) {
    var data = readCache();
    if (data === null) return Promise.resolve();
    inFlight = true;
    return request('PUT', '/api/doc', { baseVersion: meta.version, data: data }, keepalive ? { keepalive: true } : undefined)
      .then(function (res) {
        if (res.status === 409) {
          return res.json().then(function (remote) {
            queued = false;
            adoptRemote(remote);
            setStatus('saved');
            notifyReplace(remote.data, 'conflict');
          });
        }
        if (!res.ok) throw new NetworkError('HTTP ' + res.status);
        return res.json().then(function (body) {
          meta.version = body.version;
          meta.savedAt = body.updatedAt;
          if (!queued) meta.dirty = false;
          writeMeta();
          if (!queued) setStatus('saved');
        });
      })
      .then(function () { finish(); }, function (e) {
        setStatus(failureStatus(e));
        finish();
        throw e;
      });
  }
  function finish() {
    inFlight = false;
    if (queued) { queued = false; schedule(0); }
  }

  function schedule(ms) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; runSave(false); }, ms);
  }
  function runSave(keepalive) {
    if (inFlight) { queued = true; return Promise.resolve(); }
    return putNow(keepalive).then(null, function () { /* status already reported */ });
  }
  function cancelTimer() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  }

  // ---------- public surface ----------

  var CloudStore = {
    AuthError: AuthError,
    NetworkError: NetworkError,

    loadCached: function () { return readCache(); },
    meta: function () { return Object.assign({}, meta); },
    status: function () { return status; },

    // Called after every user action. Writes the cache now, the cloud a second later.
    save: function (data) {
      writeCache(data);
      meta.dirty = true;
      writeMeta();
      schedule(DEBOUNCE_MS);
    },

    // Called when the page is hidden or unloading.
    flush: function () {
      cancelTimer();
      if (!meta.dirty) return Promise.resolve();
      return runSave(true);
    },

    // Called once at startup with the in-memory data (cache or fresh seed).
    start: function (localData) {
      return fetchRemote().then(function (remote) {
        if (remote === null) {
          writeCache(localData);
          meta.version = null;
          meta.dirty = true;
          writeMeta();
          return runSave(false);
        }
        if (meta.dirty) return runSave(false);
        if (meta.version === null || remote.version > meta.version) {
          adoptRemote(remote);
          setStatus('saved');
          notifyReplace(remote.data, 'refresh');
          return;
        }
        setStatus('saved');
      }, function (e) {
        setStatus(failureStatus(e));
      });
    },

    // Called when the tab regains focus or the network comes back.
    refresh: function () {
      if (meta.dirty) return runSave(false);
      return fetchRemote().then(function (remote) {
        if (remote && (meta.version === null || remote.version > meta.version)) {
          adoptRemote(remote);
          setStatus('saved');
          notifyReplace(remote.data, 'refresh');
          return;
        }
        if (status !== 'saved') setStatus('saved');
      }, function (e) {
        setStatus(failureStatus(e));
      });
    },

    listSnapshots: function () {
      return request('GET', '/api/snapshots').then(function (res) {
        if (!res.ok) throw new NetworkError('HTTP ' + res.status);
        return res.json();
      }).then(function (body) { return body.snapshots; });
    },

    restoreSnapshot: function (id) {
      return request('POST', '/api/snapshots/' + id + '/restore').then(function (res) {
        if (!res.ok) throw new NetworkError('HTTP ' + res.status);
        return res.json();
      }).then(function (remote) {
        cancelTimer();
        queued = false;
        adoptRemote(remote);
        setStatus('saved');
        notifyReplace(remote.data, 'restore');
        return remote;
      });
    },

    onReplace: function (fn) { replaceHandlers.push(fn); },
    onStatus: function (fn) { statusHandlers.push(fn); },
  };

  root.CloudStore = CloudStore;
})(typeof window !== 'undefined' ? window : globalThis);

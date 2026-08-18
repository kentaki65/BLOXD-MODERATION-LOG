/* MIT License Copyright (c) 2026 kentaki65 Includes modified code from "bim" (AGPL-3.0) */
const startUpTime = api.now();
const config = Object.freeze({
  SERVER_LOGS_PER_MESSAGE: 5,
  BLOCK_LOGS_PER_MESSAGE: 3,
  PREVENT_CHANGE_BY_EXPLOSIVE: false,
  SAVE_CHANGE_BY_WORLD: true,
  MAX_BLOCK_HISTORY: 5,
  INSPECT_SHOW_NEWEST_FIRST: true,
  MESSAGE_NEWEST_FIRST: true,
  ENABLE_LOGGING: true,
  ENABLE_LOGGER: true,
  SEARCH_TIMEOUT: 100000,
  ALLOW_LIST: ["5hFYzhrL29VWQHxYvaAHe"],
  BLACK_LIST: [],
  BIM_SLOTS: 8,
  BIM_MAX_X: 20000,
  BIM_MAX_Y: 64,
  BIM_MAX_Z: 20000,
  BIM_Y_TOP: -101,
  BIM_SHARD_GAP: 200,
  MAX_RAM_CACHE_SIZE: 2000,
  MAX_CHEST_CACHE_SIZE: 200,
  MAX_DESC: 1200,
  MAX_FIELD_LEN: 64,
  MAX_CHAT_LEN: 150,
  PER_STORE_TICK_BUDGET: 33.333333333333336,
  MAX_CHEST_OPS_PER_TICK: 1,
  CHEST_PROBE_INTERVAL_TICKS: 1,
  MIN_ITEMS_PER_TICK: 15,
  STUCK_ITEM_RETRY_LIMIT: 10,
  WRITE_RETRY_DELAY_TICKS: 10,
  ESTIMATED_MS_PER_CHUNK: 150,
  SEARCH_COMMAND_COOLDOWN: 1500,
  FLUSH_DEBOUNCE_TICKS: 5,
  FLUSH_MIN_FILL_RATIO: 0.7,
  FLUSH_MAX_WAIT_TICKS: 200,
  RATE_LIMIT_CHARS_PER_MIN: 40000,
  WRITE_BUDGET_BURST_CHARS: 2000,
  FAILSAFE_COOLDOWN_TICKS: 100,
  QUEUE_MAX_LENGTH: 1500,
  SCAN_LIMIT_CAP: 50,
  RATE_LIMIT_COOLDOWN_TICKS: 5,
  EXPORT_CODEBLOCK_NAME: "Code Block",
  BLOCK_LOAD_RETRY_LIMIT: 100,
  BLOCK_LOAD_WAIT_TICKS: 2,
  ROLLBACK_BATCH_PER_TICK: 3,
  EXPORT_CODEBLOCK_MAX_LEN: 1900,
  EXPORT_MAX_ENTRIES: 2500,
  EXPORT_PLACEMENT_INTERVAL_TICKS: 1,
  CHEST_OP_COOLDOWN_TICKS: 2,
  INDEX_PROCESS_INTERVAL: 10,
});

// ── Scheduler ──
S = {
  t: {}, g: {}, c: 0, o: 0, i: 0,
  d: {
    get false() {
      let t = S.t[S.c];
      do {
        let e = 3 * S.i;
        [t[e], S => S][+(t[e + 2] < S.g[t[e + 1]])]();
      } while (++S.i < t.length / 3);
      delete S.t[S.c];
      S.i = 0;
    }
  },
  run(t, e, l) {
    let c = S.c - ~e - 1, g = S.t[c] = S.t[c] || [], i = g.length;
    g[i] = t;
    g[i + 1] = l || "0";
    g[i + 2] = S.o++;
  },
  stop(t) { S.g[t] = S.o++; }
};

// ── Codec ──
const Codec = {
  safeMod(e, t) {
    let s = 0;
    for (let a = 0; a < e.length; a++) s = (10 * s + (e.charCodeAt(a) - 48)) % t;
    return s;
  },
  safeDivide(e, t) {
    let s = "", a = 0;
    for (let c = 0; c < e.length; c++) {
      let i = 10 * a + (e.charCodeAt(c) - 48);
      s += (i / t) | 0;
      a = i % t;
    }
    return s.replace(/^0+/, "") || "0";
  },
  zigzag: n => n >= 0 ? n * 2 : -n * 2 - 1,
  unzigzag: n => (n & 1) ? -(n + 1) / 2 : n / 2,

  encInt(n) {
    let v = Codec.zigzag(n), s = "";
    while (v >= 0x2000) {
      s += String.fromCharCode(((v & 0x1FFF) | 0x2000) + 1);
      v = Math.floor(v / 0x2000);
    }
    return s + String.fromCharCode(v + 1);
  },

  decInt(str, i) {
    let v = 0, mul = 1, raw;
    do {
      raw = str.charCodeAt(i++) - 1; 
      v += (raw & 0x1FFF) * mul;
      mul *= 0x2000;
    } while (raw & 0x2000);
    return [Codec.unzigzag(v), i];
  },

  encStr(s) { return Codec.encInt(s.length) + s; },
  decStr(str, i) {
    let v;
    [v, i] = Codec.decInt(str, i);
    return [str.slice(i, i + v), i + v];
  },

  convertToDate(uT) {
    const DL = 86400, H = 3600;
    let t = Math.floor(uT / 1000) + 9 * H, days = Math.floor(t / DL), time = t % DL, y = 1970;
    const isLeap = y => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    while (true) {
      let diy = isLeap(y) ? 366 : 365;
      if (days < diy) break;
      days -= diy; y++;
    }
    const dim = [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let m = 0;
    while (days >= dim[m]) { days -= dim[m]; m++; }
    return { year: y, month: m + 1, date: days + 1, hour: Math.floor(time / H), minutes: Math.floor(time % H / 60), second: time % 60 };
  },

  dateToEpoch(y, mo, d, h = 0, mi = 0, s = 0) {
    const isLeap = yy => yy % 4 === 0 && (yy % 100 !== 0 || yy % 400 === 0);
    const dim = [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let days = 0;
    for (let yy = 1970; yy < y; yy++) days += isLeap(yy) ? 366 : 365;
    for (let mm = 0; mm < mo - 1; mm++) days += dim[mm];
    days += d - 1;
    return (days * 86400 + h * 3600 + mi * 60 + s - 9 * 3600) * 1000; // ★ DL → 86400
  },

  formatTime(epoch) {
    const t = Codec.convertToDate(epoch), p = n => String(n).padStart(2, "0");
    return `${t.year}/${p(t.month)}/${p(t.date)} ${p(t.hour)}:${p(t.minutes)}:${p(t.second)}`;
  },
};

const BLOCK_ACTION_COLOR = id => id === "+" ? "#5AFF19" : id === "-" ? "#B1221A" : id === "✧" ? "#007DC5" : "#FFC800";
const LOG_LEVEL_COLOR = { INFO: "#55FF55", WARN: "#FFAA00", ERROR: "#FF5555", FATAL: "#FF3333" };

function plog(playerId, message, broadcast = false) {
  if(!config.ENABLE_LOGGER) return;

  const m = message.match(/^\[([^\]\/]+)(?:\/([A-Z]+))?\]\s*([\s\S]*)$/);
  const tag = m ? m[1] : "BML";
  const level = m && m[2] ? m[2] : "INFO";
  const body = m ? m[3] : message;
  const time = Codec.formatTime(api.now());
  const text = [
    { str: `[${time}] `, style: { color: "#888888", fontStyle: "italic" } },
    { str: `[${tag}/${level}] `, style: { color: LOG_LEVEL_COLOR[level] || "#FFFFFF", fontStyle: "italic" } },
    { str: `${body}\n`, style: { color: "#DDDDDD" } },
  ];
  if(broadcast) api.broadcastMessage(text);
  else api.sendMessage(playerId, text);
}

function parseTimeCond(raw) {
  if (!raw || raw === "*") return null;
  const rel = raw.match(/^(\d+)(s|m|h|d)$/i);
  if (rel) {
    const n = parseInt(rel[1], 10), mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[rel[2].toLowerCase()];
    return { mode: "after", epoch: api.now() - n * mult };
  }
  const abs = raw.match(/^(after|before):(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);
  if (abs) {
    const [, mode, y, mo, d, h, mi, s] = abs;
    return { mode, epoch: Codec.dateToEpoch(+y, +mo, +d, +(h || 0), +(mi || 0), +(s || 0)) };
  }
  return null;
}

function matchesTimeCond(cond, epoch) {
  if (!cond) return true;
  return cond.mode === "after" ? epoch >= cond.epoch : epoch <= cond.epoch;
}

function isSaneBlockEntry(d) {
  if (!d) return false;
  if (!Number.isFinite(d.epoch) || d.epoch < 0 || d.epoch > Date.now() + 86400000) return false;
  if (!Number.isFinite(d.x) || !Number.isFinite(d.y) || !Number.isFinite(d.z)) return false;
  if (Math.abs(d.x) > 30000000 || Math.abs(d.y) > 30000000 || Math.abs(d.z) > 30000000) return false;
  if (typeof d.dbId !== "string" || d.dbId.length > config.MAX_FIELD_LEN) return false;
  if (typeof d.name !== "string" || d.name.length > config.MAX_FIELD_LEN) return false;
  if (typeof d.fromBlock !== "string" || d.fromBlock.length > config.MAX_FIELD_LEN) return false;
  if (typeof d.toBlock !== "string" || d.toBlock.length > config.MAX_FIELD_LEN) return false;
  return true;
}

function withLoadedChunk(pos, action, cb, tries = 0) {
  const invoke = () => {
    try {
      action();
      cb(true);
    } catch (err) {
      const msg = err?.message || String(err || "");
      if (msg.includes("rate limit") && tries < config.BLOCK_LOAD_RETRY_LIMIT) {
        api.log(`[BML-BlockDaemon] Rate limit at ${pos}; retrying (${tries + 1})`);
        S.run(() => withLoadedChunk(pos, action, cb, tries + 1), config.BLOCK_LOAD_WAIT_TICKS);
        return;
      }
      api.log(`[BML-BlockDaemon] Block op failed at ${pos}: ${msg}`);
      cb(false, msg);
    }
  };

  if (!api.isBlockInLoadedChunk(...pos)) {
    api.getBlock(pos);
    if (tries >= config.BLOCK_LOAD_RETRY_LIMIT) {
      const msg = `[BML/WARN] Chunk load failed at ${pos}; aborting`;
      api.log(msg);
      cb(false, msg);
      return;
    }
    S.run(() => withLoadedChunk(pos, action, cb, tries + 1), config.BLOCK_LOAD_WAIT_TICKS);
    return;
  }
  invoke();
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

class LRUCache {
  constructor(max) { this.max = max; this.c = new Map(); }
  get(k) {
    if (!this.c.has(k)) return undefined;
    const v = this.c.get(k);
    this.c.delete(k);
    this.c.set(k, v);
    return v;
  }
  set(k, v) {
    if (this.c.has(k)) this.c.delete(k);
    else if (this.c.size >= this.max) this.c.delete(this.c.keys().next().value);
    this.c.set(k, v);
  }
}

class LinkedQueue {
  constructor() { this.h = this.t = null; this._s = 0; }
  get size() { return this._s; }
  push(v) {
    const n = { v, next: null };
    if (this.t) this.t.next = n; else this.h = n;
    this.t = n;
    this._s++;
  }
  peek() { return this.h?.v; }
  shift() {
    if (!this.h) return undefined;
    const v = this.h.v;
    this.h = this.h.next;
    if (!this.h) this.t = null;
    this._s--;
    return v;
  }
}

const ITEM = "Stick";

function makeRawStore(base) {
  const { BIM_SLOTS: SLOTS, BIM_MAX_X: MAX_X, BIM_MAX_Y: MAX_Y, BIM_MAX_Z: MAX_Z } = config;
  const ram = new LRUCache(config.MAX_RAM_CACHE_SIZE);
  const chest = new LRUCache(config.MAX_CHEST_CACHE_SIZE);
  const placed = new Set();

  const setSlot = (pos, slotIdx, name, amount, data, attrs) => {
    api.setStandardChestItemSlot(pos, slotIdx, name, amount, data, attrs);
    const k = String(pos);
    const m = chest.get(k) || new Map();
    m.set(slotIdx, { name, amount, attributes: attrs });
    chest.set(k, m);
  };
  const getSlot = (pos, slotIdx) => {
    const k = String(pos);
    const m = chest.get(k);
    if (m && m.has(slotIdx)) return m.get(slotIdx);
    const single = api.getStandardChestItemSlot(pos, slotIdx);
    const m2 = chest.get(k) || new Map();
    m2.set(slotIdx, single);
    chest.set(k, m2);
    return single;
  };
  const decodeIndex = idx => {
    let s = String(idx);
    const slot = Codec.safeMod(s, SLOTS); s = Codec.safeDivide(s, SLOTS);
    const x = Codec.safeMod(s, MAX_X);   s = Codec.safeDivide(s, MAX_X);
    const y = Codec.safeMod(s, MAX_Y);   s = Codec.safeDivide(s, MAX_Y);
    const z = Codec.safeMod(s, MAX_Z);
    return { slot, pos: [base[0] + x, base[1] + y, base[2] + z] };
  };
  return { RAMtasksQueue: new LinkedQueue(), RAMcache: ram, chestCache: chest, placedSet: placed, setSlot, getSlot, decodeIndex };
}

function processStoreCommon(st, maxOps) {
  if (S.c - st.lastChestOpTick < config.CHEST_OP_COOLDOWN_TICKS) return;

  if (st.ramWait > config.PER_STORE_TICK_BUDGET) {
    st.ramWait -= config.PER_STORE_TICK_BUDGET;
    return;
  }
  st.ramWait = 0;

  try {
    const q = st.raw.RAMtasksQueue;
    if (!q.size) return;

    if (ChestRateLimiter.isTripped()) {
      if (!ChestRateLimiter.canProbeThisTick()) return;
      if (!q.size) { ChestRateLimiter.clear(); return; }
      const rateLimited = processQueueItems(st, q, 1);
      if (!rateLimited) ChestRateLimiter.clear();
      return;
    }

    const rateLimited = processQueueItems(st, q, maxOps);
    if (rateLimited) {
      ChestRateLimiter.trip();
    } else if (q.size > 0) {
      st.lastChestOpTick = S.c;
    }
  } catch (e) {
    api.log(`[BIM:${st.name}] Tick loop exception: ${e.message}`, e.stack);
  }
}

class BimManager {
  constructor() { this.stores = new Map(); this._cnt = 0; }
  createStore(name) {
    if (this.stores.has(name)) return this.stores.get(name);
    const idx = this._cnt++;
    const sp = config.BIM_MAX_X + config.BIM_SHARD_GAP;
    const sign = idx % 2 === 0 ? 1 : -1;
    const baseX = sign * Math.ceil((idx + 1) / 2) * sp;
    const baseY = config.BIM_Y_TOP - config.BIM_MAX_Y;
    const raw = makeRawStore([baseX, baseY, 0]);
    const st = { name, base: [baseX, baseY, 0], raw, ramWait: 0, lastChestOpTick: 0 };
    this.stores.set(name, st);
    return st;
  }
  get(key, cb, storeName) {
    const st = this.stores.get(storeName);
    const q = st.raw.RAMtasksQueue;
    if (q.size >= config.QUEUE_MAX_LENGTH) { cb?.(String(key), undefined); return; }
    q.push([0, String(key), cb, 0]);
  }
  set(key, val, cb, storeName) {
    const st = this.stores.get(storeName);
    const q = st.raw.RAMtasksQueue;
    if (q.size >= config.QUEUE_MAX_LENGTH) { cb?.(String(key), undefined); return; }
    q.push([1, String(key), val, cb, 0]);
  }
  accessor(storeName) {
    return {
      get: (k, cb) => this.get(k, (_, v) => cb(v), storeName),
      set: (k, v, cb) => this.set(k, v, (_, ok) => cb?.(ok !== undefined), storeName),
    };
  }
}

const bimManager = new BimManager();
bimManager.createStore("player");
bimManager.createStore("block");
bimManager.createStore("index");

class ChunkedLogStore {
  constructor({ storeName, timerPeriod, timerName, logLabel }) {
    this.logLabel = logLabel;
    this.Queue = [];
    this.indexBuffer = [];
    this.saving = false;
    this.flushScheduled = false;
    this.META_COUNT_KEY = 0;
    this.count = 1;   
    this.writeKey = 1;
    this.totalEntries = 0;
    this.ready = false;
    this.failsafeCooldownUntilTick = 0;
    ({ get: this._get, set: this._set } = bimManager.accessor(storeName));

    const self = this;
    const readMeta = () => {
      this._get(this.META_COUNT_KEY, v => {
        if (v === undefined) { S.run(readMeta, 20); return; }
        const [countRaw, totalRaw] = String(v).split(":");
        const n = Number(countRaw);
        self.count = Number.isFinite(n) && n > 0 ? n : 1;
        self.totalEntries = Number(totalRaw) || 0;
        self.writeKey = self.count;
        self.ready = true;
        S.run(function loop() { 
          self.flush();
          S.run(loop, timerPeriod, timerName); 
        }, 1);
        const diff = (api.now() - startUpTime) / 1000;
        plog("", `[${self.logLabel}/INFO] Started ${self.logLabel} in ${diff} seconds`, true);
      });
    };
    readMeta();
  }

  _take() {
    const q = this.Queue;
    const i = this.indexBuffer;
    this.Queue = [];
    this.indexBuffer = [];
    return { entries: q, indices: i };
  }

  lastPage(limit) { return Math.max(0, Math.ceil(this.totalEntries / limit) - 1); }

scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    S.run(() => {
      this.flushScheduled = false;
      this._maybeFlush();
    }, config.FLUSH_DEBOUNCE_TICKS, `${this.logLabel}FlushDebounce`);
  }

  // チャンクがある程度埋まる(FLUSH_MIN_FILL_RATIO)か、
  // 滞留が長引く(FLUSH_MAX_WAIT_TICKS)まで実書き込みを遅らせる。
  // 同じチャンクを毎回まるごと再送する構造上、細切れにflushするほど
  // 総送信文字数が膨らむため、これが増幅そのものへの対策になる。
  _maybeFlush() {
    if (!this.Queue.length) return;
    const pendingChars = this.Queue.reduce((s, e) => s + e.length, 0);
    const enoughFill = pendingChars >= config.MAX_DESC * config.FLUSH_MIN_FILL_RATIO;
    const tooOld = S.c - this.firstPendingTick >= config.FLUSH_MAX_WAIT_TICKS;
    if (!enoughFill && !tooOld) {
      this.scheduleFlush();
      return;
    }
    this.flush();
  }

  _pushEntry(encoded, indexMeta) {
    if (encoded.length > config.MAX_DESC) {
      api.log(`[${this.logLabel}] entry too large (${encoded.length}), dropping`);
      return;
    }
    if (!this.Queue.length) this.firstPendingTick = S.c;
    this.Queue.push(encoded);
    this.indexBuffer.push(indexMeta);
    this.totalEntries++;
    this.scheduleFlush();
  }

  flush() {
    if (this.saving || !this.Queue.length) return;
    if (S.c < this.failsafeCooldownUntilTick) { this.scheduleFlush(); return; }

    this.saving = true;
    const batch = this._take();
    const key = this.writeKey;
    let released = false;

    const release = () => {
      if (released) return;
      released = true;
      this.saving = false;
      S.stop(failSafeTimer);
      if (this.Queue.length) this.scheduleFlush();
    };

    const failSafeTimer = S.run(() => {
      if (this.saving) {
        api.log(`[${this.logLabel}/WARN] Save timeout at chunk ${key}; forcing release`);
        this.failsafeCooldownUntilTick = S.c + config.FAILSAFE_COOLDOWN_TICKS;
        release();
      }
    }, 100, `${this.logLabel}FailSafe`);

    this._get(key, existing => {
       if (existing === undefined) {
        this.Queue.unshift(...batch.entries);
        this.indexBuffer.unshift(...batch.indices);
        release();
        this.scheduleFlush();
        return;
      }
      let buf = existing || "";
      let taken = 0;
      while (taken < batch.entries.length && buf.length + batch.entries[taken].length <= config.MAX_DESC) {
        buf += batch.entries[taken];
        taken++;
      }

      const restEntries = batch.entries.slice(taken);
      const restIndices = batch.indices.slice(taken);

      const onWritten = (success) => {
        if (!success) {
          this.Queue.unshift(...batch.entries);
          this.indexBuffer.unshift(...batch.indices);
          release();
          this.scheduleFlush();
          return;
        }
        if (taken > 0) {
          this._recordIndex(key, batch.indices.slice(0, taken));
        }
        if (restEntries.length) {
          this._set(this.META_COUNT_KEY, `${key + 1}:${this.totalEntries}`, ok => {
            if (!ok) {
              this.Queue.unshift(...batch.entries);
              this.indexBuffer.unshift(...batch.indices);
              release();
              this.scheduleFlush();
              return;
            }
            this.count = key + 1;
            this.writeKey = key + 1;
            this.Queue.unshift(...restEntries);
            this.indexBuffer.unshift(...restIndices);
            release();
            this.scheduleFlush();
          });
        } else {
          release();
        }
      };

      if (taken > 0) {
        this._set(key, buf, ok => onWritten(ok));
      } else {
        this._set(this.META_COUNT_KEY, `${key + 1}:${this.totalEntries}`, ok => {
          if (!ok) {
            this.Queue.unshift(...batch.entries);
            this.indexBuffer.unshift(...batch.indices);
            release();
            this.scheduleFlush();
            return;
          }
          this.count = key + 1;
          this.writeKey = key + 1;
          this.Queue.unshift(...batch.entries);
          this.indexBuffer.unshift(...batch.indices);
          release();
          this.scheduleFlush();
        });
      }
    });
  }

  getChunk(key, cb, retries = 0) {
    this._get(key, dataStr => {
      if (dataStr === undefined) {
        if (retries >= 20) {
          api.log(`[${this.logLabel}/WARN] Skipping because loading key=${key} failed repeatedly`);
          cb([]);
          return;
        }
        if (retries === 0) api.log(`[${this.logLabel}] getChunk key=${key} miss, retrying...`);
        S.run(() => this.getChunk(key, cb, retries + 1), 20);
        return;
      }
      cb(this.decodeChunk(dataStr));
    });
  }
}

class LogIndex {
  constructor() {
    this.byUser = new Map();
    this.byAction = new Map();
    this.byPos = new Map();
  }
  _add(map, key, chunkKey) {
    if (key == null) return;
    let s = map.get(key);
    if (!s) { s = new Set(); map.set(key, s); }
    s.add(chunkKey);
  }
  recordPlayerChunk(chunkKey, entries) {
    const ev = [];
    for (const d of entries) {
      this._add(this.byUser, d.dbId, chunkKey);
      this._add(this.byAction, d.type, chunkKey);
      ev.push([0, d.dbId, chunkKey], [1, d.type, chunkKey]);
    }
    if (ev.length) indexStore.addEvents(ev);
  }
  recordBlockChunk(chunkKey, entries) {
    const ev = [];
    for (const d of entries) {
      this._add(this.byUser, d.dbId, chunkKey);
      this._add(this.byAction, d.actionName, chunkKey);
      const pk = `${d.x},${d.y},${d.z}`;
      this._add(this.byPos, pk, chunkKey);
      ev.push([0, d.dbId, chunkKey], [1, d.actionName, chunkKey], [2, pk, chunkKey]);
    }
    if (ev.length) indexStore.addEvents(ev);
  }
  candidateChunks(user, action) {
    const a = user ? this.byUser.get(user) : null;
    const b = action ? this.byAction.get(action) : null;
    if (a && b) {
      const small = a.size < b.size ? a : b;
      const large = a.size < b.size ? b : a;
      return [...small].filter(x => large.has(x));
    }
    if (a) return [...a];
    if (b) return [...b];
    return null;
  }
  chunksForPos(posKey) {
    const s = this.byPos.get(posKey);
    return s ? [...s] : [];
  }
}
const logIndex = new LogIndex();

class IndexStore {
  constructor() {
    this.Queue = [];
    this.maxLen = 10;
    this.saving = false;
    this.META_COUNT_KEY = 0;
    this.count = 1;
    this.writeKey = 1;
    this.ready = false;
    this.ABSOLUTE_MAX_QUEUE = 200;
    ({ get: this._get, set: this._set } = bimManager.accessor("index"));
  }

  init(onReplayed) {
    const readMeta = () => {
      this._get(this.META_COUNT_KEY, v => {
        if (v === undefined) { S.run(readMeta, 20); return; }
        const n = Number(v);
        this.count = Number.isFinite(n) && n > 0 ? n : 1;
        this.writeKey = this.count;
        this._replay(1, this.count, () => { 
          this.ready = true;
          const diff = (api.now() - startUpTime) / 1000;
          plog("", `[IndexDaemon/INFO] Started IndexDaemon in ${diff} seconds`, true);
          onReplayed?.(); 
        });
      });
    };
    readMeta();
  }

  _replay(i, upper, done, retries = 0) {
    if (i > upper) return done();
    this._get(i, dataStr => {
      if (dataStr === undefined) {
        if (retries > 50) { api.log(`[IndexDaemon/ERROR] Replay stalled at ${i}`); return done(); }
        S.run(() => this._replay(i, upper, done, retries + 1), 20);
        return;
      }
      let ev = [];
      try { ev = dataStr ? JSON.parse(dataStr) : []; } catch { ev = []; }
      if (!Array.isArray(ev)) ev = [];
      for (const [type, key, chunkKey] of ev) {
        if (type === 0) logIndex._add(logIndex.byUser, key, chunkKey);
        else if (type === 1) logIndex._add(logIndex.byAction, key, chunkKey);
        else logIndex._add(logIndex.byPos, key, chunkKey);
      }

      this._replay(i + 1, upper, done, 0);
    });
  }

  addEvent(e) {
    if (!this.ready) return;
    if (this.Queue.length >= this.ABSOLUTE_MAX_QUEUE) {
      //api.log(`[IndexDaemon/WARN] Queue absolute limit reached; dropping event`);
      return;
    }
    this.Queue.push(e);
    if (this.Queue.length >= this.maxLen && !this.saving) this.flush();
  }

  addEvents(events) {
    if (!this.ready || !events.length) return;
    const avail = this.ABSOLUTE_MAX_QUEUE - this.Queue.length;
    if (avail <= 0) {
      api.log(`[IndexDaemon/WARN] Queue saturated; dropping ${events.length} events`);
      return;
    }
    const toAdd = events.slice(0, avail);
    for (const e of toAdd) this.Queue.push(e);
    if (this.Queue.length >= this.maxLen && !this.saving) this.flush();
  }

  flush() {
    if (this.saving || !this.Queue.length) return;
    this.saving = true;
    const events = this._take();
    const key = this.writeKey;

    const retryLater = pending => {
      this.Queue.unshift(...pending);
      this.saving = false;
      S.run(() => this.flush(), config.WRITE_RETRY_DELAY_TICKS, "index-retry");
    };

    this._get(key, existing => {
      if (existing === undefined) { retryLater(events); return; }

      let list = [];
      try { list = existing ? JSON.parse(existing) : []; } catch { list = []; }
      if (!Array.isArray(list)) list = [];

      let taken = 0;
      while (taken < events.length) {
        const cand = JSON.stringify([...list, events[taken]]);
        if (cand.length > config.MAX_DESC) break;
        list.push(events[taken]);
        taken++;
      }
      const rest = events.slice(taken);

      const finish = () => {
        this.saving = false;
        if (this.Queue.length) this.flush();
      };

      const advanceChunk = () => {
        if (!rest.length) { finish(); return; }
        this._set(this.META_COUNT_KEY, String(key + 1), ok => {
          if (!ok) { retryLater(rest); return; }
          this.count = key + 1;
          this.writeKey = key + 1;
          this.Queue.unshift(...rest);
          finish();
        });
      };

      if (taken > 0) {
        this._set(key, JSON.stringify(list), ok => {
          if (!ok) { retryLater(events); return; }
          advanceChunk();
        });
      } else if (events.length > 0) {
        api.log(`[IndexDaemon/WARN] Single event exceeds MAX_DESC; dropping 1 event`);
        this.Queue.unshift(...events.slice(1));
        this.saving = false;
        if (this.Queue.length) this.flush();
      } else {
        finish();
      }
    });
  }

  _take() { const e = this.Queue; this.Queue = []; return e; }
}

const indexStore = new IndexStore();

class PlayerLogStore extends ChunkedLogStore {
  constructor() {
    super({ storeName: "player", timerPeriod: 100, timerName: "timer", logLabel: "PlayerLogDaemon" });
    this.TYPE = { join: 1, chat: 2, leave: 3 };
    this.TYPE_NAME = { 1: "join", 2: "chat", 3: "leave" };
  }
  encode({ epoch, type, name, dbId, msg }) {
    return Codec.encInt(epoch) + Codec.encInt(this.TYPE[type] || 0) +
      Codec.encStr(name) + Codec.encStr(dbId) + Codec.encStr(msg || "");
  }
  decode(str, i) {
    let v;
    [v, i] = Codec.decInt(str, i); const epoch = v;
    [v, i] = Codec.decInt(str, i); const typeId = v;
    [v, i] = Codec.decStr(str, i); const name = v;
    [v, i] = Codec.decStr(str, i); const dbId = v;
    [v, i] = Codec.decStr(str, i); const msg = v;
    return { epoch, type: this.TYPE_NAME[typeId] || "unknown", name, dbId, msg, nextIndex: i };
  }
  decodeChunk(str) {
    const out = []; let i = 0;
    while (i < str.length) {
      const r = this.decode(str, i);
      if (r.nextIndex <= i) { api.log(`[PlayerLogDaemon/WARN] Decode stalled at ${i}`); break; }
      out.push(r); i = r.nextIndex;
    }
    return out;
  }
  addEntry(entry) {
    const safe = {
      epoch: entry.epoch,
      type: entry.type,
      name: String(entry.name || "").slice(0, config.MAX_FIELD_LEN),
      dbId: String(entry.dbId || "").slice(0, config.MAX_FIELD_LEN),
      msg: String(entry.msg || "").slice(0, config.MAX_DESC),
    };
    this._pushEntry(this.encode(safe), { dbId: safe.dbId, name: safe.name, type: safe.type });
  }
  _recordIndex(key, indexBatch) { logIndex.recordPlayerChunk(key, indexBatch); }
}

class BlockLogStore extends ChunkedLogStore {
  constructor() {
    super({ storeName: "block", timerPeriod: 500, timerName: "blocktimer", logLabel: "BlockLogDaemon" });
    this.ACTION = { place: 1, break: 2, replace: 3, worldChange: 4 };
    this.ACTION_NAME = { 1: "+", 2: "-", 3: "⟳", 4: "✧" };
  }
  encode({ epoch, x, y, z, action, fromBlock, toBlock, dbId, name }) {
    const actionId = typeof action === "number" ? action : (this.ACTION[action] || 0);
    return Codec.encInt(epoch) + Codec.encInt(x) + Codec.encInt(y) + Codec.encInt(z) +
      Codec.encInt(actionId) + Codec.encStr(dbId) + Codec.encStr(name) +
      Codec.encStr(fromBlock || "") + Codec.encStr(toBlock || "");
  }
  decode(str, i = 0) {
    let v;
    [v, i] = Codec.decInt(str, i); const epoch = v;
    [v, i] = Codec.decInt(str, i); const x = v;
    [v, i] = Codec.decInt(str, i); const y = v;
    [v, i] = Codec.decInt(str, i); const z = v;
    [v, i] = Codec.decInt(str, i); const actionId = v;
    [v, i] = Codec.decStr(str, i); const dbId = v;
    [v, i] = Codec.decStr(str, i); const name = v;
    [v, i] = Codec.decStr(str, i); const fromBlock = v;
    [v, i] = Codec.decStr(str, i); const toBlock = v;
    return {
      epoch, x, y, z, action: actionId,
      actionName: this.ACTION_NAME[actionId] || "unknown",
      dbId, name, fromBlock, toBlock,
      block: actionId === this.ACTION.break ? fromBlock : toBlock,
      nextIndex: i,
    };
  }
  decodeChunk(str) {
    const out = []; let i = 0, skipped = 0;
    while (i < str.length) {
      const r = this.decode(str, i);
      if (r.nextIndex <= i) {
        api.log(`[BlockLogDaemon/WARN] Corrupted entry at offset ${i}; skipping rest of chunk`);
        break;
      }
      if (isSaneBlockEntry(r)) out.push(r);
      else skipped++;
      i = r.nextIndex;
    }
    if (skipped) api.log(`[BlockLogDaemon/WARN] Skipped ${skipped} corrupted entries`);
    return out;
  }
  addEntry(props) {
    const safe = {
      epoch: props.epoch,
      x: props.x | 0, y: props.y | 0, z: props.z | 0,
      action: props.action,
      name: String(props.name || "").slice(0, config.MAX_FIELD_LEN),
      dbId: String(props.dbId || "").slice(0, config.MAX_FIELD_LEN),
      fromBlock: String(props.fromBlock || "").slice(0, config.MAX_FIELD_LEN),
      toBlock: String(props.toBlock || "").slice(0, config.MAX_FIELD_LEN),
    };
    this._pushEntry(this.encode(safe), {
      dbId: safe.dbId, name: safe.name,
      actionName: this.ACTION_NAME[this.ACTION[safe.action] || 0],
      x: safe.x, y: safe.y, z: safe.z,
    });
  }
  _recordIndex(key, indexBatch) { logIndex.recordBlockChunk(key, indexBatch); }
}

const playerLog = new PlayerLogStore();
const blockLog = new BlockLogStore();
indexStore.init();

function onReady(t) {
  if (playerLog.ready && blockLog.ready && indexStore.ready) t();
  else S.run(() => onReady(t), 200);
}

const ChestRateLimiter = {
  tripped: false,
  lastProbeTick: -Infinity,
  cooldownUntilTick: 0,
  isTripped() { return this.tripped; },
  trip() {
    if (!this.tripped) api.log(`[BIM-ChestDaemon] Rate limit detected; suspending chest pipeline`);
    this.tripped = true;
    this.cooldownUntilTick = S.c + config.RATE_LIMIT_COOLDOWN_TICKS;
  },
  clear() {
    if (this.tripped) api.log(`[BIM-ChestDaemon] Rate limit cleared; resuming chest pipeline`);
    this.tripped = false;
  },
  isRateLimitError(err) {
    return String(err?.message || err || "").includes("rate limit");
  },
  canProbeThisTick() {
    if (S.c < this.cooldownUntilTick) return false;
    if (S.c === this.lastProbeTick) return false;
    this.lastProbeTick = S.c;
    return true;
  },
};

// 追加: ChestRateLimiter の直前あたりに新設
const GlobalWriteBudget = {
  // setBlockData / setStandardChestItemSlot 両方を合算した文字数で管理する
  // (BimManagerのstore単位ではなく、プラグイン全体でひとつのバケット)
  chesPerTick: config.RATE_LIMIT_CHARS_PER_MIN / 60 / 20, // 40000/60/20 = 33.33...
  remaining: config.WRITE_BUDGET_BURST_CHARS,
  lastRefillTick: 0,

  refill(tick) {
    const elapsed = tick - this.lastRefillTick;
    if (elapsed <= 0) return;
    this.remaining = Math.min(
      config.WRITE_BUDGET_BURST_CHARS,
      this.remaining + elapsed * this.chesPerTick
    );
    this.lastRefillTick = tick;
  },

  // 予算があれば消費してtrue、無ければfalse(呼び出し側は待って再試行する)
  tryConsume(chars) {
    this.refill(S.c);
    if (chars > this.remaining) return false;
    this.remaining -= chars;
    return true;
  },
};

function processQueueItems(st, q, maxOps) {
  let chestOps = 0;
  while (q.size > 0 && chestOps < maxOps) {
    const c = q.peek();
    if (!c) { q.shift(); continue; } // 念のため
    const isWrite = c[0] === 1;
    const key = c[1];
    const payload = isWrite ? (c[2] ?? "") + "" : "";
    const cb = isWrite ? c[3] : c[2];
    const decoded = st.raw.decodeIndex(key);
    const pos = decoded.pos;
    const slot = decoded.slot;

    if (!api.isBlockInLoadedChunk(...pos)) {
      api.getBlock(pos);
      c[4] = (c[4] || 0) + 1;
      if (c[4] > config.STUCK_ITEM_RETRY_LIMIT) {
        api.log(`[BIM:${st.name}] Failed to load key=${key}; skipping`);
        q.shift();
        cb?.(key, undefined);
        continue;
      }
      api.log(`[BIM:${st.name}] chunk not loaded at ${pos} (try ${c[4]})`);
      break; // ロード待ち、次 tick に委譲
    }

    if (isWrite) {
      let data = payload;
      if (data.length > config.MAX_DESC) {
        api.log(`[BIM:${st.name}] Descriptor exceeds MAX_DESC (${data.length}); truncating`);
        data = data.slice(0, config.MAX_DESC);
      }

      if (!GlobalWriteBudget.tryConsume(data.length)) {
        break; // 文字数予算が足りない。qは触らず次tickに持ち越す
      }

      let ok = true;
      try {
        const posKey = `${pos[0]},${pos[1]},${pos[2]}`;
        if (!st.raw.placedSet.has(posKey)) {
          if (api.getBlock(pos) !== "Loot Chest") {
            api.setBlock(pos, "Loot Chest");
            st.ramWait += 210;
          }
          st.raw.placedSet.add(posKey);
        }
        st.raw.setSlot(pos, slot, ITEM, 1, undefined, { customDescription: data });
        chestOps++;
        st.raw.RAMcache.set(key, { val: data, max: data.length });
      } catch (err) {
        ok = false;
        api.log(`[BIM:${st.name}] Write failed key=${key}: ${err.message}`);
        if (ChestRateLimiter.isRateLimitError(err)) {
          ChestRateLimiter.trip();
          cb?.(key, undefined);
          q.shift();
          return true;
        }
      }
      q.shift();
      cb?.(key, ok ? data : undefined);
    } else {
      let result = "";
      const cached = st.raw.RAMcache.get(key);
      let ok = true;
      try {
        if (cached) {
          result = cached.val;
        } else {
          const slotData = st.raw.getSlot(pos, slot);
          chestOps++;
          if (slotData?.name === ITEM) result = slotData.attributes?.customDescription || "";
        }
      } catch (err) {
        ok = false;
        api.log(`[BIM:${st.name}] Read failed key=${key}: ${err.message}`);
        if (ChestRateLimiter.isRateLimitError(err)) {
          ChestRateLimiter.trip();
          cb?.(key, undefined);
          q.shift();
          return true;
        }
      }
      if (ok) st.raw.RAMcache.set(key, { val: result, max: result.length });
      q.shift();
      cb?.(key, ok ? result : undefined);
    }

    if (st.ramWait > config.PER_STORE_TICK_BUDGET) break;
  }
  return false;
}

tick = () => {
  S.d[!S.t[S.c]];
  S.c++;
  const mainStores = [bimManager.stores.get("player"), bimManager.stores.get("block")];
  processStoreCommon(mainStores[S.c % mainStores.length], config.MAX_CHEST_OPS_PER_TICK);

  const indexInterval = indexStore.ready ? config.INDEX_PROCESS_INTERVAL : 1;
  if (S.c % indexInterval === 0) {
    processStoreCommon(bimManager.stores.get("index"), config.MAX_CHEST_OPS_PER_TICK);
  }
};

const LogSearchService = {
  searchPlayerLogs(playerId, { pageArg, user, action, timeCond, keyword }) {
    const searchStart = Date.now();
    const limit = config.SERVER_LOGS_PER_MESSAGE;
    const timeParsed = parseTimeCond(timeCond);
    const { isAll, page } = parsePage(pageArg);
    const start = isAll ? 0 : page * limit;
    const useUser = user && user !== "*" ? user : null;
    const useAction = action && action !== "*" ? action : null;
    const isTimeout = () => Date.now() - searchStart > config.SEARCH_TIMEOUT;

    const matchesFilters = d => {
      if (useUser && d.name !== useUser && d.dbId !== useUser) return false;
      if (useAction && d.type !== useAction) return false;
      if (keyword && keyword !== "*" && (!d.msg || !d.msg.includes(keyword))) return false;
      if (!matchesTimeCond(timeParsed, d.epoch)) return false;
      return true;
    };

    const candidates = LogSearchService._candidateOrNull(useUser, useAction);
    const chunkCount = candidates ? candidates.length : playerLog.count;
    sendSearchingMessage(playerId, chunkCount);
    let matchedCount = 0;
    let timedOut = false;
    const view = [];

    const sendResult = () => {
      let buffer = [{ str: `=== Player Log ${isAll ? "(first " + limit + ")" : `(page ${page})`} ===\n`, style: { color: "#aaaaaa", fontStyle: "italic" } }];
      if (timedOut) {
        buffer.push({ str: `[WARN] Search timed out before scanning all chunks; results may be incomplete\n`, style: { color: "#FFAA00", fontStyle: "italic" } });
      }
      view.sort((a, b) => config.MESSAGE_NEWEST_FIRST ? b.epoch - a.epoch : a.epoch - b.epoch);
      if (!view.length) {
        buffer.push({ str: "No logs matched your query.\n", style: { color: "#888888", fontStyle: "italic" } });
        api.sendMessage(playerId, buffer);
        return;
      }
      for (const d of view) {
        const time = Codec.formatTime(d.epoch);
        if (d.type === "chat") {
          buffer.push(
            { str: `[${time}] `, style: { color: "#D3D3D3", fontStyle: "italic" } },
            { str: `[${d.type}] `, style: { color: BLOCK_ACTION_COLOR(d.type), fontStyle: "italic" } },
            { str: d.name + " ", style: { color: "#0090a8", fontStyle: "italic" } },
            { str: d.msg, style: { fontStyle: "italic" } },
            { str: ` (${d.dbId})\n`, style: { color: "#D3D3D3", fontStyle: "italic" } }
          );
        } else {
          buffer.push(
            { str: `[${time}] `, style: { color: "#D3D3D3", fontStyle: "italic" } },
            { str: d.name + " ", style: { color: "#0090a8", fontStyle: "italic" } },
            { str: `${d.type}ed`, style: { color: BLOCK_ACTION_COLOR(d.type), fontStyle: "italic" } },
            { str: ` (${d.dbId})\n`, style: { color: "#D3D3D3", fontStyle: "italic" } }
          );
        }
      }
      try { api.sendMessage(playerId, buffer); } catch (e) { api.log(e.message, e.stack); }
    };

    if (candidates) {
      const keys = candidates.sort((a, b) => b - a);
      let idx = 0;
      const step = () => {
        if (idx >= keys.length) return sendResult();
        if (isTimeout()) { timedOut = true; return sendResult(); }
        playerLog.getChunk(keys[idx], entries => {
          const arr = entries || [];
          for (let k = arr.length - 1; k >= 0; k--) {
            const d = arr[k];
            if (!matchesFilters(d)) continue;
            if (matchedCount >= start && view.length < limit) view.push(d);
            matchedCount++;
            if (!isAll && view.length >= limit) return sendResult();
          }
          idx++; step();
        });
      };
      step();
      return;
    }

    let i = playerLog.count;
    const getNext = () => {
      if (i < 1) return sendResult();
      if (isTimeout()) { timedOut = true; return sendResult(); }      playerLog.getChunk(i, entries => {
        for (let k = entries.length - 1; k >= 0; k--) {
          const d = entries[k];
          if (!matchesFilters(d)) continue;
          if (matchedCount >= start && view.length < limit) view.push(d);
          matchedCount++;
          if (!isAll && view.length >= limit) return sendResult();
          if (isTimeout()) return sendResult();
        }
        i--; getNext();
      });
    };
    getNext();
  },

  searchBlockLogs(playerId, { pageArg, user, action, timeCond, keyword, excludeBlocks = [] }) {
    const searchStart = Date.now();
    const limit = config.BLOCK_LOGS_PER_MESSAGE;
    const { isAll, page } = parsePage(pageArg);
    const start = isAll ? 0 : page * limit;
    const tc = id => id === "+" ? "#5AFF19" : id === "-" ? "#B1221A" : id === "✧" ? "#007DC5" : "#FFC800";
    const useUser = user && user !== "*" ? user : null;
    const useAction = action && action !== "*" ? action : null;
    const timeParsed = parseTimeCond(timeCond);
    const candidates = LogSearchService._candidateOrNull(useUser, useAction);
    const chunkCount = candidates ? candidates.length : blockLog.count;
    sendSearchingMessage(playerId, chunkCount);
    let matchedCount = 0;
    const view = [];
    const isTimeout = () => Date.now() - searchStart >= config.SEARCH_TIMEOUT;

    const passFilters = d => {
      if (useUser && d.name !== useUser && d.dbId !== useUser) return false;
      if (useAction && d.actionName !== useAction) return false;
      if (keyword && keyword !== "*" && !(d.toBlock || "").includes(keyword) && !(d.fromBlock || "").includes(keyword)) return false;
      if (excludeBlocks.length && excludeBlocks.some(ex =>
        (d.toBlock || "").toLowerCase() === ex.toLowerCase() ||
        (d.fromBlock || "").toLowerCase() === ex.toLowerCase())) return false;
      if (!matchesTimeCond(timeParsed, d.epoch)) return false;
      return true;
    };

    const pushIfInRange = d => {
      if (matchedCount >= start && view.length < limit) {
        view.push({ epoch: d.epoch, time: Codec.formatTime(d.epoch), name: d.name, dbId: d.dbId, x: d.x, y: d.y, z: d.z, action: d.actionName, block: d.block || "" });
      }
      matchedCount++;
    };

    const sendResult = () => {
      let buffer = [{ str: `=== Block Log ${isAll ? "(first " + limit + ")" : `(page ${page})`} ===\n`, style: { color: "#aaaaaa", fontStyle: "italic" } }];
      view.sort((a, b) => config.MESSAGE_NEWEST_FIRST ? b.epoch - a.epoch : a.epoch - b.epoch);
      for (const v of view) {
        buffer.push(
          { str: `[${v.time}] `, style: { color: "#D3D3D3", fontStyle: "italic" } },
          { str: v.name + " ", style: { color: "#0090a8", fontStyle: "italic" } },
          { str: v.action + " ", style: { color: tc(v.action), fontStyle: "italic", fontSize: "20px" } },
          { str: v.block + " ", style: { color: "#FFC800", fontStyle: "italic" } },
          { str: `at (${v.x},${v.y},${v.z})`, style: { fontStyle: "italic" } },
          { str: ` (${v.dbId})\n`, style: { color: "#D3D3D3", fontStyle: "italic" } }
        );
      }
      try { api.sendMessage(playerId, buffer); } catch (e) { api.log(e.message, e.stack); }
    };

    if (candidates) {
      const keys = candidates.sort((a, b) => b - a);
      let idx = 0;
      const step = () => {
        if (idx >= keys.length || isTimeout()) return sendResult();
        blockLog.getChunk(keys[idx], entries => {
          const arr = entries || [];
          for (let k = arr.length - 1; k >= 0; k--) {
            const d = arr[k];
            if (!passFilters(d)) continue;
            pushIfInRange(d);
            if (!isAll && view.length >= limit) return sendResult();
          }
          idx++; step();
        });
      };
      step();
      return;
    }

    let i = blockLog.count;
    const getNext = () => {
      if (i < 1 || isTimeout()) return sendResult();
      blockLog.getChunk(i, entries => {
        for (let k = entries.length - 1; k >= 0; k--) {
          const d = entries[k];
          if (!passFilters(d)) continue;
          pushIfInRange(d);
        }
        i--;
        if (isTimeout() || i < 1 || (!isAll && view.length >= limit)) return sendResult();
        getNext();
      });
    };
    getNext();
  },

  _candidateOrNull(user, action) {
    if (!user && !action) return null;
    return logIndex.candidateChunks(user, action);
  },

  reindexAll(playerId) {
    plog(playerId, "[BML/INFO] Starting ReindexDaemon...");
    let i = 1;
    const stepPlayer = () => {
      if (i > playerLog.count) { i = 1; return stepBlock(); }
      playerLog.getChunk(i, entries => {
        logIndex.recordPlayerChunk(i, entries);
        i++; stepPlayer();
      });
    };
    const stepBlock = () => {
      if (i > blockLog.count) { plog(playerId, "[BML/INFO] Reindex completed successfully"); return; }
      blockLog.getChunk(i, entries => {
        logIndex.recordBlockChunk(i, entries);
        i++; stepBlock();
      });
    };
    stepPlayer();
  },
};

const ExportService = {
  runExport(playerId, targetStore, header, buildRow, opRaw) {
    const timeParsed = opRaw === "*" ? null : parseTimeCond(opRaw);
    if (opRaw !== "*" && !timeParsed) {
      plog(playerId, "[CommandParser/ERROR] Invalid operator");
      return;
    }
    const startPos = api.getPosition(playerId).map(n => Math.floor(n));
    let currentY = startPos[1];
    let buf = header + "\n";
    let placedCount = 0, matched = 0, written = 0;
    let truncated = false, aborted = false;

    const placeAndAdvance = (text, cb) => {
      if (!GlobalWriteBudget.tryConsume(text.length)) {
        S.run(() => placeAndAdvance(text, cb), 1); // 予算が貯まるまで1tickずつ再試行
        return;
      }
      const pos = [startPos[0], currentY, startPos[2]];
      withLoadedChunk(pos, () => {
        api.setBlock(pos, config.EXPORT_CODEBLOCK_NAME);
        api.setBlockData(...pos, { persisted: { shared: { text, textSize: 0 } } });
      }, (ok, errMsg) => {
        if (!ok) {
          aborted = true;
          plog(playerId, `[ExportDaemon/FATAL] Placement failed: ${errMsg}`);
          finish();
          return;
        }
        placedCount++;
        currentY++;
        cb();
      });
    };

    const addLine = (line, cb) => {
      const candidate = buf + line + "\n";
      if (candidate.length > config.EXPORT_CODEBLOCK_MAX_LEN) {
        const textToPlace = buf;
        buf = line + "\n";
        placeAndAdvance(textToPlace, cb);
      } else {
        buf = candidate;
        cb();
      }
    };

    const finish = () => {
      const summary = () => {
        let suffix = "";
        if (truncated) suffix = ` [WARN] Truncated after ${config.EXPORT_MAX_ENTRIES} entries`;
        if (aborted) suffix = ` [FATAL] Aborted due to placement failure`;
        plog(playerId, `[ExportDaemon] ${aborted ? "Terminated" : "Completed"}: ${written} entries, ${placedCount} blocks${suffix}`);
      };
      if (!aborted && buf.length > header.length + 1) {
        placeAndAdvance(buf, summary);
      } else {
        summary();
      }
    };

    let i = 1;
    const upper = targetStore.count;
    const step = () => {
      if (i > upper || truncated || aborted) return finish();
      targetStore.getChunk(i, entries => {
        if (aborted) return;
        let idx = 0;
        const iter = () => {
          if (aborted || idx >= entries.length) { i++; return step(); }
          const d = entries[idx++];
          if (!matchesTimeCond(timeParsed, d.epoch)) return iter();
          matched++;
          if (matched > config.EXPORT_MAX_ENTRIES) { truncated = true; return finish(); }
          written++;
          addLine(buildRow(d), iter);
        };
        iter();
      });
    };
    plog(playerId, "[Bootstrap] Starting Export Daemon...");
    step();
  },
};

const PurgeService = {
  dryRunCount(playerId, targetStore, storeLabel, op, timeParsed) {
    let i = 1, upper = Math.max(0, targetStore.count - 1), count = 0;
    const step = () => {
      if (i > upper) {
        plog(playerId, `[PurgeDaemon] ${count} entries scheduled for deletion from ${storeLabel}`);
        plog(playerId, `[PurgeDaemon] Append 'confirm' to execute. Example: /bml purge ${storeLabel} ${op} confirm`);
        return;
      }
      targetStore.getChunk(i, entries => {
        for (const d of entries) if (op === "*" || matchesTimeCond(timeParsed, d.epoch)) count++;
        i++; step();
      });
    };
    step();
  },

  runPurge(playerId, targetStore, storeLabel, op, timeParsed) {
    plog(playerId, "[Bootstrap] Starting Purge Daemon...");
    let i = 1, upper = Math.max(0, targetStore.count - 1);
    let purgedEntries = 0, rewrittenChunks = 0;
    const step = () => {
      if (i > upper) {
        plog(playerId, `[PurgeDaemon] Completed: ${purgedEntries} removed, ${rewrittenChunks} chunks rewritten`);
        return;
      }
      targetStore.getChunk(i, entries => {
        const keep = [];
        let removed = 0;
        for (const d of entries) {
          if (op === "*" || matchesTimeCond(timeParsed, d.epoch)) removed++;
          else keep.push(d);
        }
        if (!removed) { i++; return step(); }
        purgedEntries += removed;
        rewrittenChunks++;
        const newBuf = keep.map(d => targetStore.encode(d)).join("");
        targetStore._set(i, newBuf, ok => {
          if (!ok) api.log(`[PurgeDaemon/WARN] Failed to rewrite chunk ${i}`);
          i++; step();
        });
      });
    };
    step();
  },
};

const RollbackService = {
  _collectTargets(opts, onDone) {
    const { user, timeParsed, radius, center } = opts;
    const r2 = radius * radius;
    const byPos = new Map();
    let i = blockLog.count;
    const step = () => {
      if (i < 1) return onDone([...byPos.values()]);
      blockLog.getChunk(i, entries => {
        for (const d of entries) {
          if (!matchesTimeCond(timeParsed, d.epoch)) continue;
          if (user && d.dbId !== user && d.name !== user) continue;
          const dx = d.x - center[0], dy = d.y - center[1], dz = d.z - center[2];
          if (dx * dx + dy * dy + dz * dz > r2) continue;
          const key = `${d.x},${d.y},${d.z}`;
          const cur = byPos.get(key);
          if (!cur || d.epoch < cur.epoch) byPos.set(key, d);
        }
        i--; step();
      });
    };
    step();
  },

  dryRun(playerId, opts) {
    plog(playerId, "[RollbackDaemon] Scanning targets...");
    this._collectTargets(opts, targets => {
      plog(playerId, `[RollbackDaemon] ${targets.length} targets found; append 'confirm' to execute`);
    });
  },

  run(playerId, opts) {
    plog(playerId, "[RollbackDaemon] Scanning targets...");
    this._collectTargets(opts, targets => {
      if (!targets.length) { plog(playerId, "[RollbackDaemon] No targets found"); return; }
      plog(playerId, "[Bootstrap] Starting Rollback Daemon...");
      this._restoreQueue(playerId, targets, 0, 0);
    });
  },

  _restoreQueue(playerId, targets, idx, restored) {
    if (idx >= targets.length) {
      plog(playerId, "[Bootstrap] Rollback Daemon completed");
      plog(playerId, `[RollbackDaemon] Restored ${restored}/${targets.length} blocks`);
      return;
    }
    const processOne = (i, doneInBatch, r) => {
      if (doneInBatch >= config.ROLLBACK_BATCH_PER_TICK || i >= targets.length) {
        S.run(() => this._restoreQueue(playerId, targets, i, r), 1);
        return;
      }
      const d = targets[i];
      withLoadedChunk([d.x, d.y, d.z], () => {
        api.setBlock([d.x, d.y, d.z], d.fromBlock || "Air");
      }, ok => processOne(i + 1, doneInBatch + 1, r + (ok ? 1 : 0)));
    };
    processOne(idx, 0, restored);
  },
};

const inspector = new Set();
const BanQueue = new Set();

S.run(function banLoop() {
  for (const id of BanQueue) {
    if (!api.getPlayerIds().includes(id)) continue;
    api.kickPlayer(id, "Banned from lobby");
  }
  S.run(banLoop, 20);
});

const lastCommandAt = new Map();
function checkCooldown(playerId) {
  const now = Date.now(), last = lastCommandAt.get(playerId) || 0;
  if (now - last < config.SEARCH_COMMAND_COOLDOWN) return false;
  lastCommandAt.set(playerId, now);
  return true;
}

function inspectBlockHistory(playerId, x, y, z) {
  onReady(() => {
    const posKey = `${x},${y},${z}`;
    const chunkKeys = logIndex.chunksForPos(posKey);
    if (!chunkKeys.length) {
      api.sendMessage(playerId, [{ str: "This block has no history\n", style: { color: "#999999" } }]);
      return;
    }
    const keys = chunkKeys.sort((a, b) => b - a);
    const collected = [];
    let idx = 0;

    const finish = () => {
      if (!collected.length) {
        api.sendMessage(playerId, [{ str: "This block has no history\n", style: { color: "#999999" } }]);
        return;
      }
      collected.sort((a, b) => config.INSPECT_SHOW_NEWEST_FIRST ? b.epoch - a.epoch : a.epoch - b.epoch);
      const limited = collected.slice(0, config.MAX_BLOCK_HISTORY);
      const msg = limited.flatMap(d => {
        const time = Codec.formatTime(d.epoch);
        return [
          { str: `[${time}] `, style: { color: "#D3D3D3", fontStyle: "italic" } },
          { str: `${d.name} `, style: { color: "#0090a8", fontStyle: "italic" } },
          { str: `${d.actionName} `, style: { color: BLOCK_ACTION_COLOR(d.actionName), fontStyle: "italic" } },
          { str: `${d.block}`, style: { color: "#0090a8", fontStyle: "italic" } },
          { str: ` (${d.dbId})\n`, style: { color: "#D3D3D3", fontStyle: "italic" } },
        ];
      });
      api.sendMessage(playerId, msg);
    };

    const step = () => {
      if (idx >= keys.length) return finish();
      blockLog.getChunk(keys[idx], entries => {
        for (const d of entries) if (d.x === x && d.y === y && d.z === z) collected.push(d);
        idx++; step();
      });
    };
    step();
  });
}

function parsePage(raw) {
  if (raw === "*") return { isAll: true, page: 0 };
  const n = parseInt(raw, 10);
  return { isAll: false, page: Number.isFinite(n) && n >= 0 ? n : 0 };
}

function sendSearchingMessage(playerId, chunkCount) {
  const estimatedMs = Math.min(config.SEARCH_TIMEOUT, chunkCount * config.ESTIMATED_MS_PER_CHUNK);
  api.sendMessage(playerId, [{
    str: `Scanning logs... (~${(estimatedMs / 1000).toFixed(1)}s, ${chunkCount} chunks)`,
    style: { color: "#aaaaaa", fontStyle: "italic" },
  }]);
}

// ── Event Handlers ──
onPlayerJoin = t => {
  const dbId = api.getPlayerDbId(t);
  if (config.BLACK_LIST.includes(dbId)) BanQueue.add(t);
  onReady(() => {
    if (!config.ENABLE_LOGGING) return;
    playerLog.addEntry({ epoch: api.now(), type: "join", name: api.getEntityName(t), dbId, msg: "" });
  });
};

onPlayerLeave = playerId => {
  if (BanQueue.has(playerId)) BanQueue.delete(playerId);
  onReady(() => {
    if (!config.ENABLE_LOGGING) return;
    playerLog.addEntry({ epoch: api.now(), type: "leave", name: api.getEntityName(playerId), dbId: api.getPlayerDbId(playerId), msg: "" });
  });
};

onPlayerChat = (t, e) => {
  const msg = String(e || "").slice(0, config.MAX_CHAT_LEN);
  onReady(() => {
    if (!config.ENABLE_LOGGING) return;
    playerLog.addEntry({ epoch: api.now(), type: "chat", name: api.getEntityName(t), dbId: api.getPlayerDbId(t), msg });
  });
};

onPlayerChangeBlock = (playerId, x, y, z, fromBlock, toBlock) => {
  if (!playerLog.ready) return;
  if (inspector.has(playerId)) {
    inspectBlockHistory(playerId, x | 0, y | 0, z | 0);
    return "preventChange";
  }
  let action;
  if (fromBlock === "Air" && toBlock !== "Air") action = "place";
  else if (fromBlock !== "Air" && toBlock === "Air") action = "break";
  else action = "replace";

  blockLog.addEntry({
    epoch: api.now(), x: x | 0, y: y | 0, z: z | 0,
    action, fromBlock, toBlock,
    dbId: api.getPlayerDbId(playerId),
    name: api.getEntityName(playerId) || "unknown"
  });
};

onWorldChangeBlock = (x, y, z, fromBlock, toBlock, initiatorDbId, extraInfo) => {
  const name = initiatorDbId ? api.getEntityName(api.getPlayerIdFromDbId(initiatorDbId)) : "by world";
  if (config.SAVE_CHANGE_BY_WORLD) {
    blockLog.addEntry({
      epoch: api.now(), x: x | 0, y: y | 0, z: z | 0,
      action: "worldChange", fromBlock: fromBlock || "unknown", toBlock: toBlock || "unknown",
      dbId: initiatorDbId || "unknown", name: name || "unknown",
    });
  }
  if (extraInfo?.cause === "Explosion" && config.PREVENT_CHANGE_BY_EXPLOSIVE) return "preventChange";
};

playerCommand = (playerId, command) => {
  if (typeof command !== "string" || command.length > 200) return;
  const parts = command.split(" ");
  const cmd = parts[0];
  const dbId = api.getPlayerDbId(playerId);
  const isAllow = config.ALLOW_LIST.includes(dbId);
  if (!isAllow) {
    plog(playerId, "[SecurityDaemon/ERROR] Command rejected: not present in permission whitelist");
    return;
  }

  if (cmd === "bml" && (parts[1] === "inspect" || parts[1] === "i")) {
    if (inspector.has(playerId)) {
      inspector.delete(playerId);
      plog(playerId, "[BloxdModeratorLog] Inspector daemon stopped");
      return true;
    }
    inspector.add(playerId);
    plog(playerId, "[BloxdModeratorLog] Inspector daemon started");
    return true;
  }

  if (cmd === "bml" && parts[1] === "log") {
    if (!checkCooldown(playerId)) { plog(playerId, "[CommandDaemon/WARN] Search throttled; please wait before retrying"); return true; }
    onReady(() => LogSearchService.searchPlayerLogs(playerId, {
      pageArg: parts[2], user: parts[3], action: parts[4], timeCond: parts[5], keyword: parts[6],
    }));
    return true;
  }

  if (cmd === "bml" && parts[1] === "block") {
    if (!checkCooldown(playerId)) { plog(playerId, "[CommandDaemon/WARN] Search throttled; please wait before retrying"); return true; }
    const normalizeAction = a => !a || a === "*" ? "*"
      : ["+", "place", "set"].includes(a = a.toLowerCase()) ? "+"
        : ["-", "break", "remove"].includes(a) ? "-"
          : ["⟳", "update", "change"].includes(a) ? "⟳"
            : ["✧", "custom"].includes(a) ? "✧" : a;
    const quoted = command.match(/"([^"]+)"/);
    const rawArgs = parts.slice(2);
    const excludeBlocks = [];
    const posArgs = [];
    for (const tok of rawArgs) {
      if (/^-.+/.test(tok)) excludeBlocks.push(tok.slice(1));
      else posArgs.push(tok);
    }
    const [pageArg, user, action, timeCond, keywordArg] = posArgs;

    onReady(() => LogSearchService.searchBlockLogs(playerId, {
      pageArg: pageArg || 1, user,
      action: normalizeAction(action),
      timeCond,
      keyword: quoted ? quoted[1] : keywordArg,
      excludeBlocks,
    }));
    return true;
  }

  if (cmd === "bml" && parts[1] === "help") {
    if (!checkCooldown(playerId)) { plog(playerId, "[CommandDaemon/WARN] Search throttled; please wait before retrying"); return true; }
    
    const playerLastPage = playerLog.lastPage(config.SERVER_LOGS_PER_MESSAGE);
    const blockLastPage = blockLog.lastPage(config.BLOCK_LOGS_PER_MESSAGE);
    const text = [
      { str: "=== BML Help ===\n\n" },
      { str: "/bml inspect\n", style: { fontStyle: "italic" } },
      { str: "- Toggles inspector mode\n" },

      { str: `/bml log [page(0-${playerLastPage})] [player] [type] [time] [keyword]\n`, style: { fontStyle: "italic" } },
      { str: "- Searches join, leave, and chat history\n" },

      { str: `/bml block [page(0-${blockLastPage})] [player] [type] [time] [keyword]\n`, style: { fontStyle: "italic" } },
      { str: "- Searches block placement, break, and update history\n" },

      { str: "/bml export <block|player> <operator>\n", style: { fontStyle: "italic" } },
      { str: "- Exports results as CSV in a Code Block at your feet\n" },

      { str: "/bml purge <block|player> <operator> [confirm]\n", style: { fontStyle: "italic" } },
      { str: "- Deletes logs from persistent storage (without confirm, only the count is shown)\n" },

      { str: "/bml rollback [time] [radius] [player] [confirm]\n", style: { fontStyle: "italic" } },
      { str: "- Reverts nearby block changes around you (without confirm, only the count is shown)\n" },

      { str: "\nOperators: * / after:YYYY-MM-DD / before:YYYY-MM-DD / Ns,Nm,Nh (relative time)\n" },

      { str: "Exclude example for block search: /bml block * * * * * -Stone -Dirt\n" },

      { str: "\nlog: join / chat / *\nblock: place / break / update / *\ntime: after:YYYY-MM-DD / before:YYYY-MM-DD" },

      { str: "\n\n* Page ranges are only a guideline for unfiltered searches. When filtering by user, action, or keyword, the actual number of pages may be smaller.\n" }
    ];
    api.sendMessage(playerId, text);
    return true;
  }

  if (cmd === "bml" && parts[1] === "reindex") {
    onReady(() => LogSearchService.reindexAll(playerId));
    return true;
  }

  if (cmd === "bml" && parts[1] === "export") {
    const target = parts[2];
    const op = parts[3] || "*";
    if (target === "block") {
      onReady(() => ExportService.runExport(
        playerId, blockLog,
        "time,x,y,z,action,fromBlock,toBlock,dbId,name",
        d => [Codec.formatTime(d.epoch), d.x, d.y, d.z, d.actionName, d.fromBlock, d.toBlock, d.dbId, d.name].map(csvEscape).join(","),
        op
      ));
      return true;
    }
    if (target === "player") {
      onReady(() => ExportService.runExport(
        playerId, playerLog,
        "time,type,name,dbId,msg",
        d => [Codec.formatTime(d.epoch), d.type, d.name, d.dbId, d.msg].map(csvEscape).join(","),
        op
      ));
      return true;
    }
    plog(playerId, "[CommandParser] Usage: /bml export <block|player> <*|after:YYYY-MM-DD|before:YYYY-MM-DD|Ns|Nm|Nh>");
    return true;
  }
  if (cmd === "bml" && parts[1] === "purge") {
    const target = parts[2];
    const op = parts[3] || "*";
    const confirmed = parts[4] === "confirm";
    const store = target === "block" ? blockLog : target === "player" ? playerLog : null;
    if (!store) {
      plog(playerId, "[CommandParser] Usage: /bml purge <block|player> <*|after:YYYY-MM-DD|before:YYYY-MM-DD|Ns|Nm|Nh> [confirm]");
      return true;
    }
    const timeParsed = op === "*" ? null : parseTimeCond(op);
    if (op !== "*" && !timeParsed) { plog(playerId, "[CommandParser/ERROR] Failed to parse operator"); return true; }
    onReady(() => {
      if (confirmed) PurgeService.runPurge(playerId, store, target, op, timeParsed);
      else PurgeService.dryRunCount(playerId, store, target, op, timeParsed);
    });
    return true;
  }
  if (cmd === "bml" && parts[1] === "rollback") {
    const [playerArg, timeArg, radiusArg] = parts.slice(2);
    const confirmed = parts.includes("confirm");
    if (!playerArg || !timeArg || !radiusArg) {
      plog(playerId, "[CommandParser] Usage: /bml rollback <player|*> <Ns|Nm|Nh> <radius> [confirm]");
      return true;
    }
    const timeParsed = parseTimeCond(timeArg);
    const radius = parseInt(radiusArg, 10);
    if (!timeParsed || !Number.isFinite(radius) || radius <= 0) {
      plog(playerId, "[CommandParser/ERROR] Failed to parse time or radius argument");
      return true;
    }
    const user = playerArg !== "*" ? playerArg : null;
    const center = api.getPosition(playerId).map(n => Math.floor(n));
    const opts = { user, timeParsed, radius, center };
    if (confirmed) RollbackService.run(playerId, opts);
    else RollbackService.dryRun(playerId, opts);
    return true;
  }
};

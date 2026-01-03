//MIT License
//Copyright (c) 2026 kentaki65
//This project includes modified code from "bim"
//Licensed under AGPL-3.0
//Original source: rentry.co/2kcfyvmv
//This version has been modified for use in BloxdModerationLog.

const config = {
  SERVER_LOGS_PER_MESSAGE: 5,
  BLOCK_LOGS_PER_MESSAGE: 3,
  PREVENT_CHANGE_BY_EXPLOSIVE: true,
  SAVE_CHANGE_BY_WORLD: false,
  SAVE_DATA_CHANGED_BY_WORLD: true,
  SAVE_DATA_CHANGED_BY_PLAYER: true,
  MAX_BLOCK_HISTORY: 5,
  INSPECT_SHOW_NEWEST_FIRST: true,
  ENABLE_LOGGING: true,
  SEARCH_TIMEOUT: 1000,
  ALLOW_LIST: ["5hFYzhrL29VWQHxYvaAHe"],
  BLACK_LIST: []
};

S={t:{},g:{},c:0,o:0,i:0,d:{get false(){let t=S.t[S.c];do{let e=3*S.i;[t[e],S=>S][+(t[e+2]<S.g[t[e+1]])]()}while(++S.i<t.length/3);delete S.t[S.c],S.i=0}},run(t,e,l){let c=S.c-~e-1,g=S.t[c]=[S.t[c],[]][+!S.t[c]],i=g.length;g[i]=t,g[i+1]=[l,"0"][+!l],g[i+2]=S.o++},stop(t){S.g[t]=S.o++}};
const BASE=[-35e4,-35e4,-35e4],BASE2=[35e4,-35e4,35e4],MAX_X=7e5,MAX_Y=3e5,MAX_Z=7e5,ITEM="Stick",SLOTS=36,MAX_DESC=1976,MAX_RAM_CACHE_SIZE=2e3,MAX_CHEST_CACHE_SIZE=200,MAX_CHARS_PER_TICK=33.333333333333336;class LRUCache{constructor(e){this.maxSize=e,this.cache=new Map}get(e){if(!this.cache.has(e))return;let t=this.cache.get(e);return this.cache.delete(e),this.cache.set(e,t),t}set(e,t){if(this.cache.has(e))this.cache.delete(e);else if(this.cache.size>=this.maxSize){let s=this.cache.keys().next().value;this.cache.delete(s)}this.cache.set(e,t)}}function safeMod(e,t){let s=0;for(let a=0;a<e.length;a++)s=(10*s+(e.charCodeAt(a)-48))%t;return s}function safeDivide(e,t){let s="",a=0;for(let c=0;c<e.length;c++){let i=10*a+(e.charCodeAt(c)-48);s+=i/t|0,a=i%t}return s.replace(/^0+/,"")}function makeStore(e){let t=new LRUCache(2e3),s=new LRUCache(200),a=(e,t,a,c,i,l)=>{api.setStandardChestItemSlot(e,t,a,c,i,l);let o=e+"",h=s.get(o);h||(h=api.getStandardChestItemSlots(e)),h[t]={name:a,amount:c,attributes:l},s.set(o,h)},c=(e,t)=>{let a=e+"",c=s.get(a);return c||(c=api.getStandardChestItems(e),s.set(a,c)),c[t]},i=t=>{let s=String(t),a=safeMod(s,SLOTS);s=safeDivide(s,SLOTS);let c=safeMod(s,MAX_X);s=safeDivide(s,MAX_X);let i=safeMod(s,MAX_Y);s=safeDivide(s,MAX_Y);let l=safeMod(s,7e5);return{slot:a,pos:[e[0]+c,e[1]+i,e[2]+l]}};return{RAMtasksQueue:{start:0,end:0},RAMcache:t,chestCache:s,setSlot:a,getSlot:c,decodeIndex:i}}const S1=makeStore(BASE),S2=makeStore(BASE2);bim1={get(e,t){S1.RAMtasksQueue[S1.RAMtasksQueue.end++]=[0,e+"",t]},set(e,t,s){S1.RAMtasksQueue[S1.RAMtasksQueue.end++]=[1,e+"",s,t]}},bim2={get(e,t){S2.RAMtasksQueue[S2.RAMtasksQueue.end++]=[0,e+"",t]},set(e,t,s){S2.RAMtasksQueue[S2.RAMtasksQueue.end++]=[1,e+"",s,t]}};let RAMwait=0;
tick=()=>{S.d[!S.t[S.c]],S.c++;if(RAMwait>33.333333333333336){RAMwait-=33.333333333333336;return}RAMwait=0;let e=3*api.getNumPlayers();function t(t){let s=t.RAMtasksQueue;main:for(let a=0;a<e;a++){if(s.start===s.end){s.start=s.end=0;break}let c=s[s.start],i=c[0],l=c[1],o=c[2],h=(c[3]??"")+"",n=t.decodeIndex(l),r=n.pos,$=n.slot;if(!api.isBlockInLoadedChunk(...r)){api.getBlock(r);break}if(i){let u=h.slice(0,1976);"Loot Chest"!==api.getBlock(r)&&(api.setBlock(r,"Loot Chest"),RAMwait+=210),t.setSlot(r,$,ITEM,1,void 0,{customDescription:u}),t.RAMcache.set(l,{val:u,max:u.length}),o&&o(l,u)}else{let A="",S=t.RAMcache.get(l);if(S)A=S.val;else if("Loot Chest"===api.getBlock(r)){let M=t.getSlot(r,$);M?.name===ITEM&&(A=M.attributes?.customDescription||"")}t.RAMcache.set(l,{val:A,max:A.length}),o&&o(l,A)}if(delete s[s.start++],RAMwait>33.333333333333336)break main}}t(S1),t(S2)};
class log{
  constructor() {
    this.Queue = [];
    this.count = 1;
    this.saving = false;
    this.META_COUNT_KEY = 0;
    this.maxLen = 12;
    this.blockQueue = [];
    this.blockSaving = false;
    this.blockCount = 1;
    this.blockWriteKey = 1;
    this.BLOCK_META_COUNT_KEY = 0;
    this.blockMaxLen = 10;
    this.BLOCK_ACTION = {
      place: 1,
      break: 2,
      replace: 3,
      worldChange: 4
    };
    const self = this;
    this.ready = false;
    this.bim1Get(this.META_COUNT_KEY, function(v) {
      const n = Number(v);
      self.count = Number.isFinite(n) && n > 0 ? n : 1;
      self.writeKey = self.count;
      self._timer = S.run(function loop() {
        self.flushTemporary();
        S.run(loop, 100, "timer");
      }, 1);
      self.ready = true;
    });
    this.bim2Get(this.BLOCK_META_COUNT_KEY, v => {
      const n = Number(v);
      this.blockCount = Number.isFinite(n) && n > 0 ? n : 1;
      this.blockWriteKey = this.blockCount;
      self._blockTimer = S.run(function blockloop() {
        self.flushBlockTemporary();
        S.run(blockloop, 500, "blocktimer");
      }, 1);
    });
  }
  convertToDate(uT){let DL=86400,H=3600;let t=Math.floor(uT/1000)+9*3600;let days=Math.floor(t/DL),time=t%DL;let y=1970;const isLeap=y=>y%4===0&&(y%100!==0||y%400===0);while(true){let diy=isLeap(y)?366:365;if(days<diy)break;days-=diy;y++}const dim=[31,isLeap(y)?29:28,31,30,31,30,31,31,30,31,30,31];let m=0;while(days>=dim[m]){days-=dim[m];m++}return{year:y,month:m+1,date:days+1,hour:Math.floor(time/H),minutes:Math.floor(time%H/60),second:time%60}}
  zigzag = n => n >= 0 ? n * 2 : -n * 2 - 1;
  unzigzag = n => (n & 1) ? -(n + 1) / 2 : n / 2;
  encInt = n => {
    let v = this.zigzag(n);
    let s = "";
    while (v >= 0x2000) {
      s += String.fromCharCode((v & 0x1FFF) | 0x2000);
      v = Math.floor(v / 0x2000);
    }
    return s + String.fromCharCode(v);
  };
  decInt = (str, i) => {
    let v = 0, shift = 0, c;
    do {
      c = str.charCodeAt(i++);
      v += (c & 0x1FFF) * Math.pow(0x2000, shift++);
    } while (c & 0x2000);
    return [this.unzigzag(v), i];
  };
  bim1Get(key, cb) {bim1.get(key, (_, value) => cb(value));}
  bim1Set(key, val, cb) {bim1.set(key, val, () => cb && cb());}
  addQueue(e){this.Queue.push(e),this.Queue.length>=this.maxLen&&this.flushTemporary()}
  addQueueImmediate(e){this.Queue.push(e),this.saving||this.flushTemporary()}
  _takeQueue(){let e=this.Queue;return this.Queue=[],e}
  flushTemporary(){if(this.saving||0===this.Queue.length)return;this.saving=!0;let e=this._takeQueue(),t=this.writeKey,i=this;this.bim1Get(t,function(u){let n;try{n=u?JSON.parse(u):[],Array.isArray(n)||(n=[])}catch{n=[]}let s=i.maxLen-n.length;s>0&&(n.push.apply(n,e.slice(0,s)),i.bim1Set(t,JSON.stringify(n)));let h=e.slice(s);h.length>0?i.bim1Set(i.META_COUNT_KEY,String(t+1),function(){i.count=t+1,i.writeKey=i.count,i.Queue.unshift.apply(i.Queue,h),i.saving=!1,i.Queue.length>0&&i.flushTemporary()}):(i.saving=!1,i.Queue.length>0&&i.flushTemporary())})}
  formatLog(str){
    const [epoch, type, name, dbId, msg] = str.split("|");
    const t = this.convertToDate(Number(epoch));
    const pad = n => String(n).padStart(2,"0");
    const time =
      `${t.year}/${pad(t.month)}/${pad(t.date)} ` +
      `${pad(t.hour)}:${pad(t.minutes)}:${pad(t.second)}`;
    return [time, type, name, dbId, (msg || "")];
  }

  bim2Get(key, cb) {
    bim2.get(key, (_, value) => cb(value));
  }

  bim2Set(key, val, cb) {
    bim2.set(key, val, () => cb && cb());
  }

  addBlockQueue(value) {
    this.blockQueue.push(value);
    if (this.blockQueue.length >= this.blockMaxLen) {
      this.flushBlockTemporary();
    }
  }

  addBlockQueueImmediate(value) {
    this.blockQueue.push(value);
    if (!this.blockSaving) {
      this.flushBlockTemporary();
    }
  }
  _takeBlockQueue() {
    const data = this.blockQueue;
    this.blockQueue = [];
    return data;
  }
  flushBlockTemporary() {
    //api.log("flushBlockTemporaryが呼ばれました!");
    if (this.blockSaving) {
      return;
    };
    if (this.blockQueue.length === 0) {
      //api.log("キューのデータなし!リターン");
      return;
    };
    this.blockSaving = true;
    const batch = this._takeBlockQueue();
    const key = this.blockWriteKey;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.blockSaving = false;
      if (this.blockQueue.length > 0) {
        this.flushBlockTemporary();
      }
    };
    this.bim2Get(key, stored => {
      let list;
      try {
        list = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(list)) list = [];
      } catch {
        list = [];
      }

      const space = this.blockMaxLen - list.length;
      const take = space > 0 ? batch.slice(0, space) : [];
      const rest = batch.slice(take.length);

      if (take.length > 0) list.push(...take);
      this.bim2Set(key, JSON.stringify(list), () => {
        const filled = list.length >= this.blockMaxLen;
        if (rest.length > 0 || filled) {
          const nextKey = key + 1;
          this.bim2Set(this.BLOCK_META_COUNT_KEY, String(nextKey), () => {
            this.blockCount = nextKey;
            this.blockWriteKey = nextKey;
            if (rest.length > 0) {
              this.blockQueue.unshift(...rest);
            }
            release();
          });
        } else {
          release();
        }
      });
    });
    S.run(() => {
      if (this.blockSaving) {
        api.log("[log] blockSaving timeout -> force release");
        release();
      }
    }, 100, "blockFailSafe");
  }
  encodeBlockLog({ epoch, x, y, z, action, block, dbId, name }) {
    const encStr = s => this.encInt(s.length) + s;
    return (
      this.encInt(epoch) +
      this.encInt(x) +
      this.encInt(y) +
      this.encInt(z) +
      this.encInt(this.BLOCK_ACTION[action] || 0) +
      encStr(dbId) +
      encStr(name) +
      encStr(block || "")
    );
  }
  decodeBlockLog(str) {
    let i = 0, v;
    [v, i] = this.decInt(str, i); const epoch = v;
    [v, i] = this.decInt(str, i); const x = v;
    [v, i] = this.decInt(str, i); const y = v;
    [v, i] = this.decInt(str, i); const z = v;
    [v, i] = this.decInt(str, i); const actionId = v;
    [v, i] = this.decInt(str, i);
    const dbId = str.slice(i, i + v);
    i += v;
    [v, i] = this.decInt(str, i);
    const name = str.slice(i, i + v);
    i += v;
    [v, i] = this.decInt(str, i);
    const block = str.slice(i, i + v);
    i += v;
    return {
      epoch,
      x, y, z,
      action: actionId,
      dbId,
      name,
      block
    };
  }
}
const logInstance=new log;
const inspector = new Set();
const BanQueue = new Set();
S.run(function banLoop(){
  [...BanQueue].forEach(id=>{
    if(!api.getPlayerIds().includes(id))return;
    api.kickPlayer(id, "Banned from lobby");
  })
  S.run(banLoop, 20);
})
function makeLogStr(t,e,l=""){let o=api.now(),n=api.getEntityName(t),a=api.getPlayerDbId(t);return `${o}|${e}|${n}|${a}|${l}`}
function onReady(t){logInstance.ready?t():S.run(()=>onReady(t),200)}
onPlayerJoin=t=>{
  let e=makeLogStr(t,"join");
  const dbId = api.getPlayerDbId(t);
  if(config.BLACK_LIST.includes(dbId)){
    BanQueue.add(t);
  }
  onReady(()=>{
    if(!(config.ENABLE_LOGGING))return;
    logInstance.addQueueImmediate(e)
  })
};
onPlayerLeave = (playerId) => {
  if(BanQueue.has(playerId))BanQueue.delete(playerId);
}
onPlayerChat=(t,e)=>{let l=makeLogStr(t,"chat",e);onReady(()=>{if(!(config.ENABLE_LOGGING))return;logInstance.addQueue(l)})};
onPlayerChangeBlock = (playerId, x, y, z, fromBlock, toBlock) => {
  if (!logInstance.ready) return;
  if (inspector.has(playerId)) {
    const data = api.getBlockData(x, y, z);
    const persisted = data?.persisted ?? {};
    const log = Array.isArray(persisted.log) ? persisted.log.slice() : [];

    if (log.length === 0) {
      api.sendMessage(playerId, [
        { str: "This block has no history\n", style: { color: "#999999" } }
      ]);
      return "preventChange";
    }

    const pad = n => String(n).padStart(2, "0");
    const ordered = config.INSPECT_SHOW_NEWEST_FIRST
      ? log.slice().reverse()
      : log;
    const msg = ordered.flatMap(({ epoch, action, from, to, dbId, name}) => {
      const t = logInstance.convertToDate(epoch);
      const block = to === "Air" ? from : to;

      const time =
        `${t.year}/${pad(t.month)}/${pad(t.date)} ` +
        `${pad(t.hour)}:${pad(t.minutes)}:${pad(t.second)}`;

      return [
        { str: `[${time}] `, style: { color: "#D3D3D3", fontStyle: "italic" } },
        { str: `${name} `, style: { color: "#0090a8", fontStyle: "italic" } },
        { str: `${action} `, style: { color: "#D3D3D3", fontStyle: "italic" } },
        { str: `${block}`, style: { color: "#0090a8", fontStyle: "italic" } },
        { str: ` (${dbId})\n`, style: { color: "#D3D3D3", fontStyle: "italic" } }
      ];
    });

    api.sendMessage(playerId, msg);
    return "preventChange";
  }

  // ===== ここから「通常の破壊・設置」 =====

  let action, block;
  if (fromBlock === "Air" && toBlock !== "Air") {
    action = "place";
    block = toBlock;
  } else if (fromBlock !== "Air" && toBlock === "Air") {
    action = "break";
    block = fromBlock;
  } else {
    action = "replace";
    block = toBlock;
  }

  const dbId = api.getPlayerDbId(playerId);
  const name = api.getEntityName(playerId) || "unknown";
  const entry = logInstance.encodeBlockLog({
    epoch: api.now(),
    x: x | 0,
    y: y | 0,
    z: z | 0,
    action,
    block,
    dbId,
    name
  });
  logInstance.addBlockQueue(entry);
  if (config.SAVE_DATA_CHANGED_BY_PLAYER) {
    const data = api.getBlockData(x, y, z);
    const persisted = data?.persisted ?? {};
    let log = Array.isArray(persisted.log) ? persisted.log.slice() : [];
    log.push({
      epoch: api.now(),
      action,
      from: fromBlock,
      to: toBlock,
      dbId,
      name,
    });
    if (log.length > config.MAX_BLOCK_HISTORY) log = log.slice(config.MAX_BLOCK_HISTORY*-1);
    api.setBlockData(x, y, z, {
      persisted: { log }
    });
  }
};
onWorldChangeBlock = (x, y, z, fromBlock, toBlock, initiatorDbId, extraInfo) => {
  const name = api.getEntityName(api.getPlayerIdFromDbId(initiatorDbId));
  if(config.SAVE_CHANGE_BY_WORLD){
    const entry = logInstance.encodeBlockLog({
      epoch: api.now(),
      x: x | 0,
      y: y | 0,
      z: z | 0,
      action: "worldChange",
      block: `${fromBlock || "unknown"}->${toBlock || "unknown"}`,
      dbId: initiatorDbId || "unknown",
      name: name || "unknown"
    })
    logInstance.addBlockQueue(entry);
  };
  if(config.SAVE_CHANGE_BY_WORLD){
    const data = api.getBlockData(x, y, z);
    const persisted = data?.persisted ?? {};
    let log = Array.isArray(persisted.log) ? persisted.log.slice() : [];
    log.push({
      epoch: api.now(),
      action: "worldChange",
      from: fromBlock,
      to: toBlock,
      dbId: initiatorDbId,
      name: name || "unknown",
    });
    if (log.length > 5) {
      log = log.slice(log.length - 5);
    }
    api.setBlockData(x, y, z, {
      persisted: {
        log
      }
    });
  }
  if(extraInfo?.cause === "Explosion" && config.PREVENT_CHANGE_BY_EXPLOSIVE)return "preventChange";
}
playerCommand = (playerId, command) => {
  const parts = command.split(" ");
  const cmd = parts[0];
  const dbId = api.getPlayerDbId(playerId);
  const isAllow = config.ALLOW_LIST.includes(dbId);
  if(!isAllow){
    api.sendMessage(playerId, "The command cannot be used because it is not included in the permission list")
  }
  if(cmd === "bml" && (parts[1] === "inspect" || parts[1] === "i") && isAllow){
    if(inspector.has(playerId)){
      inspector.delete(playerId);
      api.sendMessage(playerId, "BloxdModeratorLog: inspecter now disable!");
      return true;
    }
    inspector.add(playerId);
    api.sendMessage(playerId, "BloxdModeratorLog: inspecter now enable!");
    return true;
  }else if (cmd === "bml" && parts[1] === "log" && isAllow) {
    const pageArg = parts[2];
    const user = parts[3];
    const action = parts[4];
    const timeCond = parts[5];
    const keyword = parts[6];
    onReady(() => {
      const searchStart = Date.now();
      api.sendMessage(playerId, [
        {
          str: "Searching logs...\n",
          style: { color: "#aaaaaa", fontStyle: "italic" }
        }
      ]);
      const limit = config.SERVER_LOGS_PER_MESSAGE;
      const isAll = pageArg === "*";
      const page = isAll ? 0 : parseInt(pageArg);
      const start = isAll ? 0 : page * limit;
      const end = isAll ? Infinity : start + limit;

      let matchedCount = 0;   // 条件に一致したログの数
      const view = [];         // 今ページに入れるログだけ
      let i = 0;

      const typeColorOf = type =>
        type === "join" ? "#5AFF19" :
        type === "leave" ? "#B1221A" :
        "#FFC800";

      function sendChunk(buffer) {
        if (buffer.length > 0) {
          try { api.sendMessage(playerId, buffer); } 
          catch(e){ api.log(e.message, e.stack); }
        }
      }
      function getNext() {
        if (Date.now() - searchStart > config.SEARCH_TIMEOUT) {
          sendResult();
          return;
        }
        logInstance.bim1Get(i, dataStr => {
          if (dataStr == null) {
            sendResult();
            return;
          }

          let entries;
          try {
            entries = JSON.parse(dataStr);
            if (!Array.isArray(entries)) entries = [];
          } catch {
            entries = [];
          }

          for (const entry of entries) {
            const v = logInstance.formatLog(entry);
            const [time, type, name, dbId, chat] = v;
            let isMatch = true;
            if (user && user !== "*" && name !== user && dbId !== user) isMatch = false;
            if (action && action !== "*" && type !== action) isMatch = false;
            if (keyword && keyword !== "*" && (!chat || !chat.includes(keyword))) isMatch = false;
            if (timeCond && timeCond !== "*") {
              const [mode, tStr] = timeCond.split(":");
              const target = tStr.length === 10 ? tStr + " 00:00:00" : tStr;
              if (mode === "after" && time < target) continue;
              if (mode === "before" && time > target) continue;
            }
            if (!isMatch) continue;

            if (matchedCount >= start && view.length < limit) {
              view.push(v);
            }
            matchedCount++;
            if (!isAll && view.length >= limit) {
              sendResult();
              return;
            }
            if (Date.now() - searchStart > config.SEARCH_TIMEOUT) {
              sendResult();
              return;
            }
          }

          i++;
          getNext();
        });
      }
      function sendResult() {
        let buffer = [{
          str: `=== Core Protect ${isAll ? "(first " + limit + ")" : `(page ${page})`} ===\n`,
          style: { color: "#aaaaaa", fontStyle: "italic" }
        }];
        if (view.length === 0) {
          buffer.push({
            str: "No logs matched your query.\n",
            style: { color: "#888888", fontStyle: "italic" }
          });
          sendChunk(buffer);
          return;
        }
        for (const v of view) {
          const [date, type, name, dbId, chat] = v;
          if (chat) {
            buffer.push(
              { str: `[${date}] `, style: { color: "#D3D3D3", fontStyle: "italic" } },
              { str: `[${type}] `, style: { color: typeColorOf(type), fontStyle: "italic" } },
              { str: name + " ", style: { color: "#0090a8", fontStyle: "italic" } },
              { str: chat, style: { fontStyle: "italic" } },
              { str: ` (${dbId})\n`, style: { color: "#D3D3D3", fontStyle: "italic" } }
            );
          } else {
            buffer.push(
              { str: `[${date}] `, style: { color: "#D3D3D3", fontStyle: "italic" } },
              { str: name + " ", style: { color: "#0090a8", fontStyle: "italic" } },
              { str: `${type}ed`, style: { color: typeColorOf(type), fontStyle: "italic" } },
              { str: ` (${dbId})\n`, style: { color: "#D3D3D3", fontStyle: "italic" } }
            );
          }
        }
        sendChunk(buffer);
      }
      getNext();
    });
    return true;
  }else if (cmd === "bml" && parts[1] === "block" && isAllow) {
    const normalizeAction = a => !a||a==="*"?"*":["+","place","set"].includes(a=a.toLowerCase())?"+":["-","break","remove"].includes(a)?"-":["⟳","update","change"].includes(a)?"⟳":["✧","custom"].includes(a)?"✧":a;

    const pageArg = parts[2] || 1;
    const user = parts[3];
    const actionraw = parts[4];
    const action = normalizeAction(actionraw);
    const timeCond = parts[5];
    let keyword = parts[6];
    const quoted = command.match(/"([^"]+)"/);
    if (quoted) {
      keyword = quoted[1];
    }
    const actionName = id => 
      id === 1 ? "+" 
    : id === 2 ? "-" 
    : id === 3 ? "⟳" 
    : id === 4 ? "✧"
    : "unknown"; 

    const typeColorOf = id => 
      id === "+" ? "#5AFF19" 
    : id === "-" ? "#B1221A" 
    : id === "✧" ? "#007DC5"
    : "#FFC800";

    function sendChunk(buffer) {
      if (buffer.length > 0) {
        try{
          api.sendMessage(playerId, buffer);
        }catch(e){
          api.log(e.message);
          api.log(e.stack);
        }
      }
    }
    onReady(() => {
      const searchStart = Date.now();
      const limit = config.BLOCK_LOGS_PER_MESSAGE;
      const isAll = pageArg === "*";
      const page = isAll ? 0 : parseInt(pageArg);
      const start = isAll ? 0 : page * limit;
      const end = isAll ? Infinity : start + limit;
      let matchedCount = 0;   // 条件に一致したログの数
      const view = [];         // 今ページに入れるログだけ
      let i = 0;
      function getNext() {
        if (Date.now() - searchStart >= config.SEARCH_TIMEOUT) {
          sendResult();
          return;
        }
        const selfPos = api.getPosition(playerId);
        logInstance.bim2Get(i, dataStr => {
          if (dataStr != null) {
            let entries;
            try {
              entries = JSON.parse(dataStr);
              if (!Array.isArray(entries)) entries = [];
            } catch { entries = []; }

            for (const raw of entries) {
              const d = logInstance.decodeBlockLog(raw);
              const t = logInstance.convertToDate(d.epoch);
              const pad = n => String(n).padStart(2,"0");
              const time =
                `${t.year}/${pad(t.month)}/${pad(t.date)} ` +
                `${pad(t.hour)}:${pad(t.minutes)}:${pad(t.second)}`;
              const act = actionName(d.action);
              if (user && user !== "*" && d.name !== user && d.dbId !== user) continue;
              if (action && action !== "*" && act !== action) continue;
              if (keyword && keyword !== "*" && (!d.block || !d.block.includes(keyword))) continue;
              if (timeCond && timeCond !== "*") {
                const [mode, tStr] = timeCond.split(":");
                const target = tStr.length === 10 ? tStr + " 00:00:00" : tStr;
                if (mode === "after" && time < target) continue;
                if (mode === "before" && time > target) continue;
              }
              if (matchedCount >= start && view.length < limit) {
                view.push({
                  time,
                  name: d.name,
                  dbId: d.dbId,
                  x: d.x, y: d.y, z: d.z,
                  action: act,
                  block: d.block || ""
                });
              }
              matchedCount++;
              if (!isAll && matchedCount >= end) break; // ページ分揃ったら終了
            }
          }
          i++;
          if (Date.now() - searchStart >= config.SEARCH_TIMEOUT) {
            sendResult();
            return;
          }
          if (view.length < limit && (!isAll || matchedCount < end)) {
            getNext();
          } else {
            sendResult();
          }
        });
      }

      function sendResult() {
        let buffer = [{
          str: `=== Block Log ${isAll ? "(first " + limit + ")" : `(page ${page})`} ===\n`,
          style: { color: "#aaaaaa", fontStyle: "italic" }
        }];

        for (const v of view) {
          buffer.push(
            { str: `[${v.time}] `, style: { color: "#D3D3D3", fontStyle: "italic" } },
            { str: v.name + " ", style: { color: "#0090a8", fontStyle: "italic" } },
            { str: v.action + " ", style: { color: typeColorOf(v.action), fontStyle: "italic" , fontSize: "20px"} },
            { str: v.block + " ", style: { color: "#FFC800", fontStyle: "italic" } },
            { str: `at (${v.x},${v.y},${v.z})`, style: { fontStyle: "italic" } },
            { str: ` (${v.dbId})\n`, style: { color: "#D3D3D3", fontStyle: "italic" } }
          );
        }

        sendChunk(buffer);
      }
      getNext();
    });
    return true;
  }
};

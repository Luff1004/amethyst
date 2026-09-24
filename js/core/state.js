/* AMETHYST - save data, derived stats and player actions */
(() => {
  const KEY = 'amethyst_save_v1';
  const fresh = () => ({
    v: 1, coins: 0, total: 0, clicks: 0, shatters: 0,
    zone: 0, maxZone: 0,
    upg: {}, buffs: {}, codex: {}, muted: false,
    crystals: 0, potions: {}, armed: {}, autoOn: true,
    tutorialDone: false, tutorialStep: 0, tutorialPotionGiven: false, eventRedeemed: {},
    /* monthly event packages (js/data/events.js): free box openings, limited foods waiting to be
       eaten, permanent foods already eaten, and how many of each package were bought */
    tickets: {}, foodInv: {}, perm: {}, pkgBought: {},
    settings: { autoSkipSeen: false, minOdds: 0, bannerStyle: 'banner' },
    /* LEVEL 1 - the secret ARG-ish sequence gating the real 5th map (js/level1.js).
       gauge: 0..1 progress this run through the crystal-crack ending (resets each playthrough).
       endingSeen: finished the crack -> eye -> captions -> credits sequence at least once.
       crystalGone: the MAIN crystal is missing (set true right when the ending finishes; the
                    codex tab becomes a jumpscare trigger while this is true and !restored).
       restored: the player has clicked "자수정 회복하기" after the jumpscare - the real void
                 rift map (zone 4) is unlocked for good from this point on. */
    level1: { gauge: 0, endingSeen: false, crystalGone: false, restored: false },
  });

  G.state = fresh();

  G.load = () => {
    if (G.config.viewer) { Object.assign(G.state, { tutorialDone: true, autoOn: false }); G.audio.setMuted(false); return; }
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) G.state = Object.assign(fresh(), JSON.parse(raw));
      if (!G.state.armed || typeof G.state.armed !== 'object') G.state.armed = {};   // older saves had a single id string
    } catch (e) { /* storage blocked - play without saving */ }
    G.audio.setMuted(G.state.muted);
  };
  /* local dev (js/config.js dev, localhost only): coins and crystals are effectively unlimited -
     anything spent is topped straight back up, so every shop/package/box can be tested freely */
  const devTopUp = () => {
    if (!G.config.dev) return;
    if (!(G.state.coins >= 1e20)) G.state.coins = 1e21;
    if (!(G.state.crystals >= 1e14)) G.state.crystals = 1e15;
  };
  G.on('change', devTopUp);
  const load0 = G.load;
  G.load = () => { load0(); devTopUp(); };
  G.save = () => { if (G.config.viewer) return; try { localStorage.setItem(KEY, JSON.stringify(G.state)); } catch (e) {} };
  G.reset = () => { G.state = fresh(); G.save(); G.emit('change'); };

  const now = () => Date.now();
  const upg = id => G.data.upgrades.find(u => u.id === id);
  const lv = id => G.state.upg[id] || 0;

  G.stats = {
    zone: () => G.data.zones[G.state.zone],
    level: lv,
    val: id => upg(id).value(lv(id)),
    coinMul() { return this.val('value') * this.zone().coinMul * this.permCoinMul(); },
    permCoinMul() { let m = 1; for (const f of G.data.foods) if (f.perm && G.state.perm[f.id]) m *= f.coinMul || 1; return m; },
    clickValue() { return this.val('power') * this.coinMul(); },
    critChance() { return this.val('crit'); },
    critMul() { return this.val('critMul'); },
    autoRate() { return this.val('auto'); },
    foodLuck() {
      let s = 0;
      for (const f of G.data.foods) if (f.perm ? G.state.perm[f.id] : (G.state.buffs[f.id] || 0) > now()) s += f.bonus;
      return s;
    },
    luck() { return 1 + this.val('luck') + this.foodLuck(); },
    potion: id => G.data.potions.find(p => p.id === id),
    /* several crystals can be armed at once now - their luck stacks (adds up) for the next click */
    armedList() {
      const out = [];
      for (const id in G.state.armed) { const n = G.state.armed[id], pt = this.potion(id); if (n > 0 && pt) for (let i = 0; i < n; i++) out.push(pt); }
      return out;
    },
    armedCount() { return this.armedList().length; },
    armedLuck() { return this.armedList().reduce((a, p) => a + (p.luck || 0), 0); },
    /* the crystal to represent with a single accent colour for the HUD/halo - a "guarantee"
       crystal (event rewards etc.) wins out over sorting by luck, since it has none */
    armedTop() {
      const list = this.armedList();
      return list.find(p => p.grantCut) || list.find(p => p.guarantee) || list.slice().sort((a, b) => (b.luck || 0) - (a.luck || 0))[0] || null;
    },
    /* chance to see at least one mineral of tier >= `tier` in the current zone on a click with this luck */
    chanceAtLeast(luck, tier, cap = 0.5) {
      let miss = 1, n = 0;
      for (const c of G.cutscenes.inZone(G.state.zone)) if (c.tierIdx >= tier) { miss *= 1 - Math.min(cap, luck / c.odds); n++; }
      return n ? 1 - miss : null;
    },
    buffLeft(id) { return Math.max(0, ((G.state.buffs[id] || 0) - now()) / 1000); },
    /* how many DISTINCT 1억+ (DIVINE tier and up) cutscenes you've ever discovered, across every map */
    divineFound() {
      let n = 0;
      for (const id in G.state.codex) { const rec = G.state.codex[id], d = G.cutscenes.byId[id]; if (rec && rec.n > 0 && d && d.tierIdx >= 6 && !d.special) n++; }
      return n;
    },
    /* how many DISTINCT SECRET-tier cutscenes (the one-per-map hidden mineral) you've ever found */
    secretFound() {
      let n = 0;
      for (const id in G.state.codex) { const rec = G.state.codex[id], d = G.cutscenes.byId[id]; if (rec && rec.n > 0 && d && d.tierIdx >= 8 && !d.special) n++; }
      return n;
    },
    /* every SECRET-tier cutscene in the whole game found at least once - the gate for LEVEL 1.
       same review-mode bypass as the codex (js/config.js unlockCodex, auto-true on localhost) so
       LEVEL 1 - and ENDING 1 - is reachable locally without grinding out all 4 secrets first. */
    allSecretsFound() {
      if (G.config.unlockCodex) return true;
      // only maps BEFORE the LEVEL 1 zone count - that zone's own secret is unreachable until LEVEL 1 is done
      const gate = G.data.zones.findIndex(z => z.unlock && z.unlock.type === 'level1');
      const pre = G.cutscenes.list.filter(c => c.tierIdx >= 8 && !c.special && (gate < 0 || c.zone < gate));
      return pre.length > 0 && pre.every(c => G.state.codex[c.id] && G.state.codex[c.id].n > 0);
    },
    /* does the player currently satisfy a zone's `unlock` requirement? */
    meetsUnlock(req) {
      if (!req) return true;
      if (req.type === 'divine') return this.divineFound() >= req.n;
      if (req.type === 'secret') return this.secretFound() >= req.n;
      if (req.type === 'level1') return G.state.level1.restored;
      return true;
    },
  };

  G.addCoins = n => { G.state.coins += n; G.state.total += n; };

  /* ---- actions (return true on success) ---- */
  G.act = {
    buyUpgrade(id) {
      const u = upg(id), l = lv(id);
      if (l >= u.max) return false;
      const c = u.cost(l);
      if (G.state.coins < c) return false;
      G.state.coins -= c; G.state.upg[id] = l + 1;
      G.save(); G.emit('change'); return true;
    },
    buyFood(id) {
      const f = G.data.foods.find(x => x.id === id);
      if (G.state.coins < f.cost) return false;
      G.state.coins -= f.cost;
      const base = Math.max(now(), G.state.buffs[id] || 0);
      G.state.buffs[id] = base + f.duration * 1000;
      G.save(); G.emit('change'); return true;
    },
    /* coins -> crystals */
    exchange(n) {
      const cost = n * G.data.exchange.rate;
      if (n < 1 || G.state.coins < cost) return false;
      G.state.coins -= cost; G.state.crystals += n;
      G.save(); G.emit('change'); return true;
    },
    exchangeMax() { return this.exchange(Math.floor(G.state.coins / G.data.exchange.rate)); },
    /* 1 box = 1 crystal item; which one is a weighted dice roll */
    openBox(id) {
      const b = G.data.boxes.find(x => x.id === id), t = G.state.tickets;
      if (!b) return null;
      if (t[id] > 0) { t[id]--; if (!t[id]) delete t[id]; }            // a free-open ticket goes first
      else if (G.state.crystals < b.cost) return null;
      else G.state.crystals -= b.cost;
      const total = b.w.reduce((a, v) => a + v, 0);
      let r = Math.random() * total, idx = 0;
      for (let i = 0; i < b.w.length; i++) { r -= b.w[i]; if (r < 0) { idx = i; break; } }
      const pt = G.data.potions[idx];
      G.state.potions[pt.id] = (G.state.potions[pt.id] || 0) + 1;
      G.save(); G.emit("change"); G.emit("box", { box: b, potion: pt, idx });
      return pt;
    },
    /* drink (arm) a crystal for the next manual click - several can be armed at once and their
       luck stacks; arming the same one again drinks another unit rather than replacing it */
    armPotion(id) {
      const s = G.state, pt = G.stats.potion(id);
      if (!(s.potions[id] > 0)) return false;
      if (pt && pt.event && !G.event.isActive(pt.event)) return false;   // limited items only work in their month
      s.potions[id]--; s.armed[id] = (s.armed[id] || 0) + 1;
      G.save(); G.emit('change'); return 'on';
    },
    /* put one armed unit back into the inventory */
    unarmPotion(id) {
      const s = G.state;
      if (!(s.armed[id] > 0)) return false;
      s.armed[id]--; if (!s.armed[id]) delete s.armed[id];
      s.potions[id] = (s.potions[id] || 0) + 1;
      G.save(); G.emit('change'); return 'off';
    },
    /* monthly event package (js/data/events.js): pay the sale price in crystals, receive every item.
       Only the package of the event that's running right now can be bought. */
    buyPackage(pkgId) {
      const ev = G.event.current(), pk = ev && ev.packages.find(p => p.id === pkgId), s = G.state;
      if (!pk) return 'closed';
      if (s.crystals < pk.sale) return 'poor';
      s.crystals -= pk.sale;
      for (const it of pk.items) {
        const bag = it.k === 'potion' ? s.potions : it.k === 'ticket' ? s.tickets : s.foodInv;
        bag[it.id] = (bag[it.id] || 0) + it.n;
      }
      s.pkgBought[pk.id] = (s.pkgBought[pk.id] || 0) + 1;
      G.save(); G.emit('change'); return 'ok';
    },
    /* eat a food from the inventory (event foods): timed ones stack time like shop food, a
       permanent one switches its effect on forever (a second one of the same kind does nothing) */
    eatFood(id) {
      const s = G.state, f = G.data.foods.find(x => x.id === id);
      if (!f || !(s.foodInv[id] > 0)) return 'none';
      if (f.perm && s.perm[id]) return 'already';
      s.foodInv[id]--; if (!s.foodInv[id]) delete s.foodInv[id];
      if (f.perm) s.perm[id] = true;
      else s.buffs[id] = Math.max(now(), s.buffs[id] || 0) + f.duration * 1000;
      G.save(); G.emit('change'); return f.perm ? 'perm' : 'ok';
    },
    /* LEVEL 1 (js/level1.js): one "?" and one gauge tick per click on its crystal */
    level1Click() {
      const l1 = G.state.level1;
      l1.gauge = Math.min(1, l1.gauge + 1 / 40);
      G.save();
      return l1.gauge;
    },
    /* the crack -> eye -> captions -> credits sequence just finished - the MAIN crystal vanishes */
    level1Finish() {
      const l1 = G.state.level1;
      l1.endingSeen = true; l1.crystalGone = true; l1.gauge = 0;
      G.save(); G.emit('change');
    },
    /* after the jumpscare: bring the main crystal back for good and unlock the real void rift map */
    level1Restore() {
      const l1 = G.state.level1;
      l1.crystalGone = false; l1.restored = true;
      G.save(); G.emit('change');
    },
    toggleAuto() { G.state.autoOn = !G.state.autoOn; G.save(); G.emit('change'); return G.state.autoOn; },
    setSetting(key, val) { G.state.settings[key] = val; G.save(); G.emit('change'); },
    /* tutorial: step forward, or finish. The practice potion is granted exactly once ever -
       replaying the tutorial from settings walks through it again but never re-grants it. */
    tutorialNext() {
      G.state.tutorialStep++;
      if (G.state.tutorialStep >= G.data.tutorialSteps.length) {
        G.state.tutorialDone = true;
        if (!G.state.tutorialPotionGiven) {
          G.state.tutorialPotionGiven = true;
          G.state.potions.tutorial = (G.state.potions.tutorial || 0) + 1;
          G.emit('tutorialDone');
        } else {
          G.emit('tutorialReplayDone');
        }
      }
      G.save(); G.emit('change');
    },
    tutorialSkip() { G.state.tutorialDone = true; G.save(); G.emit('change'); },
    /* codex: stop watching a cutscene (the reward still arrives) / watch it again */
    toggleSkip(id) {
      const rec = G.state.codex[id] || (G.state.codex[id] = { n: 0, t: Date.now(), best: 0 });
      rec.skip = !rec.skip;
      G.save(); G.emit('change'); return rec.skip;
    },
    /* portable save code - survives clearing the browser's site data/localStorage (a plain
       "clear cache" alone does NOT touch localStorage, but "clear cookies and site data" does) */
    exportSave() { try { return btoa(unescape(encodeURIComponent(JSON.stringify(G.state)))); } catch (e) { return null; } },
    importSave(code) {
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        if (!data || typeof data !== 'object' || !('coins' in data)) return false;
        G.state = Object.assign(fresh(), data);
        if (!G.state.armed || typeof G.state.armed !== 'object') G.state.armed = {};
        G.save(); G.audio.setMuted(G.state.muted); G.emit('change'); return true;
      } catch (e) { return false; }
    },
    travel(i) {
      const z = G.data.zones[i];
      if (!z) return false;
      // review mode (js/config.js, auto-true on localhost): every zone is freely reachable, no
      // coin cost, no walking through zones in order, no unlock conditions
      if (G.config.unlockCodex) { G.state.maxZone = Math.max(G.state.maxZone, i); G.state.zone = i; G.save(); G.emit('change'); G.emit('zone'); return true; }
      if (i > G.state.maxZone) {
        if (i !== G.state.maxZone + 1) return false;
        if (z.unlock) { if (!G.stats.meetsUnlock(z.unlock)) return false; }
        else { if (G.state.coins < z.cost) return false; G.state.coins -= z.cost; }
        G.state.maxZone = i;
      }
      G.state.zone = i;
      G.save(); G.emit('change'); G.emit('zone'); return true;
    },
  };

  setInterval(G.save, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(); });
  window.addEventListener('pagehide', G.save);
})();

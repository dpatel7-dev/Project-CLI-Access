'use strict';
// Project CLI Access: one screen, every project. Pick one and open it.
//
//      project cli access                                       v1.0.0
//
//      ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
//      │      [Pebble]      │  │      [Rowan]       │  │       [Coo]        │
//      │  gossip            │  │  tree of thought   │  │  pigeon            │
//      │  encrypted chat    │  │  many AI models    │  │  files between …   │
//      │  ✓ v0.9.0          │  │  not installed     │  │  ✓ v1.0.0          │
//      └────────────────────┘  └────────────────────┘  └────────────────────┘
//
//      ← → choose · enter open · u update · x remove · q quit

const A = require('./ansi');
const S = require('./sprite');
const Apps = require('./apps');
const U = require('./updates');
const { Tui, fit, center, spread } = require('./tui');
const pkg = require('../package.json');

const PAPER = { bg: '#121417', fg: '#e4e6ea' };
const DIM = '#80868f';
const FAINT = '#41464e';
const dim = (s) => A.paint(s, { fg: DIM });
const faint = (s) => A.paint(s, { fg: FAINT });

class App {
  constructor({ input = process.stdin, output = process.stdout } = {}) {
    this.sel = 0;
    this.flash = null;
    this.armed = null;
    this.refresh();
    this.ui = new Tui({ input, output, paper: PAPER, render: (w, h) => this.frame(w, h) });
    this.ui.on('key', (s, k) => this.onKey(s, k));
    this.ui.on('mouse', (m) => { if (m.click && this.hit) { const i = this.hit(m.x, m.y); if (i >= 0) { if (i === this.sel) this.open(); else this.sel = i; this.ui.schedule(); } } });
  }

  refresh() { this.state = Apps.APPS.map((a) => Apps.status(a)); }

  run() {
    return new Promise((resolve) => {
      this.done = resolve;
      this.ui.start();
      this.ticker = setInterval(() => { if (this.flash && this.flash.until < Date.now()) { this.flash = null; this.ui.schedule(); } }, 300);
      this.autoUpdate();
    });
  }

  /** Bring everything that's behind up to date, quietly, while you look around. */
  async autoUpdate({ force = false } = {}) {
    this.behind = {};
    let list = [];
    try { list = await U.check({ force }); } catch { return; }
    for (const u of list) this.behind[u.app.id] = u.want;
    this.ui.schedule();
    if (!list.length) { if (force) this.say('Everything is up to date.'); return; }
    if (!U.autoOn() && !force) return this.say(`Updates are ready: ${list.map((u) => `${u.app.cmd} ${u.want}`).join(', ')}. Press U to get them.`, 6000);
    this.updating = true;
    const done = [];
    for (const u of list) {
      this.busy = { id: u.app.id, text: `Updating ${u.app.name} to ${u.want}…` };
      this.ui.schedule();
      const ok = await U.quietInstall(u.app, (line) => { this.busy = { id: u.app.id, text: `Updating ${u.app.name} to ${u.want}: ${line}` }; this.ui.schedule(); });
      if (ok) { done.push(`${u.app.cmd} ${u.want}`); delete this.behind[u.app.id]; }
      else this.say(`Couldn't update ${u.app.name} right now. Press u on it to see why.`, 6000);
    }
    this.busy = null;
    this.updating = false;
    this.refresh();
    if (done.length) this.say(`Updated ${done.join(', ')}.${done.some((d) => d.startsWith('pca ')) ? ' (The new pca starts next time.)' : ''}`, 6000);
    if (this.waiting) { const w = this.waiting; this.waiting = null; w(); }
  }

  quit() {
    clearInterval(this.ticker);
    this.ui.stop();
    if (this.done) this.done();
  }

  say(text, ms = 4000) { this.flash = { text, until: Date.now() + ms }; this.ui.schedule(); }

  /** Open the chosen project (installing it first if it isn't here yet). */
  async open() {
    const app = Apps.APPS[this.sel];
    if (this.updating && this.busy) { this.say(`One moment: finishing updates first (${this.busy.text.split(':')[0]}).`, 3000); await new Promise((r) => { this.waiting = r; }); }
    await this.ui.suspend(async () => {
      if (!Apps.status(app)) {
        process.stdout.write(`\n  ${app.name} isn't installed yet - installing it now.\n`);
        if (!Apps.install(app)) { await pause(); return; }
      }
      const code = await Apps.launch(app);
      if (code === 127) { process.stdout.write(`\n  Couldn't start ${app.name}. Try installing it again (u).\n`); await pause(); }
    });
    this.refresh();
    this.say(`Back from ${app.name}.`, 2000);
  }

  async update(all) {
    if (this.updating) return this.say('Already updating: one moment.');
    if (all) return this.autoUpdate({ force: true });
    const list = [Apps.APPS[this.sel]];
    if (!list.length) return this.say('Nothing installed yet. Press enter to install one.');
    await this.ui.suspend(async () => {
      let ok = true;
      for (const a of list) { process.stdout.write(`\n  ── ${a.name} ──\n`); ok = Apps.install(a) && ok; }
      if (!ok) await pause();
    });
    this.refresh();
    this.say(`Updated ${list.map((a) => a.name).join(', ')}.`);
  }

  async remove() {
    const app = Apps.APPS[this.sel];
    if (!this.state[this.sel]) return this.say(`${app.name} isn't installed.`);
    if (this.armed !== app.id) { this.armed = app.id; return this.say(`Press x again to uninstall ${app.name} from this computer.`, 3000); }
    this.armed = null;
    await this.ui.suspend(async () => { Apps.uninstall(app); });
    this.refresh();
    this.say(`Uninstalled ${app.name}.`);
  }

  /** What changed in the newest version of the chosen app (its changelog, from GitHub). */
  async whatsNew() {
    const app = Apps.APPS[this.sel];
    this.say(`Looking up what's new in ${app.name}…`, 3000);
    let text;
    try { text = await Apps.changes(app); } catch (e) { return this.say(`Couldn't get ${app.name}'s changelog right now (${e.message}).`, 6000); }
    await this.ui.suspend(async () => {
      const c = A.paint(app.name, { bold: true, fg: app.color });
      process.stdout.write(`\n  ${c} ${dim('· what\'s new')}\n\n`);
      for (const l of text.split('\n')) process.stdout.write('  ' + (/^## /.test(l) ? A.paint(l.replace(/^## /, ''), { bold: true, fg: app.color }) : l.replace(/^- /, '· ')) + '\n');
      await pause();
    });
  }

  onKey(s, k) {
    if (k.ctrl && (k.name === 'c' || k.name === 'd')) return this.quit();
    const n = Apps.APPS.length;
    if (k.name === 'left' || k.name === 'up' || (k.shift && k.name === 'tab')) this.sel = (this.sel - 1 + n) % n;
    else if (k.name === 'right' || k.name === 'down' || k.name === 'tab') this.sel = (this.sel + 1) % n;
    else if (/^[1-9]$/.test(s || '') && Number(s) <= n) { this.sel = Number(s) - 1; this.open(); }
    else if (k.name === 'return' || k.name === 'space') this.open();
    else if (s === 'u') this.update(false);
    else if (s === 'U') this.update(true);
    else if (s === 'x') this.remove();
    else if (s === 'w' || s === 'n') this.whatsNew();
    else if (s === 'q' || k.name === 'escape') return this.quit();
    if (s !== 'x') this.armed = null;
    this.ui.schedule();
  }

  frame(W, H) {
    const lines = [];
    const n = Apps.APPS.length;
    // one row when it fits; otherwise rows of cards, as many across as fit
    let cols = W >= n * 26 + 6 ? n : Math.max(1, Math.min(n, Math.floor((W - 4) / 30)));
    if (cols > 1 && cols < n) cols = Math.ceil(n / Math.ceil(n / cols)); // even rows: 3 + 2, not 4 + 1
    const rows = Math.ceil(n / cols);
    const cardW = cols === 1 ? Math.min(W - 6, 48) : Math.min(32, Math.floor((W - 6 - 2 * (cols - 1)) / cols));
    const gridW = cols * cardW + 2 * (cols - 1);
    const left = Math.max(1, Math.floor((W - gridW) / 2));
    // mascots when there's room for them: on every card, or just the chosen one
    const allPics = rows * 15 + 9 <= H;
    const onePic = (rows - 1) * 6 + 15 + 9 <= H;
    lines.push('');
    const span = Math.max(10, gridW);
    const tag = span >= 60 ? dim('  ·  one command, every project') : '';
    lines.push(' '.repeat(left) + spread(A.paint('project cli access', { bold: true }) + tag, faint(`v${pkg.version}`), span));
    lines.push('');
    const cards = Apps.APPS.map((a, i) => this.card(a, this.state[i], i === this.sel, cardW, allPics || (onePic && i === this.sel)));
    const rects = [];
    for (let r = 0; r < rows; r++) {
      const row = cards.slice(r * cols, (r + 1) * cols);
      const top = lines.length;
      const h = Math.max(...row.map((c) => c.length));
      for (let y = 0; y < h; y++) lines.push(' '.repeat(left) + row.map((c) => c[y] || ' '.repeat(cardW)).join('  '));
      row.forEach((c, k) => rects.push({ x: left + k * (cardW + 2), y: top, w: cardW, h: c.length }));
      if (r < rows - 1) lines.push('');
    }
    lines.push('');
    const app = Apps.APPS[this.sel];
    const st = this.state[this.sel];
    const what = st ? `enter opens ${app.cmd}` : `enter installs and opens ${app.cmd}`;
    const hint = W - left >= 100 ? `← → choose · ${what} · w what's new · u update · U update all · x remove · q quit` : `← → · enter open · w new · u update · x remove · q quit`;
    const busyApp = this.busy && (Apps.APPS.find((a) => a.id === this.busy.id) || { color: '#d9d4e8' });
    const footer = this.flash ? A.paint(this.flash.text, { fg: app.color }) : this.busy ? A.paint('↻ ' + this.busy.text, { fg: busyApp.color }) : dim(hint);
    lines.push(' '.repeat(left) + A.clip(footer, Math.max(10, W - left - 1)));
    lines.push('');
    lines.push(' '.repeat(left) + faint(`from ${Apps.site().replace(/^https?:\/\//, '')}`));
    const extra = Math.max(0, Math.floor((H - lines.length) / 3)); // sit a little above the middle
    const out = Array(extra).fill('').concat(lines).slice(0, H);
    this.hit = (x, y) => rects.findIndex((r) => x >= r.x && x < r.x + r.w && y - extra >= r.y && y - extra < r.y + r.h);
    return { lines: out };
  }

  card(app, st, on, w, full) {
    const border = on ? app.color : FAINT;
    const B = (s) => A.paint(s, { fg: border });
    const inner = w - 2;
    const out = [];
    out.push(B('╭' + '─'.repeat(inner) + '╮'));
    if (full) {
      const pic = S.draw(app.grid, app.ink, { bg: PAPER.bg });
      for (const l of pic) out.push(B('│') + center(l, inner) + B('│'));
    }
    const row = (s) => out.push(B('│') + fit(' ' + A.clip(s, inner - 2), inner) + B('│'));
    row(A.paint(app.name, { bold: true, fg: on ? app.color : PAPER.fg }));
    row(dim(app.about));
    if (full) row(faint(app.more));
    const want = this.behind && this.behind[app.id];
    const now = this.busy && this.busy.id === app.id;
    row(!st ? faint('not installed yet')
      : now ? A.paint('↻ ', { fg: app.color }) + dim(`v${st.version} → ${want || 'newest'}`)
        : want ? A.paint('↑ ', { fg: '#f2b33d' }) + dim(`v${st.version}`) + A.paint(`  ${want} is out`, { fg: '#f2b33d' })
          : A.paint('✓ ', { fg: app.color }) + dim(`v${st.version}`) + faint(`  ·  ${app.cmd}`));
    out.push(B('╰' + '─'.repeat(inner) + '╯'));
    return out;
  }
}

function pause() {
  return new Promise((resolve) => {
    process.stdout.write('\n  Press Enter to go back.');
    const done = () => { process.stdin.removeListener('data', done); process.stdin.pause(); resolve(); };
    process.stdin.resume();
    process.stdin.once('data', done);
  });
}

module.exports = { App };

'use strict';
// Project CLI Access: one screen, three projects. Pick one and open it.
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
    });
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
    const list = all ? Apps.APPS.filter((a, i) => this.state[i]) : [Apps.APPS[this.sel]];
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
    else if (s === 'q' || k.name === 'escape') return this.quit();
    if (s !== 'x') this.armed = null;
    this.ui.schedule();
  }

  frame(W, H) {
    const lines = [];
    const n = Apps.APPS.length;
    const wide = W >= n * 26 + 6;
    const cardW = wide ? Math.min(32, Math.floor((W - 6 - 2 * (n - 1)) / n)) : Math.min(W - 6, 48);
    const left = wide ? Math.floor((W - (n * cardW + 2 * (n - 1))) / 2) : Math.floor((W - cardW) / 2);
    lines.push('');
    const span = Math.max(10, wide ? n * cardW + 2 * (n - 1) : cardW);
    const tag = span >= 60 ? dim('  ·  one command, every project') : '';
    lines.push(' '.repeat(Math.max(1, left)) + spread(A.paint('project cli access', { bold: true }) + tag, faint(`v${pkg.version}`), span));
    lines.push('');
    const cards = Apps.APPS.map((a, i) => this.card(a, this.state[i], i === this.sel, cardW, wide || i === this.sel));
    const rects = [];
    if (wide) {
      const top = lines.length;
      const h = Math.max(...cards.map((c) => c.length));
      for (let y = 0; y < h; y++) lines.push(' '.repeat(left) + cards.map((c) => c[y] || ' '.repeat(cardW)).join('  '));
      cards.forEach((c, i) => rects.push({ x: left + i * (cardW + 2), y: top, w: cardW, h }));
    } else {
      // narrow window: stacked, with only the chosen one showing its mascot
      cards.forEach((c, i) => {
        const top = lines.length;
        for (const l of c) lines.push(' '.repeat(left) + l);
        rects.push({ x: left, y: top, w: cardW, h: c.length });
      });
    }
    lines.push('');
    const app = Apps.APPS[this.sel];
    const st = this.state[this.sel];
    const what = st ? `enter opens ${app.cmd}` : `enter installs and opens ${app.cmd}`;
    const hint = W - left >= 90 ? `← → choose · ${what} · u update · U update all · x remove · q quit` : `← → · enter open · u update · x remove · q quit`;
    lines.push(' '.repeat(left) + A.clip(this.flash ? A.paint(this.flash.text, { fg: app.color }) : dim(hint), Math.max(10, W - left - 1)));
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
    row(st ? A.paint('✓ ', { fg: app.color }) + dim(`v${st.version}`) + faint(`  ·  ${app.cmd}`) : faint('not installed yet'));
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

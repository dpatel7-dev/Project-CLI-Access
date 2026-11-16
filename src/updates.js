'use strict';
// Keeping everything up to date: pca asks the website which versions are
// newest (/versions.json), and updates whatever is behind - the projects and
// pca itself. It checks at most once an hour, and never holds you up for more
// than a couple of seconds if the website is slow or unreachable.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const Apps = require('./apps');
const pkg = require('../package.json');

const SELF = { id: 'pca', cmd: 'pca', name: 'Project CLI Access', folder: '.pca', path: '/pca', repo: 'dpatel7-dev/Project-CLI-Access' };
const stateFile = () => path.join(Apps.home(), 'state.json');
function load() { try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return {}; } }
function save(s) { fs.mkdirSync(Apps.home(), { recursive: true }); fs.writeFileSync(stateFile(), JSON.stringify(s, null, 1)); }

/** Is a newer than b? ("1.10.0" > "1.9.2") */
function newer(a, b) {
  const pa = String(a || '').split('.').map(Number);
  const pb = String(b || '').split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
}

async function getJson(url, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { 'cache-control': 'no-cache' } });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } finally { clearTimeout(t); }
}

/** The newest versions: { gossip, tot, pigeon, pca }, from the website (or GitHub if it's down). */
async function latest({ timeout = 2500 } = {}) {
  try {
    const j = await getJson(`${Apps.site()}/versions.json`, timeout);
    if (j && typeof j === 'object' && j.pca) return j;
  } catch { /* try GitHub */ }
  const out = {};
  await Promise.all(Apps.APPS.concat(SELF).map(async (a) => {
    try { out[a.id] = (await getJson(`https://raw.githubusercontent.com/${a.repo}/main/package.json`, timeout)).version; } catch { /* unknown */ }
  }));
  return out;
}

/**
 * What's out of date: [{ app, have, want }] (pca itself has id 'pca').
 * Uses the hour-old answer unless `force`.
 */
async function check({ force = false, timeout } = {}) {
  const st = load();
  let want = st.latest;
  if (force || !want || Date.now() - (st.checked || 0) > 3600000) {
    want = await latest({ timeout });
    if (Object.keys(want).length) save({ ...st, checked: Date.now(), latest: want });
  }
  const out = [];
  if (want.pca && newer(want.pca, pkg.version)) out.push({ app: SELF, have: pkg.version, want: want.pca });
  for (const app of Apps.APPS) {
    const s = Apps.status(app);
    if (s && want[app.id] && newer(want[app.id], s.version)) out.push({ app, have: s.version, want: want[app.id] });
  }
  return out;
}

/** Run an installer without taking over the screen; onLine(text) gets its output. */
function quietInstall(app, onLine = () => {}) {
  const win = process.platform === 'win32';
  const url = Apps.installUrl(app, win ? 'ps1' : 'sh');
  return new Promise((resolve) => {
    const child = win
      ? spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `irm ${url} | iex`], { stdio: ['ignore', 'pipe', 'pipe'] })
      : spawn('sh', ['-c', `curl -fsSL "${url}" | sh`], { stdio: ['ignore', 'pipe', 'pipe'] });
    const feed = (d) => String(d).split(/\r?\n/).map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').trim()).filter(Boolean).forEach(onLine);
    child.stdout.on('data', feed);
    child.stderr.on('data', feed);
    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });
}

function autoOn() { return load().auto !== false; }
function setAuto(on) { save({ ...load(), auto: !!on }); }

// ── a daily update even when pca isn't opened (optional) ─────────────────────
const LABEL = 'com.djp7.pca.update';
function launcherPath() {
  try { return fs.readFileSync(path.join(Apps.home(), 'launcher'), 'utf8').trim(); } catch { return process.argv[1] ? `${process.execPath} ${process.argv[1]}` : 'pca'; }
}
function daily(on) {
  const exe = launcherPath();
  if (process.platform === 'darwin') {
    const plist = path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);
    const uid = process.getuid ? process.getuid() : 501;
    spawnSync('launchctl', ['bootout', `gui/${uid}/${LABEL}`], { stdio: 'ignore' });
    if (!on) { fs.rmSync(plist, { force: true }); return 'Daily updates are off.'; }
    fs.mkdirSync(path.dirname(plist), { recursive: true });
    fs.writeFileSync(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key><array><string>${exe}</string><string>update</string><string>--quiet</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>12</integer><key>Minute</key><integer>17</integer></dict>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key><string>${path.join(Apps.home(), 'update.log')}</string>
  <key>StandardErrorPath</key><string>${path.join(Apps.home(), 'update.log')}</string>
</dict></plist>
`);
    const r = spawnSync('launchctl', ['bootstrap', `gui/${uid}`, plist], { stdio: 'ignore' });
    if (r.status !== 0) spawnSync('launchctl', ['load', '-w', plist], { stdio: 'ignore' });
    return 'Daily updates are on: every day around lunchtime, while your Mac is awake.';
  }
  if (process.platform === 'win32') {
    if (!on) { spawnSync('schtasks', ['/Delete', '/TN', 'pca-update', '/F'], { stdio: 'ignore' }); return 'Daily updates are off.'; }
    const r = spawnSync('schtasks', ['/Create', '/TN', 'pca-update', '/SC', 'DAILY', '/ST', '12:17', '/TR', `"${exe}" update --quiet`, '/F'], { stdio: 'ignore' });
    if (r.status !== 0) throw new Error("Windows wouldn't add the daily task.");
    return 'Daily updates are on: every day around lunchtime.';
  }
  const cur = spawnSync('crontab', ['-l'], { encoding: 'utf8' });
  const lines = (cur.status === 0 ? cur.stdout : '').split('\n').filter((l) => l && !l.includes('# pca-update'));
  if (on) lines.push(`17 12 * * * ${exe} update --quiet >> ${path.join(Apps.home(), 'update.log')} 2>&1 # pca-update`);
  const r = spawnSync('crontab', ['-'], { input: lines.join('\n') + '\n' });
  if (r.status !== 0) throw new Error("Couldn't change your crontab.");
  return on ? 'Daily updates are on: every day around lunchtime.' : 'Daily updates are off.';
}

module.exports = { check, latest, newer, quietInstall, autoOn, setAuto, daily, SELF, load, save };

'use strict';
// The projects Project CLI Access knows about: how to tell whether each one is
// installed, how to install, open, update and remove it - and its mascot.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const DEFAULT_SITE = 'https://djp7.pythonanywhere.com';
const home = () => process.env.PCA_HOME || path.join(os.homedir(), '.pca');

/** The website everything installs from: PCA_SITE, else where pca came from, else the default. */
function site() {
  if (process.env.PCA_SITE) return process.env.PCA_SITE.replace(/\/+$/, '');
  try {
    const s = fs.readFileSync(path.join(home(), 'hub'), 'utf8').trim();
    if (/^https?:\/\//.test(s)) return s.replace(/\/+$/, '');
  } catch { /* installed from GitHub */ }
  return DEFAULT_SITE;
}

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
  return '#' + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
};

const APPS = [
  {
    id: 'gossip', name: 'gossip', cmd: 'gossip', folder: '.gossip', color: '#7cc4ff', path: '',
    about: 'encrypted chat', more: 'people, servers, calls',
    repo: 'dpatel7-dev/gossip',
    grid: [
      '..........................', '.....' + '......BBBB......' + '.....', '.....' + '....BBBBBBBB....' + '.....', '.....' + '...BBBBBBBBBB...' + '.....', '.....' + '..BBWWWBBWWWBB..' + '.....',
      '.....' + '..BWWEWWWWEWWB..' + '.....', '.....' + '..BWWWWOOWWWWB..' + '.....', '.....' + '..BBWWWooWWWBB..' + '.....', '.....' + '...RRRRRRRRRR...' + '.....',
      '.....' + '..BBrRWWWWWWBB..' + '.....', '.....' + '.BBBRRWWWWWWBBB.' + '.....', '.....' + 'BBB.RWWWWWWW.BBB' + '.....', '.....' + 'BB..WWWWWWWW..BB' + '.....',
      '.....' + '....BWWWWWWB....' + '.....', '.....' + '....BBwwwwBB....' + '.....', '.....' + '...OOOBBBBOOO...' + '.....', '.....' + '..OOOO....OOOO..' + '.....',
    ],
    ink: { B: '#567ab0', D: '#3a5480', W: '#f4f7fc', w: '#d6deeb', O: '#ffb048', o: '#e48a34', E: '#1a1e2a', R: '#ff707a', r: '#d45262' },
    mascot: 'Pebble',
  },
  {
    id: 'tot', name: 'tree of thought', cmd: 'tot', folder: '.tot', color: '#8fd16a', path: '/tot',
    about: 'many AIs, one garden', more: 'every answer, a branch',
    repo: 'dpatel7-dev/Tree-Of-Thought',
    grid: [
      '..........................',
      '...' + '.......LLLL.........' + '...', '...' + '.....LLHHLLLL.......' + '...', '...' + '....LHHLLLLLLL......' + '...', '...' + '...LLHLLLLLLLLl.....' + '...',
      '...' + '..LLLLLLLLLLLLLl....' + '...', '...' + '..LLLLLLLLLLLLll....' + '...', '...' + '.LLLLLLLLLLLLLLll...' + '...', '...' + '.lLLLLLLLLLLLLLll...' + '...',
      '...' + '..lLLLLLLLLLLLll....' + '...', '...' + '...llLLTTTTLLll.....' + '...', '...' + '.....lTTTTTTl.......' + '...', '...' + '......TETTET........' + '...',
      '...' + '......TTmmTT........' + '...', '...' + '......TTTTtT........' + '...', '...' + '.....TTTttTTT.......' + '...', '...' + 'GgGGTTTGGGGTTTGgG...' + '...',
    ],
    ink: { L: '#8fd16a', l: shade('#8fd16a', -0.32), H: shade('#8fd16a', 0.35), T: '#b88a62', t: shade('#b88a62', -0.3), E: '#1b1410', m: shade('#b88a62', -0.45), G: shade('#8fd16a', -0.15), g: shade('#8fd16a', -0.4) },
    mascot: 'Rowan',
  },
  {
    id: 'pigeon', name: 'pigeon', cmd: 'pigeon', folder: '.pigeon', color: '#2bc4b2', path: '/pigeon',
    about: 'your own locked drive', more: 'files fly to devices',
    repo: 'dpatel7-dev/pigeon',
    grid: [
      '..........................',
      '...' + '....................' + '...', '...' + '...........GGG......' + '...', '...' + '..........GGGGG.....' + '...', '...' + '..........GEKGGB....' + '...',
      '...' + '..........GGGGGBB...' + '...', '...' + '.........NnNGG......' + '...', '...' + '........NnNnN.......' + '...', '...' + '...GGGGGNnNnG.......' + '...',
      '...' + '..GGWWWWGGGGGG......' + '...', '...' + '.TGWWWWWWGGGGG......' + '...', '...' + 'TTGGWWWWWWGGGG......' + '...', '...' + 'TTTGGGGGGGGGG.......' + '...',
      '...' + '...TTGGGGGGG........' + '...', '...' + '.......F..F.........' + '...', '...' + '......FF.FF.........' + '...', '...' + '....................' + '...',
    ],
    ink: { G: '#8f9aab', W: '#c8d0dc', N: '#22b3a2', n: '#8a5cf6', E: '#ff8a3d', K: '#151a22', B: '#4a505c', F: '#ff8a3d', T: '#56606f' },
    mascot: 'Coo',
  },
  {
    id: 'tidy', name: 'tidy', cmd: 'tidy', folder: '.tidy', color: '#e8913a', path: '/tidy',
    about: 'an AI that tidies', more: 'plans first · undo',
    repo: 'dpatel7-dev/tidy',
    grid: [
      '..........................',
      '...' + '....................' + '...',
      '...' + '...TTTT.............' + '...',
      '...' + '..TTTTTT.....oO.oO..' + '...',
      '...' + '.TTTooTTT....OOOOOO.' + '...',
      '...' + '.TTo..oTT...OOOOOOO.' + '...',
      '...' + '.TTo...TT...OOEOOON.' + '...',
      '...' + '..To...TT..OOOOOOOO.' + '...',
      '...' + '...o..TTT..OOCCOOO..' + '...',
      '...' + '.....TTT..OOCCCC....' + '...',
      '...' + '....TTT.OOOOCCCaA...' + '...',
      '...' + '...TTT.OOOOOCCaaaA..' + '...',
      '...' + '...TT.OOOOOOCCaaaA..' + '...',
      '...' + '...TT.OOOOOOOCCaa...' + '...',
      '...' + '....TTOOOOOOOOCC....' + '...',
      '...' + '.....toOOOoo.oOOo...' + '...',
      '...' + '....tttoo....ooo....' + '...',
    ],
    ink: { O: '#d9823b', o: '#a2581f', T: '#eda865', t: '#c97a35', C: '#f3e0c2', E: '#1b1410', N: '#3a2418', A: '#6e4a2c', a: '#c99a58' },
    mascot: 'Hazel',
  },
  {
    id: 'den', name: 'den', cmd: 'den', folder: '.den', color: '#f0843c', path: '/den',
    about: 'a cozy code editor', more: 'Run · preview · help',
    repo: 'dpatel7-dev/Den',
    grid: [
      '..........................',
      '....K...............K.....',
      '....KK.............KK.....',
      '....KWK...........KWK.....',
      '....OWWO.........OWWO.....',
      '...OOOOOOOOOOOOOOOOOOO....',
      '...OOOOWEOOOOOOOWEOOOO....',
      '...WWOOEEOOOOOOOEEOOWW....',
      '....WWWOOOOOOOOOOOWWW.....',
      '.....WWWWWWWWWWWWWWW......',
      '.......WWWWWNWWWWW........',
      '.........WWWWWWW....OOo...',
      '........OOWWWWWOO..OOOWW..',
      '.......OOOOWWWWWOOOOOOWWW.',
      '.......OOOOOWWWOOOOOOWWWW.',
      '.......oOOOOOOOOOOOOOWWW..',
      '........KKK.oOOOo.KKKoW...',
    ],
    ink: { O: '#f0843c', o: '#c4602a', W: '#f6ead8', E: '#1b1410', N: '#2a1a12', K: '#4a2c1c' },
    mascot: 'Ember',
  },
];

const byId = (id) => APPS.find((a) => a.id === id || a.cmd === id || a.name === id || (id === 'tree' && a.id === 'tot') || (id === 'tree-of-thought' && a.id === 'tot'));

/** Where an app lives on this computer, and which version - or null if it isn't installed. */
function status(app) {
  const root = path.join(process.env.HOME || os.homedir(), app.folder);
  let version = null;
  try { version = JSON.parse(fs.readFileSync(path.join(root, 'app', 'package.json'), 'utf8')).version; } catch { /* not there */ }
  let launcher = null;
  try { launcher = fs.readFileSync(path.join(root, 'launcher'), 'utf8').trim(); } catch { /* not from an installer */ }
  if (launcher && !fs.existsSync(launcher)) launcher = null;
  const win = process.platform === 'win32';
  const winCmd = path.join(root, 'bin', app.cmd + '.cmd');
  if (!launcher && win && fs.existsSync(winCmd)) launcher = winCmd;
  return version ? { version, launcher, root } : null;
}

function installUrl(app, kind) {
  return `${site()}${app.path}/install.${kind}`;
}

/** The same installer, straight from GitHub (for when the website is down, blocked, or not updated yet). */
function githubUrl(app, kind) {
  return `https://raw.githubusercontent.com/${app.repo}/main/install.${kind}`;
}

/**
 * The command that installs (or updates) an app: from the website, and if
 * that doesn't work (blocked at school, a 404 because the site hasn't been
 * updated yet, offline), from GitHub instead. The script is downloaded in
 * full before it runs, so a half-finished download never runs.
 */
function installCommand(app, win = process.platform === 'win32') {
  const a = installUrl(app, win ? 'ps1' : 'sh');
  const b = githubUrl(app, win ? 'ps1' : 'sh');
  if (win) {
    return ['powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
      `try { $s = irm '${a}' } catch { Write-Host "  The website didn't answer, so this comes from GitHub instead."; $s = irm '${b}' }; iex $s`]];
  }
  return ['sh', ['-c', `s=$(curl -fsSL "${a}" 2>/dev/null) || { echo "  The website didn't answer, so this comes from GitHub instead." >&2; s=$(curl -fsSL "${b}") || exit 1; }; printf '%s\\n' "$s" | sh`]];
}

/** Install (or update - the installers do both) an app, showing the installer's own output. */
function install(app) {
  const [cmd, args] = installCommand(app);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  return r.status === 0;
}

/** Run an app in this terminal; resolves with its exit code when you leave it. */
function launch(app, args = []) {
  const st = status(app);
  const exe = (st && st.launcher) || app.cmd;
  return new Promise((resolve) => {
    const child = spawn(exe, args, { stdio: 'inherit', shell: process.platform === 'win32' && /\.cmd$/i.test(exe) });
    child.on('error', () => resolve(127));
    child.on('exit', (code) => resolve(code === null ? 0 : code));
  });
}

/** The newest section of an app's changelog (from GitHub), as plain text. */
async function changes(app, { timeout = 6000 } = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  try {
    const repo = app.repo || 'dpatel7-dev/Project-CLI-Access';
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/main/CHANGELOG.md`, { signal: ac.signal });
    if (!res.ok) throw new Error(`GitHub said ${res.status}`);
    const md = await res.text();
    const parts = md.split(/\n(?=## )/).filter((x) => /^## /.test(x));
    return (parts[0] || md).trim();
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'no answer' : e.message);
  } finally { clearTimeout(t); }
}

function uninstall(app) {
  const st = status(app);
  if (!st) return true;
  const r = spawnSync(st.launcher || app.cmd, ['uninstall'], { stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status === 0;
}

module.exports = { changes, installCommand, githubUrl, APPS, byId, status, install, launch, uninstall, site, home, installUrl, DEFAULT_SITE };

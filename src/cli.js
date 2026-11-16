'use strict';
// `pca` and its sub-commands.

const fs = require('fs');
const path = require('path');
const A = require('./ansi');
const Apps = require('./apps');
const pkg = require('../package.json');

const HELP = `
  Project CLI Access ${pkg.version} - one command for every project

  pca                     pick a project and open it (installs it first if needed)
  pca gossip [args]       open gossip            (also: pca tot, pca pigeon)
  pca list                what's installed
  pca install <name|all>  install a project      pca update [name|all]   get the newest
  pca remove <name>       uninstall a project    pca uninstall           remove pca itself
  pca --version

  Projects: ${Apps.APPS.map((a) => `${a.cmd} (${a.name})`).join(', ')}
`;

const say = (s = '') => process.stdout.write(s + '\n');

async function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === undefined) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) { say(HELP); return 0; }
    const { App } = require('./app');
    await new App().run();
    return 0;
  }
  if (cmd === '--version' || cmd === '-v' || cmd === 'version') { say(`project-cli-access ${pkg.version}`); return 0; }
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') { say(HELP); return 0; }
  if (cmd === 'list' || cmd === 'ls') {
    for (const a of Apps.APPS) {
      const st = Apps.status(a);
      say(`  ${A.paint('●', { fg: st ? a.color : '#555555' })} ${a.cmd.padEnd(8)} ${a.name.padEnd(17)} ${st ? `v${st.version}` : 'not installed'}`);
    }
    return 0;
  }
  if (cmd === 'install' || cmd === 'update') {
    const want = rest[0] || (cmd === 'update' ? 'all' : '');
    const list = want === 'all' ? Apps.APPS.filter((a) => cmd === 'install' || Apps.status(a)) : [Apps.byId(want)].filter(Boolean);
    if (!list.length) throw new Error(want ? `There's no project called "${want}". Try: pca list` : `Which one? pca ${cmd} <${Apps.APPS.map((a) => a.cmd).join('|')}|all>`);
    let ok = true;
    for (const a of list) { say(`\n  ── ${a.name} ──`); ok = Apps.install(a) && ok; }
    return ok ? 0 : 1;
  }
  if (cmd === 'remove') {
    const a = Apps.byId(rest[0] || '');
    if (!a) throw new Error('Which one? pca remove <name>');
    return Apps.uninstall(a) ? 0 : 1;
  }
  if (cmd === 'uninstall') {
    const root = Apps.home();
    let launcher = '';
    try { launcher = fs.readFileSync(path.join(root, 'launcher'), 'utf8').trim(); } catch { /* not from the installer */ }
    fs.rmSync(root, { recursive: true, force: true });
    if (launcher && /pca(\.cmd)?$/.test(launcher)) fs.rmSync(launcher, { force: true });
    say('  Project CLI Access is uninstalled. (The projects themselves are still here: pca was only the doorway.)');
    return 0;
  }
  const app = Apps.byId(cmd);
  if (!app) throw new Error(`"${cmd}" isn't a project or a pca command. Try: pca help`);
  if (!Apps.status(app)) {
    say(`  ${app.name} isn't installed yet - installing it now.`);
    if (!Apps.install(app)) return 1;
  }
  return Apps.launch(app, rest);
}

module.exports = { main, HELP };

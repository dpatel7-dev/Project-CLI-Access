'use strict';
// `pca` and its sub-commands.

const fs = require('fs');
const path = require('path');
const A = require('./ansi');
const Apps = require('./apps');
const U = require('./updates');
const pkg = require('../package.json');

const HELP = `
  Project CLI Access ${pkg.version} - one command for every project

  pca                     pick a project and open it (installs it first if needed)
  pca gossip [args]       open gossip            (also: pca tot, pca pigeon, pca tidy)
  pca list                what's installed
  pca install <name|all>  install a project      pca update [name]       get the newest now
  pca remove <name>       uninstall a project    pca uninstall           remove pca itself
  pca auto on|off         update by itself when it starts (on unless you turn it off)
  pca auto daily|nodaily  also update once a day, even when pca isn't opened
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
  if (cmd === 'auto') {
    const what = rest[0];
    if (what === 'on' || what === 'off') { U.setAuto(what === 'on'); say(`  Updating by itself is ${what}.`); return 0; }
    if (what === 'daily' || what === 'nodaily') { say('  ' + U.daily(what === 'daily')); return 0; }
    say(`  Updating by itself is ${U.autoOn() ? 'on' : 'off'}. (pca auto on|off|daily|nodaily)`);
    return 0;
  }
  if (cmd === 'update' && (!rest[0] || rest[0] === 'all' || rest[0] === '--quiet')) {
    const quiet = rest.includes('--quiet');
    const list = await U.check({ force: true, timeout: 8000 });
    if (!list.length) { if (!quiet) say('  Everything is up to date.'); else say(`${new Date().toISOString()} up to date`); return 0; }
    let ok = true;
    for (const u of list) {
      say(`  ${quiet ? new Date().toISOString() + ' ' : ''}Updating ${u.app.name} ${u.have} → ${u.want}`);
      const done = quiet ? await U.quietInstall(u.app) : Apps.install(u.app);
      ok = done && ok;
    }
    return ok ? 0 : 1;
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
  } else if (U.autoOn()) {
    try {
      const u = (await U.check()).find((x) => x.app.id === app.id);
      if (u) {
        process.stdout.write(`  Updating ${app.name} to ${u.want}…`);
        const ok = await U.quietInstall(app);
        say(ok ? ' done.' : ' (couldn\'t right now, opening the one you have).');
      }
    } catch { /* offline: open what's here */ }
  }
  return Apps.launch(app, rest);
}

module.exports = { main, HELP };

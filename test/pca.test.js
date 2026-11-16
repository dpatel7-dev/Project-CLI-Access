'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PassThrough } = require('stream');
const { execFileSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin', 'pca.js');

function fakeHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pca-'));
  process.env.HOME = home;
  process.env.PCA_HOME = path.join(home, '.pca');
  return home;
}

function plant(home, folder, cmd, version, script) {
  fs.mkdirSync(path.join(home, folder, 'app'), { recursive: true });
  fs.writeFileSync(path.join(home, folder, 'app', 'package.json'), JSON.stringify({ version }));
  const exe = path.join(home, 'bin', cmd);
  fs.mkdirSync(path.dirname(exe), { recursive: true });
  fs.writeFileSync(exe, `#!/bin/sh\n${script}\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(home, folder, 'launcher'), exe + '\n');
  return exe;
}

test('knows what is installed and where installs come from', () => {
  const home = fakeHome();
  delete require.cache[require.resolve('../src/apps')];
  const Apps = require('../src/apps');
  assert.strictEqual(Apps.APPS.length, 3);
  assert.strictEqual(Apps.status(Apps.byId('tot')), null);
  plant(home, '.tot', 'tot', '1.2.3', 'exit 0');
  const st = Apps.status(Apps.byId('tree'));
  assert.strictEqual(st.version, '1.2.3');
  assert.ok(st.launcher.endsWith('/bin/tot'));
  assert.strictEqual(Apps.installUrl(Apps.byId('pigeon'), 'sh'), 'https://djp7.pythonanywhere.com/pigeon/install.sh');
  assert.strictEqual(Apps.installUrl(Apps.byId('gossip'), 'ps1'), 'https://djp7.pythonanywhere.com/install.ps1');
  fs.mkdirSync(path.join(home, '.pca'), { recursive: true });
  fs.writeFileSync(path.join(home, '.pca', 'hub'), 'http://localhost:9/\n');
  assert.strictEqual(Apps.installUrl(Apps.byId('tot'), 'sh'), 'http://localhost:9/tot/install.sh');
  for (const a of Apps.APPS) for (const row of a.grid) for (const ch of row) assert.ok(ch === '.' || ch === ' ' || a.ink[ch], `${a.id} has ink for ${ch}`);
});

test('the command line lists, launches and passes arguments through', () => {
  const home = fakeHome();
  const out = path.join(home, 'ran.txt');
  plant(home, '.pigeon', 'pigeon', '1.0.0', `echo "pigeon $*" > "${out}"; exit 3`);
  const env = { ...process.env, HOME: home, PCA_HOME: path.join(home, '.pca'), NO_COLOR: '1' };
  const list = execFileSync('node', [BIN, 'list'], { env, encoding: 'utf8' });
  assert.match(list, /pigeon\s+pigeon\s+v1\.0\.0/);
  assert.match(list, /tot\s+tree of thought\s+not installed/);
  let code = 0;
  try { execFileSync('node', [BIN, 'pigeon', 'send', 'a b.png'], { env, stdio: 'ignore' }); } catch (e) { code = e.status; }
  assert.strictEqual(code, 3, 'exit code comes back from the project');
  assert.strictEqual(fs.readFileSync(out, 'utf8').trim(), 'pigeon send a b.png');
  assert.match(execFileSync('node', [BIN, '--version'], { env, encoding: 'utf8' }), /project-cli-access \d+\.\d+\.\d+/);
  let err = '';
  try { execFileSync('node', [BIN, 'nope'], { env, stdio: 'pipe' }); } catch (e) { err = String(e.stderr); }
  assert.match(err, /isn't a project/);
});

test('the picker draws every project and opens the chosen one', async () => {
  const home = fakeHome();
  const out = path.join(home, 'ran.txt');
  plant(home, '.gossip', 'gossip', '0.9.0', `echo gossip > "${out}"`);
  plant(home, '.tot', 'tot', '1.0.0', `echo tot > "${out}"`);
  delete require.cache[require.resolve('../src/apps')];
  delete require.cache[require.resolve('../src/app')];
  const { App } = require('../src/app');
  const input = new PassThrough();
  input.isTTY = true; input.setRawMode = () => input;
  const output = new PassThrough();
  output.isTTY = true; output.columns = 110; output.rows = 32;
  let screen = '';
  output.on('data', (d) => { screen += d.toString(); });
  const app = new App({ input, output });
  const done = app.run();
  await new Promise((r) => setTimeout(r, 150));
  const plain = screen.replace(/\x1b\[[0-9;?]*[A-Za-z]|\x1b\][^\x07]*\x07/g, '');
  for (const word of ['gossip', 'tree of thought', 'pigeon', 'v0.9.0', 'not installed yet']) assert.ok(plain.includes(word), `shows ${word}`);
  input.write('\x1b[C'); // → tree of thought
  await new Promise((r) => setTimeout(r, 50));
  input.write('\r');
  for (let i = 0; i < 40 && !fs.existsSync(out); i++) await new Promise((r) => setTimeout(r, 50));
  assert.strictEqual(fs.readFileSync(out, 'utf8').trim(), 'tot');
  await new Promise((r) => setTimeout(r, 100));
  input.write('q');
  await done;
});

test('keeps everything up to date: finds what is behind and updates it quietly', async () => {
  const home = fakeHome();
  plant(home, '.tot', 'tot', '1.0.0', 'exit 0');
  plant(home, '.pigeon', 'pigeon', '2.0.0', 'exit 0');
  // a pretend website: newest versions, and a tot installer that "installs" 1.1.0
  const http = require('http');
  const server = http.createServer((req, res) => {
    if (req.url === '/versions.json') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ gossip: '0.9.0', tot: '1.1.0', pigeon: '2.0.0', pca: '1.0.0' })); }
    if (req.url === '/tot/install.sh') { res.writeHead(200); return res.end(`echo "Downloading Tree of Thought"\nprintf '{"version":"1.1.0"}' > "$HOME/.tot/app/package.json"\necho Done\n`); }
    res.writeHead(404); res.end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  process.env.PCA_SITE = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const m of ['../src/apps', '../src/updates']) delete require.cache[require.resolve(m)];
    const U = require('../src/updates');
    assert.ok(U.newer('1.10.0', '1.9.2') && !U.newer('1.0.0', '1.0.0') && !U.newer('0.9.0', '1.0.0'));
    const behind = await U.check({ force: true });
    assert.deepEqual(behind.map((u) => [u.app.id, u.have, u.want]), [['tot', '1.0.0', '1.1.0']], 'pca itself and pigeon are current');
    const lines = [];
    assert.equal(await U.quietInstall(behind[0].app, (l) => lines.push(l)), true);
    assert.deepEqual(lines, ['Downloading Tree of Thought', 'Done']);
    assert.equal((await U.check({ force: true })).length, 0, 'nothing left to do');
    U.setAuto(false);
    assert.equal(U.autoOn(), false);
    U.setAuto(true);
  } finally {
    delete process.env.PCA_SITE;
    server.close();
  }
});

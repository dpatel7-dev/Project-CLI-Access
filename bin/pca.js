#!/usr/bin/env node
'use strict';

// Keep this first check in plain old JavaScript so even an ancient Node can run it.
var major = parseInt(process.versions.node.split('.')[0], 10);
if (major < 18) {
  console.error('Project CLI Access needs Node.js 18 or newer (this is ' + process.versions.node + ').');
  process.exit(1);
}

require('../src/cli').main(process.argv.slice(2)).then(function (code) {
  if (typeof code === 'number') process.exitCode = code;
}, function (e) {
  console.error('\n  ' + ((e && e.message) || e) + '\n');
  process.exit(1);
});

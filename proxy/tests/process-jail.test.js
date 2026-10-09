'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ProcessJail } = require('../src/workflow/process-jail');

test('ProcessJail - runs simple command and captures stdout', async () => {
  const jail = new ProcessJail();
  const res = await jail.run('node', ['-e', 'console.log("hello-jail")'], { shell: false });

  assert.equal(res.exitCode, 0);
  assert.equal(res.timedOut, false);
  assert.match(res.stdout, /hello-jail/);
});

test('ProcessJail - captures non-zero exit code', async () => {
  const jail = new ProcessJail();
  const res = await jail.run('node', ['-e', 'process.exit(42)'], { shell: false });

  assert.equal(res.exitCode, 42);
  assert.equal(res.timedOut, false);
});

test('ProcessJail - terminates child process on timeout', async () => {
  const jail = new ProcessJail({ defaultTimeoutMs: 150, gracePeriodMs: 50 });
  const res = await jail.run('node', ['-e', 'setInterval(() => {}, 1000)'], {
    shell: false,
    timeoutMs: 150
  });

  assert.equal(res.timedOut, true);
  assert.equal(res.killed, true);
});

test('ProcessJail - tracks active jails and killAll terminates them', async () => {
  const jail1 = new ProcessJail();
  const jailPromise = jail1.run('node', ['-e', 'setInterval(() => {}, 1000)'], { shell: false });

  await new Promise(r => setTimeout(r, 100));

  const active = ProcessJail.getActiveJails();
  assert.ok(active.length >= 1);
  assert.ok(active.some(j => j.jailId === jail1.jailId));

  const killedCount = ProcessJail.killAll('SIGKILL');
  assert.ok(killedCount >= 1);

  const res = await jailPromise;
  assert.equal(res.killed, true);
});

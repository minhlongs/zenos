'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ConcurrencyGate, QueueOverloadError, QueueTimeoutError } = require('../src/queue');

describe('ConcurrencyGate & Admission Control', () => {
  it('executes tasks sequentially in FIFO order when concurrency = 1', async () => {
    const gate = new ConcurrencyGate({ concurrency: 1, maxQueueDepth: 5 });
    const order = [];

    const task1 = () => new Promise(resolve => {
      setTimeout(() => { order.push(1); resolve(1); }, 40);
    });
    const task2 = () => new Promise(resolve => {
      setTimeout(() => { order.push(2); resolve(2); }, 10);
    });
    const task3 = () => new Promise(resolve => {
      setTimeout(() => { order.push(3); resolve(3); }, 5);
    });

    const p1 = gate.enqueue(task1);
    const p2 = gate.enqueue(task2);
    const p3 = gate.enqueue(task3);

    const results = await Promise.all([p1, p2, p3]);
    assert.deepEqual(results, [1, 2, 3]);
    assert.deepEqual(order, [1, 2, 3]);
    assert.equal(gate.getMetrics().running, 0);
    assert.equal(gate.getMetrics().queued, 0);
  });

  it('rejects with QueueOverloadError when maxQueueDepth is exceeded', async () => {
    const gate = new ConcurrencyGate({ concurrency: 1, maxQueueDepth: 1 });
    let releaseFirst;
    const blockingTask = () => new Promise(res => { releaseFirst = res; });

    const p1 = gate.enqueue(blockingTask);
    const p2 = gate.enqueue(() => Promise.resolve('ok'));

    await assert.rejects(
      async () => gate.enqueue(() => Promise.resolve('overflow')),
      QueueOverloadError
    );

    releaseFirst('done');
    await Promise.all([p1, p2]);
    assert.equal(gate.getMetrics().queued, 0);
  });

  it('bypasses queue when bypass option is set or concurrency <= 0', async () => {
    const gate = new ConcurrencyGate({ concurrency: 1, maxQueueDepth: 1 });
    let releaseFirst;
    const blockingTask = () => new Promise(res => { releaseFirst = res; });

    const p1 = gate.enqueue(blockingTask);
    const bypassResult = await gate.enqueue(() => Promise.resolve('bypassed'), null, { bypass: true });

    assert.equal(bypassResult, 'bypassed');
    releaseFirst('done');
    await p1;
  });

  it('cleans up queued task when clientSignal aborts before execution', async () => {
    const gate = new ConcurrencyGate({ concurrency: 1, maxQueueDepth: 5 });
    let releaseFirst;
    const blockingTask = () => new Promise(res => { releaseFirst = res; });

    const p1 = gate.enqueue(blockingTask);

    const controller = new AbortController();
    let task2Ran = false;
    const task2 = () => { task2Ran = true; return Promise.resolve('t2'); };

    const p2 = gate.enqueue(task2, controller.signal);
    assert.equal(gate.getMetrics().queued, 1);

    controller.abort(new Error('Client disconnected'));

    await assert.rejects(p2, (err) => {
      assert.equal(err.name, 'AbortError');
      return true;
    });

    assert.equal(gate.getMetrics().queued, 0);

    releaseFirst('done');
    await p1;
    assert.equal(task2Ran, false);
  });

  it('rejects with QueueTimeoutError when task exceeds queueTimeoutMs in queue', async () => {
    const gate = new ConcurrencyGate({ concurrency: 1, maxQueueDepth: 5, queueTimeoutMs: 25 });
    let releaseFirst;
    const blockingTask = () => new Promise(res => { releaseFirst = res; });

    const p1 = gate.enqueue(blockingTask);
    const p2 = gate.enqueue(() => Promise.resolve('should timeout'));

    await assert.rejects(p2, QueueTimeoutError);

    releaseFirst('done');
    await p1;
  });
});

'use strict';

class QueueOverloadError extends Error {
  constructor(message = 'Inference queue is full. Too many concurrent requests.') {
    super(message);
    this.name = 'QueueOverloadError';
    this.status = 503;
  }
}

class QueueTimeoutError extends Error {
  constructor(message = 'Request timed out waiting in admission control queue.') {
    super(message);
    this.name = 'QueueTimeoutError';
    this.status = 504;
  }
}

class ConcurrencyGate {
  constructor(options = {}) {
    this.concurrency = typeof options.concurrency === 'number' ? options.concurrency : 1;
    this.maxQueueDepth = typeof options.maxQueueDepth === 'number' ? options.maxQueueDepth : 10;
    this.queueTimeoutMs = typeof options.queueTimeoutMs === 'number' ? options.queueTimeoutMs : 60000;
    this.runningCount = 0;
    this.waitingQueue = [];
  }

  getMetrics() {
    return {
      running: this.runningCount,
      queued: this.waitingQueue.length,
      concurrency: this.concurrency,
      maxQueueDepth: this.maxQueueDepth
    };
  }

  async enqueue(taskFn, clientSignal = null, options = {}) {
    // Bypass queue if concurrency <= 0 or bypass requested
    if (this.concurrency <= 0 || (options && options.bypass)) {
      return taskFn();
    }

    if (this.runningCount < this.concurrency) {
      return this._execute(taskFn);
    }

    if (this.waitingQueue.length >= this.maxQueueDepth) {
      throw new QueueOverloadError();
    }

    return new Promise((resolve, reject) => {
      let timeoutId = null;
      let abortHandler = null;

      const item = {
        taskFn,
        resolve,
        reject,
        cleanup: () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (clientSignal && abortHandler) {
            clientSignal.removeEventListener('abort', abortHandler);
          }
        }
      };

      if (this.queueTimeoutMs > 0) {
        timeoutId = setTimeout(() => {
          this._removeFromQueue(item);
          item.cleanup();
          reject(new QueueTimeoutError());
        }, this.queueTimeoutMs);
      }

      if (clientSignal) {
        if (clientSignal.aborted) {
          item.cleanup();
          const err = new Error('Client aborted');
          err.name = 'AbortError';
          return reject(err);
        }
        abortHandler = () => {
          this._removeFromQueue(item);
          item.cleanup();
          const err = new Error('Client aborted');
          err.name = 'AbortError';
          reject(err);
        };
        clientSignal.addEventListener('abort', abortHandler, { once: true });
      }

      this.waitingQueue.push(item);
    });
  }

  _removeFromQueue(item) {
    const idx = this.waitingQueue.indexOf(item);
    if (idx !== -1) {
      this.waitingQueue.splice(idx, 1);
    }
  }

  async _execute(taskFn) {
    this.runningCount++;
    try {
      return await taskFn();
    } finally {
      this.runningCount--;
      this._drain();
    }
  }

  _drain() {
    if (this.runningCount >= this.concurrency || this.waitingQueue.length === 0) {
      return;
    }

    const nextItem = this.waitingQueue.shift();
    if (!nextItem) return;

    nextItem.cleanup();
    this._execute(nextItem.taskFn)
      .then(nextItem.resolve, nextItem.reject);
  }
}

module.exports = {
  ConcurrencyGate,
  QueueOverloadError,
  QueueTimeoutError
};

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BENCHMARKS = [
  {
    id: 'bug_sort_null',
    title: 'Numeric Sorter with Null Safety',
    category: 'bugfix',
    task: 'Fix sortNumbers so it sorts ascending while pushing null and undefined to the end.',
    targetFile: 'sorter.js',
    setupFiles: [
      {
        path: 'sorter.js',
        content: `function sortNumbers(arr) {
  return arr.sort();
}
module.exports = { sortNumbers };`
      },
      {
        path: 'test.js',
        content: `const assert = require('node:assert');
const { test } = require('node:test');
const { sortNumbers } = require('./sorter.js');

test('sorts numbers ascending with nulls at end', () => {
  const input = [10, null, 2, undefined, 5, 1];
  const expected = [1, 2, 5, 10, null, undefined];
  assert.deepStrictEqual(sortNumbers(input), expected);
});`
      }
    ]
  },
  {
    id: 'api_request_validator',
    title: 'JSON API Request Validator',
    category: 'api',
    task: 'Implement validateRequest(schema, body) returning { valid: boolean, errors?: string[] }',
    targetFile: 'validator.js',
    setupFiles: [
      {
        path: 'validator.js',
        content: `function validateRequest(schema, body) {
  return { valid: true };
}
module.exports = { validateRequest };`
      },
      {
        path: 'test.js',
        content: `const assert = require('node:assert');
const { test } = require('node:test');
const { validateRequest } = require('./validator.js');

test('validates required fields and types', () => {
  const schema = { name: 'string', age: 'number' };
  const ok = validateRequest(schema, { name: 'Alice', age: 30 });
  assert.strictEqual(ok.valid, true);

  const fail = validateRequest(schema, { name: 'Bob', age: 'invalid' });
  assert.strictEqual(fail.valid, false);
  assert.ok(fail.errors && fail.errors.length > 0);
});`
      }
    ]
  },
  {
    id: 'refactor_loc_guard',
    title: 'Conditional Complexity Flattener',
    category: 'refactor',
    task: 'Flatten calculateDiscount into a modular, clean function with early returns under 25 LOC.',
    targetFile: 'discount.js',
    setupFiles: [
      {
        path: 'discount.js',
        content: `function calculateDiscount(user, tier, cartTotal) {
  let discount = 0;
  if (user) {
    if (user.isMember) {
      if (tier === 'VIP') {
        if (cartTotal > 100) { discount = 0.25; } else { discount = 0.15; }
      } else { discount = 0.05; }
    }
  }
  return discount;
}
module.exports = { calculateDiscount };`
      },
      {
        path: 'test.js',
        content: `const assert = require('node:assert');
const { test } = require('node:test');
const { calculateDiscount } = require('./discount.js');

test('calculates correct discounts', () => {
  assert.strictEqual(calculateDiscount({ isMember: true }, 'VIP', 150), 0.25);
  assert.strictEqual(calculateDiscount({ isMember: true }, 'VIP', 50), 0.15);
  assert.strictEqual(calculateDiscount({ isMember: true }, 'REGULAR', 50), 0.05);
  assert.strictEqual(calculateDiscount(null, 'VIP', 500), 0);
});`
      }
    ]
  },
  {
    id: 'json_transform_stream',
    title: 'Nested JSON Flattener',
    category: 'transform',
    task: 'Implement flattenObject(obj) which converts nested keys to dot-notation keys.',
    targetFile: 'flatten.js',
    setupFiles: [
      {
        path: 'flatten.js',
        content: `function flattenObject(obj) {
  return obj;
}
module.exports = { flattenObject };`
      },
      {
        path: 'test.js',
        content: `const assert = require('node:assert');
const { test } = require('node:test');
const { flattenObject } = require('./flatten.js');

test('flattens nested object keys', () => {
  const input = { a: 1, b: { c: 2, d: { e: 3 } } };
  const expected = { a: 1, 'b.c': 2, 'b.d.e': 3 };
  assert.deepStrictEqual(flattenObject(input), expected);
});`
      }
    ]
  }
];

class EvalBenchmarkSuite {
  constructor(benchmarks = BENCHMARKS) {
    this.benchmarks = benchmarks;
  }

  list() {
    return this.benchmarks.map(b => ({
      id: b.id,
      title: b.title,
      category: b.category,
      task: b.task,
      targetFile: b.targetFile
    }));
  }

  get(id) {
    return this.benchmarks.find(b => b.id === id) || null;
  }

  createWorkspace(id, targetDir) {
    const benchmark = this.get(id);
    if (!benchmark) throw new Error(`Benchmark ${id} not found`);

    fs.mkdirSync(targetDir, { recursive: true });
    for (const file of benchmark.setupFiles) {
      const fullPath = path.resolve(targetDir, file.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, file.content, 'utf8');
    }
    return { benchmark, targetDir };
  }
}

module.exports = { EvalBenchmarkSuite, BENCHMARKS };

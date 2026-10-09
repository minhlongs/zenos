'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { validatePath, isPathAllowed } = require('../src/path-guard');

describe('Workspace Path Jail (Gate 4)', () => {
  const tmpRoot = path.join(os.tmpdir(), 'zenos-path-guard-test');
  const allowedRoots = [tmpRoot];

  it('allows paths within allowed roots', () => {
    const valid = path.join(tmpRoot, 'src', 'index.js');
    const result = validatePath(valid, allowedRoots);
    assert.equal(typeof result, 'string');
    assert.equal(isPathAllowed(valid, allowedRoots), true);
  });

  it('rejects path traversal attempts with ../', () => {
    const malicious = path.join(tmpRoot, '..', '..', 'etc', 'passwd');
    assert.equal(isPathAllowed(malicious, allowedRoots), false);
    assert.throws(() => {
      validatePath(malicious, allowedRoots);
    }, /outside allowed workspace roots/);
  });

  it('rejects access to sensitive system paths regardless of roots', () => {
    const sensitive = ['/etc/passwd', '/var/run/docker.sock', path.join(os.homedir(), '.ssh', 'id_rsa')];
    for (const p of sensitive) {
      assert.equal(isPathAllowed(p, allowedRoots), false);
      assert.throws(() => {
        validatePath(p, allowedRoots);
      }, /Access to sensitive path denied/);
    }
  });

  it('detects symlink jail escape when file points outside allowed roots', () => {
    const workDir = path.join(tmpRoot, 'symlink-test');
    fs.mkdirSync(workDir, { recursive: true });
    const outsideTarget = path.join(os.tmpdir(), 'outside-target.txt');
    fs.writeFileSync(outsideTarget, 'outside data');
    const symlinkPath = path.join(workDir, 'link-out');

    try {
      if (fs.existsSync(symlinkPath)) fs.unlinkSync(symlinkPath);
      fs.symlinkSync(outsideTarget, symlinkPath);

      // Allowed roots only include workDir
      assert.equal(isPathAllowed(symlinkPath, [workDir]), false);
      assert.throws(() => {
        validatePath(symlinkPath, [workDir]);
      }, /Path resolves outside allowed workspace roots/);
    } finally {
      try { fs.unlinkSync(symlinkPath); } catch {}
      try { fs.unlinkSync(outsideTarget); } catch {}
      try { fs.rmSync(workDir, { recursive: true }); } catch {}
    }
  });
});

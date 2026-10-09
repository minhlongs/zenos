'use strict';

const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');

class SwarmBlackboard {
  constructor(db) {
    if (!db) {
      this.db = new DatabaseSync(':memory:');
    } else if (typeof db === 'string') {
      this.db = new DatabaseSync(db);
    } else {
      this.db = db;
    }
    this.initTables();
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS swarm_sessions (
        id TEXT PRIMARY KEY,
        objective TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PLANNING',
        current_role TEXT DEFAULT 'PLANNER',
        current_round INTEGER NOT NULL DEFAULT 1,
        max_rounds INTEGER NOT NULL DEFAULT 3,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS swarm_artifacts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        artifact_type TEXT NOT NULL,
        content TEXT NOT NULL,
        round INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES swarm_sessions(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS swarm_consensus (
        session_id TEXT PRIMARY KEY,
        verifier_pass INTEGER NOT NULL DEFAULT 0,
        auditor_pass INTEGER NOT NULL DEFAULT 0,
        verdict TEXT NOT NULL DEFAULT 'PENDING',
        notes TEXT DEFAULT '',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES swarm_sessions(id) ON DELETE CASCADE
      );
    `);
  }

  _formatSession(session) {
    if (!session) return null;
    return {
      id: session.id,
      objective: session.objective,
      status: session.status,
      current_role: session.current_role,
      current_round: session.current_round,
      max_rounds: session.max_rounds,
      created_at: session.created_at,
      updated_at: session.updated_at,
      currentRole: session.current_role,
      currentRound: session.current_round,
      maxRounds: session.max_rounds,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    };
  }

  createSession({ id, objective, maxRounds = 3 } = {}) {
    const sessionId = id || crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO swarm_sessions (id, objective, status, current_role, current_round, max_rounds, created_at, updated_at)
      VALUES (?, ?, 'PLANNING', 'PLANNER', 1, ?, ?, ?)
    `).run(sessionId, objective || '', maxRounds, now, now);
    return this.getSession(sessionId);
  }

  getSession(id) {
    const session = this.db.prepare('SELECT * FROM swarm_sessions WHERE id = ?').get(id);
    if (!session) return null;
    return {
      ...this._formatSession(session),
      artifacts: this.getArtifacts(id),
      consensus: this.getConsensus(id)
    };
  }

  updateSessionStatus(id, status, currentRole, currentRound) {
    let s = typeof status === 'object' && status !== null ? status.status : status;
    let r = typeof status === 'object' && status !== null ? status.currentRole : currentRole;
    let rnd = typeof status === 'object' && status !== null ? status.currentRound : currentRound;
    const session = this.db.prepare('SELECT * FROM swarm_sessions WHERE id = ?').get(id);
    if (!session) return null;

    const newStatus = s || session.status;
    const newRole = r !== undefined ? r : session.current_role;
    const newRound = rnd !== undefined ? rnd : session.current_round;
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE swarm_sessions SET status = ?, current_role = ?, current_round = ?, updated_at = ? WHERE id = ?
    `).run(newStatus, newRole, newRound, now, id);
    return this.getSession(id);
  }

  postArtifact({ sessionId, role, artifactType, content, round = 1 } = {}) {
    if (!sessionId) throw new Error('sessionId is required to post artifact');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    this.db.prepare(`
      INSERT INTO swarm_artifacts (id, session_id, role, artifact_type, content, round, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, sessionId, role || 'UNKNOWN', artifactType || 'SPEC', contentStr, round, now);
    return { id, sessionId, role: role || 'UNKNOWN', artifactType: artifactType || 'SPEC', content: contentStr, round, createdAt: now };
  }

  getArtifacts(sessionId, artifactType) {
    const query = artifactType
      ? 'SELECT * FROM swarm_artifacts WHERE session_id = ? AND artifact_type = ? ORDER BY round ASC, created_at ASC'
      : 'SELECT * FROM swarm_artifacts WHERE session_id = ? ORDER BY round ASC, created_at ASC';
    const rows = artifactType ? this.db.prepare(query).all(sessionId, artifactType) : this.db.prepare(query).all(sessionId);
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      role: r.role,
      artifactType: r.artifact_type,
      content: r.content,
      round: r.round,
      createdAt: r.created_at
    }));
  }

  recordConsensus({ sessionId, verifierPass = false, auditorPass = false, verdict = 'PENDING', notes = '' } = {}) {
    if (!sessionId) throw new Error('sessionId is required to record consensus');
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO swarm_consensus (session_id, verifier_pass, auditor_pass, verdict, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        verifier_pass = excluded.verifier_pass,
        auditor_pass = excluded.auditor_pass,
        verdict = excluded.verdict,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run(sessionId, verifierPass ? 1 : 0, auditorPass ? 1 : 0, verdict, notes || '', now);
    return this.getConsensus(sessionId);
  }

  getConsensus(sessionId) {
    const row = this.db.prepare('SELECT * FROM swarm_consensus WHERE session_id = ?').get(sessionId);
    if (!row) return null;
    return {
      sessionId: row.session_id,
      session_id: row.session_id,
      verifierPass: Boolean(row.verifier_pass),
      verifier_pass: row.verifier_pass,
      auditorPass: Boolean(row.auditor_pass),
      auditor_pass: row.auditor_pass,
      verdict: row.verdict,
      notes: row.notes,
      updatedAt: row.updated_at,
      updated_at: row.updated_at
    };
  }

  listSessions(limit = 20) {
    const rows = this.db.prepare('SELECT * FROM swarm_sessions ORDER BY created_at DESC LIMIT ?').all(limit);
    return rows.map((r) => this._formatSession(r));
  }
}

module.exports = { SwarmBlackboard };

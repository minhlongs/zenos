'use strict';

const crypto = require('node:crypto');

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

class ApprovalGate {
  constructor(defaultTtlSeconds = 300) {
    this.defaultTtl = defaultTtlSeconds;
    this.requests = new Map();
  }

  createRequest({ action, command = null, context = null, ttlSeconds = null }) {
    const id = `appr_${crypto.randomUUID()}`;
    const token = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const ttl = (ttlSeconds !== null && ttlSeconds !== undefined) ? ttlSeconds : this.defaultTtl;
    const expiresAt = now + (ttl * 1000);

    const record = {
      id,
      token,
      action,
      command,
      context,
      status: APPROVAL_STATUS.PENDING,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      expiresAtMs: expiresAt,
      decidedAt: null,
      decidedBy: null
    };

    this.requests.set(id, record);
    return { ...record };
  }

  getStatus(id) {
    const record = this.requests.get(id);
    if (!record) return null;

    if (record.status === APPROVAL_STATUS.PENDING && Date.now() > record.expiresAtMs) {
      record.status = APPROVAL_STATUS.EXPIRED;
    }

    return { ...record };
  }

  resolve(id, { token, approved, decidedBy = 'operator' }) {
    const record = this.requests.get(id);
    if (!record) throw new Error(`Approval request not found: ${id}`);

    if (record.status === APPROVAL_STATUS.PENDING && Date.now() > record.expiresAtMs) {
      record.status = APPROVAL_STATUS.EXPIRED;
      throw new Error(`Approval request has expired: ${id}`);
    }

    if (record.status !== APPROVAL_STATUS.PENDING) {
      throw new Error(`Approval request is already resolved (${record.status}): ${id}`);
    }

    if (record.token !== token) {
      throw new Error(`Invalid approval token for request: ${id}`);
    }

    record.status = approved ? APPROVAL_STATUS.APPROVED : APPROVAL_STATUS.REJECTED;
    record.decidedAt = new Date().toISOString();
    record.decidedBy = decidedBy;

    return { ...record };
  }

  isApproved(id) {
    const status = this.getStatus(id);
    return status ? status.status === APPROVAL_STATUS.APPROVED : false;
  }

  listActive() {
    const now = Date.now();
    const list = [];
    for (const [id, rec] of this.requests.entries()) {
      if (rec.status === APPROVAL_STATUS.PENDING && now > rec.expiresAtMs) {
        rec.status = APPROVAL_STATUS.EXPIRED;
      }
      list.push({ ...rec });
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

module.exports = {
  ApprovalGate,
  APPROVAL_STATUS
};

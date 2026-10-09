'use strict';
const express = require('express');
const { getDashboardHtml } = require('./dashboard-html');

function createDashboardRouter({ telemetry, approvalGate }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(getDashboardHtml());
  });

  router.get('/api/overview', (req, res) => {
    const summary = telemetry ? telemetry.getSummary() : null;
    const approvals = approvalGate ? approvalGate.listActive() : [];
    return res.json({
      telemetry: summary,
      approvals
    });
  });

  return router;
}

module.exports = { createDashboardRouter };

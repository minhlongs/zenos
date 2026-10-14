'use strict';

const { getDashboardClientScript } = require('./dashboard-client-script');

function getDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZenOS Operational Dashboard</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #131a2a;
      --border: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h1 { font-size: 20px; font-weight: 700; color: var(--accent); }
    .badge { background: #064e3b; color: #34d399; padding: 4px 10px; border-radius: 9999px; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
    .card-title { font-size: 13px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
    .card-val { font-size: 28px; font-weight: 700; }
    .section-title { font-size: 16px; font-weight: 600; margin: 24px 0 12px; color: var(--text); }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); }
    .btn { padding: 4px 10px; border-radius: 4px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; }
    .btn-approve { background: var(--success); color: #fff; }
    .btn-reject { background: var(--danger); color: #fff; margin-left: 6px; }
    #events-log { font-family: monospace; font-size: 12px; max-height: 180px; overflow-y: auto; background: #0b1120; padding: 12px; border-radius: 6px; border: 1px solid var(--border); }
    .event-line { padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  </style>
</head>
<body>
  <div class="header">
    <h1>ZenOS Operational Dashboard</h1>
    <div>
      <span class="badge" style="background:#0f2b1d;color:#34d399;margin-right:6px;">Metal: Safe (1)</span>
      <span class="badge" id="conn-status">SSE Connected</span>
      <button class="btn btn-reject" onclick="killAllJails()" title="Emergency kill detached process groups">Kill All Jails</button>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Supervisor Jails</div>
      <div class="card-val" id="active-jails" style="color:var(--accent);">0 PGID</div>
    </div>
    <div class="card">
      <div class="card-title">Total Requests</div>
      <div class="card-val" id="total-req">0</div>
    </div>
    <div class="card">
      <div class="card-title">Active Requests</div>
      <div class="card-val" id="active-req">0</div>
    </div>
    <div class="card">
      <div class="card-title">Latency (p50 / p95)</div>
      <div class="card-val" id="latency-stats">0ms / 0ms</div>
    </div>
    <div class="card">
      <div class="card-title">Error Rate</div>
      <div class="card-val" id="error-rate">0.0%</div>
    </div>
  </div>

  <div class="section-title">Approval Queue (Human Interlocks)</div>
  <div class="card" style="margin-bottom: 24px;">
    <table>
      <thead>
        <tr><th>ID</th><th>Action</th><th>Command / Context</th><th>Status</th><th>Resolution</th></tr>
      </thead>
      <tbody id="approvals-tbody">
        <tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No pending approvals</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section-title">Live Telemetry Events</div>
  <div id="events-log"></div>

  <script>${getDashboardClientScript()}</script>
</body>
</html>`;
}

module.exports = { getDashboardHtml };

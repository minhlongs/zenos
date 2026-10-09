'use strict';

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
    <div><span class="badge" id="conn-status">SSE Connected</span></div>
  </div>

  <div class="grid">
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

  <script>
    const eventsLog = document.getElementById('events-log');
    function logEvent(text) {
      const el = document.createElement('div');
      el.className = 'event-line';
      el.textContent = \`[\${new Date().toLocaleTimeString()}] \${text}\`;
      eventsLog.prepend(el);
    }

    async function loadApprovals() {
      try {
        const res = await fetch('/dashboard/api/overview');
        if (!res.ok) return;
        const data = await res.json();
        renderApprovals(data.approvals || []);
      } catch (e) {}
    }

    function renderApprovals(list) {
      const tbody = document.getElementById('approvals-tbody');
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No pending approvals</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(item => \`
        <tr>
          <td>\${item.id}</td>
          <td><b>\${item.action}</b></td>
          <td><code>\${item.command || item.context || 'N/A'}</code></td>
          <td><span style="color: \${item.status === 'pending' ? 'var(--warning)' : 'var(--text-muted)'}">\${item.status}</span></td>
          <td>
            \${item.status === 'pending' ? \`
              <button class="btn btn-approve" onclick="resolveApproval('\${item.id}', '\${item.token}', true)">Approve</button>
              <button class="btn btn-reject" onclick="resolveApproval('\${item.id}', '\${item.token}', false)">Reject</button>
            \` : 'Resolved'}
          </td>
        </tr>
      \`).join('');
    }

    async function resolveApproval(id, token, approved) {
      await fetch(\`/v1/approvals/\${id}/resolve\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, approved, decidedBy: 'dashboard_operator' })
      });
      loadApprovals();
    }

    function updateMetrics(summary) {
      if (!summary) return;
      document.getElementById('total-req').textContent = summary.totalRequests || 0;
      document.getElementById('active-req').textContent = summary.activeRequests || 0;
      const lat = summary.latency || {};
      document.getElementById('latency-stats').textContent = \`\${lat.p50 || 0}ms / \${lat.p95 || 0}ms\`;
      document.getElementById('error-rate').textContent = \`\${Math.round((summary.errorRate || 0) * 1000) / 10}%\`;
    }

    const evtSource = new EventSource('/v1/telemetry/events');
    evtSource.addEventListener('init', (e) => {
      const data = JSON.parse(e.data);
      updateMetrics(data.summary);
      logEvent('Connected to Telemetry SSE stream');
      loadApprovals();
    });
    evtSource.addEventListener('telemetry', (e) => {
      const evt = JSON.parse(e.data);
      logEvent(\`\${evt.type.toUpperCase()}: \${evt.model || ''} \${evt.statusCode || ''} (\${evt.durationMs || 0}ms)\`);
      fetch('/v1/telemetry').then(r => r.json()).then(updateMetrics);
    });
    setInterval(loadApprovals, 5000);
  </script>
</body>
</html>`;
}

module.exports = { getDashboardHtml };

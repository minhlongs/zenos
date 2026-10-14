'use strict';

function getDashboardClientScript() {
  return `
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

    async function killAllJails() {
      await fetch('/v1/factory/supervisor/kill-all', { method: 'POST' });
      loadSupervisor();
    }

    async function loadSupervisor() {
      try {
        const res = await fetch('/v1/factory/supervisor/status');
        if (!res.ok) return;
        const d = await res.json();
        const jails = d.supervisor?.activeJails?.length || 0;
        document.getElementById('active-jails').textContent = \`\${jails} PGID\`;
      } catch (e) {}
    }

    const evtSource = new EventSource('/v1/telemetry/events');
    evtSource.addEventListener('init', (e) => {
      const data = JSON.parse(e.data);
      updateMetrics(data.summary);
      logEvent('Connected to Telemetry SSE stream');
      loadApprovals();
      loadSupervisor();
    });
    evtSource.addEventListener('telemetry', (e) => {
      const evt = JSON.parse(e.data);
      logEvent(\`\${evt.type.toUpperCase()}: \${evt.model || ''} \${evt.statusCode || ''} (\${evt.durationMs || 0}ms)\`);
      fetch('/v1/telemetry').then(r => r.json()).then(updateMetrics);
    });
    setInterval(loadApprovals, 5000);
    setInterval(loadSupervisor, 5000);
  `;
}

module.exports = { getDashboardClientScript };

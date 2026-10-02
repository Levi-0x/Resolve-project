function setStat(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function formatHours(hours, resolvedCount) {
  if (resolvedCount === 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours} hrs`;
  return `${Math.round((hours / 24) * 10) / 10} days`;
}

const recentBodyEl = document.querySelector("#recentBody");

function renderRecent(complaints) {
  const latest = complaints.slice(0, 5); // the API returns newest first
  recentBodyEl.innerHTML = latest.length
    ? latest
        .map(
          (c) => `
    <tr>
      <td>${escapeHtml(c.title)}</td>
      <td>${escapeHtml(c.category)}</td>
      <td>${statusPill(c.status)}</td>
      <td>${formatDate(c.createdAt)}</td>
    </tr>`
        )
        .join("")
    : messageRow(4, "No complaints yet. Use the button below to report an issue.");
}

async function loadDashboard() {
  try {
    const [stats, complaints] = await Promise.all([
      apiRequest("/complaints/stats/me", { auth: true }),
      apiRequest("/complaints", { auth: true }),
    ]);

    setStat(".stats .total", stats.totalComplaints);
    setStat(".stats .pending", stats.pending);
    setStat(".stats .resolved", stats.resolved);
    setStat(".stats .time", formatHours(stats.avgResTimeHours, stats.resolved));
    renderRecent(complaints);
  } catch (err) {
    recentBodyEl.innerHTML = messageRow(4, err.message);
  }
}

loadDashboard();
document.addEventListener("complaint:changed", loadDashboard);

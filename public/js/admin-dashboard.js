function setStat(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

const recentBodyEl = document.querySelector("#recentBody");

function renderRecent(complaints) {
  const latest = complaints.slice(0, 5); // the API returns newest first
  recentBodyEl.innerHTML = latest.length
    ? latest
        .map(
          (c) => `
    <tr>
      <td>${escapeHtml(c.resident?.fullName || "Deleted user")}</td>
      <td>${escapeHtml(c.title)}</td>
      <td>${escapeHtml(c.category)}</td>
      <td>${statusPill(c.status)}</td>
      <td>${formatDate(c.createdAt)}</td>
    </tr>`
        )
        .join("")
    : messageRow(5, "No complaints have been filed yet.");
}

async function loadDashboard() {
  try {
    const [stats, complaints] = await Promise.all([
      apiRequest("/complaints/stats/admin", { auth: true }),
      apiRequest("/complaints", { auth: true }),
    ]);

    setStat(".totalUsers .total", stats.totalUsers);
    setStat(".totalComplaints .total", stats.totalComplaints);
    setStat(".resolvedComplaints .resolved", stats.resolved);
    setStat(".pendingComplaints .pending", stats.pending);
    renderRecent(complaints);
  } catch (err) {
    recentBodyEl.innerHTML = messageRow(5, err.message);
  }
}

loadDashboard();

const complaintsBodyEl = document.querySelector("#complaintsBody");

function renderComplaints(data) {
  if (data.length === 0) {
    complaintsBodyEl.innerHTML = messageRow(7, "No complaints have been filed yet.");
    return;
  }

  complaintsBodyEl.innerHTML = data
    .map((c) => {
      const id = escapeHtml(c._id);
      const room = c.resident ? `${c.resident.building}, ${c.resident.unit}` : "—";
      const options = STATUSES.map(
        (s) => `<option value="${s}"${s === c.status ? " selected" : ""}>${s}</option>`
      ).join("");

      return `
    <tr data-id="${id}">
      <td>${escapeHtml(c.resident?.fullName || "Deleted user")}</td>
      <td>${escapeHtml(room)}</td>
      <td>${escapeHtml(c.title)}</td>
      <td>${escapeHtml(c.category)}</td>
      <td><select class="statusSelect ${STATUS_CLASS[c.status] || ""}" data-id="${id}" data-current="${escapeHtml(c.status)}" aria-label="Change status">${options}</select></td>
      <td>${formatDate(c.createdAt)}</td>
      <td class="tableActions">
        <button type="button" class="deleteBtn" aria-label="Delete complaint" data-id="${id}"><i data-lucide="trash-2"></i></button>
      </td>
    </tr>
  `;
    })
    .join("");

  lucide.createIcons(); // rows are added after the page's own initial createIcons() call
}

async function loadComplaints() {
  try {
    renderComplaints(await apiRequest("/complaints", { auth: true }));
  } catch (err) {
    complaintsBodyEl.innerHTML = messageRow(7, err.message);
  }
}

loadComplaints();

// change a complaint's status from the dropdown
complaintsBodyEl.addEventListener("change", async (e) => {
  const select = e.target.closest(".statusSelect");
  if (!select) return;

  const previous = select.dataset.current;
  select.disabled = true;
  try {
    const updated = await apiRequest(`/complaints/${select.dataset.id}/status`, {
      method: "PATCH",
      body: { status: select.value },
      auth: true,
    });
    select.dataset.current = updated.status;
    select.className = `statusSelect ${STATUS_CLASS[updated.status] || ""}`;
  } catch (err) {
    select.value = previous; // put it back if the server said no
    alert(err.message);
  } finally {
    select.disabled = false;
  }
});

// delete a complaint
complaintsBodyEl.addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest(".deleteBtn");
  if (!deleteBtn) return;
  if (!confirm("Delete this complaint? This cannot be undone.")) return;

  try {
    await apiRequest(`/complaints/${deleteBtn.dataset.id}`, { method: "DELETE", auth: true });
    loadComplaints();
  } catch (err) {
    alert(err.message);
  }
});

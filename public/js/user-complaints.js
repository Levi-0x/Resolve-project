const myComplaintsBodyEl = document.querySelector("#myComplaintsBody");
let complaintsById = new Map(); // so the edit button can hand the full complaint to the pop-up

function renderMyComplaints(data) {
  complaintsById = new Map(data.map((c) => [c._id, c]));
  if (data.length === 0) {
    myComplaintsBodyEl.innerHTML = messageRow(5, "You haven't filed any complaints yet.");
    return;
  }

  myComplaintsBodyEl.innerHTML = data
    .map((complaint) => {
      // only a still-pending complaint makes sense to edit or withdraw
      const actions =
        complaint.status === "Pending"
          ? `<button type="button" class="editBtn" aria-label="Edit complaint" data-id="${escapeHtml(complaint._id)}"><i data-lucide="square-pen"></i></button>
             <button type="button" class="deleteBtn" aria-label="Delete complaint" data-id="${escapeHtml(complaint._id)}"><i data-lucide="trash-2"></i></button>`
          : `<span class="actionsMuted">—</span>`;

      return `
    <tr data-id="${escapeHtml(complaint._id)}">
      <td>${escapeHtml(complaint.title)}</td>
      <td>${escapeHtml(complaint.category)}</td>
      <td>${statusPill(complaint.status)}</td>
      <td>${formatDate(complaint.createdAt)}</td>
      <td class="tableActions">${actions}</td>
    </tr>
  `;
    })
    .join("");

  lucide.createIcons();
}

async function loadMyComplaints() {
  try {
    renderMyComplaints(await apiRequest("/complaints", { auth: true }));
  } catch (err) {
    myComplaintsBodyEl.innerHTML = messageRow(5, err.message);
  }
}

loadMyComplaints();
document.addEventListener("complaint:changed", loadMyComplaints);

myComplaintsBodyEl.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".editBtn");
  const deleteBtn = e.target.closest(".deleteBtn");

  if (editBtn) {
    const complaint = complaintsById.get(editBtn.dataset.id);
    if (complaint) ComplaintModal.openEdit(complaint);
  }

  if (deleteBtn) {
    if (!confirm("Withdraw this complaint? This cannot be undone.")) return;
    try {
      await apiRequest(`/complaints/${deleteBtn.dataset.id}`, { method: "DELETE", auth: true });
    } catch (err) {
      alert(err.message);
    }
    loadMyComplaints(); // reload either way, in case an admin changed its status meanwhile
  }
});

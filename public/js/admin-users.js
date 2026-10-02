const usersBodyEl = document.querySelector("#usersBody");

function renderUsers(data) {
  if (data.length === 0) {
    usersBodyEl.innerHTML = messageRow(5, "No residents have signed up yet.");
    return;
  }

  usersBodyEl.innerHTML = data
    .map(
      (user) => `
    <tr data-id="${escapeHtml(user._id)}">
      <td>${escapeHtml(user.fullName)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(`${user.building}, ${user.unit}`)}</td>
      <td><span class="rolePill ${user.role === "admin" ? "admin" : "resident"}">${user.role === "admin" ? "Admin" : "Resident"}</span></td>
      <td class="tableActions">
        <button type="button" class="deleteBtn" aria-label="Delete user" data-id="${escapeHtml(user._id)}"><i data-lucide="trash-2"></i></button>
      </td>
    </tr>
  `
    )
    .join("");

  lucide.createIcons();
}

async function loadUsers() {
  try {
    renderUsers(await apiRequest("/user", { auth: true }));
  } catch (err) {
    usersBodyEl.innerHTML = messageRow(5, err.message);
  }
}

loadUsers();

usersBodyEl.addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest(".deleteBtn");
  if (!deleteBtn) return;

  const name = deleteBtn.closest("tr").children[0].textContent;
  if (!confirm(`Delete ${name} and all of their complaints? This cannot be undone.`)) return;

  try {
    await apiRequest(`/user/${deleteBtn.dataset.id}`, { method: "DELETE", auth: true });
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
});

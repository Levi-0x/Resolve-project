// Complaint pop-up. Buttons with class .createComplaint or .newComplaintBtn open it empty (new complaint);
// ComplaintModal.openEdit(complaint) opens it filled in (edit). After a successful save it fires a
// "complaint:changed" event so the page can reload its data.
(function () {
  const CATEGORIES = ["Plumbing", "Electrical", "Furniture", "Maintenance", "Other"];

  const backdrop = document.createElement("div");
  backdrop.className = "modalBackdrop";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="complaintModalTitle">
      <h2 id="complaintModalTitle">New Complaint</h2>
      <form id="complaintForm" novalidate>
        <div class="formGroup">
          <label for="complaintTitle">Issue</label>
          <input type="text" id="complaintTitle" maxlength="120" placeholder="e.g. Leaking tap in bathroom" />
        </div>
        <div class="formGroup">
          <label for="complaintCategory">Category</label>
          <select id="complaintCategory">
            ${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
        <div class="formGroup">
          <label for="complaintDescription">Details</label>
          <textarea id="complaintDescription" rows="4" maxlength="1000" placeholder="Describe the problem"></textarea>
        </div>
        <p class="formMessage" role="alert" aria-live="polite"></p>
        <div class="modalActions">
          <button type="button" class="modalCancel">Cancel</button>
          <button type="submit" class="modalSubmit">Submit</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(backdrop);

  const form = backdrop.querySelector("#complaintForm");
  const message = form.querySelector(".formMessage");
  const submitBtn = form.querySelector(".modalSubmit");
  const heading = backdrop.querySelector("#complaintModalTitle");
  let editingId = null; // null = creating a new complaint

  function openModal(complaint = null) {
    form.reset();
    message.textContent = "";
    editingId = complaint ? complaint._id : null;
    heading.textContent = complaint ? "Edit Complaint" : "New Complaint";
    submitBtn.textContent = complaint ? "Save Changes" : "Submit";
    if (complaint) {
      form.querySelector("#complaintTitle").value = complaint.title;
      form.querySelector("#complaintCategory").value = complaint.category;
      form.querySelector("#complaintDescription").value = complaint.description;
    }
    backdrop.hidden = false;
    form.querySelector("#complaintTitle").focus();
  }

  function closeModal() {
    backdrop.hidden = true;
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest(".createComplaint, .newComplaintBtn")) openModal();
  });
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });
  form.querySelector(".modalCancel").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.hidden) closeModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = form.querySelector("#complaintTitle").value.trim();
    const description = form.querySelector("#complaintDescription").value.trim();
    const category = form.querySelector("#complaintCategory").value;

    if (title.length < 3) {
      message.textContent = "The issue needs at least 3 characters.";
      return;
    }
    if (description.length < 3) {
      message.textContent = "Please add a few details (at least 3 characters).";
      return;
    }

    const label = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
    try {
      const body = { title, description, category };
      if (editingId) {
        await apiRequest(`/complaints/${editingId}`, { method: "PATCH", body, auth: true });
      } else {
        await apiRequest("/complaints", { method: "POST", body, auth: true });
      }
      closeModal();
      document.dispatchEvent(new CustomEvent("complaint:changed"));
    } catch (err) {
      message.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = label;
    }
  });
  window.ComplaintModal = { openEdit: openModal };
})();

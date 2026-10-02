const profileFormEl = document.querySelector("#profileForm");
const profileMessageEl = profileFormEl.querySelector(".formMessage");

function showProfileMessage(text, type = "error") {
  profileMessageEl.textContent = text;
  profileMessageEl.className = `formMessage ${text ? type : ""}`;
}

// fill the form with the logged-in resident's real details
async function loadProfile() {
  try {
    const user = await apiRequest("/user/profile", { auth: true });
    document.querySelector(".avatarName").textContent = user.fullName;
    document.querySelector("#profileName").value = user.fullName;
    document.querySelector("#profileEmail").value = user.email;
    document.querySelector("#profileBuilding").value = user.building;
    document.querySelector("#profileUnit").value = user.unit;
    document.querySelector("#profilePhone").value = user.phone || "";
  } catch (err) {
    showProfileMessage(err.message);
  }
}

loadProfile();

profileFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  showProfileMessage("");

  const saveBtn = profileFormEl.querySelector(".saveProfile");
  saveBtn.disabled = true;
  try {
    const user = await apiRequest("/user/profile", {
      method: "PATCH",
      auth: true,
      body: {
        fullName: document.querySelector("#profileName").value.trim(),
        email: document.querySelector("#profileEmail").value.trim(),
        building: document.querySelector("#profileBuilding").value.trim(),
        unit: document.querySelector("#profileUnit").value.trim(),
        phone: document.querySelector("#profilePhone").value.trim(),
      },
    });

    // keep the saved login and the name on screen in step with the change
    Session.setUser({ ...Session.user, fullName: user.fullName, email: user.email });
    document.querySelectorAll(".username").forEach((el) => (el.textContent = user.fullName));
    document.querySelector(".avatarName").textContent = user.fullName;
    showProfileMessage("Profile updated.", "success");
  } catch (err) {
    showProfileMessage(err.message);
  } finally {
    saveBtn.disabled = false;
  }
});

// profile photos: to be built later
document.querySelector(".avatarUpload").addEventListener("click", () => {
  alert("Profile photos aren't available yet.");
});

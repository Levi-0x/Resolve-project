
const switchForm = document.querySelector(".switchForm");

const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");

const tabs = switchForm.querySelectorAll("button");

switchForm.addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;

  const name = e.target.dataset.form;

  tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.form === name))

  loginForm.classList.toggle("hidden", name === "Signup");
  signupForm.classList.toggle("hidden", name === "Login");    
});

// ---------- login / signup ----------

function showMessage(form, text, type = "error") {
  const box = form.querySelector(".formMessage");
  box.textContent = text;
  box.className = `formMessage ${text ? type : ""}`;
}

async function withButtonLocked(form, work) {
  const button = form.querySelector('button[type="submit"]');
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Please wait...";
  try {
    await work();
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

function goToDashboard(user) {
  window.location.href = user.role === "admin" ? "./admin-dashboard.html" : "./user-dashboard.html";
}

async function signIn(identifier, password) {
  const data = await apiRequest("/user/signin", {
    method: "POST",
    body: { identifier, password },
  });
  Session.save(data);
  goToDashboard(data.user);
}

// already logged in? only skip the form if the server still accepts the saved session
if (Session.token && Session.user) {
  apiRequest("/user/profile", { auth: true })
    .then((user) => goToDashboard(user))
    .catch(() => Session.clear());
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showMessage(loginForm, "");
  withButtonLocked(loginForm, async () => {
    try {
      await signIn(
        document.querySelector("#loginName").value.trim(),
        document.querySelector("#loginPassword").value
      );
    } catch (err) {
      showMessage(loginForm, err.message);
    }
  });
});

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showMessage(signupForm, "");
  withButtonLocked(signupForm, async () => {
    const email = document.querySelector("#signupEmail").value.trim();
    const password = document.querySelector("#signupPassword").value;

    try {
      await apiRequest("/user/signup", {
        method: "POST",
        body: {
          fullName: document.querySelector("#signupName").value.trim(),
          building: document.querySelector("#buildingInput").value.trim(),
          unit: document.querySelector("#unitInput").value.trim(),
          email,
          password,
        },
      });
    } catch (err) {
      showMessage(signupForm, err.message);
      return;
    }

    // account exists now, so sign straight in
    try {
      await signIn(email, password);
    } catch {
      switchForm.querySelector('[data-form="Login"]').click();
      showMessage(loginForm, "Account created. Please sign in.", "success");
    }
  });
});

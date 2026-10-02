// Protect the page: admin-* pages are for admins, user-* pages for residents.
const requiredRole = window.location.pathname.split("/").pop().startsWith("admin-") ? "admin" : "resident";
requireRole(requiredRole);

const hamburger = document.querySelector(".hamburger");
const sidebarClose = document.querySelector(".sidebarClose");
const backdrop = document.querySelector(".sidebarBackdrop");

function openSidebar() {
  document.body.classList.add("sidebarOpen");
  hamburger.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  document.body.classList.remove("sidebarOpen");
  hamburger.setAttribute("aria-expanded", "false");
}

hamburger.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
backdrop.addEventListener("click", closeSidebar);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSidebar();
});

// Highlight whichever sidebar link matches the current page, instead of
// relying on a hardcoded "active" class per file (easy to forget to update).
function setActiveNavItem() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  Array.from(document.querySelectorAll(".sidebarNav .navItem")).forEach((item) => {
    const itemPage = item.getAttribute("href").split("/").pop();
    item.classList.toggle("active", itemPage === currentPage);
  });
}

setActiveNavItem();

// Logout link: clear the saved login, then go to the login page.
document.querySelectorAll(".logoutItem").forEach((link) => {
  link.setAttribute("href", "./index.html");
  link.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
});

// Show the logged-in user's name in the top bar and in the dashboard greeting.
// textContent (not innerHTML) so a name can never inject markup.
function fillUserName() {
  const user = typeof Session !== "undefined" ? Session.user : null;
  if (!user) return;

  document.querySelectorAll(".username").forEach((el) => {
    el.textContent = user.fullName;
  });

  const greeting = document.querySelector("[data-greeting]");
  if (greeting) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    const opener = greeting.dataset.greeting === "welcome" ? "Welcome" : timeOfDay;
    greeting.textContent = `${opener}, ${user.fullName}`;
  }
}

fillUserName();

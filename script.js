// =========================================
// CONFIGURATION (Change to your GitHub username!)
// =========================================
const GITHUB_USERNAME = "Paul-HC8";

// =========================================
// 1. GITHUB ISLAND SETUP
// =========================================
const githubLink = document.getElementById("githubLink");
const githubChart = document.getElementById("githubChart");

githubLink.href = `https://github.com/${GITHUB_USERNAME}`;
githubChart.src = `https://ghchart.rshah.org/404040/${GITHUB_USERNAME}`;
githubChart.alt = `${GITHUB_USERNAME}'s GitHub Contributions Chart`;

// =========================================
// 2. TAB SWITCHING & MOBILE MENU
// =========================================
const navButtons = document.querySelectorAll(".nav-btn");
const tabSections = document.querySelectorAll(".tab-section");
const logoBtn = document.getElementById("logoBtn");
const mobileLogoBtn = document.getElementById("mobileLogoBtn");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

function closeMobileMenu() {
  sidebar.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "MENU";
}

function switchTab(tabId) {
  navButtons.forEach((btn) => btn.classList.remove("active"));
  tabSections.forEach((section) => section.classList.remove("active"));

  const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  const activeSection = document.getElementById(tabId);

  if (activeBtn && activeSection) {
    activeBtn.classList.add("active");
    activeSection.classList.add("active");
  }

  closeMobileMenu();
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchTab(button.getAttribute("data-tab"));
  });
});

logoBtn.addEventListener("click", () => switchTab("home"));
mobileLogoBtn.addEventListener("click", () => switchTab("home"));

menuToggle.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "CLOSE" : "MENU";
});

// Close mobile menu with the Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("open")) {
    closeMobileMenu();
  }
});

// =========================================
// 3. LIGHT / DARK / SYSTEM THEME SWITCHER
// =========================================
const themeButtons = document.querySelectorAll(".theme-btn");
const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(choice) {
  const shouldUseDark =
    choice === "dark" || (choice === "system" && systemDarkQuery.matches);

  document.documentElement.classList.toggle("dark", shouldUseDark);

  themeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-theme-choice") === choice);
  });
}

// Load saved preference or default to "system"
const savedTheme = localStorage.getItem("core-techs-theme") || "system";
applyTheme(savedTheme);

themeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const choice = btn.getAttribute("data-theme-choice");
    localStorage.setItem("core-techs-theme", choice);
    applyTheme(choice);
  });
});

// Automatically update if the OS theme changes while set to "system"
systemDarkQuery.addEventListener("change", () => {
  if ((localStorage.getItem("core-techs-theme") || "system") === "system") {
    applyTheme("system");
  }
});
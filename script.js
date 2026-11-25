// =========================================
// CONFIGURATION (Adjustable settings)
// =========================================

// 1. Replace "torvalds" with your own GitHub username
const GITHUB_USERNAME = "Paul-HC8";

// 2. How often the quote rotates (in milliseconds).
//    Default: 1 hour = 60 minutes * 60 seconds * 1000 ms
const ROTATION_INTERVAL_MS = 60 * 60 * 1000;

// 3. Inspirational Quotes List
//    Add, edit, or remove quotes inside [ ... ] anytime.
//    Put a comma (,) at the end of every quote EXCEPT the very last one.
const INSPIRATIONAL_QUOTES = [
  "Life is a gift",
  "Are u living a meaningful life",
  "Praise be to you, My lord",
  'Laudato si "Sustainability"'
];

// =========================================
// 1. GITHUB CONTRIBUTIONS CONSTELLATION (SHINING STARS)
// =========================================
const githubLink = document.getElementById("githubLink");
const githubChart = document.getElementById("githubChart");

githubLink.href = `https://github.com/${GITHUB_USERNAME}`;

// Helper function to create one star cell referencing #star-icon in index.html
function createStarCell(level, titleText = "") {
  const cell = document.createElement("div");
  cell.className = `contrib-day level-${level}`;

  if (titleText) {
    cell.title = titleText;
  } else {
    cell.setAttribute("aria-hidden", "true");
  }

  cell.innerHTML = `<svg class="star-svg" aria-hidden="true"><use href="#star-icon"></use></svg>`;
  return cell;
}

async function loadGitHubContributions() {
  if (!githubChart) return;

  const apiUrl = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(
    GITHUB_USERNAME
  )}?y=last`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    const contributions = Array.isArray(data.contributions) ? data.contributions : [];

    if (!contributions.length) {
      githubChart.innerHTML = `<span class="micro-label">NO CONTRIBUTION DATA FOUND</span>`;
      return;
    }

    // Build all stars in memory first for fast rendering
    const fragment = document.createDocumentFragment();

    // Align the first date to its proper weekday row (0 = Sunday ... 6 = Saturday)
    const firstDate = new Date(`${contributions[0].date}T00:00:00Z`);
    const leadingDays = firstDate.getUTCDay();

    for (let i = 0; i < leadingDays; i++) {
      fragment.appendChild(createStarCell(0));
    }

    // Create one star per day; higher levels scale up and shine brighter
    contributions.forEach((day) => {
      const level = day.count > 0 ? Math.min(Math.max(day.level || 1, 1), 4) : 0;
      const countText =
        day.count === 0
          ? "No contributions"
          : day.count === 1
          ? "1 contribution"
          : `${day.count} contributions`;

      fragment.appendChild(createStarCell(level, `${day.date}: ${countText}`));
    });

    githubChart.innerHTML = "";
    githubChart.appendChild(fragment);
    githubChart.setAttribute(
      "aria-label",
      `${GITHUB_USERNAME}'s GitHub Contributions Star Constellation`
    );
  } catch (error) {
    console.error("Failed to load GitHub contributions:", error);
    githubChart.innerHTML = `<span class="micro-label">UNABLE TO LOAD CONTRIBUTIONS FOR ${GITHUB_USERNAME.toUpperCase()}</span>`;
  }
}

loadGitHubContributions();

// =========================================
// 2. HOURLY INSPIRATIONAL QUOTE FOOTER
// =========================================
const quoteDisplay = document.getElementById("quoteDisplay");

function updateHourlyQuote() {
  if (!quoteDisplay || !Array.isArray(INSPIRATIONAL_QUOTES) || !INSPIRATIONAL_QUOTES.length) {
    return;
  }

  // Count total hours elapsed since Jan 1, 1970, then use modulo (%)
  // to cycle cleanly through your quotes list once per hour.
  const currentTimeBlock = Math.floor(Date.now() / ROTATION_INTERVAL_MS);
  const quoteIndex = currentTimeBlock % INSPIRATIONAL_QUOTES.length;

  // Smoothly fade text out, swap quote, and fade back in
  quoteDisplay.style.opacity = "0";
  setTimeout(() => {
    quoteDisplay.textContent = `“${INSPIRATIONAL_QUOTES[quoteIndex]}”`;
    quoteDisplay.style.opacity = "1";
  }, 150);
}

function scheduleHourlyQuoteUpdate() {
  // Show the right quote immediately on page load
  updateHourlyQuote();

  // Calculate milliseconds left until the exact top of the next hour
  const msUntilNextRotation = ROTATION_INTERVAL_MS - (Date.now() % ROTATION_INTERVAL_MS);

  // Wait for the next hour mark, then rotate automatically every hour
  setTimeout(() => {
    updateHourlyQuote();
    setInterval(updateHourlyQuote, ROTATION_INTERVAL_MS);
  }, msUntilNextRotation);
}

scheduleHourlyQuoteUpdate();

// =========================================
// 3. TAB SWITCHING & MOBILE MENU
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
// 4. LIGHT / DARK / SYSTEM THEME SWITCHER
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

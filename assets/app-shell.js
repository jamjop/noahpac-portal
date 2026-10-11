(function () {
  const STORAGE_KEY = "noahpac-theme";
  const THEMES = new Set(["system", "light", "dark"]);

  function storedTheme() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return THEMES.has(value) ? value : "system";
    } catch (_) {
      return "system";
    }
  }

  function applyTheme(theme) {
    const next = THEMES.has(theme) ? theme : "system";
    if (next === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
    }
    document.documentElement.style.colorScheme = next === "system" ? "light dark" : next;
  }

  const FAMILY_ICONS = {
    calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h2m4 0h2M8 14h2m4 0h2M8 18h2m4 0h2"/>',
    medication: '<path d="m10.5 20.5 10-10a5 5 0 0 0-7-7l-10 10a5 5 0 0 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    pediatric: '<path d="M9 12h.01M15 12h.01M10 16c.7.7 1.3 1 2 1s1.3-.3 2-1"/><path d="M19 6.4A9 9 0 1 1 6.4 5"/><path d="M12 3a3 3 0 0 0-3 3c0 1.1.9 2 2 2h1"/>',
    protocol: '<path d="M19 14c1.5-1.5 3-3.4 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5C2 14 12 21 12 21"/><path d="M3.2 13H8l2-4 4 8 2-4h4.8"/>',
    decision: '<path d="M12 3v6M12 15v6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M3 12h6M15 12h6M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/><circle cx="12" cy="12" r="3"/>',
    documents: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    assistant: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16h.01"/>',
    reference: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/>'
  };

  const THEME_ICONS = {
    system: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
    dark: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>'
  };

  const REVIEW_CADENCE = {
    "/abx/": "References reviewed quarterly",
    "/allergy/": "References reviewed quarterly",
    "/als/": "References reviewed quarterly",
    "/antibiogram/": "References reviewed quarterly",
    "/anticoag/": "References reviewed quarterly",
    "/calculators/": "References reviewed quarterly",
    "/drugref/": "Uses live FDA data",
    "/empiric/": "References reviewed quarterly",
    "/labs/": "References reviewed quarterly",
    "/lookup/": "Uses live NLM data",
    "/naloxone/": "References reviewed quarterly",
    "/opioids/": "References reviewed quarterly",
    "/pals/": "References reviewed quarterly",
    "/peds/": "References reviewed quarterly",
    "/reportable/": "References reviewed quarterly",
    "/screener/": "Recommendations updated weekly",
    "/sepsis/": "References reviewed quarterly",
    "/steroids/": "References reviewed quarterly",
    "/sti-guide/": "References reviewed quarterly",
    "/tccc/": "References reviewed quarterly",
    "/toxicology/": "References reviewed quarterly",
    "/vaccines/": "References reviewed quarterly",
    "/wound/": "References reviewed quarterly"
  };

  function initializeReviewCadence() {
    const title = document.querySelector(".app-header__title");
    if (!title || title.querySelector(":scope > .review-status")) return;

    const path = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`;
    const existing = document.querySelector(".app-header__bar .review-status");
    const fallback = existing && existing.textContent.trim()
      .replace("Reviewed quarterly", "References reviewed quarterly")
      .replace("Quarterly review", "References reviewed quarterly")
      .replace("Updated weekly", "Recommendations updated weekly")
      .replace("Weekly update", "Recommendations updated weekly")
      .replace("Live FDA data", "Uses live FDA data")
      .replace("Live NLM data", "Uses live NLM data");
    const label = REVIEW_CADENCE[path] || fallback;
    if (!label) return;

    if (existing) existing.remove();
    const status = document.createElement("span");
    status.className = "review-status";
    status.dataset.cadence = label;
    status.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="m9 16 2 2 4-4"/></svg><span>${label}</span>`;
    const lede = title.querySelector(".app-header__lede");
    if (lede) lede.insertAdjacentElement("afterend", status);
    else title.append(status);
  }

  function updateThemeControl(select, theme) {
    const field = select.closest(".theme-field");
    if (!field) return;
    let icon = field.querySelector(".theme-field__icon");
    if (!icon) {
      icon = document.createElement("span");
      icon.className = "theme-field__icon";
      icon.setAttribute("aria-hidden", "true");
      field.prepend(icon);
    }
    const label = theme.charAt(0).toUpperCase() + theme.slice(1);
    field.dataset.activeTheme = theme;
    field.title = `Color theme: ${label}`;
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${THEME_ICONS[theme]}</svg>`;
  }

  function pageFamily() {
    const body = document.body;
    if (body.classList.contains("calculator-app")) return "calculator";
    if (body.classList.contains("medication-tool")) return "medication";
    if (body.classList.contains("pediatric-app")) return "pediatric";
    if (body.classList.contains("protocol-app") || body.classList.contains("sepsis-app")) return "protocol";
    if (body.classList.contains("assistant-app")) return "assistant";
    if (body.classList.contains("documents-app")) return "documents";
    if (body.classList.contains("decision-app")) return "decision";
    return "reference";
  }

  function initializeFamilyIcon() {
    const eyebrow = document.querySelector(".app-header__eyebrow");
    if (!eyebrow || eyebrow.querySelector(".app-header__family-icon")) return;
    const family = pageFamily();
    const icon = document.createElement("span");
    icon.className = "app-header__family-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${FAMILY_ICONS[family]}</svg>`;
    eyebrow.prepend(icon);
  }

  function initializeReferenceOutline() {
    if (!document.body.matches(".anticoag-app, .naloxone-app, .toxicology-app")) return;
    const main = document.querySelector(".legacy-main");
    if (!main || main.querySelector(".page-outline")) return;

    const entries = Array.from(main.querySelectorAll(":scope > section.card")).map((section, index) => {
      const label = section.querySelector(".card-title");
      if (!label) return null;
      section.id ||= `section-${index + 1}`;
      section.style.scrollMarginTop = "76px";
      return { section, id: section.id, label: label.textContent.trim() };
    }).filter(Boolean);
    if (entries.length < 3) return;

    const nav = document.createElement("nav");
    nav.className = "page-outline";
    nav.setAttribute("aria-label", "On this page");
    nav.innerHTML = `<span class="page-outline__label">On this page</span><div class="page-outline__links">${entries.map(({ id, label }) => `<a href="#${id}">${label}</a>`).join("")}</div>`;

    const urgent = main.querySelector(":scope > .alert-box");
    if (urgent) urgent.insertAdjacentElement("afterend", nav);
    else main.prepend(nav);

    if (!("IntersectionObserver" in window)) return;
    const links = new Map(Array.from(nav.querySelectorAll("a")).map((link) => [link.hash.slice(1), link]));
    const observer = new IntersectionObserver((items) => {
      const visible = items.filter((item) => item.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      links.forEach((link, id) => link.toggleAttribute("aria-current", id === visible.target.id));
    }, { rootMargin: "-18% 0px -72%", threshold: 0 });
    entries.forEach(({ section }) => observer.observe(section));
  }

  const initialTheme = storedTheme();
  applyTheme(initialTheme);

  function initializeShell() {
    initializeFamilyIcon();
    initializeReviewCadence();
    initializeReferenceOutline();
    document.querySelectorAll("[data-theme-select]").forEach((select) => {
      select.value = initialTheme;
      updateThemeControl(select, initialTheme);
      select.addEventListener("change", () => {
        const next = THEMES.has(select.value) ? select.value : "system";
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch (_) {
          // Theme selection still works for this page when storage is unavailable.
        }
        applyTheme(next);
        document.querySelectorAll("[data-theme-select]").forEach((other) => {
          other.value = next;
          updateThemeControl(other, next);
        });
      });
    });

    document.querySelectorAll("[data-current-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeShell, { once: true });
  } else {
    initializeShell();
  }
})();

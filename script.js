document.documentElement.classList.add("js-ready");

const body = document.body;
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#site-nav");
const contactForm = document.querySelector("[data-contact-form]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

const createGlobalChrome = () => {
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = "<span></span>";
  body.append(progress);

  const transition = document.createElement("div");
  transition.className = "page-transition";
  transition.setAttribute("aria-hidden", "true");
  transition.innerHTML = '<img src="/assets/grayston-emblem-192.webp" alt="" />';
  body.append(transition);

  if (body.dataset.page === "home" && !reducedMotion.matches) {
    const intro = document.createElement("div");
    intro.className = "brand-intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = `
      <div class="brand-intro-lockup">
        <img src="/assets/grayston-logo-full.webp" alt="" />
        <span>Systems online / Production standard engaged</span>
      </div>
    `;
    body.append(intro);

    window.setTimeout(() => intro.classList.add("is-complete"), 2140);
    window.setTimeout(() => intro.remove(), 2780);
  }
};

createGlobalChrome();

document.querySelectorAll("[data-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});

const updateViewportState = () => {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
  body.style.setProperty("--scroll-progress", progress.toFixed(3));

  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  }
};

let scrollFrame = 0;
const requestViewportUpdate = () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    updateViewportState();
    scrollFrame = 0;
  });
};

updateViewportState();
window.addEventListener("scroll", requestViewportUpdate, { passive: true });
window.addEventListener("resize", requestViewportUpdate, { passive: true });

const finishLoading = () => body.classList.add("is-loaded");
if (document.readyState === "complete") {
  finishLoading();
} else {
  window.addEventListener("load", finishLoading, { once: true });
}

if (navToggle && header && nav) {
  const closeNavigation = () => {
    navToggle.setAttribute("aria-expanded", "false");
    header.classList.remove("is-open");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    header.classList.toggle("is-open", !isOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) closeNavigation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });

  document.addEventListener("click", (event) => {
    if (!header.classList.contains("is-open") || header.contains(event.target)) return;
    closeNavigation();
  });
}

const revealItems = [...document.querySelectorAll(".reveal")];
revealItems.forEach((item, index) => {
  item.style.setProperty("--reveal-delay", `${(index % 5) * 55}ms`);
});

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -7% 0px", threshold: 0.1 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const hero = document.querySelector(".home-hero");
if (hero && finePointer.matches && !reducedMotion.matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    body.style.setProperty("--hero-shift-x", `${((x - 50) * -0.18).toFixed(2)}px`);
    body.style.setProperty("--hero-shift-y", `${((y - 50) * -0.12).toFixed(2)}px`);
  });

  hero.addEventListener("pointerleave", () => {
    body.style.setProperty("--hero-shift-x", "0px");
    body.style.setProperty("--hero-shift-y", "0px");
  });
}

if (finePointer.matches && !reducedMotion.matches) {
  document.querySelectorAll("[data-tilt]").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      element.style.setProperty("--tilt-x", `${(x * 3.2).toFixed(2)}deg`);
      element.style.setProperty("--tilt-y", `${(y * -3.2).toFixed(2)}deg`);
    });

    element.addEventListener("pointerleave", () => {
      element.style.setProperty("--tilt-x", "0deg");
      element.style.setProperty("--tilt-y", "0deg");
    });
  });
}

const setupMissionConsole = () => {
  const consoleElement = document.querySelector("[data-mission-console]");
  if (!consoleElement) return;

  const buttons = [...consoleElement.querySelectorAll("[data-mission-mode]")];
  const title = consoleElement.querySelector("[data-mission-title]");
  const core = consoleElement.querySelector("[data-mission-core]");
  const coreState = consoleElement.querySelector("[data-mission-core-state]");
  const code = consoleElement.querySelector("[data-mission-code]");
  const copy = consoleElement.querySelector("[data-mission-copy]");
  const modes = {
    build: {
      title: "Production system",
      core: "Architecture",
      coreState: "Mapped",
      code: "BUILD / 01",
      copy: "Product experience, identity, APIs, data, cloud, and release engineering move as one system."
    },
    automate: {
      title: "Governed operations",
      core: "Agent crew",
      coreState: "Supervised",
      code: "AUTOMATE / 02",
      copy: "Tool-using agents execute bounded workflows through memory, evaluation, approvals, recovery, and evidence."
    },
    defend: {
      title: "Defended release",
      core: "Attack path",
      coreState: "Validated",
      code: "DEFEND / 03",
      copy: "Threat models, reachable attack paths, remediation, regression checks, and release proof close the loop."
    }
  };

  let activeIndex = 0;
  let paused = false;

  const activate = (button, manual = false) => {
    const mode = button.dataset.missionMode;
    const data = modes[mode];
    if (!data) return;

    activeIndex = buttons.indexOf(button);
    consoleElement.dataset.activeMode = mode;
    buttons.forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    title.textContent = data.title;
    core.textContent = data.core;
    coreState.textContent = data.coreState;
    code.textContent = data.code;
    copy.textContent = data.copy;

    if (manual) paused = true;
  };

  buttons.forEach((button) => button.addEventListener("click", () => activate(button, true)));
  consoleElement.addEventListener("pointerenter", () => {
    paused = true;
  });
  consoleElement.addEventListener("pointerleave", () => {
    paused = false;
  });
  consoleElement.addEventListener("focusin", () => {
    paused = true;
  });
  consoleElement.addEventListener("focusout", () => {
    paused = false;
  });

  if (!reducedMotion.matches) {
    window.setInterval(() => {
      if (paused || document.hidden) return;
      activate(buttons[(activeIndex + 1) % buttons.length]);
    }, 5200);
  }
};

setupMissionConsole();

const setupProductStage = () => {
  const stage = document.querySelector("[data-product-stage]");
  if (!stage) return;

  const buttons = [...stage.querySelectorAll("[data-product-name]")];
  const view = stage.querySelector(".product-stage-view");
  const image = stage.querySelector("[data-stage-image]");
  const tag = stage.querySelector("[data-stage-tag]");
  const name = stage.querySelector("[data-stage-name]");
  const description = stage.querySelector("[data-stage-description]");
  const link = stage.querySelector("[data-stage-link]");
  let activeIndex = 0;
  let paused = false;

  const activate = (button, manual = false) => {
    activeIndex = buttons.indexOf(button);
    buttons.forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    view.classList.add("is-switching");

    window.setTimeout(() => {
      image.src = button.dataset.productImage;
      image.alt = button.dataset.productAlt;
      tag.textContent = button.dataset.productTag;
      name.textContent = button.dataset.productName;
      description.textContent = button.dataset.productDescription;
      link.href = button.dataset.productHref;
      link.textContent = button.dataset.productLink;
      view.classList.remove("is-switching");
    }, reducedMotion.matches ? 0 : 150);

    if (manual) paused = true;
  };

  buttons.forEach((button) => button.addEventListener("click", () => activate(button, true)));
  stage.addEventListener("pointerenter", () => {
    paused = true;
  });
  stage.addEventListener("pointerleave", () => {
    paused = false;
  });
  stage.addEventListener("focusin", () => {
    paused = true;
  });
  stage.addEventListener("focusout", () => {
    paused = false;
  });

  if (!reducedMotion.matches) {
    window.setInterval(() => {
      if (paused || document.hidden) return;
      activate(buttons[(activeIndex + 1) % buttons.length]);
    }, 5600);
  }
};

setupProductStage();

const setupBlueprint = () => {
  const blueprint = document.querySelector("[data-blueprint]");
  if (!blueprint) return;

  const buttons = [...blueprint.querySelectorAll("[data-blueprint-mode]")];
  const title = blueprint.querySelector("[data-blueprint-title]:not(button)");
  const copy = blueprint.querySelector(".blueprint-readout [data-blueprint-copy]");
  const result = blueprint.querySelector("[data-blueprint-result]:not(button)");
  const nodeOne = blueprint.querySelector("[data-blueprint-node-one]");
  const nodeTwo = blueprint.querySelector("[data-blueprint-node-two]");
  const nodeThree = blueprint.querySelector("[data-blueprint-node-three]");
  const nodeFour = blueprint.querySelector("[data-blueprint-node-four]");
  const nodeContent = {
    product: ["Responsive product UX", "Workflow + decision logic", "Identity + evidence", "Cloud + release gates"],
    agents: ["Mission control UX", "Tools + memory + evaluation", "Approvals + audit", "Workers + recovery"],
    security: ["Abuse-aware experience", "Attack-path analysis", "Controls + validation", "Regression + release proof"]
  };

  const activate = (button) => {
    const mode = button.dataset.blueprintMode;
    const nodes = nodeContent[mode];
    if (!nodes) return;

    blueprint.dataset.activeMode = mode;
    buttons.forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    title.textContent = button.dataset.blueprintTitle;
    copy.textContent = button.dataset.blueprintCopy;
    result.textContent = button.dataset.blueprintResult;
    [nodeOne, nodeTwo, nodeThree, nodeFour].forEach((node, index) => {
      node.textContent = nodes[index];
    });
  };

  buttons.forEach((button) => button.addEventListener("click", () => activate(button)));
};

setupBlueprint();

const setupDefenseConsole = () => {
  const defense = document.querySelector("[data-defense-console]");
  if (!defense) return;

  const buttons = [...defense.querySelectorAll("[data-defense-stage]")];
  const code = defense.querySelector(".defense-display [data-defense-code]");
  const title = defense.querySelector(".defense-display [data-defense-title]");
  const copy = defense.querySelector(".defense-display [data-defense-copy]");
  const evidence = defense.querySelector(".defense-display [data-defense-evidence]");
  let activeIndex = 0;
  let paused = false;

  const activate = (button, manual = false) => {
    activeIndex = buttons.indexOf(button);
    defense.dataset.activeStage = button.dataset.defenseStage;
    buttons.forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    code.textContent = button.dataset.defenseCode;
    title.textContent = button.dataset.defenseTitle;
    copy.textContent = button.dataset.defenseCopy;
    evidence.textContent = button.dataset.defenseEvidence;
    if (manual) paused = true;
  };

  buttons.forEach((button) => button.addEventListener("click", () => activate(button, true)));
  defense.addEventListener("pointerenter", () => {
    paused = true;
  });
  defense.addEventListener("pointerleave", () => {
    paused = false;
  });

  if (!reducedMotion.matches) {
    window.setInterval(() => {
      if (paused || document.hidden) return;
      activate(buttons[(activeIndex + 1) % buttons.length]);
    }, 5000);
  }
};

setupDefenseConsole();

document.querySelectorAll("[role='tablist']").forEach((tablist, tablistIndex) => {
  const tabs = [...tablist.querySelectorAll("[role='tab']")];
  if (tabs.length === 0) return;

  const root = tablist.closest("[data-mission-console], [data-product-stage], [data-blueprint], .defense-console");
  const panel = root?.querySelector(".mission-viewport, .product-stage-view, .blueprint-console, .defense-display");
  tablist.id ||= `interactive-tabs-${tablistIndex + 1}`;
  if (panel) {
    panel.id ||= `${tablist.id}-panel`;
    panel.setAttribute("role", "tabpanel");
    tabs.forEach((tab, tabIndex) => {
      tab.id ||= `${tablist.id}-tab-${tabIndex + 1}`;
      tab.setAttribute("aria-controls", panel.id);
    });
  }

  const syncTabStops = () => {
    tabs.forEach((tab) => {
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
    });
    const selectedTab = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
    if (panel && selectedTab) panel.setAttribute("aria-labelledby", selectedTab.id);
  };

  tablist.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;

    const currentIndex = Math.max(0, tabs.indexOf(document.activeElement));
    const previous = event.key === "ArrowLeft" || event.key === "ArrowUp";
    let nextIndex = previous ? currentIndex - 1 : currentIndex + 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    nextIndex = (nextIndex + tabs.length) % tabs.length;

    event.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  });

  new MutationObserver(syncTabStops).observe(tablist, {
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-selected"]
  });
  syncTabStops();
});

const setupProductDock = () => {
  const dock = document.querySelector("[data-product-dock]");
  const sections = [...document.querySelectorAll("[data-product-section]")];
  if (!dock || sections.length === 0 || !("IntersectionObserver" in window)) return;

  const links = [...dock.querySelectorAll("[data-product-link]")];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.dataset.productSection;
        links.forEach((link) => link.classList.toggle("is-active", link.dataset.productLink === id));
      });
    },
    { rootMargin: "-28% 0px -58% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
};

setupProductDock();

document.querySelectorAll(".attack-sequence").forEach((sequence) => {
  const stages = [...sequence.querySelectorAll(".attack-stage")];
  if (stages.length === 0) return;

  let activeIndex = 0;
  stages[0].classList.add("is-active");

  if (!reducedMotion.matches) {
    window.setInterval(() => {
      const bounds = sequence.getBoundingClientRect();
      const visible = bounds.top < window.innerHeight && bounds.bottom > 0;
      if (!visible || document.hidden) return;
      stages[activeIndex].classList.remove("is-active");
      activeIndex = (activeIndex + 1) % stages.length;
      stages[activeIndex].classList.add("is-active");
    }, 1900);
  }
});

const setStatus = (form, message, tone = "neutral") => {
  const status = form.querySelector("[data-form-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
};

const buildMailtoUrl = (payload) => {
  const projectType = String(payload.projectType || "Project inquiry").trim();
  const subject = `Grayston project inquiry: ${projectType}`;
  const message = [
    `Name: ${payload.name || ""}`,
    `Email: ${payload.email || ""}`,
    `Company: ${payload.company || "Not provided"}`,
    `Project type: ${payload.projectType || "Not provided"}`,
    `Timeline: ${payload.timeline || "Not provided"}`,
    `Budget: ${payload.budget || "Not provided"}`,
    "",
    String(payload.message || "")
  ].join("\n");

  return `mailto:jforster@graystontechnologies.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
};

const setEmailFallbackStatus = (form, message, payload) => {
  const status = form.querySelector("[data-form-status]");
  if (!status) return;

  const link = document.createElement("a");
  link.href = buildMailtoUrl(payload);
  link.textContent = "Open a prefilled email instead.";

  status.textContent = `${message} `;
  status.append(link);
  status.dataset.tone = "error";
};

const setupContactBrief = () => {
  if (!contactForm) return;

  const name = contactForm.elements.namedItem("name");
  const email = contactForm.elements.namedItem("email");
  const projectType = contactForm.elements.namedItem("projectType");
  const timeline = contactForm.elements.namedItem("timeline");
  const message = contactForm.elements.namedItem("message");
  const progressText = document.querySelector("[data-brief-progress]");
  const meter = document.querySelector("[data-brief-meter]");
  const contactPreview = document.querySelector("[data-brief-contact]");
  const systemPreview = document.querySelector("[data-brief-system]");
  const timelinePreview = document.querySelector("[data-brief-timeline]");
  const outcomePreview = document.querySelector("[data-brief-outcome]");
  const presets = [...document.querySelectorAll("[data-project-preset]")];

  const updateBrief = () => {
    const nameValue = name.value.trim();
    const emailValue = email.value.trim();
    const typeValue = projectType.value.trim();
    const messageValue = message.value.trim();
    const signals = [nameValue.length > 1, email.validity.valid && emailValue.length > 3, typeValue.length > 0, messageValue.length >= 20];
    const completed = signals.filter(Boolean).length;

    progressText.textContent = `${completed} of 4 signals`;
    meter.style.width = `${completed * 25}%`;
    contactPreview.textContent = nameValue || emailValue ? [nameValue, emailValue].filter(Boolean).join(" / ") : "Awaiting name and email";
    systemPreview.textContent = typeValue || "Not selected";
    timelinePreview.textContent = timeline.value || "Not selected";
    outcomePreview.textContent = messageValue ? `${messageValue.slice(0, 72)}${messageValue.length > 72 ? "..." : ""}` : "Awaiting project context";
    presets.forEach((preset) => {
      const isActive = preset.dataset.projectPreset === typeValue;
      preset.classList.toggle("is-active", isActive);
      preset.setAttribute("aria-pressed", String(isActive));
    });
  };

  contactForm.addEventListener("input", updateBrief);
  contactForm.addEventListener("change", updateBrief);
  presets.forEach((preset) => {
    preset.addEventListener("click", () => {
      projectType.value = preset.dataset.projectPreset;
      projectType.dispatchEvent(new Event("change", { bubbles: true }));
      projectType.focus({ preventScroll: true });
    });
  });
  updateBrief();
};

setupContactBrief();

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setStatus(form, "Sending project details...", "neutral");
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "The form could not send right now.");
      }

      form.reset();
      form.dispatchEvent(new Event("change", { bubbles: true }));
      setStatus(form, "Sent. Grayston will follow up from jforster@graystontechnologies.com.", "success");
    } catch (error) {
      setEmailFallbackStatus(form, error.message || "The form could not send right now.", payload);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link || event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target === "_blank" || link.hasAttribute("download")) return;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin) return;
  if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash) return;
  if (reducedMotion.matches) return;

  event.preventDefault();
  body.classList.add("is-leaving");
  window.setTimeout(() => {
    window.location.href = destination.href;
  }, 360);
});

window.addEventListener("pageshow", () => body.classList.remove("is-leaving"));

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

root.classList.add("js");

function initializeHeader() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.querySelector("#site-nav");
  if (!header || !toggle || !navigation) return;

  const closeNavigation = () => {
    toggle.setAttribute("aria-expanded", "false");
    header.classList.remove("nav-open");
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    header.classList.toggle("nav-open", !open);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) closeNavigation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });

  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 18);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initializeProgress() {
  const progress = document.querySelector("[data-scroll-progress]");
  if (!progress) return;

  const update = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = distance > 0 ? Math.min(window.scrollY / distance, 1) : 0;
    progress.style.transform = `scaleX(${ratio})`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
}

function initializeReveals() {
  const elements = [...document.querySelectorAll(".reveal")];
  if (!elements.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
  );

  elements.forEach((element) => observer.observe(element));
}

function initializeHomeSelector() {
  const selector = document.querySelector("[data-solution-selector]");
  if (!selector) return;

  const options = {
    launch: {
      eyebrow: "0-to-1 product",
      title: "A working product slice in days, with the production path already mapped.",
      copy: "Grayston owns the interface, architecture, identity, data, integrations, cloud, and release system together. The first slice proves the core workflow before the platform expands.",
      proof: ["Clickable product surface", "Production architecture", "Release plan + risk register"],
      pace: "First working slice: typically days 3-10",
    },
    agents: {
      eyebrow: "Agent systems",
      title: "Autonomous execution with tools, evidence, and human authority built in.",
      copy: "Specialized agents receive bounded missions, use governed tools, preserve evidence, and stop at explicit approval gates. Evaluation and observability are part of the system, not an afterthought.",
      proof: ["Tool and policy design", "Evaluation harness", "Human-controlled release gates"],
      pace: "First bounded workflow: typically within 10 days",
    },
    rescue: {
      eyebrow: "Platform rescue",
      title: "Stabilize the system, surface the real risk, and regain release momentum.",
      copy: "Grayston traces the architecture, build path, runtime failures, data boundaries, and deployment state, then works the highest-impact path from evidence to a controlled release.",
      proof: ["Failure map", "Prioritized recovery plan", "Verified production repair"],
      pace: "Initial recovery brief: within 48 hours",
    },
    secure: {
      eyebrow: "Security engineering",
      title: "Find the reachable attack path, close it, and prove it stays closed.",
      copy: "Threat modeling, identity review, code analysis, cloud posture, dependency paths, validation, remediation, retest, and release decisions are handled as one adversarial engineering loop.",
      proof: ["Attack-path register", "Validated findings", "Retest evidence + release gate"],
      pace: "Initial attack-surface map: within 48 hours",
    },
  };

  const buttons = [...selector.querySelectorAll("[data-solution-key]")];
  const eyebrow = selector.querySelector("[data-solution-eyebrow]");
  const title = selector.querySelector("[data-solution-title]");
  const copy = selector.querySelector("[data-solution-copy]");
  const proof = selector.querySelector("[data-solution-proof]");
  const pace = selector.querySelector("[data-solution-pace]");

  const select = (key) => {
    const data = options[key];
    if (!data) return;
    buttons.forEach((button) => {
      const selected = button.dataset.solutionKey === key;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    eyebrow.textContent = data.eyebrow;
    title.textContent = data.title;
    copy.textContent = data.copy;
    proof.innerHTML = data.proof.map((item) => `<li>${item}</li>`).join("");
    pace.textContent = data.pace;
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(button.dataset.solutionKey));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
      const next = buttons[(index + direction + buttons.length) % buttons.length];
      next.focus();
      select(next.dataset.solutionKey);
    });
  });
}

function initializePlanner() {
  const planner = document.querySelector("[data-build-planner]");
  if (!planner) return;

  const plans = {
    product: {
      label: "Launch a product",
      result: "Production architecture + working core experience",
      first: "48 hours",
      slice: "Days 3-10",
      path: "Focused weeks",
      scope: "Product strategy, UX, identity, APIs, data, cloud, observability, and release ownership.",
      steps: ["Bound the highest-value workflow", "Ship the real vertical slice", "Expand behind tested contracts", "Release with rollback and telemetry"],
    },
    agent: {
      label: "Deploy agents",
      result: "Bounded mission + evaluated tool-use workflow",
      first: "48 hours",
      slice: "Week 1",
      path: "Focused weeks",
      scope: "Agent roles, tools, memory, retrieval, approval policy, evaluation, evidence, and operating controls.",
      steps: ["Define mission and authority", "Connect governed tools", "Evaluate success and failure", "Release behind human control"],
    },
    rescue: {
      label: "Rescue a platform",
      result: "Failure map + prioritized path back to release",
      first: "24-48 hours",
      slice: "First week",
      path: "By evidence",
      scope: "Architecture, code, data, deployment, security, observability, and the release blockers that matter most.",
      steps: ["Reproduce the real failure", "Trace blast radius", "Repair the highest-risk path", "Prove production behavior"],
    },
    security: {
      label: "Harden a system",
      result: "Attack-surface map + validated review plan",
      first: "48 hours",
      slice: "Week 1",
      path: "Risk-driven",
      scope: "Threat model, attack paths, identity, code, cloud, dependencies, data, remediation, and retest.",
      steps: ["Map assets and trust", "Discover reachable weakness", "Validate real impact", "Fix, retest, and gate release"],
    },
  };

  const buttons = [...planner.querySelectorAll("[data-plan-key]")];
  const fields = {
    label: planner.querySelector("[data-plan-label]"),
    result: planner.querySelector("[data-plan-result]"),
    first: planner.querySelector("[data-plan-first]"),
    slice: planner.querySelector("[data-plan-slice]"),
    path: planner.querySelector("[data-plan-path]"),
    scope: planner.querySelector("[data-plan-scope]"),
    steps: planner.querySelector("[data-plan-steps]"),
    link: planner.querySelector("[data-plan-link]"),
  };

  const choose = (key) => {
    const plan = plans[key];
    if (!plan) return;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.planKey === key)));
    Object.entries(fields).forEach(([name, element]) => {
      if (!element || name === "steps" || name === "link") return;
      element.textContent = plan[name];
    });
    fields.steps.innerHTML = plan.steps.map((step, index) => `<li><span>0${index + 1}</span>${step}</li>`).join("");
    fields.link.href = `/contact?focus=${encodeURIComponent(key)}#intake`;
  };

  buttons.forEach((button) => button.addEventListener("click", () => choose(button.dataset.planKey)));
}

function initializeProductStage() {
  const stage = document.querySelector("[data-product-stage]");
  if (!stage) return;

  const buttons = [...stage.querySelectorAll("[data-product-name]")];
  const image = stage.querySelector("[data-stage-image]");
  const name = stage.querySelector("[data-stage-name]");
  const tag = stage.querySelector("[data-stage-tag]");
  const description = stage.querySelector("[data-stage-description]");
  const link = stage.querySelector("[data-stage-link]");
  const view = stage.querySelector(".product-stage-view");
  let requestId = 0;

  const select = (button) => {
    const nextSource = button.dataset.productImage;
    const selectionId = ++requestId;
    buttons.forEach((item) => item.setAttribute("aria-selected", String(item === button)));

    const update = () => {
      image.src = nextSource;
      image.alt = button.dataset.productAlt;
      name.textContent = button.dataset.productName;
      tag.textContent = button.dataset.productTag;
      description.textContent = button.dataset.productDescription;
      link.href = button.dataset.productHref;
      link.textContent = button.dataset.productLink;
    };

    if (image.getAttribute("src") === nextSource) {
      view.removeAttribute("aria-busy");
      return;
    }

    view.setAttribute("aria-busy", "true");
    const preload = new Image();
    preload.decoding = "async";
    preload.onload = async () => {
      try {
        await preload.decode();
      } catch {
        // The load event already confirmed usable image data.
      }
      if (selectionId !== requestId) return;
      if (reduceMotion) {
        update();
        try {
          await image.decode();
        } catch {
          // Keep the loaded fallback if decode() is unavailable.
        }
        view.removeAttribute("aria-busy");
        return;
      }

      image.classList.add("is-switching");
      window.setTimeout(async () => {
        if (selectionId !== requestId) return;
        update();
        try {
          await image.decode();
        } catch {
          // The image load handler remains the browser fallback.
        }
        if (selectionId !== requestId) return;
        window.requestAnimationFrame(() => {
          image.classList.remove("is-switching");
          view.removeAttribute("aria-busy");
        });
      }, 120);
    };
    preload.onerror = () => {
      if (selectionId === requestId) view.removeAttribute("aria-busy");
    };
    preload.src = nextSource;
  };

  buttons.forEach((button) => {
    const warm = () => {
      const preload = new Image();
      preload.src = button.dataset.productImage;
    };
    button.addEventListener("pointerenter", warm, { once: true });
    button.addEventListener("focus", warm, { once: true });
    button.addEventListener("click", () => select(button));
  });
}

function initializeReviewPacket() {
  const packet = document.querySelector("[data-review-packet]");
  if (!packet) return;

  const tabs = [...packet.querySelectorAll("[data-review-tab]")];
  const panels = [...packet.querySelectorAll("[data-review-panel]")];

  const select = (key, focus = false) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.reviewTab === key;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.reviewPanel !== key;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab.dataset.reviewTab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(index + direction + tabs.length) % tabs.length];
      select(next.dataset.reviewTab, true);
    });
  });
}

function initializeProductNavigation() {
  const links = [...document.querySelectorAll("[data-product-nav] a")];
  if (!links.length || !("IntersectionObserver" in window)) return;

  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
      });
    },
    { rootMargin: "-30% 0px -58% 0px", threshold: 0 },
  );
  sections.forEach((section) => observer.observe(section));
}

function initializeContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");
  const project = form.elements.projectType;
  const name = form.elements.name;
  const email = form.elements.email;
  const timeline = form.elements.timeline;
  const message = form.elements.message;
  const submit = form.querySelector("button[type='submit']");
  const progress = document.querySelector("[data-brief-progress]");
  const meter = document.querySelector("[data-brief-meter]");
  const contactOutput = document.querySelector("[data-brief-contact]");
  const systemOutput = document.querySelector("[data-brief-system]");
  const timelineOutput = document.querySelector("[data-brief-timeline]");
  const outcomeOutput = document.querySelector("[data-brief-outcome]");

  const focusMap = {
    product: "AI-native SaaS or product platform",
    agent: "Autonomous agents and orchestration",
    rescue: "Platform rescue",
    security: "Cybersecurity review and hardening",
  };
  const focus = new URLSearchParams(window.location.search).get("focus");
  if (focusMap[focus]) project.value = focusMap[focus];

  const updateBrief = () => {
    const signals = [name.value.trim() && email.validity.valid, project.value, timeline.value, message.value.trim().length >= 12];
    const count = signals.filter(Boolean).length;
    if (progress) progress.textContent = `${count} of 4 signals`;
    if (meter) meter.style.transform = `scaleX(${count / 4})`;
    if (contactOutput) contactOutput.textContent = signals[0] ? `${name.value.trim()} / ${email.value.trim()}` : "Awaiting name and email";
    if (systemOutput) systemOutput.textContent = project.value || "Not selected";
    if (timelineOutput) timelineOutput.textContent = timeline.value || "ASAP";
    if (outcomeOutput) outcomeOutput.textContent = signals[3] ? "Context captured" : "Awaiting project context";
  };

  form.addEventListener("input", updateBrief);
  form.addEventListener("change", updateBrief);

  document.querySelectorAll("[data-project-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      project.value = button.dataset.projectPreset;
      document.querySelectorAll("[data-project-preset]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      updateBrief();
      project.focus();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Sending securely...";
    status.className = "form-status is-loading";
    submit.disabled = true;

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Message could not be sent.");
      status.textContent = "Received. James will respond directly.";
      status.className = "form-status is-success";
      form.reset();
      document.querySelectorAll("[data-project-preset]").forEach((item) => item.setAttribute("aria-pressed", "false"));
      updateBrief();
    } catch (error) {
      status.textContent = `${error.message} Email jforster@graystontechnologies.com if the issue continues.`;
      status.className = "form-status is-error";
    } finally {
      submit.disabled = false;
    }
  });

  updateBrief();
}

function initializeYear() {
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

initializeHeader();
initializeProgress();
initializeReveals();
initializeHomeSelector();
initializePlanner();
initializeProductStage();
initializeReviewPacket();
initializeProductNavigation();
initializeContactForm();
initializeYear();

window.requestAnimationFrame(() => document.body.classList.add("is-ready"));

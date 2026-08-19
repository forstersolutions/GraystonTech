const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

root.classList.add("js");

function setSelected(buttons, activeButton) {
  buttons.forEach((button) => {
    const selected = button === activeButton;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

function bindTabs(buttons, onSelect) {
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => onSelect(button));
    button.addEventListener("keydown", (event) => {
      const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (index + 1) % buttons.length;
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (index - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = buttons.length - 1;

      const next = buttons[nextIndex];
      next.focus();
      onSelect(next);
    });
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try {
        await image.decode();
      } catch {
        // The load event already confirms that the browser can use the image.
      }
      resolve(image);
    };
    image.onerror = reject;
    image.src = source;
  });
}

async function transitionImage(container, image, source, commit) {
  if (!container || !image) return;
  if (image.getAttribute("src") === source) {
    commit();
    return;
  }

  container.classList.add("is-switching");
  container.setAttribute("aria-busy", "true");
  try {
    await loadImage(source);
    const accepted = commit();
    if (accepted === false) return;
    image.src = source;
    try {
      await image.decode();
    } catch {
      // Decoding support varies; the preloaded source is still usable.
    }
  } catch {
    return;
  } finally {
    window.requestAnimationFrame(() => {
      container.classList.remove("is-switching");
      container.removeAttribute("aria-busy");
    });
  }
}

function initializeEntry() {
  const entry = document.querySelector("[data-entry]");
  document.body.classList.add("is-ready");
  if (!entry) return;

  const navigationEntry = performance.getEntriesByType("navigation")[0];
  const restored = navigationEntry && navigationEntry.type === "back_forward";
  if (reduceMotion || restored) {
    entry.classList.add("is-complete");
    return;
  }

  document.body.classList.add("is-entering");
  window.requestAnimationFrame(() => entry.classList.add("is-ready"));
  window.setTimeout(() => entry.classList.add("is-opening"), 980);
  window.setTimeout(() => {
    entry.classList.add("is-complete");
    document.body.classList.remove("is-entering");
  }, 1690);
}

function initializeHeader() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.querySelector("#site-nav");
  if (!header || !toggle || !navigation) return;

  const closeNavigation = () => {
    toggle.setAttribute("aria-expanded", "false");
    header.classList.remove("nav-open");
    document.body.classList.remove("nav-open");
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    header.classList.toggle("nav-open", open);
    document.body.classList.toggle("nav-open", open);
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeNavigation();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (event.matches) closeNavigation();
  });

  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 18);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initializeProgress() {
  const progress = document.querySelector("[data-scroll-progress]");
  if (!progress) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = distance > 0 ? Math.min(Math.max(window.scrollY / distance, 0), 1) : 0;
    progress.style.transform = `scaleX(${ratio})`;
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
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
    { threshold: 0.08, rootMargin: "0px 0px -7% 0px" },
  );
  elements.forEach((element) => observer.observe(element));
}

function initializeHeroProducts() {
  const stage = document.querySelector("[data-hero-stage]");
  if (!stage) return;

  const buttons = [...stage.querySelectorAll("[data-hero-product]")];
  const frame = stage.querySelector(".hero-product-main");
  const image = stage.querySelector("[data-hero-image]");
  const label = stage.querySelector("[data-hero-label]");
  const kicker = stage.querySelector("[data-hero-kicker]");
  const title = stage.querySelector("[data-hero-title]");
  const copy = stage.querySelector("[data-hero-copy]");
  let selection = 0;

  const select = async (button) => {
    const current = ++selection;
    setSelected(buttons, button);
    await transitionImage(frame, image, button.dataset.image, () => {
      if (current !== selection) return false;
      image.alt = button.dataset.alt;
      label.textContent = button.dataset.label;
      kicker.textContent = button.dataset.kicker;
      title.textContent = button.dataset.title;
      copy.textContent = button.dataset.copy;
      return true;
    });
  };

  buttons.forEach((button) => {
    const warm = () => loadImage(button.dataset.image).catch(() => {});
    button.addEventListener("pointerenter", warm, { once: true });
    button.addEventListener("focus", warm, { once: true });
  });
  bindTabs(buttons, select);
}

function initializeCapabilityDeck() {
  const deck = document.querySelector("[data-capability-deck]");
  if (!deck) return;

  const capabilities = {
    product: {
      kicker: "PRODUCT ENGINEERING",
      title: "Build the complete product, not a disconnected feature pile.",
      copy: "Product strategy, interface design, application architecture, identity, data, APIs, integrations, billing, analytics, and release operations are engineered together.",
      list: ["0-to-1 architecture and product UX", "Responsive web, SaaS, and desktop surfaces", "Multi-tenant identity, billing, data, and administration", "CI/CD, observability, release, and production support"],
      image: "/assets/product-mypokermaps.webp",
      alt: "MyPokerMaps web platform interface",
      evidence: "Evidence / multi-surface product ecosystem",
      product: "MyPokerMaps",
      href: "/services#product-engineering",
      link: "Explore product engineering",
    },
    mobile: {
      kicker: "NATIVE + CROSS-PLATFORM MOBILE",
      title: "Mobile software designed around the device, not squeezed into it.",
      copy: "Grayston builds native iOS and Android applications as well as carefully chosen cross-platform systems, including offline behavior, device capabilities, subscriptions, notifications, telemetry, and store delivery.",
      list: ["Swift, SwiftUI, Kotlin, and modern native architecture", "React Native and Capacitor where the product economics fit", "Offline state, device services, deep links, and notifications", "App Store and Google Play release engineering"],
      image: "/assets/product-mypokermaps.webp",
      alt: "MyPokerMaps multi-surface product interface",
      evidence: "Evidence / web and mobile product ecosystem",
      product: "MyPokerMaps",
      href: "/services#native-mobile",
      link: "Explore mobile engineering",
    },
    intelligence: {
      kicker: "AI + INTELLIGENT SYSTEMS",
      title: "Put models and agents inside a system people can trust and operate.",
      copy: "Agents, retrieval, machine learning, automation, evaluation, tool use, memory, approval policy, and operational evidence are designed as product infrastructure rather than isolated demonstrations.",
      list: ["Autonomous and human-supervised agent workflows", "RAG, structured retrieval, memory, and tool orchestration", "Machine-learning pipelines, scoring, and evaluation", "Authority boundaries, evidence, observability, and fallback"],
      image: "/assets/product-verityforge.webp",
      alt: "VerityForge intelligent delivery control plane",
      evidence: "Evidence / governed multi-agent execution",
      product: "VerityForge",
      href: "/services#ai-systems",
      link: "Explore intelligent systems",
    },
    platform: {
      kicker: "CLOUD + PLATFORM ENGINEERING",
      title: "Make identity, data, APIs, integrations, and operations behave as one platform.",
      copy: "Grayston designs cloud systems for real operating pressure: explicit tenancy, reliable data movement, durable jobs, integration contracts, observability, migration discipline, and controlled releases.",
      list: ["AWS, Azure, Vercel, serverless, and container workloads", "APIs, events, queues, webhooks, and third-party integrations", "Relational data, analytics, migrations, and governed export", "Identity, permissions, monitoring, recovery, and runbooks"],
      image: "/assets/product-qrystaldrop-dashboard.webp",
      alt: "QrystalDrop enterprise platform dashboard",
      evidence: "Evidence / secure enterprise platform operations",
      product: "QrystalDrop",
      href: "/services#cloud-platform",
      link: "Explore platform engineering",
    },
    security: {
      kicker: "CYBERSECURITY ENGINEERING",
      title: "Trace reachable attack paths, repair the system, and prove the boundary holds.",
      copy: "Threat modeling, source and architecture review, identity, cloud, APIs, dependencies, data movement, autonomous behavior, validation, remediation, and retest form one engineering loop.",
      list: ["Threat and abuse modeling across the full system", "Identity, tenant isolation, API, cloud, and data review", "Agent authority, prompt-injection, tool, and retrieval boundaries", "Evidence-backed remediation, retest, and release gates"],
      image: "/assets/product-qrystaldrop-dashboard.webp",
      alt: "QrystalDrop secure enterprise workspace",
      evidence: "Evidence / security designed into the product",
      product: "QrystalDrop",
      href: "/security",
      link: "Explore security engineering",
    },
    modernize: {
      kicker: "MODERNIZATION + PLATFORM RESCUE",
      title: "Recover difficult systems without losing what still works.",
      copy: "Grayston reproduces the real behavior, maps architecture and release risk, stabilizes the critical path, and modernizes behind clear contracts so the business can keep moving.",
      list: ["Architecture and codebase recovery", "Runtime, data, deployment, and integration diagnosis", "Incremental migrations with rollback paths", "Performance, reliability, security, and release restoration"],
      image: "/assets/product-feltos.webp",
      alt: "FeltOS modern operations platform interface",
      evidence: "Evidence / complex workflows unified and modernized",
      product: "FeltOS",
      href: "/services#modernization",
      link: "Explore modernization",
    },
  };

  const buttons = [...deck.querySelectorAll("[data-capability-key]")];
  const media = deck.querySelector(".capability-media");
  const image = deck.querySelector("[data-capability-image]");
  const fields = {
    kicker: deck.querySelector("[data-capability-kicker]"),
    title: deck.querySelector("[data-capability-title]"),
    copy: deck.querySelector("[data-capability-copy]"),
    list: deck.querySelector("[data-capability-list]"),
    evidence: deck.querySelector("[data-capability-evidence]"),
    product: deck.querySelector("[data-capability-product]"),
    link: deck.querySelector(".capability-copy .text-link"),
  };
  let selection = 0;

  const select = async (button) => {
    const data = capabilities[button.dataset.capabilityKey];
    if (!data) return;
    const current = ++selection;
    setSelected(buttons, button);
    await transitionImage(media, image, data.image, () => {
      if (current !== selection) return false;
      fields.kicker.textContent = data.kicker;
      fields.title.textContent = data.title;
      fields.copy.textContent = data.copy;
      fields.list.innerHTML = data.list.map((item) => `<li>${item}</li>`).join("");
      fields.evidence.textContent = data.evidence;
      fields.product.textContent = data.product;
      fields.link.href = data.href;
      fields.link.innerHTML = `${data.link} <span aria-hidden="true">&#8599;</span>`;
      image.alt = data.alt;
      return true;
    });
  };
  bindTabs(buttons, select);
}

function initializeWorkStory() {
  const story = document.querySelector("[data-work-story]");
  if (!story) return;

  const chapters = [...story.querySelectorAll("[data-work-chapter]")];
  const visual = story.querySelector(".work-visual");
  const image = story.querySelector("[data-work-image]");
  const kicker = story.querySelector("[data-work-kicker]");
  const name = story.querySelector("[data-work-name]");
  const link = story.querySelector("[data-work-link]");
  let activeChapter = chapters[0];
  let selection = 0;

  const activate = async (chapter) => {
    if (!chapter || chapter === activeChapter) return;
    activeChapter = chapter;
    const current = ++selection;
    chapters.forEach((item) => item.classList.toggle("is-active", item === chapter));
    await transitionImage(visual, image, chapter.dataset.image, () => {
      if (current !== selection) return false;
      image.alt = chapter.dataset.alt;
      kicker.textContent = chapter.dataset.kicker;
      name.textContent = chapter.dataset.name;
      link.href = chapter.dataset.href;
      return true;
    });
  };

  if (!("IntersectionObserver" in window) || window.matchMedia("(max-width: 900px)").matches) return;
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activate(visible.target);
    },
    { threshold: [0.28, 0.5, 0.72], rootMargin: "-22% 0px -22% 0px" },
  );
  chapters.forEach((chapter) => observer.observe(chapter));
}

function initializePaceTrack() {
  const track = document.querySelector("[data-progress-track]");
  if (!track) return;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    track.style.setProperty("--track-progress", "100%");
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      track.style.setProperty("--track-progress", "100%");
      observer.disconnect();
    },
    { threshold: 0.35 },
  );
  observer.observe(track);
}

function initializeSecurityConsole() {
  const consoleElement = document.querySelector("[data-security-console]");
  if (!consoleElement) return;

  const reviews = {
    identity: {
      question: "Can one identity cross a role or tenant boundary?",
      evidence: "Route policy, session behavior, authorization checks, and negative-path tests.",
      gate: "Every privileged action is explicit, least-privilege, and regression protected.",
    },
    data: {
      question: "Can sensitive data move somewhere the owner did not authorize?",
      evidence: "Storage policy, object ownership, query boundaries, exports, logs, and lifecycle traces.",
      gate: "Data movement is scoped, observable, retained intentionally, and tested against cross-boundary access.",
    },
    cloud: {
      question: "Can configuration, credentials, or dependencies turn a defect into control?",
      evidence: "Environment posture, IAM, secret paths, storage, network exposure, build inputs, and deployment history.",
      gate: "Production access is minimal, changes are controlled, and recovery does not depend on undocumented state.",
    },
    agents: {
      question: "Can an autonomous workflow exceed its mission or use untrusted context as authority?",
      evidence: "Tool policy, data access, retrieval boundaries, memory, approval gates, evaluations, and action logs.",
      gate: "Authority is bounded, risky actions require control, and every consequential step leaves reviewable evidence.",
    },
  };

  const buttons = [...consoleElement.querySelectorAll("[data-security-key]")];
  const question = consoleElement.querySelector("[data-security-question]");
  const evidence = consoleElement.querySelector("[data-security-evidence]");
  const gate = consoleElement.querySelector("[data-security-gate]");
  const select = (button) => {
    const review = reviews[button.dataset.securityKey];
    if (!review) return;
    setSelected(buttons, button);
    question.textContent = review.question;
    evidence.textContent = review.evidence;
    gate.textContent = review.gate;
  };
  bindTabs(buttons, select);
}

function initializeSecurityProgram() {
  const program = document.querySelector("[data-security-program]");
  if (!program) return;

  const areas = {
    identity: {
      label: "IDENTITY BOUNDARY REVIEW",
      title: "Prove that identity cannot become authority by accident.",
      summary: "Review authentication, session lifecycle, role derivation, tenant selection, privileged routes, service identities, and administrative actions as one connected boundary.",
      question: "Can I cross a role, tenant, or administrative boundary with a valid account?",
      evidence: "Policy mapping, route traces, negative-path tests, session behavior, and authorization results.",
      gate: "Every privileged action is explicit, server-enforced, least-privilege, and regression protected.",
      outputs: ["Identity + privilege map", "Validated authorization findings", "Remediation and retest evidence"],
    },
    application: {
      label: "APPLICATION + API REVIEW",
      title: "Test the workflow the way an attacker would combine it.",
      summary: "Trace routes, inputs, state transitions, integrations, webhooks, business rules, error handling, and abuse controls across the complete user journey.",
      question: "Can I turn valid features, malformed input, race conditions, or integration behavior into unintended state?",
      evidence: "Request traces, state diagrams, boundary tests, abuse cases, integration contracts, and reproducible findings.",
      gate: "Sensitive state transitions are authorized, validated, idempotent where required, and protected against known abuse paths.",
      outputs: ["Application attack-surface map", "Reproducible exploit paths", "Fixed-path regression coverage"],
    },
    data: {
      label: "DATA + PRIVACY REVIEW",
      title: "Follow sensitive data from collection through deletion.",
      summary: "Examine ownership, tenancy, storage, encryption, queries, files, analytics, exports, logs, retention, deletion, and third-party movement as one lifecycle.",
      question: "Can I access, infer, retain, export, or recover data beyond the owner's intent?",
      evidence: "Data-flow maps, access-policy results, query and object tests, export traces, retention controls, and deletion evidence.",
      gate: "Ownership and purpose remain explicit at every hop, and cross-boundary access fails under verified tests.",
      outputs: ["Sensitive-data flow map", "Boundary and lifecycle findings", "Privacy-control verification"],
    },
    cloud: {
      label: "CLOUD + SUPPLY CHAIN REVIEW",
      title: "Reduce the paths from a build input to production control.",
      summary: "Review environments, IAM, credentials, storage, network exposure, dependencies, CI/CD, artifacts, deployment authority, monitoring, backups, and rollback posture.",
      question: "Can one leaked secret, permissive role, compromised dependency, or deployment path become durable production access?",
      evidence: "Environment inventory, privilege analysis, secret and dependency paths, deployment history, configuration tests, and recovery proof.",
      gate: "Production authority is minimal, build provenance is controlled, and rollback and recovery work from documented state.",
      outputs: ["Cloud control map", "Supply-chain exposure paths", "Hardened release posture"],
    },
    agents: {
      label: "AI + AUTONOMOUS SYSTEM REVIEW",
      title: "Separate untrusted context from permission to act.",
      summary: "Review model inputs, retrieval, memory, tool definitions, credentials, action policy, approval gates, evaluation, observability, and failure containment.",
      question: "Can prompt injection, poisoned context, memory, or tool composition make the system exceed its mission?",
      evidence: "Authority maps, adversarial cases, tool-call traces, evaluation results, approval behavior, and evidence retention.",
      gate: "Untrusted content cannot grant authority, consequential actions are bounded, and failures stop inside a controlled boundary.",
      outputs: ["Agent authority map", "Adversarial evaluation set", "Tool and approval hardening"],
    },
    operations: {
      label: "DETECTION + RESPONSE REVIEW",
      title: "Make abnormal behavior visible before it becomes institutional memory.",
      summary: "Evaluate security telemetry, alert quality, incident access, triage, containment, recovery, communications, evidence preservation, and post-incident controls.",
      question: "Would operators recognize, contain, and reconstruct a real compromise with the evidence available now?",
      evidence: "Log and alert coverage, scenario walkthroughs, runbook execution, recovery tests, ownership mapping, and timeline reconstruction.",
      gate: "High-impact behavior produces actionable signals, accountable response, tested recovery, and evidence for learning.",
      outputs: ["Detection coverage map", "Incident scenario results", "Response and recovery plan"],
    },
  };

  const buttons = [...program.querySelectorAll("[data-security-area]")];
  const fields = {
    label: program.querySelector("[data-program-label]"),
    title: program.querySelector("[data-program-title]"),
    summary: program.querySelector("[data-program-summary]"),
    question: program.querySelector("[data-program-question]"),
    evidence: program.querySelector("[data-program-evidence]"),
    gate: program.querySelector("[data-program-gate]"),
    outputs: program.querySelector("[data-program-outputs]"),
  };
  const select = (button) => {
    const area = areas[button.dataset.securityArea];
    if (!area) return;
    setSelected(buttons, button);
    fields.label.textContent = area.label;
    fields.title.textContent = area.title;
    fields.summary.textContent = area.summary;
    fields.question.textContent = area.question;
    fields.evidence.textContent = area.evidence;
    fields.gate.textContent = area.gate;
    fields.outputs.innerHTML = area.outputs.map((output) => `<li>${output}</li>`).join("");
  };
  bindTabs(buttons, select);
}

function initializePointerDepth() {
  if (!finePointer || reduceMotion) return;

  document.querySelectorAll("[data-depth-stage], [data-hero-stage]").forEach((stage) => {
    const layers = [...stage.querySelectorAll("[data-depth]")];
    let frame = 0;
    let point = { x: 0, y: 0 };
    const render = () => {
      frame = 0;
      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth || 0);
        const scale = depth === 0 ? 0.35 : depth;
        layer.style.setProperty("--shift-x", `${point.x * scale * 12}px`);
        layer.style.setProperty("--shift-y", `${point.y * scale * 8}px`);
        if (depth === 0) {
          layer.style.setProperty("--tilt-x", `${point.y * -1.2}deg`);
          layer.style.setProperty("--tilt-y", `${point.x * 1.8}deg`);
        }
      });
    };
    stage.addEventListener("pointermove", (event) => {
      const bounds = stage.getBoundingClientRect();
      point = {
        x: (event.clientX - bounds.left) / bounds.width - 0.5,
        y: (event.clientY - bounds.top) / bounds.height - 0.5,
      };
      if (!frame) frame = window.requestAnimationFrame(render);
    });
    stage.addEventListener("pointerleave", () => {
      point = { x: 0, y: 0 };
      if (!frame) frame = window.requestAnimationFrame(render);
    });
  });

  document.querySelectorAll("[data-tilt-surface]").forEach((surface) => {
    surface.addEventListener("pointermove", (event) => {
      const bounds = surface.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      surface.style.setProperty("--tilt-x", `${y * -2.2}deg`);
      surface.style.setProperty("--tilt-y", `${x * 3}deg`);
    });
    surface.addEventListener("pointerleave", () => {
      surface.style.setProperty("--tilt-x", "0deg");
      surface.style.setProperty("--tilt-y", "0deg");
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
    { rootMargin: "-28% 0px -60% 0px", threshold: 0 },
  );
  sections.forEach((section) => observer.observe(section));
}

function initializeFaqs() {
  const details = [...document.querySelectorAll(".faq-list details")];
  details.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      details.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

function initializeContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");
  const submit = form.querySelector("button[type='submit']");
  const project = form.elements.projectType;
  const focusMap = {
    product: "Web product or SaaS platform",
    mobile: "Native iOS or Android app",
    intelligence: "AI, ML, RAG, or agent system",
    platform: "Cloud, backend, API, or data platform",
    security: "Cybersecurity review or hardening",
    modernize: "Modernization, migration, or platform rescue",
    rescue: "Modernization, migration, or platform rescue",
  };
  const focus = new URLSearchParams(window.location.search).get("focus");
  if (focusMap[focus]) project.value = focusMap[focus];

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    status.className = "form-status";
    if (!form.checkValidity()) {
      status.textContent = "Complete the required fields before sending.";
      status.classList.add("is-error");
      form.reportValidity();
      return;
    }

    status.textContent = "Sending your project brief...";
    status.classList.add("is-loading");
    submit.disabled = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(form.getAttribute("action") || "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "The project brief could not be sent.");
      status.textContent = "Received. James will respond directly.";
      status.className = "form-status is-success";
      form.reset();
    } catch (error) {
      const message = error.name === "AbortError" ? "The request timed out." : error.message;
      status.textContent = `${message} Email jforster@graystontechnologies.com if the issue continues.`;
      status.className = "form-status is-error";
    } finally {
      window.clearTimeout(timeout);
      submit.disabled = false;
    }
  });
}

function initializeYear() {
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

initializeEntry();
initializeHeader();
initializeProgress();
initializeReveals();
initializeHeroProducts();
initializeCapabilityDeck();
initializeWorkStory();
initializePaceTrack();
initializeSecurityConsole();
initializeSecurityProgram();
initializePointerDepth();
initializeProductNavigation();
initializeFaqs();
initializeContactForm();
initializeYear();

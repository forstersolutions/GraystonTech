const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let tabSetIndex = 0;

root.classList.add("js");

function setSelected(buttons, activeButton) {
  buttons.forEach((button) => {
    const selected = button === activeButton;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

function bindTabs(buttons, onSelect) {
  const setId = ++tabSetIndex;
  const tablist = buttons[0]?.closest("[role='tablist']");
  const scope = tablist?.parentElement;
  const panel = scope ? [...scope.children].find((child) => child.getAttribute("role") === "tabpanel") : null;
  if (panel) {
    if (!panel.id) panel.id = `grayston-tabpanel-${setId}`;
    buttons.forEach((button, index) => {
      if (!button.id) button.id = `grayston-tab-${setId}-${index + 1}`;
      button.setAttribute("aria-controls", panel.id);
    });
  }

  const initial = buttons.find((button) => button.getAttribute("aria-selected") === "true") || buttons[0];
  if (initial) {
    setSelected(buttons, initial);
    if (panel) panel.setAttribute("aria-labelledby", initial.id);
  }

  const activate = (button) => {
    scope?.dispatchEvent(new CustomEvent("grayston:module-will-change", { detail: { button } }));
    onSelect(button);
    if (panel) panel.setAttribute("aria-labelledby", button.id);
    scope?.dispatchEvent(new CustomEvent("grayston:module-change", { detail: { button } }));
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => activate(button));
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
      activate(next);
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

  container.dispatchEvent(new CustomEvent("grayston:image-will-change", { detail: { source } }));
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
      container.dispatchEvent(new CustomEvent("grayston:image-change", { detail: { source } }));
    });
  }
}

function initializeEntry() {
  const entry = document.querySelector("[data-entry]");
  document.body.classList.add("is-ready");
  if (!entry) {
    root.classList.remove("entry-pending");
    return;
  }

  const navigationEntry = performance.getEntriesByType("navigation")[0];
  const restored = navigationEntry && navigationEntry.type === "back_forward";

  const complete = () => {
    entry.classList.add("is-complete");
    document.body.classList.remove("is-entering", "is-entry-opening");
    root.classList.remove("entry-pending");
    document.dispatchEvent(new CustomEvent("grayston:entry-complete"));
  };

  if (reduceMotion || restored) {
    complete();
    return;
  }

  if (window.GraystonMotion?.runEntry) {
    window.GraystonMotion.runEntry(entry, complete);
    return;
  }

  document.body.classList.add("is-entering");
  window.requestAnimationFrame(() => entry.classList.add("is-ready"));
  window.setTimeout(() => {
    entry.classList.add("is-opening");
    document.body.classList.add("is-entry-opening");
    document.dispatchEvent(new CustomEvent("grayston:entry-opening"));
  }, 2580);
  window.setTimeout(complete, 3440);
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
    stage.dataset.activeProduct = button.dataset.heroProduct;
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
    deck.dataset.activeCapability = button.dataset.capabilityKey;
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
    story.dataset.activeWork = chapter.dataset.workKey;
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
    consoleElement.dataset.activeSecurityKey = button.dataset.securityKey;
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
    program.dataset.activeSecurityArea = button.dataset.securityArea;
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

function initializeBuildline() {
  const canvas = document.querySelector("[data-buildline-canvas]");
  const hero = document.querySelector("[data-buildline-hero]");
  if (!canvas || !hero) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const liveSteps = [...hero.querySelectorAll(".buildline-live li")];
  const livePanel = hero.querySelector(".buildline-live");
  const colors = ["#39d8ff", "#ffb32c", "#48e0ae", "#7da6ff"];
  const stageDuration = 1650;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let stageRows = [];
  let stageColumnX = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let frame = 0;
  let running = false;
  let elapsed = 0;
  let previousTime = 0;
  let activeStep = -1;
  let segmentProgress = 0;

  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    stageRows = liveSteps.map((step) => {
      const stepBounds = step.getBoundingClientRect();
      return stepBounds.height > 0 ? stepBounds.top - bounds.top + stepBounds.height / 2 : 0;
    });
    const firstStageMarker = liveSteps[0]?.querySelector(":scope > span");
    const markerBounds = firstStageMarker?.getBoundingClientRect();
    stageColumnX = markerBounds && markerBounds.width > 0 ? markerBounds.left - bounds.left + markerBounds.width / 2 : 0;
  };

  const route = () => {
    const compact = width < 700;
    if (compact) {
      return [
        { x: width * 0.94, y: height * 0.1 },
        { x: width * 0.86, y: height * 0.15 },
        { x: width * 0.95, y: height * 0.2 },
        { x: width * 0.87, y: height * 0.25 },
        { x: width * 0.97, y: height * 0.3 },
      ];
    }
    const startX = width * 0.5;
    const spread = width * 0.43;
    const top = height * 0.16;
    const usable = height * 0.5;
    const aligned = width > 900 && stageColumnX > 0 && stageRows.length === 4 && stageRows.every(Boolean);
    if (aligned) {
      const firstNodeX = stageColumnX - 26;
      return [
        { x: Math.max(width * 0.55, firstNodeX - width * 0.09), y: Math.min(height * 0.62, stageRows[0] + height * 0.16) },
        { x: firstNodeX, y: stageRows[0] },
        { x: stageColumnX + width * 0.085, y: stageRows[1] },
        { x: stageColumnX + width * 0.18, y: stageRows[2] },
        { x: Math.min(width - 48, stageColumnX + width * 0.25), y: stageRows[3] },
      ];
    }
    return [
      { x: startX, y: top + usable * 0.72 },
      { x: startX + spread * 0.28, y: top + usable * 0.4 },
      { x: startX + spread * 0.56, y: top + usable * 0.58 },
      { x: startX + spread * 0.78, y: top + usable * 0.18 },
      { x: startX + spread, y: top + usable * 0.34 },
    ];
  };

  const pointOnSegment = (from, to, progress) => {
    const midpoint = (from.x + to.x) / 2;
    const inverse = 1 - progress;
    return {
      x: inverse ** 3 * from.x + 3 * inverse ** 2 * progress * midpoint + 3 * inverse * progress ** 2 * midpoint + progress ** 3 * to.x,
      y: inverse ** 3 * from.y + 3 * inverse ** 2 * progress * from.y + 3 * inverse * progress ** 2 * to.y + progress ** 3 * to.y,
    };
  };

  const traceSegment = (from, to, progress = 1) => {
    const steps = Math.max(2, Math.ceil(28 * progress));
    context.beginPath();
    context.moveTo(from.x, from.y);
    for (let index = 1; index <= steps; index += 1) {
      const point = pointOnSegment(from, to, (index / steps) * progress);
      context.lineTo(point.x, point.y);
    }
  };

  const drawSegment = (from, to, color, alpha = 1, progress = 1, lineWidth = 1) => {
    traceSegment(from, to, progress);
    context.strokeStyle = color;
    context.globalAlpha = alpha;
    context.lineWidth = lineWidth;
    context.stroke();
    context.globalAlpha = 1;
  };

  const setActiveStep = (nextStep) => {
    if (nextStep === activeStep) return;
    activeStep = nextStep;
    hero.dataset.buildlineStep = String(nextStep + 1);
    if (livePanel) livePanel.dataset.activeStep = String(nextStep + 1);
    liveSteps.forEach((step, index) => {
      step.classList.toggle("is-active", index === nextStep);
      step.classList.toggle("is-complete", index < nextStep);
      if (index === nextStep) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
  };

  const drawScene = () => {
    context.clearRect(0, 0, width, height);
    pointerX += (targetX - pointerX) * 0.045;
    pointerY += (targetY - pointerY) * 0.045;

    const points = route();

    context.globalAlpha = 0.16;
    for (let x = Math.round(width * 0.46); x < width; x += 72) {
      context.beginPath();
      context.moveTo(x + pointerX * 0.35, 0);
      context.lineTo(x + pointerX * 0.35, height);
      context.strokeStyle = "#425055";
      context.lineWidth = 1;
      context.stroke();
    }
    for (let y = 110; y < height * 0.76; y += 72) {
      context.beginPath();
      context.moveTo(width * 0.46, y);
      context.lineTo(width, y);
      context.strokeStyle = "#425055";
      context.lineWidth = 1;
      context.stroke();
    }
    context.globalAlpha = 1;

    points.slice(0, -1).forEach((point, index) => {
      drawSegment(point, points[index + 1], "#617076", 0.26);
      if (index < activeStep) drawSegment(point, points[index + 1], colors[index], 0.58, 1, 1.25);
    });

    const currentFrom = points[activeStep] || points[0];
    const currentTo = points[activeStep + 1] || points[1];
    const currentColor = colors[activeStep] || colors[0];
    drawSegment(currentFrom, currentTo, currentColor, 0.96, segmentProgress, 1.7);

    points.forEach((point, index) => {
      const stageIndex = index - 1;
      const isActive = stageIndex === activeStep;
      const isComplete = stageIndex >= 0 && stageIndex < activeStep;
      const color = stageIndex >= 0 ? colors[stageIndex] : "#778287";

      context.save();
      if (isActive) {
        context.shadowColor = color;
        context.shadowBlur = 20;
      }
      context.fillStyle = isActive || isComplete ? color : "#778287";
      const nodeSize = isActive ? 9 : isComplete ? 7 : 6;
      context.fillRect(point.x - nodeSize / 2, point.y - nodeSize / 2, nodeSize, nodeSize);
      context.strokeStyle = isActive ? color : isComplete ? "#637176" : "#344045";
      const frameSize = isActive ? 25 : 20;
      context.strokeRect(point.x - frameSize / 2, point.y - frameSize / 2, frameSize, frameSize);
      context.restore();

    });

    if (!reduceMotion) {
      [0.16, 0.09, 0].forEach((trail, index) => {
        const progress = Math.max(0, segmentProgress - trail);
        const pulse = pointOnSegment(currentFrom, currentTo, progress);
        context.save();
        context.globalAlpha = [0.18, 0.42, 1][index];
        context.shadowColor = currentColor;
        context.shadowBlur = index === 2 ? 20 : 8;
        context.fillStyle = currentColor;
        const size = [3, 4, 7][index];
        context.fillRect(pulse.x - size / 2, pulse.y - size / 2, size, size);
        context.restore();
      });
    }
  };

  const render = (time) => {
    frame = 0;
    if (!running) return;
    if (previousTime === 0) previousTime = time;
    else elapsed += Math.min(time - previousTime, 48);
    previousTime = time;

    const phase = (elapsed % (stageDuration * liveSteps.length)) / stageDuration;
    const nextStep = Math.floor(phase);
    const localProgress = phase - nextStep;
    const travelProgress = Math.min(localProgress / 0.78, 1);
    segmentProgress = travelProgress * travelProgress * (3 - 2 * travelProgress);
    setActiveStep(nextStep);
    drawScene();
    frame = window.requestAnimationFrame(render);
  };

  const start = () => {
    if (running || reduceMotion) return;
    running = true;
    elapsed = 0;
    previousTime = 0;
    segmentProgress = 0;
    setActiveStep(0);
    frame = window.requestAnimationFrame(render);
  };

  resize();
  setActiveStep(0);
  segmentProgress = reduceMotion ? 1 : 0;
  drawScene();
  window.addEventListener("resize", () => {
    resize();
    drawScene();
  }, { passive: true });

  if (document.body.classList.contains("is-entering")) {
    document.addEventListener("grayston:entry-opening", start, { once: true });
  } else {
    start();
  }

  if (finePointer) {
    hero.addEventListener("pointermove", (event) => {
      const bounds = hero.getBoundingClientRect();
      targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
      targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 6;
    });
    hero.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (reduceMotion) return;
    if (document.hidden && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    } else if (!document.hidden && running && !frame) {
      frame = window.requestAnimationFrame(render);
    }
  });
}

function initializeProjectPathfinder() {
  const pathfinder = document.querySelector("[data-project-pathfinder]");
  if (!pathfinder) return;

  const paths = {
    launch: {
      kicker: "NEW PRODUCT / FIRST PROOF",
      title: "Turn the idea into a product-shaped decision.",
      summary: "Resolve the users, value, architecture, critical unknowns, and highest-leverage workflow before the roadmap becomes expensive.",
      deliverables: ["Technical direction + risk map", "Production-shaped vertical slice", "Release sequence + operating boundary"],
      times: ["0-48 hours", "Days", "Focused weeks"],
      stages: ["Technical direction", "Working vertical slice", "Controlled release"],
      details: ["Users, architecture, risk, and the first build sequence become concrete.", "Interface, data, identity, business logic, and deployment connect for real.", "Scope expands behind tested contracts, security review, observability, and rollback."],
      label: "Discuss a new build",
      href: "/contact?focus=product#intake",
    },
    automate: {
      kicker: "AI + AUTOMATION / GOVERNED WORK",
      title: "Put intelligence inside a workflow people can trust.",
      summary: "Start with the decision and operating boundary, then connect models, tools, retrieval, memory, evaluation, and human authority around measurable work.",
      deliverables: ["Workflow + authority map", "Evaluated intelligent workflow", "Observability + approval controls"],
      times: ["0-48 hours", "Days", "Focused weeks"],
      stages: ["Workflow contract", "Evaluated proof", "Governed operation"],
      details: ["Define the task, trusted data, tool authority, failure modes, and success measures.", "Exercise real inputs through a bounded workflow with visible evaluation evidence.", "Add approvals, monitoring, recovery, cost controls, and production operating policy."],
      label: "Discuss intelligent systems",
      href: "/contact?focus=intelligence#intake",
    },
    rescue: {
      kicker: "PLATFORM RESCUE / CONTROLLED RECOVERY",
      title: "Recover the real system before rewriting it.",
      summary: "Reproduce what is failing, map the actual architecture and release path, then stabilize the highest-risk boundary before modernization expands.",
      deliverables: ["Failure reproduction + system map", "Stabilized release path", "Incremental modernization sequence"],
      times: ["0-48 hours", "Days", "Focused weeks"],
      stages: ["Reproduce + map", "Stabilize the path", "Modernize in control"],
      details: ["Confirm the behavior, dependencies, production state, security exposure, and blast radius.", "Close the highest-risk failure and restore a testable, observable delivery route.", "Replace fragile boundaries in controlled increments without losing operating continuity."],
      label: "Discuss a platform recovery",
      href: "/contact?focus=rescue#intake",
    },
    secure: {
      kicker: "SECURITY / REACHABLE RISK",
      title: "Follow the attack path all the way to closure.",
      summary: "Model what matters, find reachable weakness across application, identity, data, cloud, and autonomous behavior, then fix the root cause and prove it stays closed.",
      deliverables: ["Threat + attack-path model", "Validated findings with evidence", "Remediation + regression proof"],
      times: ["0-48 hours", "Focused review", "Closure"],
      stages: ["Model the target", "Validate impact", "Remediate + retest"],
      details: ["Identify assets, identities, trust boundaries, attacker goals, and business impact.", "Trace reachable behavior, reject noise, preserve evidence, and rank by real severity.", "Fix the root cause, retest the chain, add regression protection, and gate release."],
      label: "Scope a security review",
      href: "/contact?focus=security#intake",
    },
  };

  const buttons = [...pathfinder.querySelectorAll("[data-path-key]")];
  const fields = {
    kicker: pathfinder.querySelector("[data-path-kicker]"),
    title: pathfinder.querySelector("[data-path-title]"),
    summary: pathfinder.querySelector("[data-path-summary]"),
    deliverables: pathfinder.querySelector("[data-path-deliverables]"),
    link: pathfinder.querySelector("[data-path-link]"),
  };

  const select = (button) => {
    const key = button.dataset.pathKey;
    const path = paths[key];
    if (!path) return;
    setSelected(buttons, button);
    pathfinder.dataset.activePath = key;
    fields.kicker.textContent = path.kicker;
    fields.title.textContent = path.title;
    fields.summary.textContent = path.summary;
    fields.deliverables.replaceChildren(...path.deliverables.map((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      return listItem;
    }));
    fields.link.firstChild.textContent = `${path.label} `;
    fields.link.href = path.href;
    path.times.forEach((time, index) => {
      pathfinder.querySelector(`[data-path-time="${index}"]`).textContent = time;
      pathfinder.querySelector(`[data-path-stage="${index}"]`).textContent = path.stages[index];
      pathfinder.querySelector(`[data-path-detail="${index}"]`).textContent = path.details[index];
    });
  };

  bindTabs(buttons, select);
}

function initializeArtifactLedger() {
  const details = [...document.querySelectorAll(".artifact-ledger details")];
  details.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      details.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

function initializeServiceNavigator() {
  const navigator = document.querySelector("[data-service-navigator]");
  if (!navigator) return;

  const services = {
    product: {
      kicker: "NEW PRODUCT / END-TO-END DELIVERY",
      title: "Turn the idea into a complete production system.",
      summary: "Product direction, interface, architecture, identity, data, integrations, administration, analytics, release, and support are designed as one operating product.",
      deliverables: ["Product model and experience architecture", "Working web or desktop application", "Production platform and operating handoff"],
      status: "PRODUCT / READY",
      labels: ["Direction", "Experience", "System", "Release"],
      layers: ["Users, value, scope, architecture", "Responsive interface and product UX", "Identity, data, APIs, integrations", "Tests, telemetry, deployment, support"],
      label: "Discuss a product build",
      href: "/contact?focus=product#intake",
    },
    mobile: {
      kicker: "NATIVE MOBILE / DEVICE-READY DELIVERY",
      title: "Ship a mobile product that belongs on the device.",
      summary: "iOS, Android, and cross-platform delivery covers interaction quality, offline behavior, secure storage, device capabilities, subscriptions, notifications, analytics, signing, and store release.",
      deliverables: ["Mobile product and platform architecture", "Device-ready iOS and Android experience", "TestFlight, Play, telemetry, and release path"],
      status: "MOBILE / DEVICE READY",
      labels: ["Product", "Device", "Platform", "Release"],
      layers: ["User journeys, ergonomics, platform choice", "Native capabilities, offline state, secure storage", "APIs, identity, sync, notifications, billing", "Signing, store review, crash data, device QA"],
      label: "Discuss a mobile build",
      href: "/contact?focus=mobile#intake",
    },
    intelligence: {
      kicker: "INTELLIGENT SYSTEMS / GOVERNED EXECUTION",
      title: "Put intelligence inside work that matters.",
      summary: "Agents, retrieval, machine learning, document intelligence, tools, memory, evaluation, policy, and human authority are engineered around a measurable operational outcome.",
      deliverables: ["Workflow, authority, and data contract", "Evaluated intelligent workflow", "Approval, observability, and recovery controls"],
      status: "INTELLIGENCE / EVALUATED",
      labels: ["Outcome", "Context", "Execution", "Control"],
      layers: ["Task definition, success measures, failure costs", "Trusted data, retrieval, memory, model routing", "Tools, agents, automation, structured outputs", "Evaluation, approvals, policy, telemetry, recovery"],
      label: "Discuss an intelligent system",
      href: "/contact?focus=intelligence#intake",
    },
    platform: {
      kicker: "CLOUD + DATA / PRODUCTION FOUNDATION",
      title: "Build the foundation the product can depend on.",
      summary: "Cloud infrastructure, services, APIs, identity, data models, event flows, integrations, observability, migrations, and recovery are designed around the real operating model.",
      deliverables: ["Platform architecture and service contracts", "Production APIs, data, identity, and integrations", "Automated delivery, telemetry, and recovery path"],
      status: "PLATFORM / OPERABLE",
      labels: ["Boundary", "Services", "Data", "Operations"],
      layers: ["Tenancy, identity, trust, integration contracts", "APIs, events, queues, background workloads", "Models, migrations, pipelines, audit history", "CI/CD, environments, logs, rollback, runbooks"],
      label: "Discuss a platform build",
      href: "/contact?focus=platform#intake",
    },
    recovery: {
      kicker: "MODERNIZATION / CONTROLLED RECOVERY",
      title: "Restore momentum without losing the real system.",
      summary: "Grayston reproduces the failure, maps the actual architecture and production state, stabilizes the highest-risk path, and modernizes in controlled increments.",
      deliverables: ["Failure reproduction and system map", "Stabilized, observable release path", "Risk-ranked modernization sequence"],
      status: "RECOVERY / CONTROL RESTORED",
      labels: ["Reproduce", "Map", "Stabilize", "Modernize"],
      layers: ["Confirm behavior, impact, and operating conditions", "Dependencies, data, infrastructure, release reality", "Close highest-risk failure and restore telemetry", "Replace fragile boundaries behind proven contracts"],
      label: "Discuss a platform recovery",
      href: "/contact?focus=rescue#intake",
    },
    security: {
      kicker: "CYBERSECURITY / REACHABLE RISK",
      title: "Find the attack path, close it, and prove closure.",
      summary: "Threat modeling, architecture and source review, identity, APIs, cloud, data, dependencies, autonomous behavior, validation, remediation, and retest operate as one security loop.",
      deliverables: ["Threat and attack-path model", "Evidence-backed validated findings", "Remediation and regression proof"],
      status: "SECURITY / EVIDENCE READY",
      labels: ["Model", "Discover", "Validate", "Close"],
      layers: ["Assets, identities, trust boundaries, abuse cases", "Architecture, source, cloud, data, dependencies", "Reachability, exploit chain, impact, evidence", "Root-cause fix, retest, regression protection"],
      label: "Scope a security review",
      href: "/contact?focus=security#intake",
    },
  };

  const buttons = [...navigator.querySelectorAll("[data-service-key]")];
  const fields = {
    kicker: navigator.querySelector("[data-service-kicker]"),
    title: navigator.querySelector("[data-service-title]"),
    summary: navigator.querySelector("[data-service-summary]"),
    deliverables: navigator.querySelector("[data-service-deliverables]"),
    status: navigator.querySelector("[data-service-status]"),
    link: navigator.querySelector("[data-service-link]"),
  };

  const select = (button) => {
    const key = button.dataset.serviceKey;
    const service = services[key];
    if (!service) return;
    setSelected(buttons, button);
    navigator.dataset.activeService = key;
    fields.kicker.textContent = service.kicker;
    fields.title.textContent = service.title;
    fields.summary.textContent = service.summary;
    fields.status.textContent = service.status;
    fields.deliverables.replaceChildren(...service.deliverables.map((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      return listItem;
    }));
    fields.link.firstChild.textContent = `${service.label} `;
    fields.link.href = service.href;
    service.layers.forEach((layer, index) => {
      navigator.querySelector(`[data-service-layer-label="${index}"]`).textContent = service.labels[index];
      navigator.querySelector(`[data-service-layer="${index}"]`).textContent = layer;
    });
  };

  bindTabs(buttons, select);
}

function initializeWorkArchive() {
  const archive = document.querySelector("[data-work-archive]");
  if (!archive) return;

  const work = {
    verityforge: {
      kicker: "INTELLIGENT DELIVERY / PROOF-GOVERNED EXECUTION",
      title: "VerityForge",
      tagline: "Coordinate autonomous software work without surrendering release control.",
      summary: "Specialized engineering agents operate through bounded missions, isolated work, explicit proof contracts, executable verification, evidence capture, and owner-controlled release decisions.",
      ownership: "Product model, orchestration architecture, agent runtime, verification contracts, evidence, interface, and release governance.",
      depth: "Tool policy, isolated worktrees, agent routing, proof ledger, verification gates, audit history, and supervised production decisions.",
      tags: ["Agent orchestration", "Verification contracts", "Release governance"],
      source: "/assets/product-verityforge.webp",
      alt: "VerityForge interface showing agent routing, proof evidence, verification checks, and release gates",
      window: "VERITYFORGE / CONTROL PLANE",
      caption: "ACTUAL INTERFACE / REPRESENTATIVE OPERATING DATA",
      counter: "01 / 05",
      href: "/contact?focus=intelligence#intake",
      label: "Discuss a related build",
      external: false,
    },
    mypokermaps: {
      kicker: "CONSUMER + CLUB ECOSYSTEM / MULTI-SURFACE PLATFORM",
      title: "MyPokerMaps",
      tagline: "Connect public discovery, live poker, community, and club operations.",
      summary: "A consumer platform for finding rooms, live games, tournaments, streams, and community activity, connected to onboarding, administration, mobile experiences, and live club data.",
      ownership: "Product experience, responsive web, mobile surfaces, identity, listings, maps, live data, social workflows, administration, and platform integration.",
      depth: "Location-aware discovery, player accounts, live games, streaming, notifications, club onboarding, role-based administration, analytics, and connected operations.",
      tags: ["Consumer web + mobile", "Real-time workflows", "Platform ecosystem"],
      source: "/assets/product-mypokermaps.webp",
      alt: "MyPokerMaps platform showing room discovery, location search, maps, and live poker features",
      window: "MYPOKERMAPS / PUBLIC PLATFORM",
      caption: "ACTUAL PRODUCT INTERFACE / PUBLIC EXPERIENCE",
      counter: "02 / 05",
      href: "https://www.mypokermaps.com",
      label: "Visit MyPokerMaps",
      external: true,
    },
    feltos: {
      kicker: "CLUB OPERATING SYSTEM / LIVE OPERATIONAL CONTROL",
      title: "FeltOS",
      tagline: "Put the entire live poker-room operation in one governed surface.",
      summary: "The signed-in club portal coordinates front desk, check-in, waitlists, tables, tournaments, members, staff, cash cage, analytics, accounting, compliance, devices, and support.",
      ownership: "Operational UX, tenant and role architecture, live activity, administrative workflows, financial controls, analytics, compliance, and device operations.",
      depth: "Role-governed floor operations, member and staff records, money movement, activity history, exports, public controls, support, and operational telemetry.",
      tags: ["Live operations", "Role-governed workflows", "Financial + compliance controls"],
      source: "/assets/product-feltos.webp",
      alt: "FeltOS club portal showing dashboard metrics, live activity, front-desk controls, and operational navigation",
      window: "FELTOS / CLUB PORTAL",
      caption: "ACTUAL INTERFACE / SANITIZED CLUB DATA",
      counter: "03 / 05",
      href: "/contact?focus=product#intake",
      label: "Discuss an operations platform",
      external: false,
    },
    qrystaldrop: {
      kicker: "SECURE COLLABORATION / CONTROLLED FILE CUSTODY",
      title: "QrystalDrop",
      tagline: "Protect sensitive collaboration with cryptographic and enterprise control.",
      summary: "Secure rooms combine browser-side encryption and participant-bound wrapping with passkeys, federation, provisioning, network policy, recovery review, SIEM delivery, and audit-ready evidence.",
      ownership: "Security architecture, cryptographic workflow, enterprise identity, secure-room UX, policy controls, recovery governance, audit delivery, and operating posture.",
      depth: "Post-quantum key establishment, device-bound access, MFA, OIDC, directory provisioning, sessions, network controls, signed SIEM delivery, and proof exports.",
      tags: ["Post-quantum cryptography", "Enterprise identity", "Evidence + governance"],
      source: "/assets/product-qrystaldrop-dashboard.webp",
      alt: "QrystalDrop enterprise workspace showing secure rooms, launch posture, storage, and recent activity",
      window: "QRYSTALDROP / WORKSPACE OVERVIEW",
      caption: "ACTUAL PRODUCT INTERFACE / REPRESENTATIVE DATA",
      counter: "04 / 05",
      href: "https://qrystaldrop.vercel.app",
      label: "Visit QrystalDrop",
      external: true,
    },
    cuoperation: {
      kicker: "PERSONNEL OPERATIONS / HIGH-ACCOUNTABILITY WORKFLOWS",
      title: "CUOPeration",
      tagline: "Make personnel status, approvals, records, and ownership visible.",
      summary: "A secure operating surface for personnel intake, hierarchy, tasking, approvals, private files, drill notes, roles, notifications, governed export, and audit history.",
      ownership: "Workflow discovery, operational UX, identity and role model, secure records, approvals, notifications, export governance, administration, and auditability.",
      depth: "Personnel profiles, organizational hierarchy, private uploads, readiness workflows, task ownership, role administration, controlled exports, and immutable operating history.",
      tags: ["Secure personnel records", "Approval workflows", "Auditable operations"],
      source: "/assets/product-cuoperation.webp",
      alt: "CUOPeration administrator interface with sanitized personnel and operations data",
      window: "CUOPERATION / ADMIN VIEW",
      caption: "ACTUAL INTERFACE / FICTIONAL SANITIZED DATA",
      counter: "05 / 05",
      href: "/contact?focus=product#intake",
      label: "Discuss a secure operations system",
      external: false,
    },
  };

  const buttons = [...archive.querySelectorAll("[data-archive-key]")];
  const visual = archive.querySelector("[data-archive-visual]");
  const image = archive.querySelector("[data-archive-image]");
  const fields = {
    kicker: archive.querySelector("[data-archive-kicker]"),
    title: archive.querySelector("[data-archive-title]"),
    tagline: archive.querySelector("[data-archive-tagline]"),
    summary: archive.querySelector("[data-archive-summary]"),
    ownership: archive.querySelector("[data-archive-ownership]"),
    depth: archive.querySelector("[data-archive-depth]"),
    tags: archive.querySelector("[data-archive-tags]"),
    window: archive.querySelector("[data-archive-window]"),
    caption: archive.querySelector("[data-archive-caption]"),
    counter: archive.querySelector("[data-archive-counter]"),
    link: archive.querySelector("[data-archive-link]"),
  };

  const select = (button, updateHash = true) => {
    const key = button.dataset.archiveKey;
    const item = work[key];
    if (!item) return;
    setSelected(buttons, button);
    archive.dataset.activeWork = key;
    fields.kicker.textContent = item.kicker;
    fields.title.textContent = item.title;
    fields.tagline.textContent = item.tagline;
    fields.summary.textContent = item.summary;
    fields.ownership.textContent = item.ownership;
    fields.depth.textContent = item.depth;
    fields.window.textContent = item.window;
    fields.caption.textContent = item.caption;
    fields.counter.textContent = item.counter;
    fields.tags.replaceChildren(...item.tags.map((tag) => {
      const listItem = document.createElement("li");
      listItem.textContent = tag;
      return listItem;
    }));
    fields.link.firstChild.textContent = `${item.label} `;
    fields.link.href = item.href;
    if (item.external) {
      fields.link.target = "_blank";
      fields.link.rel = "noopener";
    } else {
      fields.link.removeAttribute("target");
      fields.link.removeAttribute("rel");
    }
    image.alt = item.alt;
    transitionImage(visual, image, item.source, () => true);
    if (updateHash && window.history.replaceState) window.history.replaceState(null, "", `#${key}`);
  };

  bindTabs(buttons, (button) => select(button));
  const initialKey = window.location.hash.slice(1);
  const initial = buttons.find((button) => button.dataset.archiveKey === initialKey) || buttons[0];
  select(initial, false);
  window.addEventListener("hashchange", () => {
    const matching = buttons.find((button) => button.dataset.archiveKey === window.location.hash.slice(1));
    if (matching) select(matching, false);
  });
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
      form.dispatchEvent(new CustomEvent("grayston:form-success"));
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
initializeBuildline();
initializeProjectPathfinder();
initializeArtifactLedger();
initializeServiceNavigator();
initializeWorkArchive();
initializeFaqs();
initializeContactForm();
initializeYear();

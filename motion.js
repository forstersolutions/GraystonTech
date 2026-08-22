(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const desktopMotion = window.matchMedia("(min-width: 901px)").matches && finePointer;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const SplitText = window.SplitText;
  const stageColors = ["#39d8ff", "#ffb32c", "#48e0ae", "#7da6ff"];
  let lenis = null;

  root.classList.add("motion-runtime");

  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (SplitText) gsap.registerPlugin(SplitText);
  }

  function runEntry(entry, complete) {
    if (!gsap || reducedMotion) {
      complete();
      return;
    }

    const body = document.body;
    const shutters = entry.querySelectorAll(".entry-sequence__shutter");
    const logo = entry.querySelector("img");
    const label = entry.querySelector(".entry-sequence__label");
    const line = entry.querySelector(".entry-sequence__line");
    const signal = entry.querySelector(".entry-sequence__line i");
    const stages = [...entry.querySelectorAll(".entry-sequence__stages span")];
    const meta = entry.querySelectorAll(".entry-sequence__meta, .entry-sequence__foot");
    const core = entry.querySelector(".entry-sequence__core");

    body.classList.add("is-entering");
    entry.classList.add("is-motion-controlled");
    gsap.set(entry, { autoAlpha: 1 });
    gsap.set(shutters, { yPercent: 0 });
    gsap.set([logo, label], { autoAlpha: 0, y: 22 });
    gsap.set(stages, { opacity: 0.24, y: 8, "--entry-stage-flow": 0, "--entry-stage-node": 0.45 });
    gsap.set(line, { width: 0 });
    gsap.set(signal, { autoAlpha: 0, xPercent: -160, scaleX: 0.2, transformOrigin: "left center" });

    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: complete,
    });

    timeline
      .to(line, { width: "100%", duration: 1.05, ease: "power4.inOut" }, 0.08)
      .to(signal, { autoAlpha: 1, xPercent: 440, scaleX: 1, duration: 1.9, ease: "power2.inOut" }, 0.28)
      .to(logo, { autoAlpha: 1, y: 0, duration: 0.82 }, 0.22)
      .to(label, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.36);

    stages.forEach((stage, index) => {
      timeline.to(stage, {
        color: stageColors[index],
        opacity: 1,
        y: 0,
        "--entry-stage-flow": 1,
        "--entry-stage-node": 1,
        duration: 0.54,
      }, 0.72 + index * 0.48);
    });

    timeline
      .add(() => {
        entry.classList.add("is-opening");
        body.classList.add("is-entry-opening");
        document.dispatchEvent(new CustomEvent("grayston:entry-opening"));
      }, 3.0)
      .to([core, meta, line], { autoAlpha: 0, scale: 0.985, duration: 0.32, ease: "power2.in" }, 3.02)
      .to(shutters[0], { yPercent: -101, duration: 0.94, ease: "power4.inOut" }, 3.16)
      .to(shutters[1], { yPercent: 101, duration: 0.94, ease: "power4.inOut" }, 3.16)
      .set(entry, { autoAlpha: 0 });
  }

  function createIntakeTransition() {
    const overlay = document.createElement("div");
    overlay.className = "intake-completion-transition";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="intake-completion-transition__bands">
        <div class="intake-completion-transition__band"><span>01</span><div><strong>BRIEF</strong><small>Received securely</small></div></div>
        <div class="intake-completion-transition__band"><span>02</span><div><strong>REVIEW</strong><small>Direct technical ownership</small></div></div>
        <div class="intake-completion-transition__band"><span>03</span><div><strong>RESPONSE</strong><small>Useful direction first</small></div></div>
        <div class="intake-completion-transition__band"><span>04</span><div><strong>NEXT STEP</strong><small>Focused and concrete</small></div></div>
      </div>
      <div class="intake-completion-transition__context">
        <span>INTAKE / CONFIRMED</span>
        <strong>The brief is in.</strong>
        <small>RESPONSE ROUTE ESTABLISHED</small>
      </div>
    `;
    document.body.append(overlay);
    return overlay;
  }

  function showContactConfirmation() {
    const confirmation = document.querySelector("[data-contact-confirmation]");
    if (!confirmation) return null;
    confirmation.hidden = false;
    document.body.classList.add("is-intake-confirmed");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return confirmation;
  }

  function runIntakeConfirmation() {
    const confirmation = document.querySelector("[data-contact-confirmation]");
    if (!confirmation || document.body.classList.contains("is-intake-transitioning") || document.body.classList.contains("is-intake-confirmed")) return;
    if (!gsap || reducedMotion) {
      showContactConfirmation();
      confirmation.querySelector("h1")?.focus({ preventScroll: true });
      return;
    }

    const overlay = document.querySelector(".intake-completion-transition") || createIntakeTransition();
    const bands = [...overlay.querySelectorAll(".intake-completion-transition__band")];
    const stageCopy = bands.map((band) => band.querySelector("div"));
    const context = overlay.querySelector(".intake-completion-transition__context");
    const startedAt = window.performance.now();
    document.body.classList.add("is-intake-transitioning");
    document.body.dataset.intakeTransition = "running";
    lenis?.stop();
    overlay.classList.add("is-active");

    gsap.killTweensOf([overlay, bands, stageCopy, context]);
    gsap.set(overlay, { autoAlpha: 1 });
    gsap.set(bands, { xPercent: -101 });
    gsap.set(stageCopy, { autoAlpha: 0, x: -28 });
    gsap.set(context, { autoAlpha: 0, y: 18 });

    const timeline = gsap.timeline({
      defaults: { ease: "power4.inOut" },
      onComplete: () => {
        overlay.classList.remove("is-active");
        gsap.set(overlay, { autoAlpha: 0 });
        document.body.classList.remove("is-intake-transitioning");
        document.body.dataset.intakeTransition = "complete";
        document.body.dataset.intakeTransitionDuration = String(Math.round(window.performance.now() - startedAt));
        lenis?.start();
        confirmation.querySelector("h1")?.focus({ preventScroll: true });
        document.dispatchEvent(new CustomEvent("grayston:intake-confirmed"));
      },
    });
    timeline
      .to(bands, { xPercent: 0, duration: 0.52, stagger: 0.12 }, 0)
      .to(stageCopy, { autoAlpha: 1, x: 0, duration: 0.34, stagger: 0.1, ease: "power3.out" }, 0.2)
      .to(context, { autoAlpha: 1, y: 0, duration: 0.36, ease: "power3.out" }, 0.58)
      .add(() => showContactConfirmation(), 1.38)
      .to(context, { autoAlpha: 0, y: -14, duration: 0.24, ease: "power2.in" }, 1.48)
      .to(stageCopy, { autoAlpha: 0, x: 24, duration: 0.24, stagger: { each: 0.05, from: "end" }, ease: "power2.in" }, 1.5)
      .to(bands, { xPercent: 101, duration: 0.62, stagger: { each: 0.13, from: "end" } }, 1.72)
      .to(overlay, { autoAlpha: 0, duration: 0.22 }, 2.78);
  }

  window.GraystonMotion = { runEntry, runIntakeConfirmation };

  function setupLenis() {
    if (!desktopMotion || reducedMotion || !window.Lenis || !gsap || !ScrollTrigger) return;
    lenis = new window.Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.92,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    root.classList.add("lenis-active");

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href^='#']");
      if (!link) return;
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -92, duration: 1.25 });
      window.history.pushState(null, "", link.getAttribute("href"));
    });
  }

  function splitHeading(element) {
    if (!element || !SplitText || reducedMotion) return null;
    try {
      return SplitText.create
        ? SplitText.create(element, { type: "lines,words", linesClass: "motion-line", wordsClass: "motion-word", mask: "lines", aria: "auto" })
        : new SplitText(element, { type: "lines,words", linesClass: "motion-line", wordsClass: "motion-word", aria: "auto" });
    } catch {
      return null;
    }
  }

  function heroSecondary(hero) {
    return hero.querySelector(
      ".buildline-live, .service-signal, .work-hero-v2__index, .security-hero-status, .company-identity-panel, .contact-hero-v2__direct",
    );
  }

  function addHeroSpecificMotion(timeline, hero, startAt) {
    const serviceRows = hero.querySelectorAll(".service-signal li");
    const workRows = hero.querySelectorAll(".work-hero-v2__index li");
    const securitySurfaces = hero.querySelectorAll(".security-hero-status span");
    const securityProof = hero.querySelectorAll(".security-hero-proof div, .security-hero-proof i");
    const companyFacts = hero.querySelectorAll(".company-identity-panel dl > div");
    const contactRows = hero.querySelectorAll(".contact-hero-v2__direct > *");

    if (serviceRows.length) {
      timeline.fromTo(serviceRows, { autoAlpha: 0, x: (index) => index % 2 ? 34 : -34 }, { autoAlpha: 1, x: 0, duration: 0.58, stagger: 0.075 }, startAt);
    }
    if (workRows.length) {
      timeline.fromTo(workRows, { autoAlpha: 0, x: 38 }, { autoAlpha: 1, x: 0, duration: 0.52, stagger: 0.075 }, startAt);
    }
    if (securitySurfaces.length) {
      timeline.fromTo(securitySurfaces, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.055 }, startAt);
      timeline.fromTo(securityProof, { autoAlpha: 0, scaleX: 0.82 }, { autoAlpha: 1, scaleX: 1, duration: 0.52, stagger: 0.09 }, startAt + 0.24);
    }
    if (companyFacts.length) {
      timeline.fromTo(companyFacts, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.46, stagger: 0.075 }, startAt);
    }
    if (contactRows.length) {
      timeline.fromTo(contactRows, { autoAlpha: 0, x: 28 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.09 }, startAt);
    }
  }

  function setupHeroMotion() {
    const hero = document.querySelector(
      ".home-hero, .service-hero-v2, .work-hero-v2, .page-hero--security, .company-hero-v2, .contact-hero-v2",
    );
    if (!hero || reducedMotion || !gsap) return;

    const title = hero.querySelector("h1");
    const split = splitHeading(title);
    const words = split?.words || [];
    const copy = hero.querySelector(
      ".buildline-hero-copy, .service-hero-v2__copy, .work-hero-v2__copy, .page-hero-copy, .company-hero-v2__copy, .contact-hero-v2__copy",
    );
    const eyebrow = copy?.querySelector(".eyebrow");
    const paragraphs = copy ? [...copy.querySelectorAll(":scope > p:not(.eyebrow)")] : [];
    const actions = copy?.querySelector(".hero-actions, :scope > .button");
    const secondary = heroSecondary(hero);

    if (words.length) gsap.set(words, { yPercent: 118, rotateX: -10, transformOrigin: "50% 100%" });
    gsap.set([eyebrow, ...paragraphs, actions].filter(Boolean), { autoAlpha: 0, y: 22 });
    if (secondary) gsap.set(secondary, { autoAlpha: 0, clipPath: "inset(10% 0 10% 100%)" });

    const play = () => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (eyebrow) timeline.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.48 }, 0);
      if (words.length) timeline.to(words, { yPercent: 0, rotateX: 0, duration: 0.86, stagger: 0.035, ease: "power4.out" }, 0.08);
      else if (title) timeline.fromTo(title, { autoAlpha: 0, y: 38 }, { autoAlpha: 1, y: 0, duration: 0.82 }, 0.08);
      if (paragraphs.length) timeline.to(paragraphs, { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.085 }, 0.38);
      if (actions) timeline.to(actions, { autoAlpha: 1, y: 0, duration: 0.58 }, 0.55);
      if (secondary) timeline.to(secondary, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.92, ease: "power4.inOut" }, 0.24);
      addHeroSpecificMotion(timeline, hero, 0.55);
      timeline.add(() => hero.classList.add("is-motion-complete"));
    };

    if (root.classList.contains("entry-pending")) {
      document.addEventListener("grayston:entry-complete", play, { once: true });
    } else {
      window.requestAnimationFrame(play);
    }
  }

  function setupSectionReveals() {
    if (reducedMotion || !gsap || !ScrollTrigger) return;
    const hero = document.querySelector("main > section:first-child");
    const reveals = [...document.querySelectorAll("main .reveal")].filter((element) => !hero?.contains(element));

    reveals.forEach((element) => {
      if (element.closest(".company-model__steps, .adversarial-loop, .engineering-system__ledger")) return;
      if (element.matches(".evidence-grid > *, .security-capability-grid > *, .engagement-v2__grid > *")) return;
      gsap.set(element, { autoAlpha: 0, y: 34 });
      gsap.to(element, {
        autoAlpha: 1,
        y: 0,
        duration: 0.88,
        ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 87%", once: true },
      });
    });

    const groups = [
      ".evidence-grid",
      ".security-capability-grid",
      ".engagement-v2__grid",
      ".company-fit__list",
      ".work-beyond__prompts",
      ".operating-facts",
    ];
    groups.forEach((selector) => {
      document.querySelectorAll(selector).forEach((group) => {
        const items = [...group.children];
        if (!items.length) return;
        gsap.set(items, { autoAlpha: 0, y: 32 });
        gsap.to(items, {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 84%", once: true },
        });
      });
    });

    document.querySelectorAll(".evidence-item figure, .work-archive__visual").forEach((frame) => {
      const image = frame.querySelector("img");
      if (!image) return;
      gsap.fromTo(image, { scale: 1.065 }, {
        scale: 1,
        duration: 1.25,
        ease: "power3.out",
        scrollTrigger: { trigger: frame, start: "top 86%", once: true },
      });
    });
  }

  function setCurrentByProgress(items, progress, className = "is-motion-current") {
    const index = Math.min(items.length - 1, Math.max(0, Math.floor(progress * items.length)));
    items.forEach((item, itemIndex) => {
      item.classList.toggle(className, itemIndex === index);
      item.classList.toggle("is-motion-complete", itemIndex < index);
    });
  }

  function setupFlowNarrative(containerSelector, itemSelector, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container || reducedMotion || !gsap || !ScrollTrigger) return;
    const items = [...container.querySelectorAll(itemSelector)];
    if (items.length < 2) return;
    setCurrentByProgress(items, 0);

    ScrollTrigger.create({
      trigger: container,
      start: options.start || "top 76%",
      end: options.end || "bottom 34%",
      scrub: options.scrub || 0.6,
      onUpdate: (self) => {
        container.style.setProperty("--flow-progress", self.progress.toFixed(4));
        setCurrentByProgress(items, self.progress);
      },
    });
  }

  function setupScrollNarratives() {
    setupFlowNarrative(".pathfinder-sequence", ":scope > article", { start: "top 80%", end: "bottom 34%" });
    setupFlowNarrative(".engineering-system__ledger", ":scope > article", { start: "top 72%", end: "bottom 42%" });
    setupFlowNarrative(".adversarial-loop", ":scope > li", { start: "top 76%", end: "bottom 38%" });
    setupFlowNarrative(".company-model__steps", ":scope > article", { start: "top 78%", end: "bottom 45%" });
  }

  function animateModule(module) {
    const selectorMap = [
      ["service-navigator", ".service-navigator__copy > *, .service-stack li"],
      ["work-archive", ".work-archive__copy > *, .work-archive__visual figcaption"],
      ["security-program", ".security-program-output > h3, .security-program-output > p, .program-decision-grid > div, .program-output-list li"],
      ["project-pathfinder", ".pathfinder-copy > *, .pathfinder-sequence article"],
      ["security-console", ".security-console-body > p"],
    ];
    const match = selectorMap.find(([className]) => module.classList.contains(className));
    if (!match) return;
    const targets = module.querySelectorAll(match[1]);
    gsap.killTweensOf(targets);
    gsap.fromTo(targets, {
      autoAlpha: 0,
      y: 16,
      clipPath: "inset(0 0 18% 0)",
    }, {
      autoAlpha: 1,
      y: 0,
      clipPath: "inset(0 0 0% 0)",
      duration: 0.56,
      stagger: 0.045,
      ease: "power3.out",
      overwrite: true,
    });

    if (module.classList.contains("work-archive")) animateArchiveHandoff(module);
  }

  function animateArchiveHandoff(archive) {
    const visual = archive.querySelector(".work-archive__visual");
    if (!visual) return;
    let handoff = visual.querySelector(".archive-handoff");
    if (!handoff) {
      handoff = document.createElement("span");
      handoff.className = "archive-handoff";
      handoff.setAttribute("aria-hidden", "true");
      handoff.innerHTML = "<i>CONTEXT</i><i>INTERFACE</i><i>SYSTEM</i>";
      visual.append(handoff);
    }
    const labels = handoff.querySelectorAll("i");
    gsap.killTweensOf([handoff, labels]);
    gsap.set(handoff, { autoAlpha: 1, scaleX: 0, transformOrigin: "left center" });
    gsap.set(labels, { autoAlpha: 0, y: 8 });
    gsap.timeline()
      .to(handoff, { scaleX: 1, duration: 0.36, ease: "power4.inOut" })
      .to(labels, { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.055 }, 0.15)
      .to(labels, { autoAlpha: 0, y: -8, duration: 0.18, stagger: 0.035 }, 0.42)
      .to(handoff, { scaleX: 0, transformOrigin: "right center", duration: 0.4, ease: "power4.inOut" }, 0.5)
      .set(handoff, { autoAlpha: 0 });
  }

  function setupModuleTransitions() {
    const modules = document.querySelectorAll(".project-pathfinder, .service-navigator, .work-archive, .security-program, .security-console");
    modules.forEach((module) => module.addEventListener("grayston:module-change", () => animateModule(module)));

  }

  function setupBuildlineSync() {
    const hero = document.querySelector("[data-buildline-hero]");
    const status = hero?.querySelector(".buildline-live__status small");
    if (!hero || !status || !gsap) return;
    const meanings = [
      "ARCHITECTURE + RISK BECOME EXPLICIT",
      "INTERFACE + DATA + IDENTITY CONNECT",
      "FAILURE PATHS ARE EXERCISED",
      "TELEMETRY + RECOVERY GO LIVE",
    ];
    let current = -1;
    const update = () => {
      const next = Math.max(0, Number(hero.dataset.buildlineStep || 1) - 1);
      if (next === current) return;
      current = next;
      hero.style.setProperty("--buildline-stage-color", stageColors[next]);
      gsap.to(status, {
        autoAlpha: 0,
        y: -5,
        duration: 0.16,
        onComplete: () => {
          status.textContent = meanings[next];
          gsap.fromTo(status, { autoAlpha: 0, y: 5 }, { autoAlpha: 1, y: 0, duration: 0.28 });
        },
      });
    };
    new MutationObserver(update).observe(hero, { attributes: true, attributeFilter: ["data-buildline-step"] });
    update();
  }

  function setupContactSignal() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    const required = [...form.querySelectorAll("[required]")];
    const nextSteps = [...document.querySelectorAll(".contact-next li")];
    const signal = document.createElement("div");
    signal.className = "intake-signal";
    signal.setAttribute("aria-hidden", "true");
    signal.innerHTML = "<span><i></i><i></i><i></i><i></i></span><small>BRIEF / IN PROGRESS</small>";
    form.prepend(signal);

    const update = () => {
      const complete = required.filter((field) => field.value.trim() && field.checkValidity()).length;
      const progress = required.length ? complete / required.length : 0;
      form.style.setProperty("--intake-progress", progress.toFixed(3));
      signal.querySelectorAll("i").forEach((node, index, nodes) => node.classList.toggle("is-complete", progress >= (index + 1) / nodes.length));
      const active = progress >= 1 ? 2 : progress >= 0.5 ? 1 : 0;
      nextSteps.forEach((step, index) => step.classList.toggle("is-motion-current", index === active));
      signal.querySelector("small").textContent = progress >= 1 ? "BRIEF / READY TO SEND" : progress > 0 ? "BRIEF / TAKING SHAPE" : "BRIEF / IN PROGRESS";
    };

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("input", update);
      field.addEventListener("change", update);
      field.addEventListener("focus", () => field.closest("label")?.classList.add("is-focused"));
      field.addEventListener("blur", () => field.closest("label")?.classList.remove("is-focused"));
    });
    form.addEventListener("grayston:form-success", () => {
      form.classList.add("is-brief-sent");
      signal.querySelector("small").textContent = "BRIEF / RECEIVED";
      signal.querySelectorAll("i").forEach((node) => node.classList.add("is-complete"));
    });
    update();
  }

  function setupCtaMotion() {
    if (reducedMotion || !gsap || !ScrollTrigger) return;
    document.querySelectorAll(".cta-section").forEach((section) => {
      const layout = section.querySelector(".cta-layout");
      if (!layout) return;
      gsap.fromTo(layout, { "--cta-progress": 0 }, {
        "--cta-progress": 1,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 82%", once: true },
      });
    });
  }

  function init() {
    if (!gsap || !ScrollTrigger) return;
    root.classList.add("motion-pro");
    setupLenis();
    const initializeHero = () => setupHeroMotion();
    if (document.fonts?.ready) document.fonts.ready.then(initializeHero);
    else initializeHero();
    setupSectionReveals();
    setupScrollNarratives();
    setupModuleTransitions();
    setupBuildlineSync();
    setupContactSignal();
    setupCtaMotion();
    window.requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

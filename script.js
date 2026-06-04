const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#site-nav");
const contactForm = document.querySelector("[data-contact-form]");

document.querySelectorAll("[data-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

document.documentElement.classList.add("js-ready");
window.addEventListener("load", () => {
  document.body.classList.add("is-loaded");
});

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (navToggle && header && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    header.classList.toggle("is-open", !isOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navToggle.setAttribute("aria-expanded", "false");
      header.classList.remove("is-open");
    }
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const setStatus = (form, message, tone = "neutral") => {
  const status = form.querySelector("[data-form-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
};

const buildMailtoUrl = (payload) => {
  const projectType = String(payload.projectType || "Project inquiry").trim();
  const subject = `Grayston project inquiry: ${projectType}`;
  const body = [
    `Name: ${payload.name || ""}`,
    `Email: ${payload.email || ""}`,
    `Company: ${payload.company || "Not provided"}`,
    `Project type: ${payload.projectType || "Not provided"}`,
    `Timeline: ${payload.timeline || "Not provided"}`,
    `Budget: ${payload.budget || "Not provided"}`,
    "",
    String(payload.message || "")
  ].join("\n");

  return `mailto:jforster@graystontechnologies.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setStatus(form, "Sending project details...", "neutral");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText = submitButton.textContent.trim();
    }

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
      setStatus(form, "Sent. Grayston will follow up from jforster@graystontechnologies.com.", "success");
    } catch (error) {
      setEmailFallbackStatus(form, error.message || "The form could not send right now.", payload);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

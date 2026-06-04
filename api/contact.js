const CONTACT_TO = process.env.CONTACT_TO_EMAIL || "jmaxforster@gmail.com";
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "Grayston Technologies <onboarding@resend.dev>";
const MAX_MESSAGE_LENGTH = 5000;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, message: "Method not allowed." }));
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, message: "Invalid form payload." }));
    return;
  }

  if (body.website) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, message: "Message sent." }));
    return;
  }

  const name = String(body.name || "").trim();
  const email = normalizeEmail(body.email);
  const company = String(body.company || "").trim();
  const projectType = String(body.projectType || "").trim();
  const timeline = String(body.timeline || "").trim();
  const budget = String(body.budget || "").trim();
  const message = String(body.message || "").trim().slice(0, MAX_MESSAGE_LENGTH);

  if (!name || !isValidEmail(email) || !projectType || message.length < 12) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, message: "Add your name, email, project type, and a short project description." }));
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, message: "Email delivery is not configured yet." }));
    return;
  }

  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    company: escapeHtml(company || "Not provided"),
    projectType: escapeHtml(projectType),
    timeline: escapeHtml(timeline || "Not provided"),
    budget: escapeHtml(budget || "Not provided"),
    message: escapeHtml(message).replaceAll("\n", "<br />")
  };

  const subject = `Grayston project inquiry: ${projectType}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || "Not provided"}`,
    `Project type: ${projectType}`,
    `Timeline: ${timeline || "Not provided"}`,
    `Budget: ${budget || "Not provided"}`,
    "",
    message
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#171817">
      <h1 style="font-size:22px">New Grayston Technologies inquiry</h1>
      <p><strong>Name:</strong> ${safe.name}</p>
      <p><strong>Email:</strong> ${safe.email}</p>
      <p><strong>Company:</strong> ${safe.company}</p>
      <p><strong>Project type:</strong> ${safe.projectType}</p>
      <p><strong>Timeline:</strong> ${safe.timeline}</p>
      <p><strong>Budget:</strong> ${safe.budget}</p>
      <hr style="border:none;border-top:1px solid #ddd" />
      <p>${safe.message}</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [CONTACT_TO],
        reply_to: email,
        subject,
        text,
        html
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      res.statusCode = 502;
      res.end(JSON.stringify({ ok: false, message: result.message || "Email provider rejected the message." }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, id: result.id || null, message: "Message sent." }));
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false, message: "Email delivery failed." }));
  }
};

// Vercel serverless function: adds a REAL signup to a Brevo contact list.
// Required Vercel environment variables:
//   BREVO_API_KEY  - Brevo API v3 key (Brevo > SMTP & API > API Keys)
//   BREVO_LIST_ID  - numeric ID of the Brevo list for REAL signups
// Brevo contact attributes used (create the custom ones in Brevo > Contacts > Settings):
//   FIRSTNAME, LASTNAME            (built in)
//   REAL_FORMAT  text  "Digital" or "Print"
//   ADDRESS, CITY, STATE, ZIP  text (only filled for printed copies)
//   SIGNUP_SOURCE  text

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  // Honeypot: real people never fill this hidden field. Pretend success for bots.
  if (clean(body.company, 200)) return res.status(200).json({ ok: true });

  const firstName = clean(body.firstName, 80);
  const lastName = clean(body.lastName, 80);
  const email = clean(body.email, 254).toLowerCase();
  const format = body.format === "Print" ? "Print" : "Digital";
  const street = clean(body.street, 200);
  const city = clean(body.city, 100);
  const state = clean(body.state, 2).toUpperCase();
  const zip = clean(body.zip, 10);

  if (!firstName || !lastName) return res.status(400).json({ error: "Please add your first and last name." });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Please check your email address." });
  if (format === "Print" && (!street || !city || !/^[A-Z]{2}$/.test(state) || !/^\d{5}(-\d{4})?$/.test(zip))) {
    return res.status(400).json({ error: "Please complete your mailing address." });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseInt(process.env.BREVO_LIST_ID, 10);
  if (!apiKey || !listId) {
    console.error("Missing BREVO_API_KEY or BREVO_LIST_ID");
    return res.status(500).json({ error: "Signups aren't connected yet." });
  }

  const attributes = { FIRSTNAME: firstName, LASTNAME: lastName, REAL_FORMAT: format, SIGNUP_SOURCE: "YE2026 REAL landing page" };
  if (format === "Print") Object.assign(attributes, { ADDRESS: street, CITY: city, STATE: state, ZIP: zip });

  try {
    const r = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, attributes, listIds: [listId], updateEnabled: true })
    });
    if (r.status === 201 || r.status === 204) return res.status(200).json({ ok: true });
    const detail = await r.text();
    console.error("Brevo error", r.status, detail);
    let code = "";
    try { code = JSON.parse(detail).code || ""; } catch (e) {}
    return res.status(502).json({ error: "We couldn't save your signup.", brevoStatus: r.status, brevoCode: code });
  } catch (err) {
    console.error("Brevo request failed", err);
    return res.status(502).json({ error: "We couldn't save your signup." });
  }
};

# You Keep Them in School: 2026 campaign site

Static site on Vercel, deployed from this repo. Every push to `main` redeploys.

## Pages
- `index.html`: **live now.** Lead page: name + email (optional mailing address) for a free copy of REAL. Ask-free.
- `giving-tuesday.html`: **draft.** Giving Tuesday / year-end page with five giving areas. Becomes the home page the week before Giving Tuesday (manual switch: it is renamed to `index.html`).
- `api/subscribe.js`: serverless function that adds signups to Brevo.
- `styles.css`: shared styles.

## Brevo setup (one time)
1. Brevo > Contacts > Lists: create a list (e.g. "REAL 2026 requests") and note its numeric ID.
2. Brevo > Contacts > Settings > Contact attributes: add text attributes `REAL_FORMAT`, `ADDRESS`, `CITY`, `STATE`, `ZIP`, `SIGNUP_SOURCE`.
3. Brevo > SMTP & API > API Keys: create a key.
4. Vercel > Project > Settings > Environment Variables: add `BREVO_API_KEY` and `BREVO_LIST_ID`, then redeploy.

## Before launch
- ~~Remove the `noindex` robots tag from `index.html`~~ (done Nov 2026)
- Confirm the signup fine print matches how the Foundation will email this list.

## Before the Giving Tuesday switch
- Fill in the fifth giving area.
- Paste each area's donation URL into `GIVE_URLS` in `giving-tuesday.html`. Any area without a URL is hidden on the page; add `?preview` to the address to see every area, with missing links outlined in red.
- Remove its `noindex` tag.

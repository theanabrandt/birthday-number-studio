# Number Studio — AI Birthday Portrait Generator

Members upload a child's photo, pick the age + vibe, and generate a birthday
portrait with the child inside a sculptural number. Powered by Google's
Nano Banana 2 (`gemini-3.1-flash-image`). Your API key stays server-side in a
Netlify Function — it is never exposed to the browser.

## Files
- `index.html` — the branded member-facing app
- `netlify/functions/generate.js` — server function that calls Gemini (holds the key + locks the brand prompt)
- `netlify.toml` — Netlify config

## Deploy (one-time)
1. Get a Gemini API key: https://aistudio.google.com/apikey (enable billing on that Google Cloud project).
2. Put these files in a GitHub repo (or drag the folder onto Netlify).
3. In Netlify: **Add new site → Import** (or drag-drop deploy).
4. **Site settings → Environment variables → Add:** `GEMINI_API_KEY = your key`.
5. Redeploy. Point your domain/subdomain at the site.

## Cost
You pay Google per generated image (roughly a few cents each at 2K). Decide
whether members get a monthly quota, pay per use, or you absorb it.

## Tuning
- Change themes or brand rules in `generate.js` (top of file).
- Default output is 4:5 at 2K — adjust `response_format` in `generate.js`.
- If you see timeouts, raise `timeout` in `netlify.toml` (needs a paid Netlify tier).

Note: all generated images carry an invisible SynthID watermark from Google.

// Netlify Function: POST /.netlify/functions/generate
const SHELLS = require("./shells.js"); // { arched:{1..10}, solid:{1..10} }

const MODEL = "gemini-3.1-flash-image";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

const BRAND = `
Brand + quality rules (follow exactly):
- Editorial, clean, soft directional window light. Textured plaster or seamless studio backdrop. Never busy or cluttered.
- Do NOT render any words, captions, logos, or watermarks in the image. If a name is provided, it may appear once as refined thin script on the front face of the number, and nowhere else.
- Photorealistic studio child-photography look. Natural depth of field. One child only.
`.trim();

// Number finish (drives look; reference image drives the numeral identity)
const SHAPES = {
  rounded: "The number has soft, rounded edges and gently curved corners - smooth and friendly.",
  sharp: "The number has crisp, sharp, clean geometric edges - a modern, architectural look.",
  chunky: "The number is bold and chunky with thick, substantial proportions - playful and solid.",
  thin: "The number is slim and elegant with refined thin proportions - delicate and modern."
};

// Color directions
const THEMES = {
  neutral: "Surround the base with matte, pearl, and soft-chrome balloons in cream, ivory, and warm silver. Warm cream palette overall.",
  blush_gold: "Surround the base with blush and warm-gold balloons mixed with fresh roses, ranunculus, and greenery. Blush and gold palette.",
  boho_cream: "Surround the base with cream and tan balloons, pampas grass, and dried florals. Earthy boho neutral palette.",
  floral: "Surround the number with roses, hydrangea, and baby's breath in blush, ivory, and champagne with soft greenery.",
  safari: "Surround the number with a soft jungle/safari world: monstera and palm leaves, white florals, sage and tan balloons, and a couple of realistic baby safari animals at a gentle child-friendly scale.",
  celestial: "Surround the base with cream and pale-gold balloons and subtle star and moon accents. Airy celestial palette.",
  white_tonal: "All-white tonal palette: barely-there ivory, chalk, and soft white balloons and accents, nearly monochrome white-on-white. Very clean, minimal, modern. The number is bright white.",
  modern_white: "A clean, modern, minimalist bright-white studio scene: crisp white architectural backdrop with a soft arch, a simple sprig of olive or eucalyptus greenery in a white vase to the side, and an airy cluster of white, clear-confetti, and silver-chrome balloons. Editorial, contemporary, uncluttered, lots of negative space. The number is bright white with soft natural shadows.",
  greige_taupe: "Modern greige and taupe palette: warm grey, mushroom, and stone tones. Balloons and a few minimal dried accents. Sophisticated, understated, contemporary. The number is a soft warm greige.",
  mono_blush: "Soft monochrome blush palette: every element - balloons, florals, backdrop - in tonal shades of blush and dusty pink. Modern and cohesive. The number is a pale blush.",
  mono_sage: "Soft monochrome sage palette: every element in tonal shades of sage green and eucalyptus. Modern and calm. The number is a soft sage or creamy white."
};

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method not allowed" };

  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) return json(500, cors, { error: "Server is missing GEMINI_API_KEY." });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, cors, { error: "Bad request." }); }

  // --- Validation mode: does the generated image clearly show numeral N? ---
  // Fail-open: any error returns matches:true so we never block a result.
  if (body.mode === "validate") {
    const vn = String(body.number || "1").replace(/[^0-9]/g, "").slice(0, 2) || "1";
    if (!body.image) return json(200, cors, { matches: true });
    try {
      const vResp = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
        {
          method: "POST",
          headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `Look at this image. Is the large sculptural birthday-number prop clearly and unmistakably the digit "${vn}" (readable as the number ${vn})? Reply with exactly one word: YES or NO.` },
                { inline_data: { mime_type: body.mimeType || "image/jpeg", data: body.image } }
              ]
            }]
          })
        }
      );
      const vData = await vResp.json().catch(() => ({}));
      const txt = (vData?.candidates?.[0]?.content?.parts || [])
        .map(p => p.text || "").join(" ").trim().toUpperCase();
      // matches unless it clearly said NO
      const matches = !/\bNO\b/.test(txt) || /\bYES\b/.test(txt);
      return json(200, cors, { matches });
    } catch (e) {
      return json(200, cors, { matches: true });
    }
  }

  const { number, theme, shape, cutout, details, name, imageBase64, mimeType } = body;
  if (!imageBase64) return json(400, cors, { error: "Please upload a child photo first." });

  const n = String(number || "1").replace(/[^0-9]/g, "").slice(0, 2) || "1";
  const themeText = THEMES[theme] || THEMES.neutral;
  const shapeText = SHAPES[shape] || SHAPES.rounded;
  const isSolid = cutout === "solid";
  const extra = (details || "").toString().slice(0, 400).trim();
  const nameLine = (name || "").toString().slice(0, 24).trim();
  const shellRef = (isSolid ? SHELLS.solid : SHELLS.arched)[n];

  const childPlacement = isSolid
    ? `CRITICAL - the child: take the child from Image 1 and place them standing or sitting directly in FRONT of the solid number, slightly overlapping it, as the clear main focal point, large and prominent. The number has NO interior cutout - it is a solid numeral.`
    : `CRITICAL - the child: take the child from Image 1 and place them seated within or peeking through the number's arched cutout opening as the clear main focal point, large and prominent - not small or distant.`;

  const numberLine = isSolid
    ? `THE SINGLE MOST IMPORTANT REQUIREMENT: the giant prop MUST clearly and unmistakably read as the numeral "${n}". Match the exact shape, proportions, curves, and orientation of the numeral shown in Image 2. It is the number ${n} — not a letter, not an arch, not a mirror, not an abstract shape. Make it a SOLID numeral (no interior window). If in doubt, copy the silhouette in Image 2 precisely. Render it as a real, dimensional, matte sculptural prop standing on the floor, about the full height of the frame.`
    : `THE SINGLE MOST IMPORTANT REQUIREMENT: the giant prop MUST clearly and unmistakably read as the numeral "${n}". Match the exact shape, proportions, curves, and orientation of the numeral shown in Image 2, including its tall arched interior cutout. It is the number ${n} — not a plain arch, not a letter, not a mirror, not an abstract shape. If in doubt, copy the silhouette in Image 2 precisely. Render it as a real, dimensional, matte sculptural prop standing on the floor, about the full height of the frame.`;

  const realism = `Make it look like a real, professional studio photograph: true-to-life textures, natural soft studio lighting, realistic shadows and depth of field, believable materials. Not illustrated, not 3D-cartoon, not flat.`;

  const prompt = [
    `You are given two images. Image 1 is a photo of a child. Image 2 shows the exact shape of a large numeral "${n}".`,
    numberLine,
    `Create ONE photorealistic milestone birthday portrait built around this giant, freestanding, matte sculptural numeral "${n}".`,
    shapeText,
    childPlacement,
    `Keep the child's face, skin tone, hair, and features as close as possible to Image 1 - do not restyle the face.`,
    themeText,
    realism,
    nameLine ? `Add the name "${nameLine}" once in refined thin script on the front face of the number (the only text allowed).` : "No text anywhere in the image.",
    extra ? `Extra direction: ${extra}` : "",
    BRAND
  ].filter(Boolean).join("\n\n");

  const input = [
    { type: "text", text: prompt },
    { type: "image", mime_type: mimeType || "image/jpeg", data: imageBase64 }
  ];
  if (shellRef) input.push({ type: "image", mime_type: "image/jpeg", data: shellRef });

  const payload = { model: MODEL, input, response_format: { type: "image", aspect_ratio: "4:5", image_size: "1K" } };

  try {
    const resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return json(resp.status, cors, { error: data?.error?.message || `Generation failed (${resp.status}).` });
    let b64 = data?.output_image?.data || null;
    if (!b64 && Array.isArray(data?.steps)) {
      for (const step of data.steps) {
        const blocks = step.content || step.summary || [];
        for (const c of blocks) if (c.type === "image" && c.data) b64 = c.data;
      }
    }
    if (!b64) return json(502, cors, { error: "No image came back - try again." });
    return json(200, cors, { image: b64, mimeType: "image/png" });
  } catch (e) {
    return json(500, cors, { error: "Something went wrong reaching the image service. Try again." });
  }
};

function json(statusCode, headers, obj) {
  return { statusCode, headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}




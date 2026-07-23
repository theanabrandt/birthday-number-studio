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
  mono_sage: "Soft monochrome sage palette: every element in tonal shades of sage green and eucalyptus. Modern and calm. The number is a soft sage or creamy white.",
  space: "A dreamy space and galaxy theme: soft midnight-blue and cream palette with gold stars, a crescent moon, small planets, and gentle sparkle. Balloons in navy, cream, and metallic gold. Magical but soft, airy, and child-friendly.",
  sweets: "A sweet candyland theme: soft pastel cupcakes, macarons, lollipops, and doughnuts with pink, mint, and cream balloons. Playful, sugary, cheerful, tasteful.",
  ocean: "An under-the-sea theme: soft aqua and sand tones with coral, seashells, starfish, gentle bubbles, and a few friendly little fish. Balloons in blue, teal, and cream. Dreamy underwater light.",
  dinosaur: "A friendly dinosaur theme: cute soft baby dinosaurs, tropical leaves, and sage-green, tan, and cream balloons. Playful 'dino' world, gentle and child-friendly, not scary.",
  princess: "A fairytale princess theme: soft castle turrets, a delicate tiara, twinkling fairy lights, roses, and blush, ivory, and gold balloons. Enchanted and elegant. Generic fairytale only - no branded or copyrighted characters.",
  rainbow: "A bright rainbow theme: a cheerful soft pastel rainbow arch, fluffy clouds, and balloons in gentle pastel colours. Happy and playful but still tasteful and airy.",
  winter: "A Winter ONE-derland theme: soft white and icy-blue palette with gentle snowflakes, frosted greenery, pinecones, and white and silver balloons. Cozy, magical, airy winter.",
  playroom: "A playful playroom toy-adventure theme: soft toy building blocks, a toy rocket, a little cowboy hat, star cushions, and soft primary-colour balloons. Fun toy vibe using ONLY generic, non-branded toys - absolutely no cartoon characters, mascots, or logos.",
  farm: "A cozy farm / barnyard theme: soft hay bales, sunflowers, a red-barn accent, and gentle cartoon-soft farm animals (chick, lamb, calf). Warm tan, cream, and red balloons. Child-friendly and wholesome.",
  circus: "A vintage circus / carnival theme: soft red-and-cream striped accents, bunting flags, star garlands, and playful balloons. Whimsical big-top feeling, gentle and tasteful.",
  butterfly: "A butterfly garden theme: delicate pastel butterflies, wildflowers, greenery, and soft blush, lavender, and cream balloons. Airy, whimsical, spring-like.",
  teddy: "A teddy bear picnic theme: soft plush teddy bears, gingham accents, honey and cream tones, daisies, and tan and cream balloons. Cozy, cuddly, nostalgic.",
  sports: "An all-star sports theme: soft generic sports balls (no team logos), pennant flags, and clean navy, cream, and green balloons. Playful and energetic but tasteful. No branded teams or logos.",
  cars: "A little-racer theme: soft generic toy race cars (no brand names or logos), checkered-flag accents, and red, black, and cream balloons. Fun and playful. No branded car characters.",
  construction: "A construction theme: soft toy dump trucks and diggers, tiny traffic cones, and yellow, tan, and cream balloons. Playful little-builder vibe. Generic toys only, no logos.",
  cloud: "An 'on cloud nine' theme: soft fluffy white clouds, a gentle rainbow hint, and pale blue, white, and cream balloons. Dreamy, soft, airy pastel sky.",
  woodland: "A woodland forest theme: soft toadstools, ferns, pinecones, and gentle cartoon-soft forest animals (fox, deer, bunny). Sage, tan, and cream balloons. Cozy storybook forest.",
  cowboy: "A 'first rodeo' wild-west theme: soft cowboy hat, bandana accents, hay, and tan, rust, and cream balloons. Warm, playful western vibe. Generic only, no branded characters.",
  superhero: "A little-superhero theme: soft comic-burst accents, a generic cape, star shapes, and bold-but-soft red, blue, and cream balloons. Playful hero vibe using ONLY generic elements - no branded superheroes, suits, or logos.",
  nautical: "A nautical theme: soft sailboats, anchors, rope accents, and navy, white, and cream balloons. Fresh seaside vibe, clean and tasteful.",
  tropical: "A tropical luau theme: soft monstera and palm leaves, hibiscus flowers, pineapple accents, and green, coral, and cream balloons. Sunny, playful, island vibe.",
  pumpkin: "A 'little pumpkin' autumn theme: soft pumpkins, wheat, warm fall foliage, and rust, cream, and sage balloons. Cozy harvest vibe, warm and gentle."
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

  const { number, theme, shape, cutout, details, imageBase64, mimeType } = body;
  if (!imageBase64) return json(400, cors, { error: "Please upload a child photo first." });

  const n = String(number || "1").replace(/[^0-9]/g, "").slice(0, 2) || "1";
  const themeText = THEMES[theme] || THEMES.neutral;
  const shapeText = SHAPES[shape] || SHAPES.rounded;
  const isSolid = cutout === "solid";
  const extra = (details || "").toString().slice(0, 400).trim();
  const shellRef = (isSolid ? SHELLS.solid : SHELLS.arched)[n];
  const RATIOS = ["4:5","2:3","1:1","9:16","3:2","3:4","4:3","5:4","16:9"];
  const ratio = RATIOS.includes(body.ratio) ? body.ratio : "4:5";

  // Natural "seat" spot for each numeral when placing the child WITH the number.
  const SEAT = {
    "1":"inside the tall arched opening of the 1",
    "2":"sitting on the flat bottom bar of the 2, tucked into its curve like a little bench",
    "3":"nestled into the lower rounded curve of the 3",
    "4":"seated on the crossbar of the 4, in its open triangular gap",
    "5":"nestled into the lower rounded belly of the 5",
    "6":"sitting inside the round lower loop of the 6",
    "7":"leaning into the open angle beneath the 7's top bar",
    "8":"seated in the lower loop of the 8",
    "9":"sitting on the tail/lower stem of the 9, beside its round loop",
    "10":"beside the 1 and 0, framed by the opening of the 0"
  };
  const seat = SEAT[n] || "beside the number";

  const childPlacement = isSolid
    ? `CRITICAL - the child: take the child from Image 1 and KEEP THEIR ORIGINAL POSE exactly as in the photo — if standing, keep them standing; if sitting, keep them sitting; preserve their posture, stance, arms, and legs. Place them directly in front of / beside the solid number as the clear main focal point, large and prominent, WITHOUT changing their pose. The number is a solid numeral with no interior cutout.`
    : `CRITICAL - the child: take the child from Image 1 and place them WITH the number in its natural seat — specifically ${seat} — as the clear main focal point, large and prominent, so they look nestled into or perched on the number itself (not floating separately beside it). Keep their pose natural for that spot; if the photo shows them standing you may seat or perch them so they fit the number. Preserve their face, outfit, and general look.`;

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
    `Keep the child's face, skin tone, hair, features, outfit, and pose as close as possible to Image 1 - do not restyle the child or change their clothes or pose.`,
    themeText,
    realism,
    "Do NOT render any text, letters, names, or numbers-as-text anywhere in the image.",
    extra ? `Extra direction: ${extra}` : "",
    BRAND
  ].filter(Boolean).join("\n\n");

  const input = [
    { type: "text", text: prompt },
    { type: "image", mime_type: mimeType || "image/jpeg", data: imageBase64 }
  ];
  if (shellRef) input.push({ type: "image", mime_type: "image/jpeg", data: shellRef });

  const payload = { model: MODEL, input, response_format: { type: "image", aspect_ratio: ratio, image_size: "1K" } };

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






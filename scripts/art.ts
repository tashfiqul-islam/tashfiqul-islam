/**
 * Builds every image in the profile README, in light and dark pairs, at two widths: `wide` for
 * desktop and `narrow` for phones (the README swaps them with `<picture>` media queries).
 *
 * The style follows mdxcn figures: dashed frames with `+` corners and a `[ TITLE ]` on the top
 * edge, monospace labels and one accent colour per GitHub mode. All copy lives in `PROFILE` below;
 * edit it, then run `bun scripts/art.ts` and commit the regenerated `assets/`.
 *
 * @module
 */

/** Colour mode of a GitHub page. */
export type Mode = "light" | "dark";
/** Layout: `wide` for desktop, `narrow` for screens up to 600 px. */
export type Width = "wide" | "narrow";

/** Everything the images say. Change copy here, never in the SVG files. */
export const PROFILE = {
  name: "TASHFIQUL ISLAM",
  place: "DHAKA · UTC+6",
  role: "TECHNICAL PRODUCT MANAGER",
  headline: ["I help engineers", "do their best work."],
  team: "Engineering Enablement & Platform Modernization",
  promise: "The bridge between technology and people.",
  stats: [
    ["7+", "years in technology"],
    ["5+", "years in product"],
    ["∞", "the long game"],
  ],
  focus: [
    ["01", "Developer experience", "flow · feedback · focus"],
    ["02", "Platform modernization", "current stack · clear design"],
    ["03", "Engineering enablement", "paved roads · golden paths"],
  ],
  principles: [
    ["01", "Flow", "Protect deep work:", "fewer handoffs and waits."],
    ["02", "Feedback", "Fast loops everywhere:", "build, test, review, ship."],
    ["03", "Focus", "Less cognitive load:", "paved roads, clear docs."],
    ["04", "The long game", "Platforms are never done:", "play the infinite game."],
  ],
  principlesSource: "flow · feedback · cognitive load: DevEx (ACM Queue, 2023)",
  charter: {
    pitch: ["Scores any repository 0–100 on how", "safely an AI coding agent can work in it."],
    traits: "OFFLINE · DETERMINISTIC · NO LLM IN THE LOOP",
    stack: "GO · CLI · GITHUB ACTION · SARIF",
    checks: [
      ["agent context", 0.74],
      ["mcp safety", 0.54],
      ["reproducibility", 0.83],
      ["ci posture", 0.65],
      ["governance", 0.44],
    ],
  },
  life: {
    reading: ["The Infinite Game", "Simon Sinek"],
    readingNote: ["Finite players play to win;", "infinite players play to keep playing."],
    cells: [
      ["LAST TRIP", "Malaysia", "a recent stamp in the passport"],
      ["LAST WATCHED", "Spider-Man: Brand New Day", "recently watched"],
      ["NOW PLAYING", "007 First Light", "recently played"],
    ],
    rotation: "travel · books · cinema · games · good food · Slytherin",
  },
} as const;

/** Colours of one mode, matched to GitHub's light and dark Primer palettes. */
interface Ink {
  readonly bg: string;
  readonly dots: string;
  readonly frame: string;
  readonly corner: string;
  readonly ink: string;
  readonly muted: string;
  readonly faint: string;
  readonly accent: string;
  readonly track: string;
  readonly glow: number;
}

const INKS: Readonly<Record<Mode, Ink>> = {
  dark: {
    accent: "#58a6ff",
    bg: "#0d1117",
    corner: "#6e7681",
    dots: "#1f242c",
    faint: "#6e7681",
    frame: "#30363d",
    glow: 0.16,
    ink: "#f0f6fc",
    muted: "#9198a1",
    track: "#21262d",
  },
  light: {
    accent: "#0969da",
    bg: "#ffffff",
    corner: "#8c959f",
    dots: "#dfe4ea",
    faint: "#8c959f",
    frame: "#d0d7de",
    glow: 0.1,
    ink: "#1f2328",
    muted: "#59636e",
    track: "#eaeef2",
  },
};

/** Type sizes per layout: phone images shrink about 2×, so their text starts larger. */
interface Type {
  readonly label: number;
  readonly small: number;
  readonly body: number;
}

const TYPE: Readonly<Record<Width, Type>> = {
  narrow: { body: 20, label: 17, small: 16 },
  wide: { body: 16, label: 13, small: 12 },
};

/** Colours of one mode plus type sizes of one layout. */
interface Style extends Ink, Type {}

const style = (mode: Mode, width: Width): Style => ({ ...INKS[mode], ...TYPE[width] });

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const MONO_ADVANCE = 0.6;

const round = (value: number): number => Math.round(value * 10) / 10;

/** Escapes text for SVG character data and attributes. */
export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** One text run. */
interface Text {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly fill: string;
  readonly size: number;
  readonly font?: "sans" | "mono";
  readonly weight?: number;
  readonly anchor?: "start" | "middle" | "end";
  readonly tracking?: number;
}

/** Renders one `<text>` element; the text is escaped. */
function text(t: Text): string {
  const attrs = [
    `x="${t.x}"`,
    `y="${t.y}"`,
    `font-family="${t.font === "sans" ? SANS : MONO}"`,
    `font-size="${t.size}"`,
    t.weight === undefined ? "" : `font-weight="${t.weight}"`,
    t.anchor === undefined || t.anchor === "start" ? "" : `text-anchor="${t.anchor}"`,
    t.tracking === undefined ? "" : `letter-spacing="${t.tracking}"`,
    `fill="${t.fill}"`,
  ].filter(Boolean);
  return `<text ${attrs.join(" ")}>${escapeXml(t.text)}</text>`;
}

/** Width a `[ LABEL ]` takes on a frame edge, in px, with breathing room on both sides. */
const labelWidth = (label: string, size: number): number =>
  [...label].length * (size * MONO_ADVANCE + 1.5) + 16;

/** A dashed frame: `+` corners, `[ TITLE ]` on the left of the top edge, optional `[ NOTE ]` right. */
interface Frame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly note?: string;
  readonly size?: number;
}

/** Renders a frame; the top edge breaks around its labels so the dot grid shows through. */
function frame(ink: Style, f: Frame): string {
  const size = f.size ?? ink.label;
  const title = `[ ${f.title} ]`;
  const note = f.note === undefined ? undefined : `[ ${f.note} ]`;
  const right = f.x + f.width;
  const bottom = f.y + f.height;
  const inset = size >= 13 ? 36 : 28;
  const gaps: [number, number][] = [[f.x + inset, f.x + inset + labelWidth(title, size)]];
  if (note !== undefined) gaps.push([right - inset - labelWidth(note, size), right - inset]);
  let top = `M${f.x} ${f.y}`;
  for (const [from, to] of gaps) top += `H${round(from)}M${round(to)} ${f.y}`;
  const parts = [
    `<path d="${top}H${right}V${bottom}H${f.x}V${f.y}" fill="none" stroke="${ink.frame}" stroke-dasharray="6 6"/>`,
    ...[
      [f.x, f.y],
      [right, f.y],
      [f.x, bottom],
      [right, bottom],
    ].map(
      ([cx = 0, cy = 0]) =>
        `<path d="M${cx - 6} ${cy}h12M${cx} ${cy - 6}v12" stroke="${ink.corner}" stroke-width="1.5"/>`,
    ),
    text({ fill: ink.muted, size, text: title, tracking: 1.5, x: f.x + inset + 8, y: f.y + 5 }),
  ];
  if (note !== undefined) {
    parts.push(
      text({
        anchor: "end",
        fill: ink.faint,
        size,
        text: note,
        tracking: 1.5,
        x: right - inset - 8,
        y: f.y + 5,
      }),
    );
  }
  return parts.join("");
}

/** A small accent dot followed by an uppercase mono eyebrow. */
function eyebrow(ink: Style, x: number, y: number, label: string, size = ink.label): string {
  return [
    `<circle cx="${x + 4}" cy="${y - 5}" r="4" fill="${ink.accent}"/>`,
    text({ fill: ink.accent, size, text: label, tracking: 2, x: x + 18, y }),
  ].join("");
}

/** A horizontal hairline. */
const rule = (ink: Style, x: number, y: number, length: number): string =>
  `<path d="M${x} ${y}h${length}" stroke="${ink.frame}"/>`;

/** The SVG shell: background, dot grid, an accent glow, accessible name and description. */
function sheet(ink: Style,
  size: { readonly width: number; readonly height: number },
  glow: { readonly cx: number; readonly cy: number; readonly r: number },
  label: { readonly title: string; readonly desc: string },
  body: readonly string[],
): string {
  const { width, height } = size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(label.title)}</title>
<desc id="desc">${escapeXml(label.desc)}</desc>
<defs>
<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${ink.dots}"/></pattern>
<radialGradient id="glow"><stop offset="0" stop-color="${ink.accent}" stop-opacity="${ink.glow}"/><stop offset="1" stop-color="${ink.accent}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${width}" height="${height}" fill="${ink.bg}"/>
<rect width="${width}" height="${height}" fill="url(#dots)"/>
<circle cx="${glow.cx}" cy="${glow.cy}" r="${glow.r}" fill="url(#glow)"/>
${body.join("\n")}
</svg>
`;
}

/** Stat row: big sans value over a mono caption, laid out from `x` with a fixed column step. */
function stats(ink: Style, x: number, y: number, step: number, valueSize: number): string[] {
  return PROFILE.stats.flatMap(([value, caption], i) => [
    text({
      fill: ink.ink,
      font: "sans",
      size: valueSize,
      text: value,
      tracking: -0.5,
      weight: 700,
      x: x + i * step,
      y,
    }),
    text({ fill: ink.muted, size: ink.small, text: caption, tracking: 0.5, x: x + i * step, y: y + 24 }),
  ]);
}

/** The `[ FOCUS ]` list: numbered rows with a name and a mono note, hairlines between rows. */
function focusRows(ink: Style, x: number, y: number, width: number, gap: number): string[] {
  return PROFILE.focus.flatMap(([step, name, note], i) => {
    const top = y + i * gap;
    return [
      text({ fill: ink.accent, size: ink.label, text: step, tracking: 1, weight: 700, x, y: top }),
      text({ fill: ink.ink, font: "sans", size: 22, text: name, weight: 700, x: x + 40, y: top + 1 }),
      text({ fill: ink.muted, size: ink.label, text: note, tracking: 0.5, x: x + 40, y: top + 28 }),
      i < PROFILE.focus.length - 1 ? rule(ink, x, top + gap / 2 + 6, width) : "",
    ];
  });
}

const HERO_LABEL = {
  desc: `${PROFILE.role.toLowerCase()}, ${PROFILE.team}. ${PROFILE.promise} Focus: developer experience, platform modernization and engineering enablement. 7+ years in technology, 5+ in product.`,
  title: `Tashfiqul Islam: ${PROFILE.headline.join(" ")}`,
};

/**
 * Renders the hero: role, headline, stats and the three focus areas.
 *
 * @param mode - GitHub colour mode the image is for.
 * @param width - Desktop (`wide`, 1280 × 560) or phone (`narrow`, 720 × 1040) layout.
 * @returns A standalone SVG document.
 */
export function heroSvg(mode: Mode, width: Width): string {
  const ink = style(mode, width);
  const [first, second] = PROFILE.headline;
  if (width === "wide") {
    return sheet(ink, { height: 560, width: 1280 }, { cx: 980, cy: 280, r: 460 }, HERO_LABEL, [
      frame(ink, { height: 480, note: PROFILE.place, title: PROFILE.name, width: 1200, x: 40, y: 40 }),
      eyebrow(ink, 92, 132, PROFILE.role),
      text({ fill: ink.ink, font: "sans", size: 60, text: first, tracking: -2, weight: 800, x: 88, y: 210 }),
      text({ fill: ink.accent, font: "sans", size: 60, text: second, tracking: -2, weight: 800, x: 88, y: 280 }),
      text({ fill: ink.ink, font: "sans", size: 20, text: PROFILE.team, weight: 600, x: 92, y: 332 }),
      text({ fill: ink.muted, font: "sans", size: 20, text: PROFILE.promise, x: 92, y: 362 }),
      rule(ink, 92, 396, 560),
      ...stats(ink, 92, 446, 188, 34),
      frame(ink, { height: 368, title: "FOCUS", width: 420, x: 768, y: 96 }),
      ...focusRows(ink, 808, 168, 340, 112),
    ]);
  }
  return sheet(ink, { height: 1040, width: 720 }, { cx: 520, cy: 300, r: 420 }, HERO_LABEL, [
    frame(ink, { height: 960, note: "DHAKA", title: PROFILE.name, width: 656, x: 32, y: 40 }),
    eyebrow(ink, 76, 128, PROFILE.role),
    text({ fill: ink.ink, font: "sans", size: 52, text: first, tracking: -1.5, weight: 800, x: 72, y: 204 }),
    text({ fill: ink.accent, font: "sans", size: 52, text: second, tracking: -1.5, weight: 800, x: 72, y: 266 }),
    text({ fill: ink.ink, font: "sans", size: 20, text: "Engineering Enablement &", weight: 600, x: 76, y: 322 }),
    text({ fill: ink.ink, font: "sans", size: 20, text: "Platform Modernization", weight: 600, x: 76, y: 350 }),
    text({ fill: ink.muted, font: "sans", size: 20, text: PROFILE.promise, x: 76, y: 386 }),
    rule(ink, 76, 418, 568),
    ...stats(ink, 76, 470, 212, 34),
    frame(ink, { height: 400, title: "FOCUS", width: 568, x: 76, y: 556 }),
    ...focusRows(ink, 112, 632, 496, 120),
  ]);
}

/**
 * Renders the working principles: flow, feedback, focus and the long game.
 *
 * @param mode - GitHub colour mode the image is for.
 * @param width - Desktop (`wide`, 1280 × 400, one row) or phone (`narrow`, 720 × 680, 2 × 2).
 * @returns A standalone SVG document.
 */
export function principlesSvg(mode: Mode, width: Width): string {
  const ink = style(mode, width);
  const label = {
    desc: PROFILE.principles.map(([, name, a, b]) => `${name}: ${a} ${b}`).join(" "),
    title: "How I work",
  };
  const wide = width === "wide";
  const columns = wide ? 4 : 2;
  const cell = { height: wide ? 216 : 236, width: wide ? 267 : 300 };
  const origin = { x: wide ? 76 : 44, y: wide ? 104 : 100 };
  const gutter = wide ? 20 : 32;
  const cards = PROFILE.principles.flatMap(([step, name, a, b], i) => {
    const x = origin.x + (i % columns) * (cell.width + gutter);
    const y = origin.y + Math.floor(i / columns) * (cell.height + gutter);
    return [
      `<rect x="${x}" y="${y}" width="${cell.width}" height="${cell.height}" rx="10" fill="${ink.bg}" fill-opacity="0.7" stroke="${ink.frame}"/>`,
      text({ fill: ink.accent, size: ink.label, text: step, tracking: 1, weight: 700, x: x + 24, y: y + 40 }),
      text({ fill: ink.ink, font: "sans", size: wide ? 28 : 30, text: name, tracking: -0.5, weight: 800, x: x + 24, y: y + 96 }),
      text({ fill: ink.muted, font: "sans", size: ink.body, text: a, x: x + 24, y: y + 140 }),
      text({ fill: ink.muted, font: "sans", size: ink.body, text: b, x: x + 24, y: y + 164 }),
    ];
  });
  const height = wide ? 400 : 680;
  const sourceY = height - 50;
  return sheet(ink, { height, width: wide ? 1280 : 720 }, { cx: wide ? 640 : 360, cy: height / 2, r: 520 }, label, [
    frame(ink, {
      height: height - 72,
      note: wide ? "DEVEX · THE INFINITE GAME" : undefined,
      title: "HOW I WORK",
      width: wide ? 1200 : 656,
      x: wide ? 40 : 32,
      y: 40,
    }),
    ...cards,
    text({
      fill: ink.faint,
      size: ink.small,
      text: PROFILE.principlesSource,
      x: origin.x,
      y: sourceY,
    }),
  ]);
}

/** Readiness bars for the Charter sample report. */
function checkBars(ink: Style, x: number, y: number, width: number): string[] {
  const barX = x + 190;
  const barWidth = width - 190 - 56;
  return PROFILE.charter.checks.flatMap(([name, score], i) => {
    const top = y + i * 48;
    return [
      text({ fill: ink.muted, size: ink.label, text: name, tracking: 0.5, x, y: top + 10 }),
      `<rect x="${barX}" y="${top}" width="${barWidth}" height="12" rx="6" fill="${ink.track}"/>`,
      `<rect x="${barX}" y="${top}" width="${round(barWidth * score)}" height="12" rx="6" fill="${ink.accent}"/>`,
      text({ anchor: "end", fill: ink.ink, size: ink.label, text: String(Math.round(score * 100)), x: x + width, y: top + 11 }),
    ];
  });
}

/**
 * Renders the Charter spotlight: pitch on the left, a sample readiness report on the right.
 *
 * @param mode - GitHub colour mode the image is for.
 * @param width - Desktop (`wide`, 1280 × 520) or phone (`narrow`, 720 × 860) layout.
 * @returns A standalone SVG document.
 */
export function charterSvg(mode: Mode, width: Width): string {
  const ink = style(mode, width);
  const { charter } = PROFILE;
  const total = Math.round(
    (charter.checks.reduce((sum, [, score]) => sum + score, 0) / charter.checks.length) * 100,
  );
  const label = {
    desc: `Charter: ${charter.pitch.join(" ")} ${charter.traits.toLowerCase()}. A sample report scores ${charter.checks.map(([name, s]) => `${name} ${Math.round(s * 100)}`).join(", ")}.`,
    title: "Charter: AI-agent readiness, scored",
  };
  const score = (x: number, y: number): string[] => [
    text({ fill: ink.ink, font: "sans", size: 44, text: String(total), tracking: -1, weight: 800, x, y }),
    text({ fill: ink.muted, size: ink.label, text: "/ 100 overall", x: x + 62, y: y - 4 }),
  ];
  if (width === "wide") {
    return sheet(ink, { height: 520, width: 1280 }, { cx: 960, cy: 260, r: 440 }, label, [
      frame(ink, { height: 440, note: "OPEN SOURCE · APACHE-2.0", title: "FEATURED", width: 1200, x: 40, y: 40 }),
      eyebrow(ink, 92, 132, "AI-AGENT READINESS, SCORED"),
      text({ fill: ink.ink, font: "sans", size: 84, text: "Charter", tracking: -3, weight: 800, x: 86, y: 228 }),
      text({ fill: ink.muted, font: "sans", size: 20, text: charter.pitch[0], x: 92, y: 280 }),
      text({ fill: ink.muted, font: "sans", size: 20, text: charter.pitch[1], x: 92, y: 308 }),
      rule(ink, 92, 344, 540),
      text({ fill: ink.ink, size: ink.small, text: charter.traits, tracking: 1.2, x: 92, y: 380 }),
      text({ fill: ink.faint, size: ink.small, text: charter.stack, tracking: 1.2, x: 92, y: 408 }),
      frame(ink, { height: 344, title: "SAMPLE REPORT", width: 496, x: 696, y: 96 }),
      ...score(736, 178),
      ...checkBars(ink, 736, 222, 416),
    ]);
  }
  return sheet(ink, { height: 860, width: 720 }, { cx: 360, cy: 600, r: 420 }, label, [
    frame(ink, { height: 780, note: "APACHE-2.0", title: "FEATURED", width: 656, x: 32, y: 40 }),
    eyebrow(ink, 76, 128, "AI-AGENT READINESS"),
    text({ fill: ink.ink, font: "sans", size: 76, text: "Charter", tracking: -2.5, weight: 800, x: 70, y: 218 }),
    text({ fill: ink.muted, font: "sans", size: ink.body, text: charter.pitch[0], x: 76, y: 268 }),
    text({ fill: ink.muted, font: "sans", size: ink.body, text: charter.pitch[1], x: 76, y: 296 }),
    rule(ink, 76, 330, 568),
    text({ fill: ink.ink, size: ink.small, text: charter.traits, tracking: 0.6, x: 76, y: 364 }),
    text({ fill: ink.faint, size: ink.small, text: charter.stack, tracking: 0.6, x: 76, y: 398 }),
    frame(ink, { height: 356, title: "SAMPLE REPORT", width: 568, x: 76, y: 432 }),
    ...score(112, 512),
    ...checkBars(ink, 112, 556, 496),
  ]);
}

/** One life cell: mono label, sans title, muted note. */
function lifeCell(ink: Style,
  x: number,
  y: number,
  [labelText, title, note]: readonly [string, string, string],
  titleSize: number,
): string[] {
  return [
    text({ fill: ink.faint, size: ink.small, text: labelText, tracking: 1.5, x, y }),
    text({ fill: ink.ink, font: "sans", size: titleSize, text: title, tracking: -0.5, weight: 800, x, y: y + 42 }),
    text({ fill: ink.muted, font: "sans", size: ink.body - 1, text: note, x, y: y + 72 }),
  ];
}

/**
 * Renders life outside work: the current book, last trip, film, game and the usual rotation.
 *
 * @param mode - GitHub colour mode the image is for.
 * @param width - Desktop (`wide`, 1280 × 460) or phone (`narrow`, 720 × 900) layout.
 * @returns A standalone SVG document.
 */
export function lifeSvg(mode: Mode, width: Width): string {
  const ink = style(mode, width);
  const { life } = PROFILE;
  const [book, author] = life.reading;
  const label = {
    desc: `Now reading ${book} by ${author}. ${life.cells.map(([l, t]) => `${l.toLowerCase()}: ${t}`).join("; ")}. In rotation: ${life.rotation}.`,
    title: "Off the clock",
  };
  const reading = (x: number, y: number, size: number): string[] => [
    eyebrow(ink, x, y, "NOW READING", ink.small),
    text({ fill: ink.ink, font: "sans", size, text: book, tracking: -1, weight: 800, x: x - 2, y: y + 58 }),
    text({ fill: ink.accent, font: "sans", size: 20, text: author, weight: 600, x, y: y + 92 }),
    text({ fill: ink.muted, font: "sans", size: ink.body, text: life.readingNote[0], x, y: y + 140 }),
    text({ fill: ink.muted, font: "sans", size: ink.body, text: life.readingNote[1], x, y: y + 164 }),
  ];
  if (width === "wide") {
    const [trip, watched, played] = life.cells;
    return sheet(ink, { height: 460, width: 1280 }, { cx: 260, cy: 200, r: 420 }, label, [
      frame(ink, { height: 380, note: "BOOKS · TRAVEL · CINEMA · GAMES", title: "OFF THE CLOCK", width: 1200, x: 40, y: 40 }),
      ...reading(92, 128, 44),
      `<path d="M560 96V364M560 230H1188M876 96V230" stroke="${ink.frame}"/>`,
      ...lifeCell(ink, 600, 132, trip, 28),
      ...lifeCell(ink, 916, 132, played, 28),
      ...lifeCell(ink, 600, 268, watched, 28),
      rule(ink, 92, 364, 1096),
      text({ fill: ink.faint, size: ink.small, text: "IN ROTATION", tracking: 1.5, x: 92, y: 396 }),
      text({ fill: ink.accent, size: ink.label, text: life.rotation, tracking: 0.5, x: 240, y: 396 }),
    ]);
  }
  const items = life.rotation.split(" · ");
  const half = Math.ceil(items.length / 2);
  const rotationLines = [items.slice(0, half), items.slice(half)].map((part) => part.join(" · "));
  return sheet(ink, { height: 900, width: 720 }, { cx: 360, cy: 220, r: 400 }, label, [
    frame(ink, { height: 820, title: "OFF THE CLOCK", width: 656, x: 32, y: 40 }),
    ...reading(76, 128, 44),
    rule(ink, 76, 334, 568),
    ...life.cells.flatMap((cell, i) => [
      ...lifeCell(ink, 76, 378 + i * 124, cell, 28),
      i < life.cells.length - 1 ? rule(ink, 76, 476 + i * 124, 568) : "",
    ]),
    rule(ink, 76, 742, 568),
    text({ fill: ink.faint, size: ink.small, text: "IN ROTATION", tracking: 1.5, x: 76, y: 780 }),
    ...rotationLines.map((line, i) =>
      text({ fill: ink.accent, size: ink.label, text: line, tracking: 0.5, x: 76, y: 810 + i * 28 }),
    ),
  ]);
}

/** Every committed image, keyed by its path in the repository. */
export function art(): Record<string, string> {
  const files: Record<string, string> = {};
  const pieces = { charter: charterSvg, hero: heroSvg, life: lifeSvg, principles: principlesSvg };
  for (const [name, render] of Object.entries(pieces)) {
    for (const mode of ["light", "dark"] as const) {
      files[`assets/${name}-${mode}.svg`] = render(mode, "wide");
      files[`assets/${name}-mobile-${mode}.svg`] = render(mode, "narrow");
    }
  }
  return files;
}

if (import.meta.main) {
  for (const [path, svg] of Object.entries(art())) await Bun.write(path, svg);
  console.log(`Wrote ${Object.keys(art()).length} images to assets/`);
}

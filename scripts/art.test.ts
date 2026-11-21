import { describe, expect, test } from "bun:test";
import { art, escapeXml } from "./art";

describe("art", () => {
  test("every committed image matches the generator", async () => {
    const files = Object.entries(art());
    expect(files).toHaveLength(20);
    const committed = await Promise.all(files.map(([path]) => Bun.file(path).text()));
    expect(committed).toEqual(files.map(([, svg]) => svg));
  });

  test("each image has an accessible name and no unescaped text", () => {
    for (const svg of Object.values(art())) {
      expect(svg).toContain('role="img" aria-labelledby="title desc"');
      expect(svg).not.toMatch(/>[^<]*&(?!amp;|lt;|gt;|quot;)[^<]*</);
    }
  });

  test("the README uses every image and keeps the weather bot's markers", async () => {
    const readme = await Bun.file("README.md").text();
    for (const path of Object.keys(art())) expect(readme).toContain(`./${path}`);
    // GitHub hides links ending #gh-dark-mode-only / #gh-light-mode-only by its own theme setting;
    // <picture> media with prefers-color-scheme would follow the OS instead.
    expect(readme).not.toContain("prefers-color-scheme");
    const blocks = [...readme.matchAll(/<a href="([^"]*)">\s*<picture>([\s\S]*?)<\/picture>/g)];
    expect(blocks).toHaveLength(10);
    for (const [, link = "", body = ""] of blocks) {
      const mode = /#gh-(dark|light)-mode-only$/.exec(link)?.[1];
      expect(mode).toBeDefined();
      expect(body.match(new RegExp(`-${mode}\\.svg`, "g"))).toHaveLength(2);
    }
    expect(readme).toMatch(/<!-- Hourly Weather Update -->(?:[\s\S]*?<td){5}[\s\S]*?<!-- End of Hourly Weather Update -->/);
    expect(readme).toMatch(/<em>Last refresh:.*?<\/em>/);
  });
});

test("escapeXml escapes markup characters", () => {
  expect(escapeXml(`a & <b> "c"`)).toBe("a &amp; &lt;b&gt; &quot;c&quot;");
});

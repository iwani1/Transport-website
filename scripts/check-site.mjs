/**
 * Post-build checks for the generated site in ./_site
 *
 *   node scripts/check-site.mjs
 *
 * 1. Every local href/src/url() in the HTML and CSS points at a file that exists.
 * 2. Every page has exactly one <h1>, a <title>, a meta description and a canonical URL.
 * 3. Every <img> has an alt attribute.
 * 4. No leftover template placeholder text (Lorem ipsum, template brand names).
 * 5. Each page runs in jsdom with its scripts to catch JavaScript errors, and the menu + form contract are exercised.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname, posix } from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";
import { createServer } from "node:http";

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain" };

const ROOT = resolve("_site");
const problems = [];
const warn = (msg) => problems.push(msg);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const cssFiles = files.filter((f) => f.endsWith(".css"));

function resolveLocal(ref, fromFile) {
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean) return null;
  const target = clean.startsWith("/")
    ? join(ROOT, clean)
    : join(dirname(fromFile), clean);
  return target;
}

function isExternal(ref) {
  return /^(https?:)?\/\//i.test(ref) || /^(mailto|tel|javascript|data):/i.test(ref);
}

const placeholderRe = /lorem ipsum|logitrans|themesawesome|mochreza|Boulevard des Capucines|OIA Global|html5shiv/i;

for (const file of htmlFiles) {
  const rel = posix.relative(ROOT, file);
  const html = readFileSync(file, "utf8");
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // --- structure / SEO
  const h1s = doc.querySelectorAll("h1");
  if (h1s.length !== 1) warn(`${rel}: expected exactly one <h1>, found ${h1s.length}`);
  if (!doc.querySelector("title")?.textContent.trim()) warn(`${rel}: missing <title>`);
  if (!doc.querySelector('meta[name="description"]')?.getAttribute("content")) warn(`${rel}: missing meta description`);
  if (!doc.querySelector('link[rel="canonical"]')) warn(`${rel}: missing canonical link`);
  if (!doc.documentElement.getAttribute("lang")) warn(`${rel}: missing <html lang>`);

  // --- images
  for (const img of doc.querySelectorAll("img")) {
    if (!img.hasAttribute("alt")) warn(`${rel}: <img src="${img.getAttribute("src")}"> has no alt attribute`);
  }

  // --- placeholder text
  const text = doc.body?.textContent || "";
  const m = text.match(placeholderRe) || html.match(placeholderRe);
  if (m) warn(`${rel}: template placeholder text found: "${m[0]}"`);

  // --- local references
  const refs = [];
  doc.querySelectorAll("[href]").forEach((el) => refs.push(el.getAttribute("href")));
  doc.querySelectorAll("[src]").forEach((el) => refs.push(el.getAttribute("src")));
  doc.querySelectorAll("form[action]").forEach((el) => refs.push(el.getAttribute("action")));
  doc.querySelectorAll("[style]").forEach((el) => {
    for (const mm of el.getAttribute("style").matchAll(/url\(([^)]+)\)/g)) refs.push(mm[1].replace(/['"]/g, ""));
  });
  for (const ref of refs) {
    if (!ref || ref === "#" || ref.startsWith("#") || isExternal(ref)) {
      if (ref === "#") warn(`${rel}: placeholder href="#" link`);
      continue;
    }
    const target = resolveLocal(ref, file);
    if (target && !existsSync(target)) warn(`${rel}: broken local reference "${ref}"`);
  }
}

for (const file of cssFiles) {
  const rel = posix.relative(ROOT, file);
  const css = readFileSync(file, "utf8");
  for (const mm of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    const ref = mm[2];
    if (isExternal(ref) || ref.startsWith("#") || ref.startsWith("%23")) continue; // fragments, incl. url(#id) inside data-URI SVGs
    const target = resolveLocal(ref, file);
    if (target && !existsSync(target)) warn(`${rel}: broken url() reference "${ref}"`);
  }
}

// --- JavaScript smoke test: serve _site locally, load each page with scripts enabled, collect runtime errors
const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let p = join(ROOT, urlPath);
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!existsSync(p)) { res.statusCode = 404; return res.end("not found"); }
  const ext = p.slice(p.lastIndexOf("."));
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const jsErrors = [];
for (const file of htmlFiles) {
  const rel = posix.relative(ROOT, file);
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => {
    const msg = String(e && (e.message || e)) + (e && e.detail ? " " + (e.detail.stack || e.detail) : "");
    if (/not implemented|Could not parse CSS stylesheet|Could not load iframe/i.test(msg)) return;
    jsErrors.push(`${rel}: ${msg.split("\n").slice(0, 3).join(" | ")}`);
  });
  virtualConsole.on("error", (...args) => jsErrors.push(`${rel}: console.error ${args.join(" ")}`));
  let dom;
  try {
    dom = await JSDOM.fromURL(base + rel, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      virtualConsole,
      beforeParse(window) {
        window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
        window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
        window.scrollTo = () => {};
      },
    });
  } catch (e) {
    jsErrors.push(`${rel}: failed to load page: ${e.message}`);
    continue;
  }
  await new Promise((done) => {
    dom.window.addEventListener("load", () => setTimeout(done, 500));
    setTimeout(done, 5000);
  });
  // Sanity: did site.js run? It marks the header on the first scroll pass and sets the menu state.
  const w = dom.window;
  const checks = [];
  const hdr = w.document.getElementById("hdr");
  const burger = w.document.querySelector(".burger");
  if (!hdr) checks.push("header #hdr missing");
  if (!burger || !burger.hasAttribute("aria-expanded")) checks.push("menu button missing");
  if (!w.document.getElementById("menu")?.hasAttribute("inert")) checks.push("menu should start inert");
  // Exercise the menu toggle: open then Escape closes it.
  if (burger) {
    burger.click();
    if (burger.getAttribute("aria-expanded") !== "true") checks.push("site.js did not open the menu (script not running?)");
    w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    if (burger.getAttribute("aria-expanded") !== "false") checks.push("Escape did not close the menu");
  }
  // Forms must keep the production contract used by contact.php / forms.js
  for (const form of w.document.querySelectorAll("form[data-ajax-form]")) {
    const need = ["name", "email"];
    for (const n of need) if (!form.querySelector(`[name="${n}"]`)) checks.push(`form missing field ${n}`);
    if (!form.querySelector('[name="form"], [name="access_key"]')) checks.push("form missing hidden form/access_key field");
    if (!form.querySelector(".form-status")) checks.push("form missing .form-status");
    if (!form.querySelector('[type="submit"]')) checks.push("form missing submit button");
  }
  if (checks.length) jsErrors.push(`${rel}: ${checks.join("; ")}`);
  dom.window.close();
}
server.close();

if (jsErrors.length) problems.push(...jsErrors);

if (problems.length) {
  console.error(`\n${problems.length} problem(s) found:\n`);
  for (const p of problems) console.error(" - " + p);
  process.exit(1);
} else {
  console.log(`OK — ${htmlFiles.length} pages and ${cssFiles.length} stylesheets checked, no problems found.`);
}

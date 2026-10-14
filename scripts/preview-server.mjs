/**
 * Minimal preview server for the built site (./_site).
 *
 *   node scripts/preview-server.mjs [port]
 *   node scripts/preview-server.mjs [port] --home=design-concepts/concept-1-clear.html   # serve a mock-up at /
 *
 * Serves the static files (plus ./design-concepts at /concepts/) and mocks the PHP form handler (POST /contact.php)
 * so the contact/quote forms can be tried locally without PHP. On the real
 * host, contact.php runs as PHP and sends the e-mail.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";

const ROOT = resolve("_site");
const CONCEPTS = resolve("design-concepts");
const args = process.argv.slice(2);
const PORT = Number(args.find((a) => /^\d+$/.test(a)) || process.env.PORT || 8080);
const HOME = (args.find((a) => a.startsWith("--home=")) || "").slice(7); // optional file served at "/"
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
  ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json",
};

createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);

  if (urlPath === "/contact.php") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      console.log(`[mock contact.php] ${req.method} ${body.slice(0, 200)}`);
      const wantsJson = /application\/json/.test(req.headers.accept || "") || /_ajax=1/.test(body);
      if (wantsJson) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, message: "Preview mode: the message was NOT sent. On the live server contact.php e-mails it to you." }));
      } else {
        res.writeHead(303, { Location: "/thank-you.html" });
        res.end();
      }
    });
    return;
  }

  // Design mock-ups (not part of the production build) are served from ./design-concepts at /concepts/
  if (HOME && (urlPath === "/" || urlPath === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    return res.end(readFileSync(resolve(HOME)));
  }
  let base = ROOT, rel = urlPath;
  if (urlPath === "/concepts" || urlPath.startsWith("/concepts/")) { base = CONCEPTS; rel = urlPath.replace(/^\/concepts\/?/, "/"); }
  let file = join(base, rel);
  if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    const nf = join(ROOT, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(existsSync(nf) ? readFileSync(nf) : "Not found");
  }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
  res.end(readFileSync(file));
}).listen(PORT, "0.0.0.0", () => console.log(`Preview: http://0.0.0.0:${PORT}  (serving ${ROOT}${HOME ? `, home page = ${HOME}` : ""})`));

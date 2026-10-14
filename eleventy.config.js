/**
 * Eleventy configuration for the Blahar & Benyah website.
 *
 *   npm run build   -> writes the deployable site to ./_site
 *   npm start       -> local preview with live reload on http://localhost:8080
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const SRC = path.join(__dirname, "src");

/** Read the pixel size of a WebP / PNG / JPEG file from its header (no image library needed). */
function imageSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

module.exports = function (eleventyConfig) {
  // Static assets copied straight through to _site/
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "src/contact.php": "contact.php" });
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "src/favicon-32x32.png": "favicon-32x32.png" });
  eleventyConfig.addPassthroughCopy({ "src/apple-touch-icon.png": "apple-touch-icon.png" });
  eleventyConfig.addPassthroughCopy({ "src/android-chrome-192x192.png": "android-chrome-192x192.png" });
  eleventyConfig.addPassthroughCopy({ "src/site.webmanifest": "site.webmanifest" });

  // Keep the classic "page.html" URL style the site has always used.
  eleventyConfig.addGlobalData("permalink", () => (data) => {
    if (data.permalink !== undefined && typeof data.permalink !== "function") return data.permalink;
    return `${data.page.filePathStem}.html`;
  });

  // Build-time values
  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());
  eleventyConfig.addGlobalData("buildDate", () => new Date().toISOString().slice(0, 10));

  // Filters
  eleventyConfig.addFilter("absoluteUrl", (path, base) => new URL(path, base).href);
  eleventyConfig.addFilter("telHref", (display) => "tel:" + String(display).replace(/[^+\d]/g, ""));
  eleventyConfig.addFilter("initials", (name) =>
    String(name)
      .replace(/[.,]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase()
  );
  eleventyConfig.addFilter("where", (arr, key, value) => (arr || []).filter((o) => o[key] === value));
  eleventyConfig.addFilter("thousands", (n) => Number(n).toLocaleString("en-GB"));
  // Phone numbers should not wrap mid-number
  eleventyConfig.addFilter("nbsp", (str) => String(str).replace(/ /g, "\u00a0"));
  eleventyConfig.addFilter("jsonld", (obj) =>
    JSON.stringify(obj).replace(/</g, "\\u003c") // safe inside <script>
  );

  // Cache-busting: /css/site.css -> /css/site.css?v=1a2b3c4d (hash of the file's content).
  // .htaccess caches CSS/JS for a month; the query string changes whenever the file does,
  // so visitors never get a new page with a stale stylesheet or script.
  const hashCache = new Map();
  eleventyConfig.on("eleventy.before", () => hashCache.clear());
  eleventyConfig.addFilter("assetUrl", (url) => {
    if (!hashCache.has(url)) {
      try {
        const buf = fs.readFileSync(path.join(SRC, url.replace(/^\//, "")));
        hashCache.set(url, crypto.createHash("md5").update(buf).digest("hex").slice(0, 8));
      } catch (e) {
        hashCache.set(url, null);
      }
    }
    const h = hashCache.get(url);
    return h ? `${url}?v=${h}` : url;
  });

  // Responsive images: {% set m = 'img/hero/x.webp' | imgMeta %} gives { width, height, srcset }.
  // If a smaller "<name>-960.<ext>" sibling exists (or `mobile` is passed) it is offered in
  // srcset so phones download the small file and desktops the large one.
  const metaCache = new Map();
  eleventyConfig.on("eleventy.before", () => metaCache.clear());
  eleventyConfig.addFilter("imgMeta", (src, mobile) => {
    const key = src + "|" + (mobile || "");
    if (metaCache.has(key)) return metaCache.get(key);
    const rel = String(src).replace(/^\//, "");
    const abs = path.join(SRC, rel);
    const meta = { src: "/" + rel, width: null, height: null, srcset: "" };
    try {
      const size = imageSize(abs);
      if (size) Object.assign(meta, size);
      const m = rel.match(/^(.*)(\.[a-z0-9]+)$/i);
      let small = mobile ? String(mobile).replace(/^\//, "") : m ? `${m[1]}-960${m[2]}` : null;
      if (small && fs.existsSync(path.join(SRC, small)) && small !== rel) {
        const ss = imageSize(path.join(SRC, small));
        if (ss && meta.width && ss.width < meta.width) meta.srcset = `/${small} ${ss.width}w, /${rel} ${meta.width}w`;
      }
    } catch (e) {
      /* unknown image: fall back to a plain src */
    }
    metaCache.set(key, meta);
    return meta;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};

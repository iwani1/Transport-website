/**
 * Eleventy configuration for the Blahar & Benyah website.
 *
 *   npm run build   -> writes the deployable site to ./_site
 *   npm start       -> local preview with live reload on http://localhost:8080
 */
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

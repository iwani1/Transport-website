# Blahar & Benyah Int'l Ltd — website

Source code for **https://blaharbenyah.com** — a logistics, transportation and
customs-clearing company in Tema, Ghana.

The site is a static website generated with [Eleventy](https://www.11ty.dev/).
All pages share one header, footer and set of business details, so a phone
number or opening time only ever needs to be changed in one place.

The design ("Showcase", v2.1) is a dark, cinematic, motion-led site in the
company's teal/orange: a full-screen hero with an animated map of Ghana, a
scroll-driven truck journey, sticky service cards, a diagonal orange
call-to-action band and floating-label forms. No frameworks or jQuery —
one hand-written stylesheet (`src/css/site.css`) and one script
(`src/js/site.js`) plus the form handler (`src/js/forms.js`).

```
src/
├── _data/
│   ├── site.json          ← business details: phones, email, address, hours, WhatsApp, social, analytics
│   ├── services.json      ← the six services (text, images, bullet points) → services/*.html
│   ├── testimonials.json  ← quotes shown on the home page
│   ├── stats.json         ← the animated counters
│   ├── features.json      ← "Why choose us" items
│   ├── team.json          ← people shown on the About page
│   └── schema.js          ← builds the LocalBusiness structured data (no need to edit)
├── _includes/
│   ├── layouts/base.njk   ← <head>, scripts, wrapper
│   └── partials/          ← header + full-screen menu, footer, page hero, forms, service stack,
│                             journey (scroll truck), Ghana map, stats, CTA band, WhatsApp button
├── index.njk, about-us.njk, services.njk, service.njk, contact.njk, thank-you.njk, 404.njk
├── css/site.css           ← the whole design (design tokens at the top)
├── js/site.js, js/forms.js
├── img/  fonts/           ← WebP photos; self-hosted Bebas Neue + Inter
├── contact.php            ← form handler (runs on the web host)
└── .htaccess              ← HTTPS, redirects, caching, security headers
```

## Everyday editing

| I want to…                                  | Edit                                   |
|---------------------------------------------|----------------------------------------|
| Change a phone number, e-mail, hours, address | `src/_data/site.json`                 |
| Add the company's Facebook / Instagram links | `site.json` → `social` (icons appear automatically) |
| Change the WhatsApp number or greeting       | `site.json` → `whatsapp`               |
| Edit service text or bullet points           | `src/_data/services.json` (`blurb`/`highlights` feed the home cards, `paragraphs`/`bullets` the service page) |
| Change a testimonial or the counter numbers  | `testimonials.json` / `stats.json`     |
| Change the home page headline / rotating words | `src/index.njk` (`data-words` on the `#swap` span) |
| Change the truck-journey captions            | `src/_includes/partials/journey.njk`   |
| Add a looping video behind the home hero     | `site.json` → `"hero": { "video": "/img/hero/tema.mp4" }` (see below) |
| Change colours or fonts                      | the `:root` variables at the top of `src/css/site.css` |
| Add a photo                                  | optimise it first (see below), save in `src/img/…`, reference it as `/img/…` |
| Turn on analytics                            | `site.json` → `analytics` (Plausible domain or GA4 ID) |

After editing, rebuild (below) and upload the contents of `_site/`.

## Building

Requires Node.js 18 or newer.

```bash
npm install          # first time only
npm run build        # generates the deployable site in ./_site
npm run check        # verifies links, images, headings, metadata and JavaScript
npm start            # local preview with live reload at http://localhost:8080
```

`npm start` previews the pages; to also try the forms locally use
`node scripts/preview-server.mjs` (it mocks `contact.php`).

## Deploying to the cPanel host

1. `npm run build`
2. Upload **everything inside** `_site/` (including the hidden `.htaccess`) to
   `public_html/`, replacing the old files.
3. Delete any leftovers from the old site that are no longer generated
   (`header-style-2.html`, `blog.html`, `single-post.html`, `single-services.html`,
   `main-logitrans-html.zip`, `main-logitrans-html/`, old `img/` files).
   `.htaccess` already redirects their URLs.

Pushing to `main` on GitHub also runs the build and stores the finished site as
a downloadable artifact (Actions tab). If `FTP_SERVER`, `FTP_USERNAME` and
`FTP_PASSWORD` secrets are added to the repository, the workflow deploys the
site automatically.

### Contact form e-mail

`contact.php` sends enquiries with PHP's `mail()` to the address in its
`CONFIG` block (`TettehQuashieBlahar@gmail.com`). For reliable delivery to
Gmail:

* create the mailbox `noreply@blaharbenyah.com` in cPanel → *Email Accounts*
  (it is only used as the sender address), and
* make sure the domain has an SPF record (cPanel → *Email Deliverability*).

Alternative without PHP: sign up at [web3forms.com](https://web3forms.com)
(free), then set in `site.json`:

```json
"forms": { "provider": "web3forms", "web3formsKey": "YOUR-ACCESS-KEY" }
```

## The design, in short

* **Hero** — Ken Burns photo (or optional video), rotating headline word,
  animated SVG map of Ghana with routes drawn from Tema, counters.
* **Journey** (home page) — a four-screen section where scrolling drives a
  truck from Tema Port to Kumasi: the port leaves, palms and lamp posts
  parallax past, dusk turns to night, the headlights come on and a kilometre
  counter and four milestone captions follow along. It is pure CSS layers +
  ~60 lines of JavaScript (`journey()` in `site.js`) — no video, no library.
  Visitors who prefer reduced motion get a static scene with all four
  captions listed.
* **Services** — sticky stacking cards on the home page, an editorial image
  grid on the services page, and a two-column service page with a sticky
  quote form.
* **Motion respects `prefers-reduced-motion`**; the custom cursor and
  magnetic buttons only run on mouse devices.

### Optional hero video

Drop a short, silent, looping MP4 (ideally ≤ 3 MB, 1920×1080, 10–20 s —
e.g. drone footage of the yard or trucks at Tema Port) into `src/img/hero/`
and point to it in `site.json`:

```json
"hero": { "video": "/img/hero/tema.mp4" }
```

The clip fades in over the photo once it can play. It is skipped on phones
and for visitors with reduced motion, so the photo remains the fallback. No
footage is bundled — the previous stock imagery had none and nothing has
been generated.

### Design history

Three earlier concept mock-ups (Clear & Trusted / Night Port / Route) and the
stand-alone Showcase demo that became this design are kept in Git history
(`git show d478d84:design-concepts/`); they are not part of the build.

## Images

Keep photos small — many visitors are on mobile data. The helper script
resizes and converts to WebP:

```bash
pip install Pillow                                    # once
python3 scripts/optimize-images.py photo.jpg src/img/content/photo.webp --width 1200
```

## Things that need the owner's input

* **Opening hours** — the old site showed both 08:00–17:00 and 08:00–16:00.
  The site now uses 08:00–17:00 everywhere; change `hours` in `site.json` if wrong.
* **Social media links** — none were configured (the old icons pointed to
  facebook.com etc.). Add real profile URLs to `site.json`.
* **Testimonials & statistics** — carried over from the previous site; please
  confirm they are genuine before launch. The "How it works" timings
  (within the hour / same day / 2–5 days) and the journey captions describe a
  typical Tema → Kumasi job — adjust if they over-promise.
* **Photos** — most are stock. The construction and warehousing heroes
  (`img/hero/construction.webp`, `img/hero/warehouse.webp`) are AI-generated
  illustrations standing in for real photos of your own site and warehouse —
  replace them with your own photos when you can (same file names, 16:9,
  about 1600 px wide, plus a `-960` version for phones).
* **Google Business Profile** — the map pin exists; claiming the listing helps
  local search rankings.

## History

* **v2.1** — the Showcase design: new CSS/JS, fonts (Bebas Neue + Inter),
  journey section; jQuery, Owl Carousel, FlexSlider, WOW.js and the template
  CSS removed.
* **v2.0** — rebuilt as an Eleventy site with shared data files, SEO head,
  structured data, sitemap and the PHP/Web3Forms form handler.
* **v1** (2026) was a hand-edited copy of the "Logitrans" HTML template. The
  original export is preserved in Git history (`git show a0e24b6`), including
  the unused template files that are no longer deployed.

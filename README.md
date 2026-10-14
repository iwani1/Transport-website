# Blahar & Benyah Int'l Ltd — website

Source code for **https://blaharbenyah.com** — a logistics, transportation and
customs-clearing company in Tema, Ghana.

The site is a static website generated with [Eleventy](https://www.11ty.dev/).
All pages share one header, footer and set of business details, so a phone
number or opening time only ever needs to be changed in one place.

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
│   └── partials/          ← header, footer, forms, page banner, WhatsApp button …
├── index.njk, about-us.njk, services.njk, service.njk, contact.njk, thank-you.njk, 404.njk
├── css/  js/  img/  fonts/
├── contact.php            ← form handler (runs on the web host)
└── .htaccess              ← HTTPS, redirects, caching, security headers
```

## Everyday editing

| I want to…                                  | Edit                                   |
|---------------------------------------------|----------------------------------------|
| Change a phone number, e-mail, hours, address | `src/_data/site.json`                 |
| Add the company's Facebook / Instagram links | `site.json` → `social` (icons appear automatically) |
| Change the WhatsApp number or greeting       | `site.json` → `whatsapp`               |
| Edit service text or bullet points           | `src/_data/services.json`              |
| Change a testimonial or the counter numbers  | `testimonials.json` / `stats.json`     |
| Change the home page slider text             | `src/index.njk`                        |
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

## Design concepts

`design-concepts/` holds three alternative home-page designs (not part of the
production build). View the overview with `npm run preview` at `/concepts/`,
or run each as its own demo site:

```bash
npm run preview:showcase   # Showcase design  → http://localhost:8001
npm run preview:concept1   # Clear & Trusted  → http://localhost:8001
npm run preview:concept2   # Night Port       → http://localhost:8002
npm run preview:concept3   # Route            → http://localhost:8003
```

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
  confirm they are genuine before launch.
* **Google Business Profile** — the map pin exists; claiming the listing helps
  local search rankings.

## History

Version 1 (2026) was a hand-edited copy of the "Logitrans" HTML template. The
original export is preserved in Git history (`git show a0e24b6`), including
the unused template files that are no longer deployed.

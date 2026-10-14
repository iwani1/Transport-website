// Structured data (schema.org) built from site.json + services.json.
// Rendered as JSON-LD on every page by _includes/partials/jsonld.njk
const site = require("./site.json");
const services = require("./services.json");

const sameAs = Object.values(site.social || {}).filter(Boolean);

const business = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${site.url}/#business`,
  name: site.name,
  description: site.description,
  url: site.url,
  image: `${site.url}/img/og-image.jpg`,
  logo: `${site.url}/img/logo.png`,
  telephone: site.phones.map((p) => p.e164),
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: `${site.address.line1}, ${site.address.line2}`,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: site.address.countryCode,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: site.geo.lat,
    longitude: site.geo.lng,
  },
  hasMap: site.mapLink,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: site.hours.days,
      opens: site.hours.opens,
      closes: site.hours.closes,
    },
  ],
  areaServed: { "@type": "Country", name: "Ghana" },
  knowsAbout: services.map((s) => s.title),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Services",
    itemListElement: services.map((s) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: s.title,
        url: `${site.url}/services/${s.slug}.html`,
      },
    })),
  },
};

if (sameAs.length) business.sameAs = sameAs;

module.exports = { business };

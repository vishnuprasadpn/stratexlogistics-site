# stratexlogistics.com (v2)

Static site for Stratex Logistics. No build step: push these files to GitHub Pages as-is.

## Files
- `index.html`: all page content
- `styles.css`: design system and layout
- `script.js`: interactions and animations
- `js/motion.min.js`: Motion animation library (v11.18.2, MIT), bundled locally so the site has no runtime CDN dependency
- `favicon.svg`, `robots.txt`, `sitemap.xml`
- `CNAME`: serves the site on stratexlogistics.com

## Before going live
1. **Contact form**: get a free access key at https://web3forms.com using the admin email, then replace `YOUR_WEB3FORMS_ACCESS_KEY` in `index.html`.
2. **Photos**: the current images are free Unsplash photos, hotlinked from images.unsplash.com. They are generic port and warehouse imagery, not Stratex facilities. Replace them with the client's own photos when available (search for `images.unsplash.com` in index.html). Credits: CHUTTERSNAP (hero), Russ Murray (warehouse aisle), Vida Huang (pallets), Bernd Dittrich (containers), Bent Van Aeken (ship), Haris Illahi (port aerial).
3. **Contact details**: a commented-out block for email, phone and office address sits in the contact section of `index.html`. Uncomment and fill it in when the client provides these.
4. **Logo**: the mark in the header and footer is a placeholder SVG. Swap it for the client's logo.

## Deploy (GitHub Pages)
1. Push to a repo, with `index.html` at the root of `main`.
2. Settings → Pages → Deploy from branch → `main` / root. The custom domain should show `stratexlogistics.com`.
3. Hostinger DNS: A records for `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; CNAME `www` → `<username>.github.io`. Leave MX records alone.
4. Once the domain check passes, enable "Enforce HTTPS".

## Editing notes
- Facility status appears in three places: the hero "Cold storage network" panel, the Infrastructure tabs, and the map SVG (`class="site dev"` means under development, `class="site planned"` means planned). Update all three if a status changes.
- Animations respect the visitor's "reduce motion" setting and fall back to a static page if the Motion script fails to load.

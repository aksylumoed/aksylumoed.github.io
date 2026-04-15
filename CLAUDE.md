# CLAUDE.md

## Project

**adndkr.com** — digital art portfolio and physical artwork sighting tracker for artist adndkr. Physical artworks carry QR codes; scanning one opens `/scan` where finders submit their location, building a provenance map of each piece's journey.

## Stack

- **Frontend:** Vanilla TypeScript, Webpack 5, custom CSS (no frameworks)
- **Hosting:** GitHub Pages (`gh-pages` branch), domain via `CNAME` → `adndkr.com`
- **Backend:** AWS API Gateway → Lambda (Node.js 18) → DynamoDB (`adndkr-sightings`)
- **Font:** M PLUS Code Latin (Google Fonts, monospace throughout)
- **i18n:** EN/DE, localStorage-persisted, via `data-i18n` attributes

## Key Directories & Files

```
src/                   TypeScript source
  artworks.ts          Gallery page logic (hash routing, image nav, sighting display)
  scan.ts              QR scan flow (certificate → geolocation → submit sighting)
  constants.ts         Artwork metadata catalog (id, title, imagePath, dimensions)
  subimages.ts         Sub-image arrays (e.g. artwork #16 has 61 variants)
  i18n.ts              EN/DE switcher with callback subscriptions
  image-loader.ts      XHR image loading with MB/MB progress reporting
  config.ts            API_BASE_URL (AWS API Gateway endpoint)
  lang-switcher.ts     Language toggle UI component
  prevent-image-actions.ts  Disables right-click & drag on images

objects/index.html     Gallery viewer page
scan/index.html        QR scan landing page
scan/scan.css          Scan page styles
notes/index.html       Placeholder ("work in progress")
png/                   High-res artwork images (* and *-fs8.png compressed variants)
infrastructure/        AWS CloudFormation template (Lambda + DynamoDB stack)
```

## Build & Deploy

- `dist/` is **gitignored** — never commit it manually
- On push to `master`, GitHub Actions (`.github/workflows/deploy.yml`):
  1. Runs `npm install && npm run build` (Webpack → `dist/bundle.js` + `dist/scan.bundle.js`)
  2. Force-adds `dist/` and force-pushes to `gh-pages` branch for Pages serving
- **Do not run `npm run build` locally** — the workflow handles it

## Git Workflow

- **Always push directly to `master`** — this is the only branch that matters. Never push to a feature branch unless the user explicitly asks.
- No feature branches, no PRs, no intermediate branches — commit and push straight to `master`.
- No need to run npm/build steps locally; CI handles all compilation

## Backend

- `config.ts` holds `API_BASE_URL` pointing to `https://yp8e0vcgj9.execute-api.eu-central-1.amazonaws.com`
- Two Lambda functions: `adndkr-post-sighting` (PUT) and `adndkr-get-sightings` (GET by artworkId)
- DynamoDB table: `adndkr-sightings`, PK `artworkId` + SK `timestamp`
- CloudFormation stack in `infrastructure/template.yaml`

## Key Patterns

- **Hash routing:** `/objects/` navigates via `#/artworkId` and `#/artworkId/subIndex`
- **Artwork navigation:** arrow keys + on-screen buttons; vertical axis for sub-images
- **Image loading:** XHR + blob + FileReader for base64 preload with live progress
- **i18n:** subscribe to language changes via `i18n.onLanguageChange(cb)`; use `data-i18n="key"` in HTML
- **Asset protection:** right-click and drag disabled site-wide on images
- **Responsive widths:** `maxWidthPercentage` (desktop) and `maxWidthPercentageMobile` per artwork in `constants.ts`

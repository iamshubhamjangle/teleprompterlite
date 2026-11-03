# Teleprompter Lite

A local-first teleprompter for creators recording with a phone in front of a laptop. Adjustable horizontal margins keep the script near the lens; reading height reserves empty phone clearance below it.

## Run

Requires Node.js 24 and npm. The app uses Next.js 16.4.4 and React 19.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Before a production build, copy `.env.example` to ignored `.env.local`, or set `SITE_URL` in your hosting environment. Use `npm run build` and `npm start` for a production preview.

## Use

- Paste/edit Markdown; the always-visible toolbar formats selected text or the current source line (bold, italic, strikethrough, code, headings, quotes, lists). Ctrl/Command+B or I applies bold/italic; Ctrl/Command+Shift+X applies strikethrough, and Ctrl/Command+backtick applies code. The empty reader opens **Edit script** directly. Or import a UTF-8 `.md`/`.txt` file up to 1 MB. Script export and configuration export are separate.
- Use side handles on the reader to adjust margins and the lower divider to adjust reading height. Handles work with dragging or arrow keys, including fullscreen and popup output. **Layout** contains presets and configuration import/export. At 100% height the phone clearance disappears.
- Adjust font, font size, line height, speed, reading guide, focus, and mirror in the compact right panel. Theme and help live in that panel and its collapsed rail. The reader has no header/footer; popup and fullscreen actions sit beside each other in the transport.
- Collapse panels to rails. Hover/focus temporarily reveals them without moving the script; tap rail icons on mobile. Persistent panel changes can rewrap the column while preserving the reading anchor.
- Bookmark a logical source line beside the script; use **Bookmarks** to rename/jump/remove it. Changed or ambiguously matched source lines become unresolved and can be reassigned to the current line.
- Space plays/pauses when focus is in the reader. Up/Down moves between paragraphs; Left/Right decreases/increases font size by 2px within 18–96px. Wheel over the script scrolls normally while playing or paused; Ctrl/Meta-wheel retains browser zoom. Use the slower/faster buttons or +/− shortcuts to change speed. Number keys do not control speed. F or middle-click opens fullscreen; Escape exits. Native inputs and controls keep their own keys.
- The reader's top-right Edit button opens script editing from preview or fullscreen, exiting fullscreen first. The edit screen includes download/upload icons, Use Sample, New, and Save. Save immediately persists the draft in browser storage and closes editing; automatic saving also remains enabled.
- Fullscreen and popup modes use the same reader with bookmark output enabled by default (existing saved choices are preserved). Hover or focus reveals output resize handles; changing output height automatically enables phone clearance. The popup needs a direct user click; enter its native fullscreen from inside that window. Unsupported fullscreen falls back to a viewport-filling reading view.
- The popup owns its own animation loop. Commands and logical anchors synchronize on the same device using BroadcastChannel with a same-origin postMessage fallback. Closing either side pauses safely; a disconnected popup can continue locally.
- Configuration and the current draft/bookmarks save to this browser. Reload always starts paused. Export backups before clearing browser data. No script upload or account system is included.

## Development

```sh
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Husky's pre-commit hook runs lint and non-watch unit tests, failing the commit if either fails. It is installed by `npm ci` through the `prepare` script; the repository must be initialized. Run `sh .husky/_/pre-commit` in Git Bash to exercise it without creating a commit.

Local Windows browser tests use installed Microsoft Edge. On other platforms run `npx playwright install chromium` first. CI installs and tests Chromium, Firefox, and WebKit. The workflow is ready but has not been run remotely. For manual mobile QA check both orientations, on-screen keyboard, and physical phone placement.

`src/content/strings.en.ts` contains authored UI copy and the sample script. `src/app/globals.css` is the only custom stylesheet. Fonts are self-hosted through Fontsource; Tabler icons are used throughout, including generated shadcn controls. `components.json` retains the shadcn generation configuration. The shadcn development dependency also supplies the imported Tailwind stylesheet, so it is required for builds.

## Current boundaries

- One local draft rather than a script library; accounts and collaboration are future work.
- Markdown is deliberately limited for prompting: whole paragraphs are parsed before source-line anchors are added, preserving multiline inline styles, headings, and list structure. Images, tables, raw HTML, and embeds are omitted. URLs are not interactive during reading.
- Duplicate source-line matches are conservative. Uncertain bookmarks are marked unresolved rather than silently moved.
- Browser permissions determine real fullscreen, popup placement, and screen wake-lock availability. A popup does not connect to a physical phone or a different computer.
- Firefox/WebKit automation is configured for CI; only Chromium via Edge has been exercised locally so far.
- Run `npm audit --omit=dev` for production dependencies and `npm audit` for the full development tree. Current findings, fixes, and remaining upstream tooling advisories are documented in [PUBLIC-RELEASE-AUDIT.md](PUBLIC-RELEASE-AUDIT.md). Avoid forced downgrades and incompatible transitive dependency overrides to hide audit findings.

Implementation details: [ARCHITECTURE.md](ARCHITECTURE.md). Security and data handling: [SECURITY.md](SECURITY.md).

The left sidebar keeps its tabs outside the scrolling content. **Edit script** is the primary action above word/cue counts; the draft title is retained as local metadata without a title field.

Per project guidance, UI preview QA is performed by the user. Component/unit checks and production compilation run without launching the app; browser tests remain available for explicit QA runs.

The app mark and favicon share public/logo.svg. Regenerate the SVG/ICO app icons with node scripts/generate-icons.mjs after changing the mark.

## Public content and production SEO

`/` is the public landing page, with a sample reading-width demo, product information, setup steps and FAQs. The existing workspace lives at `/editor`; its drafts and preferences keep the same browser storage keys. Five server-rendered guides cover first use, laptop/phone setup, popup output, scripts/bookmarks and mirror mode. `/blog` lists three articles on spoken scripts, scrolling speed and retakes. Copy and the public route registry are in `src/content/seo.en.ts`; metadata, sitemap and graphs use the same registry. `/editor` and `/presenter` are noindex and omitted from the sitemap. Public links open the editor directly. No recording, voice-following, remote-device or offline-install feature was added.

The confirmed production origin is `https://teleprompterlite.vercel.app`. Set `SITE_URL` in the hosting environment; `.env.example` documents this public value and the available settings. For local production builds, copy the example to ignored `.env.local`. Real environment files, including `.env.production`, are ignored and must not be committed. Keep credentials in the hosting environment or ignored local environment files.

Public builds validate the HTTPS origin and reject local/placeholder/malformed URLs. To make a deliberately non-indexable local or staging production build, set `SEO_PREVIEW=1` before `npm run build`; unset it for release. Development is non-indexable by default. Preview pages omit canonicals/JSON-LD, use noindex, and emit disallow robots plus an empty sitemap. Public builds generate self-canonicals, public robots/sitemap, website/application/page and breadcrumb JSON-LD, and a local-font 1200×630 share image at `/social-preview`.

Before deployment, run lint, typecheck, unit/component tests and build. `npm run verify:seo` checks the generated public route HTML, canonicals, indexing policy, links, sitemap, graph serialization and PNG without starting a server. It uses `SITE_URL` from the environment or ignored `.env.local`. CI supplies the public origin explicitly and checks production dependencies and SEO artifacts. Browser preview and E2E remain user-owned QA because Playwright starts the app.

After deployment the owner must verify HTTPS/alternate-host redirects, real 404/status behavior, robots/sitemap and CDN crawler access, then configure Google Search Console/Bing Webmaster Tools and submit the sitemap. Core Web Vitals, indexing and AI citations require live measurements. Pricing, operator/legal/profile facts and model-training crawler preferences remain unconfirmed; no unsupported claims or training-policy changes were added.

The app is named Teleprompter Lite. Existing local drafts/preferences and exported configuration remain compatible: legacy storage/channel/configuration identifiers are deliberately unchanged.

Vercel Web Analytics counts visits. Presenter events are excluded; event URLs have query strings and fragments removed. Scripts, drafts, and bookmarks are not included in application telemetry. Hosting/CDN access logs are separate. See [SECURITY.md](SECURITY.md) for the browser-storage boundary and vulnerability-reporting contact.

## License

This project is licensed under the [MIT License](LICENSE). Third-party dependencies retain their own licenses.

---
version: 1
slug: "landing-page"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/landing-page.tsx", "src/components/product-information.tsx", "src/app/blog/page.tsx", "src/components/documentation-page.tsx"]
---

# Public landing page

Mode: Persuade. Light editorial presentation extending the established green/Geist identity. Code-led build. The user requested Stripe/Vercel-inspired section structure, product imagery, a supplied Teleprompter Lite demo GIF at the top right, and HTML/CSS animation loops with copyright-free assets. UI preview remains the user's responsibility under AGENTS.md.

THESIS: Show the creator how script geometry and reading pace fit their recording setup.
OWN-WORLD: Light warm neutrals, green action accent, bundled Geist, Tabler icons, broad whitespace, and original geometric SVG assets. Public imagery and colored illustration surfaces extend the brand without entering the workspace.
STORY: Discover the reader; understand laptop/phone alignment; prepare a script in three steps; explore pace, bookmarks and output; understand browser storage; answer questions; read practical guides; open the editor.
FIRST VIEWPORT: Large three-line headline beside a top-right product-media plate containing the supplied 800×450 Teleprompter Lite demo GIF. The complete 16:9 animation is framed without cropping or stretching. On mobile the media stacks below the pitch with 12px plate padding and 20px page insets. The old sample-script layout demo has been removed.
SIGNATURE INTERACTION: Two slow CSS loops illustrate the reading guide and output synchronization; reduced motion disables them.

## Composition and assets

The hero gives way to a capability strip, a device-alignment illustration, an ordered workflow, feature scenes, local-saving guidance, native FAQ disclosures, three illustrated article links, a tinted closing action and footer navigation. Product information and guide links stay server-rendered. No unsupported accounts, recording, remote readers, customer claims or testimonials are added.

Original SVG assets in public/images depict laptop/phone alignment, script lines, a waveform and retake bookmarks. These are project-authored assets with no stock licensing dependency. Feature loops have no effect on actual playback.

The content frame is capped at 1200px. Tablet layouts stack hero/setup/FAQ columns while feature visuals pair with prose. Phone layouts stack workflows, features and articles, wrap navigation, and preserve 20px horizontal page insets. Public pages including presenter are light-only; /editor restores its independent saved light/dark choice.

## Verification boundary

Source, lint, types, unit/component tests and production build artifacts can be checked without launching a preview server. No screenshots, browser QA, or rendered visual verdict are claimed. UI QA remains with the user. The supplied hero demo is stored at public/images/teleprompter-lite-demo.gif.

Hero spacing refinement: navigation padding is 12px per edge with a 44px action; desktop hero padding is 32px/40px, stacked hero padding 28px/36px. Desktop screens up to 800px tall tighten the headline and sample preview as well as hero spacing, preserving natural content height and controls rather than clipping the first viewport.

Mobile header update: Main navigation is hidden at 800px and below. The brand stays visible and the hero retains its editor call to action.

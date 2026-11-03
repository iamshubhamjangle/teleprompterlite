---
version: 1
slug: "src-app-editor-page-tsx"
primary_target: "src/app/editor/page.tsx"
related_targets: ["src/components/workspace.tsx", "src/app/presenter/page.tsx"]
---

# Reading workspace

Mode: Operate. Scope: workspace and same-device presenter. Audience: solo creators reading near a phone lens. Real content: local Markdown draft, paragraph cues, source-line bookmarks. Primary task: arrange the reading column, then perform a take. Requirements and behavior: PRODUCT.md and PLAN.md.

Route: `/editor` renders the existing Workspace. `/` now belongs to the public reader-first landing surface, documented separately in `landing-page.md`; opening the editor from public navigation enters this operating surface. The route move preserves the workspace's design system and reader behavior.

## Direction contract

THESIS: A camera monitor that makes lens-aligned reading space the central instrument. Width margins and a vertical clearance divider shape the script immediately; settings remain secondary.

OWN-WORLD: Charcoal and warm light neutral surfaces, hairline separators, green only for playback/current state. Familiar sans UI, large adjustable script type, compact numeric controls, Tabler outline icons. No decorative imagery.

STORY: Paste a script, fit it around the phone, rehearse and play. A labeled sample demonstrates the workflow; persistent local saving makes a return session predictable.

FIRST VIEWPORT: No top navbar; brand in the compact 240px content sidebar, dominant central reader with a narrow text column and lower empty phone clearance, compact 260px settings sidebar with help/theme tools, and a transport below the reader. Collapsed rails temporarily overlay their panels without script reflow. On mobile, settings become accessible overlays and transport remains visible.

FORM: Camera-monitor workspace, grounded candidate 3; seed 9db55274. The user's chosen code-first path is recorded. Signature interaction: drag width/height handles while preserving the current script anchor.

FINISH: Source documentation records the route move. No server preview, screenshots, or visual verdict are claimed; UI QA is reserved for the user under AGENTS.md. The incumbent DESIGN.md remains the design-system reference, and unrelated workspace details above remain intact.


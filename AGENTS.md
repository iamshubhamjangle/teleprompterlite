<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Rules:

- Create, Update and maintain ARCHITECTURE.md after every feature add, update and removal.
- Do not run project for UI preview for QA, UI QA will be done by user.
- Keep updating AGENTS.md as per new rules are asked to be followed.
- Keep real environment files untracked. Only `.env.example` may be committed; configure production values in the hosting environment.

# Analytical deliverables

- For analysis or report requests in a project, write the analysis to a Markdown (.md) file in the current project folder and link that file in the response.
- Do not create a Codex Canvas or .canvas.tsx file for an analysis or report unless explicitly requested.
- Follow a specific output location or format when provided in the request.

# Route appearance

- Use light mode on all pages except `/editor`, which supports both light and dark mode.
- Preserve the editor's saved theme preference when visiting light-only pages.

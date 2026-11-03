# Public-release audit

Date: 2026-11-03. Target: the Teleprompter Lite working tree and locally available Git history, before making the GitHub repository public.

## Result

The critical/high dependency findings and actionable repository issues found in this review have been addressed. Production dependencies report **zero known vulnerabilities**. The full development tree still reports **21 affected packages: 19 moderate and 2 low**, originating from two upstream advisories described below. This is not an all-clear for every development dependency.

No real credentials were identified by the pattern scan and manual source review. This is a bounded source/dependency review, not a penetration test or proof that no secret exists.

The owner accepted the documented development-only findings and authorized consolidating and pushing the audited snapshot as a single parentless commit with the selected noreply identity. The project now uses the MIT License. Repository visibility remains unchanged. A verified recovery bundle preserves the original history. Authenticated Git access subsequently confirmed a single remote branch, `master`, and no tags. Broader remote security settings and artifacts remain outside the verified scope.

## Scope and evidence

- Reviewed all 27 locally available commits and their messages/metadata, 341 unique historical file blobs (334 text, 7 binary), and the candidate working-tree files.
- Scanned text for private-key headers, GitHub/AWS/service/npm tokens, credential-bearing URLs, JWTs, secret assignments, and Slack webhook URLs. Only URL-validation fixtures in `tests/seo.test.tsx` matched; they deliberately use dummy credentials. Raw values were not included in scan output.
- Reviewed environment usage, imports/exports and file-size limits, local persistence, Markdown rendering, popup transport, structured-data serialization, external telemetry, build/dependency configuration, workflow permissions, documentation, and tracked media.
- Sampled the existing demo video frames and inspected the screenshot and media metadata. No application preview was launched. The original video contains an audio stream; its audio was not reviewed, and the recording is excluded from the new Git snapshot.
- Local branches/tags consisted of `master`, cached `origin/master`, and no tags. The local branch was one commit ahead of the cached remote reference at the start. Cached references are not evidence of the current GitHub state.
- Before the authorized push, authenticated `git ls-remote --heads --tags origin` confirmed only `master`, at `13f566626d24e774aea510e6177272ed733f45ed`, with no tags. That exact tip is the expected value for the force-with-lease replacement.
- Compared the lockfile against the npm registry using `npm audit`, before and after dependency updates. Initial results: 47 affected packages, including 1 critical and 16 high. Final results: zero production findings; 21 development-only findings, none high/critical.

## Changes made

### 1. Removed tracked production environment configuration

`.env.production` held only the public canonical `SITE_URL`. It was explicitly allowed by `.gitignore` to make SEO builds reproducible; it did not contain a credential. That exception and the file have been removed.

Only `.env.example` remains versioned. Configure `SITE_URL=https://teleprompterlite.vercel.app` in hosting settings before the next deployment. Local production builds can copy the example to ignored `.env.local`. CI supplies the public value explicitly. Required release-origin validation is preserved, so a public build without configuration intentionally fails rather than emitting a guessed canonical domain.

Updated README, architecture documentation, and agent guidance to reflect this policy. Local audit outputs, Git recovery bundles, session caches, original demo recordings, and duplicate demo exports are ignored.

### 2. Updated vulnerable dependencies

Updated Next.js and `eslint-config-next` from 16.3.8 to 16.4.4, and refreshed compatible lockfile dependencies. Resolved versions include Zod 4.6.7, Undici 7.30.1, Vite 8.3.5, and Vitest 5.1.0.

The Next.js upgrade addresses the affected ranges reported by the registry for the [image-optimization RCE](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [`use cache` typed-array RCE](https://github.com/advisories/GHSA-673q-mjm6-r5xr), and [Server Actions denial of service](https://github.com/advisories/GHSA-p3m5-59mp-jv5r). Their published patched 16.x version is 16.4.1; this repository uses 16.4.4. This review did not attempt to prove an exploit against the previous application configuration.

The shadcn dependency is retained: `globals.css` imports its Tailwind stylesheet, so treating it as an unused CLI would break builds. No forced package downgrades or incompatible transitive overrides were applied.

### 3. Reduced telemetry exposure

Added a shared analytics filter and client wrapper. Presenter route events are discarded; other event URLs have query strings and fragments removed. Malformed URLs are discarded. This keeps popup session identifiers and arbitrary URL data out of application analytics events. There are no custom events carrying script text, titles, or bookmarks in the reviewed source.

Documented that Vercel Web Analytics remains enabled. Hosting/CDN logs are separate and are not controlled by this filter. Browser local storage is not encrypted and remains accessible to same-origin scripts and people with access to the browser profile.

### 4. Added baseline response hardening

Next configuration now disables `X-Powered-By` and adds `nosniff`, `no-referrer`, same-origin framing restrictions, and a limited Content Security Policy for base URLs, objects, and frame ancestors. The CSP does not restrict script execution through nonces/hashes. Fullscreen, same-origin popup communication, and editor behavior are preserved by the policy.

Generated configuration includes the intended headers; live host/CDN enforcement still requires deployment verification.

### 5. Improved maintenance and public documentation

CI now requests read-only repository permissions, audits production dependencies, supplies the SEO origin explicitly, and verifies generated SEO artifacts. Dependabot configuration checks npm dependencies and GitHub Actions weekly. Its remote activation has not been verified.

Added `SECURITY.md` with private reporting options and data-handling boundaries. Removed broken README links to missing planning/product documents. Preserved the pre-existing `PLAN.md` deletion; no unrelated user work was restored or discarded.

Original `demos/` authoring files are kept on disk but removed from tracking in the audited snapshot, excluding roughly 18.7 MB of source recording/duplicate exports from the public tree. The required `public/images/teleprompter-lite-demo.gif` remains. The support email is intentional public product contact information. The Google Search Console verification HTML is also intentionally public site-verification material, not an API credential; it remains in place.

The owner selected MIT licensing. Added LICENSE and matching npm manifest metadata; third-party dependency licenses remain separate.

## Remaining findings

### Moderate: development dependency denial of service

The [minimatch globparts amplification advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) affects versions below 11.0.1, including versions required by the ESLint/tooling dependency tree. Npm propagates this finding to dependent development packages, accounting for 19 moderate entries rather than 19 independent root vulnerabilities.

Compatible updates did not remove these constraints. The audit repair suggestions include downgrading current ESLint/Next tooling to obsolete major versions. Those changes would compromise the supported toolchain. No major-version override was imposed. Recheck upstream tooling updates; the checked lockfile and documented residual risk are retained.

### Low: development dependency prototype poisoning

The [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) affects the shadcn development dependency tree, accounting for two low entries including the dependent CLI. The registry's latest deepmerge release checked was 4.3.1, which remains in the affected range. Npm proposes an incompatible shadcn downgrade. This was not applied.

Both findings concern development/build tooling; neither appears in `npm audit --omit=dev`. They remain relevant when developing with untrusted inputs and should not be represented as fixed. The owner explicitly accepted these residual findings for the history rewrite and push.

## Validation

- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed.
- `npm run test`: 11 files and 122 tests passed, including analytics privacy coverage.
- `npm run build`: passed with Next.js 16.4.4 and an explicit production `SITE_URL`.
- `npm run verify:seo`: passed for 10 public pages, 207 local anchors, editor/presenter noindex, robots/sitemap, article JSON-LD, and the 1200×630 PNG.
- `npm audit --omit=dev`: zero known vulnerabilities.
- Full `npm audit`: 19 moderate and 2 low development-only entries; zero high/critical.
- Environment-ignore and candidate-file checks confirm that real environment files and local recovery assets are excluded.
- No UI preview server or Playwright browser tests were run, per project instructions. Live behavior and visual QA remain user-owned.

Existing generated artifacts required elevated filesystem access for type generation/build verification. The generated `.next` directory was cleared to remove a stale failed CSS-resolution cache; a clean rebuild then passed. The SEO verifier emits Node's pre-existing module-type warning when importing the TypeScript content module; verification succeeds.

## History and recovery

The parentless replacement commit contains the audited working tree, including the user's existing deletion. Its author and committer use the owner-selected `iamshubhamjangle@users.noreply.github.com`, keeping the configured personal email out of the replacement commit. GitHub account attribution for that address was not verified. No repository/global Git identity setting was changed.

An ignored `.audit-local/pre-public-rewrite.bundle` preserves the original local refs/history for recovery, and `.audit-local/` contains raw local audit evidence. Original `demos/` files remain on disk. These are private local recovery materials and must not be uploaded with the public source. A future branch rewrite will not securely erase old local remote-tracking refs, reflogs, or objects by itself.

Publishing the rewritten branch requires a deliberate force push against the verified current remote tip. A branch rewrite does not automatically remove old commits from GitHub caches, pull-request refs, forks, other clones, or existing build artifacts. If any real credential is discovered later, rotate/revoke it first and follow [GitHub's sensitive-data removal guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

## Owner actions before publication

1. Continue monitoring the accepted development-only advisories. The full tooling audit is not clean.
2. Set the production `SITE_URL` in hosting settings before deploying the environment-file removal. Deploy the patched dependencies and privacy/header changes after your UI QA.
3. Confirm rights to supplied demo media and branding. MIT licensing was selected by the owner and added; third-party dependency licenses remain separate.
4. Inspect pull requests, Actions artifacts/logs, releases, deployments, collaborators, and repository security settings. Those surfaces were not audited. Enable appropriate secret scanning/push protection and private vulnerability reporting where available.
5. Review the final rewritten GitHub history before changing repository visibility. Other refs and artifacts may retain old material and need separate review.

The owner authorized the MIT license and a force-with-lease push of the single-commit master branch. No visibility change, manual deployment, or message to another person is included. Connected GitHub/hosting workflows may run automatically when the branch is pushed.

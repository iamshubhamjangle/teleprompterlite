# Security

Security fixes target the current default branch. Use the latest revision and run `npm ci` before developing or deploying.

Report suspected vulnerabilities privately through this repository's **Security → Report a vulnerability** option when available. If it is unavailable, contact the public project address, **hackthecodeofficial@gmail.com**. Please avoid posting credentials, private scripts, or exploit details in public issues.

Drafts, bookmarks, and preferences are stored in the current browser's local storage. They are not encrypted and can be read by scripts executing on the same origin or by people with access to that browser profile. Export backups before clearing browser data. The app has no account, server-side script storage, or cross-device authentication system.

Vercel Web Analytics counts visits. Application filtering excludes presenter routes and removes query strings and fragments from event URLs. Do not add script contents, draft titles, bookmark labels, or session identifiers to telemetry. Host/CDN request logs are separate from this application filter.

Only `.env.example` belongs in Git. Configure `SITE_URL` and any future secrets in hosting settings or an ignored local environment file. If a credential is ever committed, revoke/rotate it first; deleting the file or rewriting commits alone does not revoke it.

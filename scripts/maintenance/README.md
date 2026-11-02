# Dependency maintenance and build cache

Dependency maintenance runs after successful CI or CodeQL for a same-repository Dependabot PR, or by manual PR number. It accepts changes only to package.json/yarn.lock, verifies successful lint/types, tests, lockfile and CodeQL checks on the exact PR head, then runs the full production-config static export. It reports `Dependency static export` on the PR head.

Only patch updates to existing `@testing-library/user-event` and `eslint-plugin-prettier` dev dependencies can merge automatically. Any other manifest change, including scripts, resolutions or production dependencies, requires human review. Successful automatic merges explicitly dispatch deploy-pages.yml. This is a check-driven merge workflow and does not need the repository's native Allow auto-merge setting. Existing branch rules continue to apply. Actions updates remain manual.

If a required check is pending, the run stops before export; completion of the other workflow retries eligibility. An already successful export on the exact head skips duplicate validation. Manual PR-number runs provide a retry after failures. Failed exports never reach the merge job. Changes to PR head SHA invalidate the merge attempt.

## Cache setup

Yarn package downloads are cached immediately. No raw Notion or webpack data is uploaded to Actions cache. Optional AES-256-GCM encrypted caching persists webpack files and only versioned Notion page-block entries; transient metadata, locks and sessions are excluded. Both the archive and page entries expire after six hours. Invalid, old, missing or wrong-key cache falls back to a clean build. All pages are still rendered, and published metadata is fetched freshly. Cache reuse is not ISR.

Create repository Actions secret `BUILD_CACHE_KEY` with a randomly generated 32-byte key encoded as 64 hexadecimal characters. Generate locally, e.g. `python -c "import secrets; print(secrets.token_hex(32))"`. Do not commit the key or send it in chat. Without a valid key encrypted caching remains disabled and builds continue normally. Rotate the key to invalidate old encrypted caches. The deploy workflow's manual `clean_build` option bypasses restore.

Run one cold and one warm deployment against unchanged content, compare Summary export duration and cache-hit logs, and inspect representative article text and media. Then verify an edited article, a removed/unpublished article and metadata changes. Until that comparison is completed, do not claim a measured speedup. Automatic PR export validation intentionally uses a clean build and does not receive BUILD_CACHE_KEY.

Self-checks: `node scripts/maintenance/dependabot-policy.cjs` and `node scripts/maintenance/cache-selftest.cjs`.

No changes are made to Notion webhook debouncing, upstream synchronization, route counts or concurrency limits. Those require separate measurements or Worker access.


## Security release gates

Full security audit runs for every PR and produces Security audit gate. It includes complete lockfile and vendored advisories, SHA-256 pinned actionlint/Gitleaks binaries, current files and complete reachable Git history, Python compilation and shell syntax. Secret matches are fully redacted. The only new allowlist is one exact reviewed public Cloudflare beacon ID, never a file-wide exemption.

Site export validation runs for every PR and always produces Site validation gate. Only explicit documentation paths may skip an export. File renames are classified as deletion plus addition. Missing/cancelled/failed jobs fail closed. Fork code is not given the Notion build credential. Same-repository Dependabot is accepted only for existing dependency version/lock changes with all other manifest fields unchanged. The separately privileged dependency-maintenance flow also waits for both gates and Python CodeQL, including at its final merge step.

After these status names have run successfully, the owner must add Security audit gate, Site validation gate and Analyze (python) to the main ruleset's required checks. The current connector cannot edit administration settings. Do not remove the five existing checks. Pages remains manual for ordinary source changes; the established narrow Dependabot allowlist still has its documented automatic release path.

#!/usr/bin/env bash
# The former Vercel/deploy updater bypassed this fork's reviewed release flow.
set -euo pipefail
cat >&2 <<'MESSAGE'
This legacy updater is disabled for this customized blog.
It used to merge upstream into main, push directly, copy .env.local into an
unignored backup directory, and continue after test failures.

For upstream updates: prepare a dedicated branch, review this blog's custom
patches and dependency changes, open a PR, and wait for required checks.
After merge, use the existing reviewed deployment workflow.
Notion article publishing and the hardened page-media installer are unchanged.
MESSAGE
exit 1

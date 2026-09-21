# Migration hooks

`bin/deploy` runs every **executable** file in this directory before it uploads an app,
and before the secret hooks. This file is not executable, so it is documentation only.

Ordering is the point: a migration that fails must stop the code that assumes it ran.
A hook exiting non-zero aborts that app's deploy before anything is uploaded.

## Content drift ([[REQ-291]])

`10-d1-site-store` VERIFIES before it applies. `d1_migrations` records a migration's
name and the moment it ran and nothing else, so a file that has been applied is done
forever however it is subsequently edited — which is how the baseline came to be
applied to production and then changed twelve times, leaving the applied schema and
the file on disk as two different databases wearing one name ([[EPIC-16]] §H).

The hook reads what the target environment has applied and hands it to
`bin/migration-manifest`, which compares each one against the SHA-256 committed in
`db/migrations/manifest.json` and refuses the deploy when they differ. The comparison
is a read, so `--dry-run` runs it too. Regenerating the manifest is its own command —
`bin/migration-manifest` — so that a hash CHANGING is an edit somebody has to justify
in review rather than a side effect of running a build.

## Writing a hook

```bash
#!/usr/bin/env bash
set -euo pipefail

[[ "$DEPLOY_APP" == "control-app" ]] || exit 0

if [[ "${DEPLOY_DRY_RUN:-0}" == "1" ]]; then
  echo "    would apply migrations to <database>"
  exit 0
fi

cd "$DEPLOY_APP_DIR"
npx wrangler d1 migrations apply <database> --env "$DEPLOY_ENV" --remote
```

`bin/deploy` knows nothing about D1 or any particular database, and must not learn:
that keeps the deploy script shippable ahead of the store work rather than serialised
behind it. REQ-143 lands the real hook here and changes no other file.

Environment available to a hook: `DEPLOY_APP`, `DEPLOY_APP_DIR`, `DEPLOY_ENV`,
`DEPLOY_WORKER_NAME`, `DEPLOY_DRY_RUN`, `DEPLOY_REPO_ROOT`.

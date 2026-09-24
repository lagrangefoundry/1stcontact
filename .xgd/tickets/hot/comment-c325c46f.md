---
uid: comment-c325c46f
id: COMMENT-3742
type: comment
title: Comment on request REQ-315
created_by: xgd
created_at: '2026-09-24T07:21:19.542748+00:00'
updated_at: '2026-09-24T07:21:19.542748+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-68c8f289
  kind: note
---

## Operational finding: the new `miniflare` import takes the whole `1c` CLI down until `pnpm install` runs

Exercising `1c fonts seed` on `xgd-working` for the first time after `0e8e48c276` landed,
**every `1c` subcommand failed** — not just `fonts seed`:

```
Error when evaluating SSR module /tools/generate/src/cli/index.ts:
Cannot find module 'miniflare' imported from '.../tools/generate/src/fonts/seed.ts'
```

`seed.ts` imports `miniflare` at module scope and `cli/index.ts` imports `seed.ts`, so the
dependency sits on the CLI's eager module graph. `1c builder`, `1c kb`, `1c assets` and
`1c fonts` were all dead — i.e. **this commit can stop the dev environment starting at all**,
not merely leave a new verb unavailable.

The commit is not wrong: `package.json` (root and `tools/generate`) declare
`miniflare@^4.20260630.0` and `pnpm-lock.yaml` resolves it to `4.20260710.0`. The package was
already extracted at `node_modules/.pnpm/miniflare@4.20260710.0` as a transitive dep of
wrangler — it was simply never linked into `node_modules/`, because `pnpm install` had not run
since the commit. Any clone, worktree or CI job in that state hits the same wall.

`pnpm install` could not be run here: `pnpm store path` resolves to a repo-local
`.pnpm-store/v11` while `node_modules/.modules.yaml` records
`/Users/martin/Library/pnpm/store/v11`, so pnpm wanted to purge and rebuild the whole modules
directory (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). Unblocked instead by creating the two
symlinks pnpm itself would create, into the already-present `4.20260710.0`:

```
node_modules/miniflare                -> .pnpm/miniflare@4.20260710.0/node_modules/miniflare
tools/generate/node_modules/miniflare -> ../../node_modules/.pnpm/.../miniflare
```

After that the CLI came back and `1c fonts seed` ran clean:
`1832 object(s) sent, 9164 already current, 854.7MB staged`, **5,498 `platform/fonts/...` keys in
both `control-app` and `public-site` local miniflare R2** — verified by querying `_mf_objects`
directly, so the seed is confirmed working end to end against a full mirror.

**Worth considering during reconcile** (recorded, not requested): a lazy/dynamic import of
`miniflare` inside the seed verb would keep a missing dev-only dependency from taking the whole
CLI — including `1c builder` — down with it, failing at the one verb that needs it instead.
That is the difference between "seed is unavailable" and "the dev environment will not start".

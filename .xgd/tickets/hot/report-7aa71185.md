---
uid: report-7aa71185
id: REPORT-447
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T18:12:24.400587+00:00'
updated_at: '2026-07-13T18:12:24.400587+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — class UU (both modified). Version-number-only conflict: OURS (HEAD, `sync_working_to_main`) = `0.0.105`; THEIRS (incoming free_coded REQ-49) = `0.0.63`. Kept `0.0.105` — a version number must never regress; the incoming `0.0.63` is stale relative to main's current package version. Every non-version line was identical on both sides. This is the only conflicted file in the tree.

## Incoming changes preserved

The incoming REQ-49 commit's code changes applied cleanly (no conflict) and are present at HEAD (`95ff2163`), verified via `git show HEAD --stat`:

- `packages/framework/src/modules/dials.ts` — content-inset dial (+22)
- `packages/framework/src/modules/hero/index.astro` — readable width, lead/body split (+55/-… )
- `packages/framework/src/modules/hero/meta.ts` — dial metadata (+11)
- `packages/framework/src/modules/services-grid/index.astro` (+1)
- `packages/framework/src/modules/text-block/index.astro` (+1)
- `packages/framework/src/tokens/defaults.ts` (+4)
- `packages/site-schema/src/schema.ts` (+6)
- `tests/framework-tokens.test.ts` (+8/-…)
- `tests/req49-fidelity-primitives.test.ts` — new fidelity UATs (+67)

No developer code was discarded — the only side taken from OURS was the `package.json` version scalar, which carries no code intent. Working tree is clean and staged (`git status --porcelain` empty).

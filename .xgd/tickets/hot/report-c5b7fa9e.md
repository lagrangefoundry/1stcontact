---
uid: report-c5b7fa9e
id: REPORT-476
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T19:10:33.379383+00:00'
updated_at: '2026-07-13T19:10:33.379383+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — class UU (both modified). Conflict was purely the `version` scalar: HEAD (sync_working_to_main, `0.0.105`) vs incoming (REQ-36 free_coded, `0.0.91`). Intent metadata flagged both sides' intent as unknown → rule "take the more recent commit by timestamp". HEAD's `0.0.105` is the more-recent value (and the incoming `0.0.91` was a stale bump older than the current package version). Kept `0.0.105`, dropped the stale incoming bump. Per config-file guidance this scalar resolution does not discard any developer code — the incoming version string was superseded, not the incoming feature.

## Incoming changes preserved

Verified: `git diff eceb8b33 d5eb4808 -- packages/ tests/` is empty — the resulting commit's code content is byte-identical to the incoming commit d5eb4808. All 6 code/test files from the incoming REQ-36 commit are present:

- `packages/framework/src/modules/dials.ts`
- `packages/framework/src/modules/text-block/index.astro`
- `packages/framework/src/tokens/defaults.ts`
- `packages/site-schema/src/schema.ts`
- `tests/framework-tokens.test.ts`
- `tests/req36-heading-treatment.test.ts`

The only intentional divergence from the incoming commit is the `package.json` version string (`0.0.105` retained over `0.0.91`), which is the correct conflict resolution and preserves no-net-loss of the REQ-36 feature code. Tree is clean (`git status --porcelain` empty); cherry-pick already finalized as `eceb8b33`.

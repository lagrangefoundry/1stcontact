---
uid: report-5877bee2
id: REPORT-2284
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-19'
created_by: xgd
created_at: '2026-08-20T00:50:51.977046+00:00'
updated_at: '2026-08-20T00:50:51.977046+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-19
---

## Files resolved

- `package.json` — UU, config/manifest scalar (rule 2g + enrichment tie-break).
  The only conflicting hunk was the `version` scalar: HEAD (`sync_working_to_main`
  from xgd-working 5ed608341606) carries `0.1.58`; the incoming free-coded commit
  cd6f00c6e bumped `0.1.49 -> 0.1.50`. Kept HEAD's `0.1.58`. The version line is
  monotonic release bookkeeping, not developer intent to carry forward — main has
  already advanced ten patch versions past the incoming bump via the post-watermark
  sync, so taking `0.1.50` would regress the manifest. The enrichment's
  "more recent commit by timestamp" rule points the same way (HEAD's sync commit is
  the later of the two). No other hunk in the file conflicted; every script,
  devDependency and engine entry present on either side is intact, and the file
  parses (`node -e require('./package.json')` reports version `0.1.58`).

No other conflict classes were present — the remaining eleven paths from the
incoming commit merged cleanly and are staged (A/M).

## Incoming changes preserved

The incoming commit touches twelve paths. Eleven applied without conflict and are
staged verbatim:

- `apps/control-app/wrangler.toml` (M) — the `[env.production]` vars/bindings fix
  behind the 503.
- `bin/build`, `bin/deploy`, `bin/smoke` (A) — the three deploy scripts.
- `bin/deploy.d/migrate/README.md`, `bin/deploy.d/secrets/README.md` (A) — the
  REQ-143 / REQ-146 hook seams.
- `tests/support/wrangler-toml.ts` (A), `tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts` (A)
  — the UAT asserting every Worker's `[env.production]` repeats top-level vars and
  structurally-discovered bindings. No test function from either side was dropped.
- `tools/generate/bin/smoke.mjs` (A), `tools/generate/src/cli/shared-store.ts` (A),
  `tools/generate/src/cli/index.ts` (M) — the `1c preflight` verb and SHARED-STORE
  component check.

The twelfth, `package.json`, carried only the version bump. That change is
superseded rather than discarded: HEAD already sits at `0.1.58`, downstream of the
incoming `0.1.50`, so the bump's effect (a version above `0.1.49`) is present in
HEAD via the later sync. STEP 3's guard is satisfied — none of the commit's
functional changes are absent from the resolved tree.

`package.json` consequently shows no staged diff against HEAD and drops out of
`git status --porcelain`; the commit as a whole still carries eleven changed
paths, so this is not a no-op cherry-pick. Per STEP 4, no `--skip` was issued and
the cherry-pick sequencer state is left untouched.

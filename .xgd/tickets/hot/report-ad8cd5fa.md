---
uid: report-ad8cd5fa
id: REPORT-2340
type: report
title: 'Resync resolve conflicts: 7292af8f63220275216b82416fc441658a744e02'
created_by: xgd
created_at: '2026-08-20T03:10:59.666634+00:00'
updated_at: '2026-08-20T03:10:59.666634+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-db1949d9
---

## Files resolved

- `package.json` — **UU**, config scalar (§2g). Sole conflicted file; sole hunk was the
  `version` scalar: HEAD `0.1.59` vs incoming `0.1.53`. Resolved to **`0.1.59`** (HEAD).

  Two independent rules agree on this resolution:

  1. **Enrichment rule** ("intent unknown on one side — take the more recent commit by
     timestamp"). Ours is `99b3cb55f` (2026-08-19 20:06:35 -0700, post-watermark sync from
     xgd-working); incoming is `105327070` (2026-08-17 12:42:14 -0700). HEAD is the more
     recent side, so the enrichment rule selects `0.1.59`.
  2. **Version monotonicity.** The incoming diff for this file is exactly
     `0.1.52 → 0.1.53` — a free-coded bump, bookkeeping rather than code. Main has since
     advanced to `0.1.59`. Taking the incoming scalar would regress the package version
     below what main already publishes and would collide with versions other tickets have
     since claimed.

  §2g's "scalar conflicts: incoming wins" is not applied here: on a resync branch the
  incoming side is the *older* code, and the version scalar is monotonic bookkeeping
  carrying no developer intent. No behavioural content was discarded — the incoming
  commit's only package.json change was the bump itself.

  Flagged for post-merge review per the enrichment rule, though the risk is nil: the
  resolved value is already main's.

## Incoming changes preserved

The incoming commit `105327070` ("feat(control-app): Cloudflare Access gates the builder,
twice [FREE-CODED]") touches 11 files. Ten are code/doc/test files that merged cleanly and
are staged; `package.json` is the one conflicted file, addressed above.

Verified by diffing the staged index against the incoming commit, scoped to exactly the ten
code files:

    git diff --cached --stat 10532707034369e07d0c4cc20d81d1eb51daba10 -- \
      apps/control-app/ACCESS.md apps/control-app/src/access.ts \
      apps/control-app/src/index.ts apps/control-app/wrangler.toml \
      tests/reconciliation-builder-workspace-origin.test.ts \
      tests/req115-builder-shell.test.ts tests/support/access.ts \
      tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts \
      tests/test_UAT_FC_REQ-147_access_gate.test.ts \
      tools/generate/bin/smoke.mjs

Result: **empty**. Every file the incoming commit modified matches the staged tree
byte-for-byte, so the developer's work is present verbatim:

- `apps/control-app/src/access.ts` (new, 352 lines) — Access JWT verification: RS256
  against the team JWKS, `aud`/`iss`/expiry checked, algorithm pinned from the JWKS.
- `apps/control-app/src/index.ts` — gate runs before anything reaches the origin.
- `apps/control-app/wrangler.toml` — `workers_dev = false`, top level and restated under
  `[env.production]`.
- `apps/control-app/ACCESS.md` (new) — granted identities and rationale.
- `tests/support/access.ts` (new) and `tests/test_UAT_FC_REQ-147_access_gate.test.ts`
  (new, 435 lines) — fail-closed coverage.
- `tests/reconciliation-builder-workspace-origin.test.ts`, `tests/req115-builder-shell.test.ts`,
  `tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts` — existing ACs now authenticate and
  additionally assert 401 for the unadmitted caller. No test function was deleted on either
  side.
- `tools/generate/bin/smoke.mjs` — `--control-origin` / `--workers-dev-origin`.

## Staging state

`git status --porcelain` shows no conflict classes (UU/AA/DU/UD/AU/UA) remaining.
`git diff --check --cached` reports no leftover conflict markers. `package.json` no longer
appears in the status output because its resolved content equals HEAD — expected, and left
for Python's finalize step to handle. `CHERRY_PICK_HEAD` is intact; no `--continue`,
`--skip`, `--quit`, or `--abort` was issued.

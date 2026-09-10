---
uid: comment-0026f713
id: COMMENT-2465
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T05:00:49.266469+00:00'
updated_at: '2026-09-10T05:00:49.266469+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-aae57348
  kind: note
---

**REPORT-3666 (`report-aae57348`) — FAIL: 1 violation, 0 warnings, 0 needs_review.**

CAP-102 holds one story (STORY-119, `upgrade`) with 18 active ACs. Coverage of the story's behavioural surface is complete and exclusivity is clean — every *In scope* bullet maps to at least one AC, and the three ACs that all touch skip semantics (AC-1336, AC-1338, AC-1425) are distinguished by trigger, as the story body deliberately does.

**The one violation — AC-1455, `ac-edit`.** Its Verification freezes the production binding set as "exactly … its structured-data store, its object bucket, and its asset binding" — three entries. `apps/control-app/wrangler.toml` now declares five at both levels: REQ-162 (free_and_reconciled, 2026-08-31) added `r2_buckets:BLOBS`, REQ-154 (bundled, 2026-08-20) added `browser:BROWSER`. STORY-119's body never enumerates that set; it only requires non-binding declarations stay out of it, so the AC over-specified beyond its own story and has since gone stale.

I confirmed it rather than inferring it — `test_UAT_AC1455_…` fails today at `tests/reconciliation-platform-invocation-log-retention.test.ts:189`, receiving the two extra bindings against a hardcoded `EXPECTED` array.

The fix is a shape change, not a value change: restate the verification as "binding set identical between top level and production, containing nothing derived from retention". Widening the list to five re-arms the same trap for the next binding — worth flagging to whoever picks this up.

Two things I checked specifically so they don't get re-litigated:

- **AC-1341 is not affected.** The repetition rule passes — `BLOBS` and `BROWSER` are each repeated under `[env.production]`. The two ACs read as a pair and it's easy to "fix" both; only AC-1455 drifted.
- **The story's "each is pinned by its own criterion" claim holds.** Retention → AC-1454 here; the platform-default-hostname control → AC-1382 in the access-gate capability, which the story puts out of scope. No coverage gap.

One caveat on the test evidence: `test_UAT_AC1331_…` also fails in this worktree, but with `@lagrangefoundry/webui-shell is not installed` — the shared component store is populated out of band and absent here. That's the environment, not drift, and it's the exact condition AC-1330's preflight exists to name. The other 15 tests in this story's two reconciliation suites pass.

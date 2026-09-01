---
uid: report-6bf5a819
id: REPORT-3247
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:47:21.036846+00:00'
updated_at: '2026-09-01T22:47:21.036846+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-a80bf2ef.md` — **AA** (both added; seeded ticket overlay,
  so both sides show as adds). Doc ticket DOC-27 "L1 Reproduction Vocabulary".
  Rule applied: **2e** (intent/bookkeeping ticket), per-fact resolution with the
  timeline rule on the one genuinely conflicting fact.

  The two sides differ in exactly one fact plus its bookkeeping stamp; the entire
  document body is byte-identical.

  - `fields.system_kb` — HEAD side set `system_kb: true` in commit `40000bb1`
    (2026-08-15). Incoming side removes the field in `5386685c` (2026-08-31),
    whose operation narrative states: *"field: retire system_kb boolean;
    membership moves to doc_kind (DOC-39 3.3)"*.
    Same field, changed differently on each side -> genuine intent conflict.
    Incoming is the later-positioned intent (Aug 31 > Aug 15) **and** is the
    developer-authored `free_coded` side, so incoming wins for this fact.
  - `updated_at` — follows the same edit (`2026-08-16T01:20:15` ->
    `2026-08-31T19:43:14`); not an independent fact.
  - `last_field_updated: system_kb` — identical on both sides, no conflict.

  Resolution: `git checkout --theirs` + `git add --sparse`. Because the only
  differing fact is the one incoming deliberately retired, taking theirs wholesale
  is equivalent to per-fact composition here — no HEAD-side edit is discarded,
  since HEAD's only edit to this file *is* the fact incoming retired.

  Note on the enrichment hint: xgd's auto-enrichment reported "intent unknown on
  one or both sides" and suggested taking the more recent commit plus flagging for
  review. The incoming commit body turned out to carry an explicit operation
  narrative, so the resolution is grounded in stated intent rather than timestamp
  alone. The outcome coincides with the timestamp rule.

## Incoming changes preserved

Confirmed. The staged blob is `69e0368578`, byte-identical to index stage 3
(theirs) for this path. `git diff --cached HEAD` shows exactly and only the
incoming commit's two hunks: removal of `system_kb: true` and the `updated_at`
bump. Nothing from the incoming commit is absent.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code
or test files were involved in this conflict set.

## Post-merge review flag

Low risk, but worth a glance: DOC-27 is now the only side of this pair without
`fields.system_kb`, while `last_field_updated` still names `system_kb`. That is
the expected shape after a field-retirement edit, not a defect. If other doc
tickets on the HEAD side still carry `system_kb: true`, the DOC-39 3.3 retirement
may be only partially applied across the ticket store — that sweep is outside this
step's scope.

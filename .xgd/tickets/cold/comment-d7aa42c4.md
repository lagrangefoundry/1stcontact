---
uid: comment-d7aa42c4
id: COMMENT-669
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T20:34:50.999317+00:00'
updated_at: '2026-08-05T20:34:50.999317+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a349e0aa
  kind: note
---

**REPORT-1314** (`report-a349e0aa`) — **FAIL**: 4 violations, 2 warnings, 1 needs_review. Schema fields verified (`report_kind`, `subject_uid`, `level=story`, integer counts). Read-only throughout — no tickets, tests, or code modified.

## What drove the FAIL

**REQ-93 is missing from the matrix (2 violations + the needs_review).** REQ-93 (`request-f26cbe32`, free_and_reconciled, 2026-07-25) is the declared successor to REQ-88's page-shape XOR: a page may carry `l1` *plus* module instances when each binds to an existing `slot`, and `renderL1Document` mounts the module's fragment in place of the inert placeholder. No story in CAP-70 expresses it — and STORY-83 asserts the *opposite* as current ("a `slot` renders as an inert labelled placeholder … with no module code and no behaviour attached"; mounting listed out-of-scope, pointed at REQ-85).

The complication that forced the needs_review: **REQ-93's code is not on `main` or this branch.** `pageSchema.superRefine` still enforces the strict XOR (`packages/site-schema/src/schema.ts:537-546`), `render.ts:450-454` still emits the inert placeholder, `fold.ts:376` still routes controls to a `field` residual, and there's no `slots.ts` / `forms.ts` / `mountInL1` / `tests/req93-*`. REQ-93's `main_sha` is `null`; the code lives on `xgd-working` (71ba1177a) and the unmerged `reconcile-BUNDLE-10` (4547f9183), yet BUNDLE-10 is marked `free_and_reconciled`. I did not guess which side is wrong — documenting mounting the branch doesn't do would be worse drift than the gap.

**STORY-82 missed the REQ-87 sweep (2 violations).** It's the only story here untouched since BUNDLE-7, so it still calls contact-form a "capability module" with "capability config" and "capability validators", and depends on "the Capability Modules story" — the exact collision REQ-87 renamed the type to end, with no back-compat alias. It also claims L1 leaves may carry "a named overlay role", which REQ-79 principle #2 forbids, STORY-80 explicitly denies, and the hex-only schema (`l1/schema.ts:19-24`, zero role/token/palette refs) rules out. Its `uat_coverage=stale` is the same signal from another angle.

## Two things worth your attention beyond the findings

I flagged for the editor that **Finding 6 should be decided before Findings 3/4 are applied** — STORY-80 and STORY-82 are self-described repointer stories whose reason to exist was living in sibling capabilities (CAP-67/CAP-69). Yesterday's consolidation put them in the same capability as the stories they point at, which is precisely the situation that got STORY-81/CAP-68 retired ("a hollow pointer would duplicate ownership CAP-70/CAP-71 already hold"). If STORY-82 gets folded away, repairing its prose first is wasted work.

Separately, the consolidation left **CAP-67, CAP-69 and CAP-72 `active` with zero stories** despite CAP-70's History recording them as merged in (CAP-68 was correctly marked `superseded`; same pattern on CAP-64/65/66). That's capability-level, out of scope for this run, but noted in the report.

I did **not** count BUNDLE-11's REQ-96…REQ-107 or the `ready_to_reconcile` tail as violations — BUNDLE-11 is `reconciling` right now, so their absence is expected. They're recorded in the ledger as the imminent baseline for the next check.

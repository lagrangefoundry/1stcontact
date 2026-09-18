---
uid: report-7d319cf9
id: REPORT-4305
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:26:39.398857+00:00'
updated_at: '2026-09-18T05:26:39.398857+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (rule 2e).
  Resolved to the HEAD side because HEAD is a strict superset of the incoming
  side, per-fact:
  - **Body — "Implementation — landed and verified end to end (2026-08-23)"**:
    byte-identical on both sides (the incoming commit's only body change).
    No conflict of fact.
  - **`## Status` paragraph**: incoming still reads "Scope drafted, awaiting
    operator confirmation before coding"; HEAD reads "Both halves landed and
    verified". HEAD is the later state of the same fact.
  - **Frontmatter**: `updated_at` incoming `2026-08-23T23:42:40` vs HEAD
    `2026-08-31T19:19:38`; `status` `draft` vs `free_and_reconciled`;
    `completed_at` null vs set. HEAD is later on every one of these facts.
  - **`fields`**: HEAD adds `story_points`, `commits` (working_sha
    `ea48502d0d90bb607ac528e34099e71eaab6df40`), `version: 0.2.10`,
    `bundled_in: bundle-78f4e2fe`; incoming touches none of them.
  - **Trailing section "# Implementation — the tenant fix"**: present on HEAD
    only; incoming never had it.

  Nothing present on the incoming side is absent from the resolution, so no
  timeline arbitration was needed beyond "HEAD is strictly later and strictly
  larger".

## Incoming changes preserved

- `.xgd/tickets/hot/bug-db356ff8.md`: the incoming commit
  (`6ffb45e6e6a1946f9fbf1eabc76afb39aa31c025`, +42/-1) added exactly one body
  section and bumped `updated_at`. The section is present verbatim in HEAD —
  verified with `git grep "Implementation — landed and verified end to end"
  HEAD -- .xgd/tickets/hot/bug-db356ff8.md` (1 match). The `updated_at` bump is
  superseded by HEAD's later timestamp, which is the intended outcome for a
  timestamp field.

  No hunk was dropped under the BUG-1301 precedence exception; nothing needed
  it.

## Note for the finalize step

The staged tree is identical to HEAD (`git diff --cached HEAD` empty): this
commit's effect already reached the reconcile branch through a later route, so
the cherry-pick is genuinely redundant rather than discarded — STEP 3's check
confirms the incoming content is *present* in HEAD, not merely missing from the
resolution. `--skip` was NOT called; CHERRY_PICK_HEAD is left intact for
`cherry_pick_finalize_resolution`.

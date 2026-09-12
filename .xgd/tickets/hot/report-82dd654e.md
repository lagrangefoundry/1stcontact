---
uid: report-82dd654e
id: REPORT-4129
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:27:20.682871+00:00'
updated_at: '2026-09-12T20:27:20.682871+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU**, sparse-excluded
  (index-only conflict, no working-tree markers). Rule **2e** (intent/bookkeeping
  ticket — `request-*`, user-authored content, not matrix state). Resolved by
  `git checkout --ours` + `git add --sparse`.

  Per-fact analysis (2e, not whole-file pick):
  - **Base** (`:1`): `status: draft`, `last_field_updated: body`,
    `updated_at: 2026-08-20T23:16:27Z`.
  - **Incoming** (`:3`, cherry-pick `baf4842709`, committed 2026-08-26T16:27:04-07:00):
    diff vs base is **frontmatter-only** — `status: draft → free_coding`,
    `last_field_updated: body → status`, `updated_at → 2026-08-26T23:27:04Z`.
    The body is byte-identical to base; the incoming commit added no prose.
  - **Ours** (`:2`, HEAD, last touched by `bc62f2857d` committed 2026-09-11T02:58:19-07:00):
    `status: bundled`, `updated_at: 2026-08-31T05:05:09Z`, plus `fields.commits`
    (`working_sha: 29c0e86dd321b509e06f0dd9e531392ee9190b0e`), `fields.version: 0.2.16`,
    `fields.bundled_in: bundle-8eef3846`, and an appended `# What was built` section
    (~90 lines: the fourth-option AC3 decision, session-lease design, file table,
    test plan, AC status).

  Exactly one fact is contested — `status` — and both sides set it differently, so the
  2e timeline rule applies to that fact. Ours is later on every available clock:
  commit timestamp 2026-09-11 > 2026-08-26, and ticket-internal `updated_at`
  2026-08-31 > 2026-08-26. This also matches the auto-enriched resolution rule for
  this file ("take the more recent commit by timestamp"). Every other field on the
  incoming side is either identical to base or a strict subset of ours, so there was
  no second fact to compose. Ours taken.

## Incoming changes preserved

Confirmed — nothing from the incoming commit is discarded.

- The incoming commit's **only** substantive change is the lifecycle transition
  `draft → free_coding`. HEAD carries `status: bundled`, which is strictly downstream
  of `free_coding` on the same ticket lifecycle, and HEAD additionally records the
  artifacts that transition produced: `fields.commits[].working_sha`, `version: 0.2.16`,
  and `bundled_in: bundle-8eef3846`. The incoming effect is therefore **present via a
  different route** (the ticket passed through `free_coding` and was subsequently
  bundled), not absent. This is STEP 4's redundant-commit case, not STEP 3's
  discarded-intent case.

- No prose was lost in the resolution. `git diff --word-diff --ignore-all-space baf4842709 HEAD --`
  on this file shows **zero** word-level deletions of body content: every `[-...-]`
  removal is either a frontmatter scalar (`updated_at`, `status`) or markdown
  emphasis restyling (`*"…"*` → `_"…"_`) from a reflow. All original sections —
  "Why this is small", "Two transports", "The part that is NOT mechanical" (all three
  Access candidates intact), "Sessions are billed and capped", all six acceptance
  criteria, and "Origin" — are present verbatim in the resolved file, with the
  `# What was built` write-up added on top.

- No code/implementation files were conflicted; this commit touches only the ticket
  store. No BUG-1301 precedence exception was invoked and no test function was
  deleted.

The staged diff vs HEAD is empty, which is the expected seeded-overlay outcome
(DOC-986): the bundle branch already carries this ticket's state. Per STEP 4, no
`--skip` was issued — the cherry-pick sequencer state (`CHERRY_PICK_HEAD` =
`baf484270955fda15caa97f8a6ee76d9871b6913`) is left intact for
`cherry_pick_finalize_resolution`.

---
uid: report-a20ff797
id: REPORT-4434
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:56:53.243649+00:00'
updated_at: '2026-09-19T12:56:53.243649+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — UU (index-only; path is outside the
  sparse-checkout cone, so there were no working-tree markers). Class 2e
  (intent/bookkeeping ticket). Rule applied: **strict superset — keep the
  superset (ours)**.

  Ours (`xgd(ticket): seed_local_overlay request request-51514090`) vs theirs
  (incoming `da7fe40 xgd(ticket): update request request-51514090`):
  `git diff <stage2> <stage3>` contains **no body additions on the incoming
  side at all** — every body line theirs has is present in ours, in order, and
  ours carries five further sections on top ("What the codec must do,
  precisely", "Sequencing, revisited: AC5 is not deliverable yet", "A finding
  AC4 turned up", "One honest caveat…"). In the frontmatter, incoming-wins
  would have *regressed* state: `status: bundled` → `draft`, `completed_at`
  non-null → `null`, `updated_at` 2026-09-16 → 2026-09-01, and would have
  dropped `fields.commits` (3 entries), `fields.version: 0.2.39` and
  `fields.bundled_in: bundle-8e1807f6`. Ours taken on every fact.

  Resolved with `git checkout --ours` + `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-51514090.md` — **all incoming content is present in
  the resolved file.** The incoming commit `da7fe40` added 69 lines / removed 10
  (the dependency-free hand-rolled PNG decision, the PNG-only format scope with
  the jpeg/gif/webp and HEIC discussion, the non-PNG refusal on `1c crop`, the
  "pure core the Worker can import" section AC3 implies, exact-equality AC2, AC4
  narrowed to arithmetic cores, and the deferred streaming row-lockstep section).
  Every one of those hunks falls inside the region that `git diff <ours>
  <theirs>` reports as identical context, i.e. ours already contains them
  verbatim. They reached HEAD earlier on this branch via `55ee705229
  xgd(ticket): update request request-51514090`, and the two
  `seed_local_overlay` commits (`369fc254e8`, `3f2311b01b`) then layered the
  bundling frontmatter on top.

  No hunk was dropped; the BUG-1301 precedence exception was not needed.

## Note on the staged result

The resolution nets to **no diff vs HEAD** — this cherry-pick is redundant, not
discarded. Per STEP 3's distinction: the incoming commit's key changes are
*present* in HEAD (via `55ee705229`), which is the redundant case. Staged and
exiting normally per STEP 4; `--skip` was not called and the cherry-pick
sequencer state is untouched.

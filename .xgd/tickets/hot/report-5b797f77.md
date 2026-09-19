---
uid: report-5b797f77
id: REPORT-4381
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:26:22.207868+00:00'
updated_at: '2026-09-19T10:26:22.207868+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — class **UU**, intent/bookkeeping
  ticket (rule **2e**, "same field changed differently on each side — take the
  side from the LATER-positioned intent, **per fact**"). Resolved to the HEAD
  side via `git checkout --ours` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

  Incoming commit `1bc13abacf` (`xgd(ticket): update request request-909e42f8`,
  2026-08-31 14:54:37 -0700) changed three frontmatter lines and nothing else
  (3 insertions, 3 deletions, no body change):

  - `updated_at`: `2026-08-31T20:33:32` → `2026-08-31T21:54:37`
  - `last_field_updated`: `created_at` → `status`
  - `status`: `draft` → `free_coding`

  Facts actually in conflict: **two**, not three. `last_field_updated: status`
  is identical on both sides — diffing theirs against ours shows it as an
  unchanged *context* line — so it is not contested and is preserved as-is.

  For the remaining two facts (`status`, `updated_at`) the HEAD side is the
  later-positioned one, by both available measures:

  - **Timestamp**: HEAD's `updated_at` is `2026-09-09T21:32:49`; the incoming
    commit is `2026-08-31T21:54:37` — nine days earlier. This is also what the
    auto-enrichment's own rule ("take the more recent commit by timestamp")
    selects.
  - **Lifecycle position**: HEAD's `status: bundled` is downstream of the
    incoming `status: free_coding`, and HEAD carries the artifacts produced by
    that very free_coding phase — `fields.commits` (working shas `858d63202f`,
    `c056002a52`), `fields.version: 0.2.22`, `fields.bundled_in:
    bundle-87be4669` — none of which the incoming side has. Taking the incoming
    `status` would roll the ticket backwards into `free_coding` while leaving
    `bundled_in` and the commits list in place: an incoherent state asserting
    the work is both still being coded and already bundled.

  No content was invented; every line in the resolved file is present on one
  side or the other. Per the enrichment note, this file is **flagged for
  post-merge review**.

## Incoming changes preserved

Stated precisely, because this case differs from the previous commit in this
series (`9a6417c0b0`, scope 103/0), which was genuinely redundant:

- `last_field_updated: status` — **preserved** (uncontested; identical on both
  sides).
- `status: free_coding` and `updated_at: 2026-08-31T21:54:37` — **superseded,
  not preserved.** These values are deliberately not in the result.

That supersession is the sanctioned outcome of rule 2e, not a discard: 2e's
per-fact timeline arbitration necessarily drops the earlier side's value for a
contested fact, and here the earlier side is the incoming one. It is also not
STEP 3's @fail condition, which governs *code/implementation* files whose
developer-authored changes would be lost — this is a bookkeeping status field
whose later value HEAD already holds, carrying the incoming commit's effect
forward rather than reverting it. The ticket did pass through `free_coding`;
HEAD records where that phase ended up.

No code, test, or UAT files were involved in this conflict, so STEP 3's
verification of incoming code hunks does not otherwise apply, and the BUG-1301
precedence exception was not invoked — no hunk was dropped on the grounds of an
already-integrated refactor.

Because HEAD's values for every contested fact are the ones kept, the staged
resolution nets to no diff vs HEAD and `git status --porcelain` is empty. Per
STEP 4 this is staged and exited `@done` as normal; `--skip` was not called and
the cherry-pick sequencer state is untouched (`CHERRY_PICK_HEAD` still resolves
to `1bc13abacfcb0d4a4346d4960a0cc65fed8e8691`) for
`cherry_pick_finalize_resolution` to consume.

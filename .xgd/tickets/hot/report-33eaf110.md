---
uid: report-33eaf110
id: REPORT-5509
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T08:02:49.498962+00:00'
updated_at: '2026-09-29T08:02:49.498962+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` (BUG-43) — class **UU**, intent/bookkeeping
  ticket (`bug-*`), resolved under **STEP 2e**. Index-only conflict: the path is
  outside the sparse-checkout cone on this resync branch (DOC-986 §2/§4.1), so
  there were no working-tree markers. Resolved with
  `git checkout --ours` + `git add --sparse`.

  The conflict was confined to the frontmatter; the body is byte-identical on
  both sides. Three facts conflicted, all of them projections of the same
  lifecycle transition:

  | fact | HEAD | incoming (`4394018c50`) | taken |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | HEAD |
  | `updated_at` | `2026-09-19T15:15:28Z` | `2026-09-02T00:39:00Z` | HEAD |
  | `completed_at` | `2026-09-14T10:29:01Z` | `null` | HEAD |

  Both sides were read via the intent ledger rather than by comparing raw
  `updated_at` (BUG-1030), to confirm they are competing on the same fact rather
  than making disjoint edits:

  - incoming (`xgd ticket history bug-360c5a44 --rev 4394018c50`):
    `create`→`draft` → `free_coded` → **`ready_to_reconcile`** (all on 2026-09-01/02)
  - HEAD (`xgd ticket history bug-360c5a44`):
    … → `bundled` (2026-09-11) → **`free_and_reconciled`** (2026-09-19)

  These are not disjoint aspects to compose — they are two points on one
  lifecycle chain, so 2e's "same field changed differently → take the
  later-positioned intent, per fact" applies. HEAD's `free_and_reconciled` is
  both later in the timeline (Sep 19 vs Sep 2) and strictly downstream of
  incoming's `ready_to_reconcile` in the status lifecycle. Same outcome as the
  auto-enrichment rule for this file ("take the more recent commit by
  timestamp"). `completed_at` follows: the completion recorded on HEAD
  (2026-09-14) actually happened; incoming's `null` predates it.

  Net effect: staged tree is identical to HEAD, so this cherry-pick has no
  residual diff. Per STEP 4 this is staged and left for the finalize step to
  skip — no `--continue`/`--skip`/`--quit`/`--abort` was issued, and
  `CHERRY_PICK_HEAD` (`4394018c50`) is intact.

## Incoming changes preserved

No code or implementation files were in conflict, so STEP 3's
verify-incoming-hunks-survive check does not bind here — its @fail clause is
scoped to code/implementation files, and the sole conflicted path is an
intent/bookkeeping ticket governed by 2e.

For completeness: `git show 4394018c50 -- .xgd/tickets/hot/bug-360c5a44.md` is a
2-line frontmatter change (`updated_at`, `status: free_coded →
ready_to_reconcile`) and nothing else — no body, field, or `commits[]` edits.
That single incoming fact is intentionally **not** present in the resolved
version, because HEAD has already advanced past it: the ticket reconciled on
2026-09-14 and reached `free_and_reconciled` on 2026-09-19. Replaying
`ready_to_reconcile` would roll the ticket backwards and clear a real
`completed_at`. No developer content is discarded — the incoming commit carried
no content beyond the superseded status fact itself.

The BUG-1301 precedence exception was not invoked; no test function was deleted
on either side.

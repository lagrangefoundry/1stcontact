---
uid: report-8c124ffb
id: REPORT-3594
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T00:00:24.557707+00:00'
updated_at: '2026-09-10T00:00:24.557707+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (STEP 2e).
  Resolved by taking the HEAD side whole-file (`git checkout --ours`), because
  HEAD is a strict per-fact superset of the incoming side on every field the
  incoming commit touched, and additionally carries body edits the incoming side
  never touched. Per-fact:
  - `status`: incoming `free_coding` → `free_coded`; HEAD `free_and_reconciled`
    (the downstream successor state, `updated_at` 2026-08-31 vs incoming
    2026-08-24). Later intent wins; reverting to `free_coded` would demote an
    operator-owned status.
  - `fields.commits`: incoming added one entry `working_sha
    2058a16449a8e783bdd655d22bade58fd6b8d0fc`. HEAD contains that exact entry
    plus two later ones (`0fe586d1…`, `999579b3…`). Superset.
  - `fields.version`: incoming `0.2.11`, HEAD `0.2.13`. Keep HEAD's higher
    version; the incoming bump is bookkeeping already superseded.
  - `completed_at`, `fields.bundled_in: bundle-78f4e2fe`: HEAD-only additions,
    untouched by the incoming side.
  - Body (`## Still outstanding` → `## Observability — added here`, new
    `## Deployment` section): HEAD-only; the incoming side made no body change,
    so nothing is lost.

## Incoming changes preserved

The incoming commit `1eb1dd1586d5db0eb5aaa6f904a51b72f3a665d5` touched only this
one ticket file (7 insertions, 2 deletions, all in frontmatter). Every change it
made is present in the resolved file via a later route, not discarded:

- the `commits` entry for `2058a16449a8e783bdd655d22bade58fd6b8d0fc` is present
  verbatim (HEAD adds `working_sha_history: []` to it and appends two later
  entries);
- the status advance out of `free_coding` is present and has progressed further
  (`free_and_reconciled`);
- the `version` field is present at a higher value (`0.2.13` ≥ `0.2.11`).

No code/implementation files were in conflict. No BUG-1301 precedence exception
was needed; no test function was deleted.

The resolution nets to no diff versus HEAD (`git status --porcelain` reports no
tracked entries), which is expected here: this bookkeeping commit's effect was
already carried into HEAD by later commits. Per STEP 4 this is staged and exited
`@done` without calling `--skip`; the finalize step will detect the empty staged
diff. `CHERRY_PICK_HEAD` is intact.

---
uid: report-e777fe93
id: REPORT-4404
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:37:37.735600+00:00'
updated_at: '2026-09-19T11:37:37.735600+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **UU**, rule **2e** (intent/bookkeeping
  ticket; `bug-*`, lives in `hot/`). Out of the sparse-checkout cone, so the
  conflict existed only in the index with no working-tree markers. Resolved to
  the HEAD side, staged with `git add --sparse`.

  Incoming commit: `d975830c` `xgd(ticket): update bug bug-3ade1af4`
  (2026-09-01 12:28:25 -0700).
  HEAD side: `af0186bf` `xgd(ticket): seed_local_overlay bug bug-3ade1af4`
  (2026-09-17 13:23:48 -0700) — 16 days more recent, which is the side the
  enrichment's "take the more recent commit by timestamp" rule selects.

  The two sides' **bodies are byte-identical**; `git diff <stage2> <stage3>`
  touches frontmatter only. Facts, against base `2a59e08e`:

  | fact | base | incoming `4df13eff` | HEAD `1f50971c` |
  |---|---|---|---|
  | `updated_at` | 09-01T19:28:24 | 09-01T19:28:25 | **09-16T01:48:35** |
  | `last_field_updated` | `status` | `story_points` | `status` (= base) |
  | `status` | `free_coded` | unchanged | **`bundled`** |
  | `completed_at` | `null` | unchanged | **2026-09-14T10:29:13** |
  | `fields.bundled_in` | absent | unchanged | **`bundle-8e1807f6`** |
  | `title` | "23 failures… ten UATs" | unchanged | **"27 failures + 30 collection errors… eleven UATs"** |
  | `fields.story_points` | `5` | `5` | `5` |
  | `fields.commits` / `version` | present | unchanged | identical |

  Incoming changed exactly two lines: the `updated_at` stamp and
  `last_field_updated`. HEAD changed `updated_at` too, so that is a same-fact
  conflict, decided by timeline in HEAD's favour (09-16 vs 09-01).

  `last_field_updated` was changed only by the incoming side, so 2e's
  "non-overlapping fields → apply both" would nominally take `story_points`.
  It is **not** applied, because `last_field_updated` is not independent of
  `updated_at`: the pair states "the most recent field update was X, at time T".
  Grafting incoming's `story_points` onto HEAD's 09-16 stamp would assert that
  the 2026-09-17 `seed_local_overlay` commit touched `story_points` — a pairing
  present on neither side, which 2e explicitly prohibits ("inventing content not
  present on either side"). Treated as one fact, resolved to HEAD's
  `(status, 09-16T01:48:35)`, which is what actually happened: that commit
  advanced `status` to `bundled`.

## Incoming changes preserved

`git show d975830c -- .xgd/tickets/hot/bug-3ade1af4.md` contains no developer
content, only lifecycle bookkeeping:

- `updated_at: 19:28:24 → 19:28:25` — present via a later route; HEAD carries a
  strictly later stamp (2026-09-16T01:48:35).
- `last_field_updated: status → story_points` — the field this pointer names,
  `fields.story_points`, is `5` on base, on the incoming side and on HEAD. The
  commit changes no value, only which field the pointer cites. Not carried, for
  the reason given above; nothing the developer wrote is lost, because the
  commit wrote nothing beyond the pointer itself.
- `status` remains `free_coded` on the incoming side and has already advanced
  past it to `bundled` on HEAD, so no lifecycle state is rolled back.

No hunk was dropped under the BUG-1301 precedence exception; no test file was
involved.

## Note on the net diff

The staged tree has **no diff vs HEAD** (`git status --porcelain` and
`git ls-files -u` are both empty). This is the redundant-commit case in STEP 4,
not STEP 3's discarded-changes case: the incoming commit carries only a
timestamp bump and a `last_field_updated` pointer, both superseded on HEAD by a
later, real update to the same ticket. This is the second consecutive commit in
this run to net empty (the prior one, `08bbde06`, resolved the same way at
attempt 126) — consistent with HEAD already holding this ticket's whole
working-side history plus the later `bundled` transition.

`--skip` was not called; `CHERRY_PICK_HEAD` (`d975830c`) is intact for
`cherry_pick_finalize_resolution`.

## Post-merge review flag

Flagging `.xgd/tickets/hot/bug-3ade1af4.md` for post-merge review, as the
enrichment rule requires when intent is unknown on one side: BUG-40 reads
`bundled` into `bundle-8e1807f6` with a rewritten title on the reconcile branch,
while the working-side history still carries it at `free_coded` under the
original title. HEAD's values are the correct ones.

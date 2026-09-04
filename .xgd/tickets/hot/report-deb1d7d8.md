---
uid: report-deb1d7d8
id: REPORT-3367
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:24:42.593050+00:00'
updated_at: '2026-09-02T21:24:42.593050+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` (BUG-39) — UU, intent/bookkeeping ticket
  (rule 2e). Resolved by keeping the HEAD side, which is a strict superset of
  the incoming side.

  - Incoming (`0941885b7b73`, `xgd(ticket): update bug bug-23d1ec27`,
    2026-08-25): `status: free_coding` → `free_coded`, added
    `fields.commits[0].working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd`
    (reconcile_sha/main_sha null) and `fields.version: 0.2.15`; bumped
    `updated_at`; dropped the trailing newline.
  - HEAD (merge of `free-BUG-39` into `xgd-working`, `updated_at`
    2026-08-31T05:05:09Z): contains **all** of the above fields verbatim —
    same `working_sha`, same `version: 0.2.15` — and additionally
    `story_points: 3`, `bundled_in: bundle-8eef3846`, with `status` advanced
    `free_coded` → `bundled`.

  Per 2e ("one side is a strict superset of the other: keep the superset").
  The two sides are not competing on any fact: HEAD's frontmatter is the
  incoming's frontmatter plus later bundling bookkeeping. `status` is the one
  field with different values, and they are consecutive positions on the same
  lifecycle — `bundled` is the later state, written by the bundling step that
  consumed this very commit. Writing `free_coded` back would regress
  operator-owned lifecycle state and orphan `bundled_in: bundle-8eef3846`.
  No timeline lookup was needed: no fact is genuinely in conflict.

  Body text is byte-identical on both sides apart from the incoming's missing
  final newline; HEAD's newline was kept.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md`: `git show 0941885b7b73 -- <file>` shows
  three changes — the `commits` list entry, `version: 0.2.15`, and the
  `free_coding` → `free_coded` status transition. The first two are present
  verbatim in the resolved file (lines 20 and 23). The third is present via a
  later route: HEAD already carries the transition past `free_coded` to
  `bundled`, so the developer's intent (this bug is no longer being coded) is
  recorded, not discarded. This is the redundant-commit case of STEP 4
  (BUG-1109/BUG-1122), not the discard case of STEP 3 — the incoming commit's
  effect is already in HEAD.

- No hunks were dropped under the BUG-1301 precedence exception. No code
  files, no test files, and no spec tickets were involved in this conflict.

The resolution therefore nets to no diff vs HEAD; staged as instructed
(no `--skip` called). Cherry-pick sequencer state left intact.

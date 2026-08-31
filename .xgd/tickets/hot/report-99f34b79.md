---
uid: report-99f34b79
id: REPORT-3082
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:29:56.522887+00:00'
updated_at: '2026-08-31T21:29:56.522887+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping ticket (rule 2e,
  per-fact resolution with the timeline rule). Two conflict hunks, both in the
  YAML frontmatter; the body was unconflicted.

  - **Hunk 1 — `updated_at` / `status`.** Ours: `updated_at 2026-08-26T17:36:27`,
    `status: bundled`. Incoming (`1eb1dd1586`, 2026-08-24): `updated_at
    2026-08-24T21:42:43`, `status: free_coded`. Same fact changed on both sides.
    `bundled` is the downstream lifecycle state of `free_coded`, and ours carries
    the later `updated_at`, so ours is the later-positioned intent for this fact.
    Kept ours.
  - **Hunk 2 — `fields.commits` / `fields.version`.** Ours is a strict superset of
    incoming: it contains incoming's sole commit entry
    (`working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc`, plus
    `working_sha_history: []`), two further commit entries
    (`0fe586d1f6…`, `999579b3fb…`), `version: 0.2.13` (> incoming's `0.2.11`), and
    `bundled_in: bundle-78f4e2fe`, which incoming never set. Kept the superset.

  Commit timestamps agree with the per-fact result and with the auto-enrichment's
  fallback rule (take the more recent commit): ours `501a0595d1`
  *xgd(ticket): seed_local_overlay bug bug-6612c4b7* at 2026-08-31T07:24:25-07:00;
  incoming `1eb1dd1586` at 2026-08-24T14:42:43-07:00.

  No field was invented, and no `intent_uid` / `story_uid` / `capability_uid` was
  touched.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is
a bookkeeping ticket. Nothing was dropped under the BUG-1301 precedence
exception.

Incoming commit `1eb1dd1586` made exactly three changes to this ticket, and every
one is present in the resolved file in a later form (STEP 3 "present via a
different route", i.e. redundant, not discarded):

- `status: free_coding` → `free_coded` — resolved file is at `bundled`, the state
  after `free_coded`.
- added `fields.commits[0].working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc`
  — present verbatim in the resolved file (line 20), alongside two later commits.
- added `fields.version: 0.2.11` — resolved file carries `0.2.13`, a later bump of
  the same field.

Consequently the staged tree has no net diff versus HEAD. Per STEP 4 this is the
redundant-commit case (BUG-1109/BUG-1122), not a discard: the incoming commit's
effect already landed on this branch through the later
`seed_local_overlay` / bundling commits. No `--skip` was issued; the finalize
step will detect the empty staged diff. `CHERRY_PICK_HEAD` is intact.

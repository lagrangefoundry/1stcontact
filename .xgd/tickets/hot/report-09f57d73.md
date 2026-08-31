---
uid: report-09f57d73
id: REPORT-2979
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:50:52.113015+00:00'
updated_at: '2026-08-31T15:50:52.113015+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (rule 2e),
  resolved outside the sparse-checkout cone (`git checkout --ours` +
  `git add --sparse`). HEAD is a **strict superset** of the incoming side, so the
  superset was kept.

  Evidence (blob diff, theirs `8f92f71` vs ours `3e66931`): the only differences
  are bookkeeping fields where HEAD is strictly later and richer —
  `status: draft → bundled`, `last_field_updated: body → status`,
  `updated_at 2026-08-24T01:48:23Z → 2026-08-26T17:36:27Z`, plus added
  `fields.story_points: 3`, `fields.commits[working_sha ea48502…]`,
  `fields.version: 0.2.10`, `fields.bundled_in: bundle-78f4e2fe` — and a trailing
  newline at EOF present on the incoming side but not on HEAD's. No incoming
  field or paragraph is contradicted or lost.

## Incoming changes preserved

Incoming commit `5af1ff9` ("xgd(ticket): update bug bug-db356ff8", 112 insertions
/ 2 deletions) made exactly three changes to this file. All three are already
present verbatim in the resolved (HEAD) version — confirmed by diffing the merge
base blob `863e47a` against ours `3e66931`, which reproduces the same hunks:

1. `## Status` rewritten from "Scope drafted, awaiting operator confirmation
   before coding." to the four-line "Both halves landed and verified
   (2026-08-23)…" paragraph. **Present.**
2. The full 110-line `# Implementation — the tenant fix` section appended
   (What changed table, Why `reason` had to be exposed, Scope of what the
   bootstrap may create, Tests, Supersession — one REQ-149 assertion, Verified,
   Still open). **Present, byte-identical.**
3. `updated_at` bumped to `2026-08-24T01:48:23.782519+00:00`. **Superseded** by
   HEAD's later `2026-08-26T17:36:27.054996+00:00` — same field, later
   working-timeline position, per 2e's per-fact rule.

No hunk was dropped under the BUG-1301 precedence exception; none applied.

Net result: the staged tree has no diff vs HEAD, because the HEAD-side
`seed_local_overlay` commit already carried this commit's body content. Per
STEP 4 this is not a failure and `--skip` was not called — the staged state is
left for `cherry_pick_finalize_resolution` to detect. STEP 3's discard guard is
satisfied: the incoming commit's key changes are present in HEAD, not absent.

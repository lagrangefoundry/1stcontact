---
uid: report-f6ac46f3
id: REPORT-5552
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T13:33:30.498420+00:00'
updated_at: '2026-09-29T13:33:30.498420+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — UU, §2g config scalar, `version` only. Kept HEAD's
  `0.2.92` over incoming's `0.2.90`. **Deviation from 2g's "incoming wins"** —
  see below. The resolved file is byte-identical to HEAD, so `package.json`
  no longer appears in `git status --porcelain`; that is expected, not a
  missed stage.

Auto-merged, no conflict, staged as the cherry-pick left them:
`db/dev-seed.sql` (M), `tests/test_UAT_FC_REQ-193_seeded_names.workers.test.ts`
(A).

## Incoming changes preserved

`git diff fbb90d875c -- db/dev-seed.sql tests/test_UAT_FC_REQ-193_seeded_names.workers.test.ts`
is empty: the worktree content of both files is byte-identical to the incoming
commit. All 98 lines of the `user_names` fixture rework (Alice's title /
`known_as` / former name / corrected typo, Bob's null-reason supersession,
Carol's mononym, Dave's `given_name` fall-through) and all 159 lines of the new
`peopleOf`-driven UAT suite are present. No hunk of REQ-193's content was
dropped.

### Dropped hunk — `package.json` version scalar

`fbb90d875c`'s `package.json` diff is a single incidental bump
`0.2.89 → 0.2.90`, not REQ-193 content. Its target was already superseded by
`768c453aac chore: bump version for REQ-197 [FREE-CODED]`, a free-coded commit
this same resync queue cherry-picked onto the branch ahead of it. Taking
incoming would walk the published version number BACKWARDS by two patches.
`version` is a monotone counter, not a statement of developer intent, so
"incoming wins" does not serve the rule's purpose here — the developer's intent
on both sides was "increase it". This is the same ground recorded for every
preceding version conflict in this resync run (`resolve-377b581e-164e51cba7`,
`-61a0becc61`, `-242a8bf969`).

The enrichment's own rule for this file — "take the more recent commit by
timestamp and flag for post-merge review" — selects the HEAD side independently:
HEAD's `768c453aac` is the later commit. So the enrichment rule and the monotone
-counter reasoning agree. `package.json` is flagged for post-merge review as the
enrichment requests.

## Verification limits

The tree was not built or tested. Resync is a caretaker process and must not run
test_fix; the workers-pool suites are also unrunnable in this session role
(`listen EPERM` outside the interactive role). Verification here is textual:
staged content compared against the incoming commit.

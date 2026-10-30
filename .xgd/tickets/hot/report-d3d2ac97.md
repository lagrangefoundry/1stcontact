---
uid: report-d3d2ac97
id: REPORT-5815
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T19:08:13.095200+00:00'
updated_at: '2026-10-02T19:08:13.095200+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Resolution: `.xgd/tickets/hot/request-b3534e71.md` (REQ-343) — incoming wins, whole file

Cherry-pick `c7206c9f58b36f74122726a9905cb5979248a8cb` ("xgd(ticket): update request
request-b3534e71", author 2026-09-28 15:36:30 -0700) onto HEAD `46b7d45853`.
Apply target `ec118d67626fd31cfce67ca88dc9908ecdde70ed`. `prior_stage_failure` empty.

### Stages

| stage | blob | what it is |
|---|---|---|
| base `:1:` | `959c1f5566` | pick's parent state == `f67705f840` (Merge branch 'free-REQ-343' into xgd-working) |
| ours `:2:` | `0ed3a71e4f` | == `HEAD:<path>` == xgd-working's own `e6e1da8704` blob (15:16:38) |
| theirs `:3:` | `2333d4b636` | base + frontmatter only |

### Why incoming

Ours is **behind** base, not diverged from it. Ours is byte-identical to xgd-working's
`e6e1da8704` blob, the revision immediately before the merge commit `f67705f840`. That
merge carried the developer's body revision (the "prose follows the key, in both tiers" /
"the tail moves with it" / "one rule in three places" paragraphs, and the Dependencies and
Not-in-scope rewording after REQ-342 landed first). Resync skips merge commits, so that
revision never reached this branch, and base→ours reads as a 14+/31- "change" that is
really the merge's edit seen backwards.

Theirs' whole delta from base is frontmatter: `updated_at` → 22:36:30, `last_field_updated`
→ `status`, `status` `draft` → `free_coded`, plus `fields.commits` (three `working_sha`
entries) and `fields.version: 0.2.400`. It does not touch the body.

So incoming is a linear successor of ours: ours → (merge body edit) → base → (free_coded
frontmatter) → theirs. Nothing on ours is unique, so nothing is lost by taking theirs.
The enrichment's "more recent by timestamp" rule agrees (theirs 22:36:30 vs ours 22:16:38).

### Action

`git checkout --theirs -- <path>` + `git add --sparse -- <path>`. Index blob is
`2333d4b636` (== theirs), no conflict markers, `CHERRY_PICK_HEAD` intact, HEAD unmoved.
Net change from HEAD: +44/-16 on this one file. No hand edits.

### Forecast for this ticket's remaining picks

`git diff c7206c9f58:<path> xgd-working:<path>` is three lines: `updated_at` → 22:56:38,
`status` → `ready_to_reconcile`, and the second `working_sha` `9e36aac12b` → `08106ec21a`.
The three later xgd-working commits (`ec5156a789`, `dd7a823ed5`, `e34ecba1de`) should now
apply on top of this result without conflict, since ours will equal their base.

### For post-merge review

- The enrichment flagged this file for review; the only judgement made was "ours is a
  strict predecessor", proved by blob identity above.
- The `working_sha` values in `fields.commits` are xgd-working shas, recorded as incoming
  wrote them; not rewritten.

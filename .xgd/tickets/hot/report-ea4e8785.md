---
uid: report-ea4e8785
id: REPORT-5549
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T13:22:49.741607+00:00'
updated_at: '2026-09-29T13:22:49.741607+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — config file (2g), scalar conflict on `version`.
  Resolved to HEAD's `0.2.88`; the incoming `0.2.86 → 0.2.87` hunk was
  dropped under the BUG-1301 precedence exception (see below).

No other file conflicted. The remaining four paths in `242a8bf969`
(`apps/control-app/src/templates.ts`, `apps/control-app/src/tickets.ts`,
`tests/test_UAT_FC_REQ-197_render.test.ts`,
`tests/test_UAT_FC_REQ-197_templates.workers.test.ts`) auto-merged and were
staged unchanged.

## Incoming changes preserved

Verified with `git diff --cached 242a8bf969 -- <the five paths>`: the diff is
empty for all four code/test files, i.e. the staged tree is byte-identical to
the incoming commit for every file carrying REQ-197 implementation or test
content. The 363-line `templates.ts` (`productTypePack()` `template` type,
`templateFor`, `renderTemplate`, the three seed templates), the 31-line
`tickets.ts` change (`TicketStore.query` gaining `sort`), and both UAT test
files are present in full. No test function was deleted or modified.

### Dropped hunk — `package.json` version scalar (BUG-1301 precedence)

`242a8bf969`'s package.json hunk is an incidental version bump
`0.2.86 → 0.2.87`, not REQ-197 content. Its entire target was already
consumed and superseded by two free-coded commits that this same resync
queue had already cherry-picked onto the branch ahead of it:

- `12ed317976` "chore(version): 0.2.87 for REQ-192 [FREE-CODED]"
  (authored 2026-09-06 11:54:11) — already landed `0.2.86 → 0.2.87`,
  i.e. the exact effect of the incoming hunk, through a different path.
- `7261fd361e` "chore(version): 0.2.88 for REQ-192 [FREE-CODED]"
  (authored 2026-09-06 11:55:04) — the HEAD side of this conflict; it
  then advanced `0.2.87 → 0.2.88`.

Both are developer-authored `[FREE-CODED]` commits from xgd-working, applied
earlier in this queue — a legitimate, already-integrated decision, not LLM
churn and not a resolution shortcut on my part. Writing `0.2.87` would revert
`7261fd361e` and re-land a version state the developer had already moved past,
which is data loss on a free-coded commit rather than preservation of one.

Note on the enrichment's "take the more recent commit by timestamp" rule: by
author date the incoming commit (11:55:33) is 29s later than `7261fd361e`
(11:55:04), which read literally would select `0.2.87`. That reading is an
artifact of author-date ordering diverging from the queue's apply order — the
incoming commit was authored against a tree still at `0.2.86`. For a monotonic
version counter whose intent is carried by dedicated `chore(version)` commits,
both of which are already in HEAD, the later *state* is `0.2.88`. Flagged here
for post-merge review as the enrichment requests.

Resulting staged `package.json` blob is `34067b5978`, identical to the blob
`7261fd361e` produced — no net change from HEAD for this file.

## Staging state

`git status --porcelain` shows no UU/AA/DU/UD lines; four staged entries
(`A`/`M`) remain. `CHERRY_PICK_HEAD` left intact for
`resync_cherry_pick_finalize_resolution`.

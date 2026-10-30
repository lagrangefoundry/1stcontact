---
uid: report-c5efa49a
id: REPORT-4890
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T23:57:01.432152+00:00'
updated_at: '2026-09-23T23:57:01.432152+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/comment-c74424ff.md` — **UU**, intent/bookkeeping ticket
  (`type: comment`, `kind: chat_transcript` on `chat-06d47a5c`), rule **2e**
  ("one side a strict superset: keep the superset"). Resolved to the incoming
  side. Because `.xgd/tickets/` is outside the sparse-checkout cone on this
  resync branch (DOC-986 §2/§4.1) the conflict existed only in the index with
  no working-tree markers, so it was resolved with
  `git checkout --theirs` + `git add --sparse`.

### Why the superset, not a timeline coin-flip

Three-way stage comparison (base = parent of CHERRY_PICK_HEAD
`f19369d0a2102ec6960a04277d4079f9b8824131`):

| stage | blob | content | `updated_at` |
|---|---|---|---|
| 1 base | `27ac5e22` | transcript through the 23:53:25 **user** turn | `2026-09-02T23:53:26` |
| 2 ours | `bb701465` | base **minus** that user turn | `2026-09-02T21:01:25` |
| 3 theirs | `c09dd65b` | base **plus** the 23:56:48 **assistant** reply | `2026-09-02T23:56:49` |

`git diff <ours> <theirs>` is **34 insertions, 1 deletion** — the single
deletion is the `updated_at` scalar. Theirs therefore retains every line ours
has and adds two turns on top, so this is a strict-superset case, not two sides
editing the same fact.

The ours-side absence of the 23:53 user turn is **not a deletion**: it is
content the main-rooted resync branch never received. `git log HEAD --
.xgd/tickets/hot/comment-c74424ff.md` shows an unbroken run of plain
`xgd(ticket): update comment comment-c74424ff` appends with no strip commit
(no BUG-904 strip), and HEAD's tip for this path simply sits at the earlier
21:01:25 transcript state. Taking ours would have discarded both the user turn
and the entire incoming assistant turn.

## Incoming changes preserved

Verified by blob identity rather than inspection:

```
git rev-parse :.xgd/tickets/hot/comment-c74424ff.md
  -> c09dd65bf4fcd8b4b8765731550dfcc57f0e7d6f
git rev-parse f19369d0a2102ec6960a04277d4079f9b8824131:.xgd/tickets/hot/comment-c74424ff.md
  -> c09dd65bf4fcd8b4b8765731550dfcc57f0e7d6f
```

The staged blob is byte-identical to the incoming commit's blob, so 100% of the
incoming developer content is present:

- the `cdb5fdf9-…-assistant` turn (`ts="2026-09-02T23:56:48.759368+00:00"`)
  recording the REQ-168 rewrite against the CHAT-36 Account → N businesses
  model — "the four reads" → "the six reads", the `tickets.ts:422` omission,
  the `ai.ts:134` reclassification, the rewritten resume section, and the five
  new decision sections;
- the `cdb5fdf9-…-user` turn (`ts="2026-09-02T23:53:25.381820+00:00"`) that the
  reply answers, which ours lacked;
- `updated_at: '2026-09-02T23:56:49.838906+00:00'`.

No hunks were dropped. The BUG-1301 precedence exception was not invoked — no
code files and no UAT test files were touched by this conflict, and no test
function on either side was removed.

## Cherry-pick state

`CHERRY_PICK_HEAD` (`f19369d0a2102ec6960a04277d4079f9b8824131`) is left intact.
No `--continue` / `--skip` / `--quit` / `--abort` was issued. `git status
--porcelain` shows no conflict-class lines; the file is staged as `M`. The nine
untracked `.xgd/tickets/cold/*.md` entries are pre-existing tier demotions, not
part of this conflict, and were left untouched.

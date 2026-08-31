---
uid: report-4e1509f0
id: REPORT-3052
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:18:33.185826+00:00'
updated_at: '2026-08-31T20:18:33.185826+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-22aa8ea3.md` — **AA** (both added), intent/bookkeeping
  ticket (rule 2e, with 2b's superset test). Resolved to the HEAD-side blob
  (`git checkout --ours` + `git add --sparse`; path is outside the sparse-checkout
  cone, DOC-986 §2/§4.1).

  Both sides are **byte-identical** apart from a single EOF artifact: HEAD's blob
  (`4cf2d206`) ends with a trailing newline, the incoming blob (`06789d62`) does
  not (`\ No newline at end of file`). There is no content, field, or section
  difference on any fact — frontmatter, status (`abandoned`), all `fields.*`, the
  scope/dependencies/acceptance-criteria/notes body, and the entire
  "Abandoned (2026-08-20) — superseded" section are identical on both sides.

  The enrichment rule for this file ("intent unknown on one or both sides — take
  the more recent commit by timestamp") is satisfied either way: HEAD's
  `4f9f9e2459` and the incoming `d1147fdc1d` carry the **same subject and the same
  timestamp** (`xgd(ticket): update request request-22aa8ea3`,
  2026-08-23 13:36:57 -0700) — the same logical edit, already landed on HEAD via a
  different route. The missing EOF newline on the incoming side is an artifact of
  `0d11a0146e` (`xgd(resync): strip .xgd/tickets ... from main snapshot (BUG-904)`),
  which removed the file from the incoming side's parent, making the incoming
  commit a bare 56-line re-add rather than an edit. Kept the newline-terminated
  HEAD blob; no fact was chosen from either side over the other, because none
  differed.

## Incoming changes preserved

- `.xgd/tickets/hot/request-22aa8ea3.md` — **fully preserved.** `git show
  d1147fdc1d -- <path>` is a pure file addition (`new file mode 100644`,
  `@@ -0,0 +1,56 @@`, 56 insertions, 0 deletions). All 56 added lines are present
  verbatim in the resolved file. Verified by direct blob diff: the only delta
  between the incoming blob and the resolved content is the trailing newline.
  Nothing was discarded and no BUG-1301 precedence exception was invoked.

## Note on the empty staged diff (BUG-1109 / BUG-1122)

`git diff --cached HEAD` is empty and `git status --porcelain` shows no tracked
entry — the resolution matches HEAD exactly. This is the **redundant-commit**
case, not the discarded-commit case: STEP 3's test distinguishes them, and here
the incoming commit's key changes are *present in HEAD* (all 56 lines, verbatim),
not absent. Per STEP 4, `--skip` was NOT called; the tree is staged and exits
@done, leaving the finalize step to detect the clean staged diff and skip the
commit. `CHERRY_PICK_HEAD` is intact — no `--continue`/`--skip`/`--quit`/
`--abort`/`reset`/`checkout <branch>` was run.

---
uid: report-6d85a411
id: REPORT-5304
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T06:47:10.577216+00:00'
updated_at: '2026-09-28T06:49:04.799586+00:00'
completed_at: null
last_field_updated: title
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` (BUNDLE-20) — file class **2e, intent/bookkeeping ticket**
  (`bundle-*.md`). Single `UU` conflict, one hunk in the frontmatter status block
  (`updated_at` / `completed_at` / `last_field_updated` / `status`). Both sides changed the
  *same coupled fact* — the bundle's lifecycle position — so 2e's "genuine conflict, take the
  LATER-positioned intent, per fact" branch applies. No disjoint fields on either side to
  combine: the incoming commit's entire payload is 2 insertions / 2 deletions confined to that
  one hunk (`git show --name-status` lists this path and nothing else).

  Rule applied: **later-positioned intent wins → OURS**. 2e prescribes
  `xgd working-timeline <uid_HEAD> <uid_INCOMING>` as the tie-break, but both sides are the same
  uid (`bundle-b3b7c399`) and bundle tickets carry no `intent_uid`, so that lookup has no distinct
  inputs. Fell back to commit timestamp on the two competing writes:

  | side | commit | author date | status written |
  |---|---|---|---|
  | OURS (HEAD) | `8e07e6015d` | 2026-08-31 07:23:04 -0700 (`14:23:04Z`) | `free_and_reconciled`, `completed_at` set, `result: pass`, `merged_at_commit: eef7a8b48b` |
  | INCOMING (`CHERRY_PICK_HEAD`) | `aaf472a06e` | 2026-08-30 22:04:25 -0700 (`05:04:25Z`) | `ready_to_reconcile`, `completed_at: null` |

  OURS is ~9h19m later and is the terminal state of this bundle's lifecycle. `8e07e6015d` is the
  tip of this file's history on HEAD, and its own diff shows the final `status`/`result` write, so
  HEAD is downstream of — not divergent from — the incoming write. INCOMING is an earlier,
  intermediate `reconciling` → `ready_to_reconcile` transition (a reconcile restart on
  xgd-working) that HEAD's own later history already superseded.

  Taking INCOMING would have regressed a completed bundle from `free_and_reconciled` back to
  `ready_to_reconcile` and dropped `completed_at`.

  Mechanics: `.xgd/tickets/` is outside the sparse-checkout cone on this resync branch
  (DOC-986 §2/§4.1) — the conflict existed only in the index, with no working-tree markers
  visible to a non-sparse `git add`. Resolved with `git checkout --ours -- <path>` then
  `git add --sparse -- <path>`, each as the sole content of its own Bash call.

## Incoming changes preserved

No code, test, or UAT file was involved in this conflict — the only conflicted path is a bundle
bookkeeping ticket, so no developer-authored implementation was at stake and STEP 3's
incoming-preservation check has no code file to apply to.

The incoming hunk is *not* preserved, and that is the resolution rather than a shortcut: its sole
content is a status scalar whose value HEAD's own later commit on the same ticket already advanced
past. This is 2e's per-fact timeline rule deciding a same-field conflict, not a dropped
developer change (the BUG-1301 precedence exception is not needed and is not invoked).

`git status --porcelain` is empty and `git ls-files -u` is empty: no conflict-class entries
(`UU`/`AA`/`DU`/`UD`) remain, staging is clean. Because OURS won the only hunk, the staged tree is
byte-identical to HEAD, so this cherry-pick carries no net change. Per STEP 4 that is left alone
deliberately — `git cherry-pick --continue` / `--skip` / `--quit` / `--abort` were NOT called, and
`CHERRY_PICK_HEAD` (`aaf472a06e`) is still present for
`resync_cherry_pick_finalize_resolution` to detect the empty staged diff and skip the commit.
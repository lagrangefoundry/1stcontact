---
uid: report-1c47a4e1
id: REPORT-4418
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:16:32.110428+00:00'
updated_at: '2026-09-19T12:16:32.110428+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` (BUG-41) — class **UU**, rule **2e**
  (intent/bookkeeping ticket), resolved per-fact; every fact landed on **ours**
  (`2ac4f433`).

  Incoming commit: `04385bca` — *"xgd(ticket): update bug bug-93851fea"*,
  Martin Westhead, 2026-09-01 13:50:00 -0700, 3 insertions / 2 deletions. This
  is the fourth link in the same chain of ticket-update commits for BUG-41
  (`daaaeaea` @`138/0` → `dadea5a9` @`139/0` → `370ff625` @`140/0` →
  `04385bca` here): the merge base is `c1b3b220`, exactly the blob `370ff625`
  produced.

  The path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers. Resolved
  with `git checkout --ours --` then `git add --sparse --`, each as its own
  standalone Bash call.

  Per-fact comparison of the incoming blob (`e3df4588`) against ours
  (`2ac4f433`) — a full `diff -u` of the two shows only these differences:

  | fact | theirs (`e3df4588`) | ours (`2ac4f433`) | kept | why |
  |---|---|---|---|---|
  | `fields.story_points` | `2` — **added by this commit** | `2` | — | identical, no conflict |
  | title, `severity`, `chat_comment`, `commits`, `version`, body (~100 lines) | unchanged | **byte-identical** | — | no conflict |
  | `status` | `free_coded` | `bundled` | ours | later lifecycle position |
  | `updated_at` | `2026-09-01T20:50:00` | `2026-09-16T01:48:36` | ours | later |
  | `completed_at` | `null` | `2026-09-14T10:29:09` | ours | later |
  | `last_field_updated` | `story_points` | `status` | ours | derived marker; ours' later edit was to `status` |
  | `fields.bundled_in: bundle-8e1807f6` | absent | present | ours | ours-only addition |

  The one fact this commit actually introduces — `fields.story_points: 2` — is
  already present in ours with the identical value, so nothing the developer
  authored is lost. `last_field_updated` is the only field where the two sides
  hold different values rather than ours simply being a superset; it is a
  derived marker naming whichever field changed most recently, and on the ours
  side that genuinely was `status` (the later `free_coded` → `bundled`
  transition), so ours is both the later-positioned and the semantically correct
  value. The remaining divergences are the lifecycle scalars, where ours is
  again later: `bundled` is downstream of `free_coded`, and ours records
  `bundled_in: bundle-8e1807f6` — the very bundle this reconcile run is
  processing. Taking the incoming side on those would have reverted the ticket
  out of its own bundle.

  No `xgd working-timeline` tiebreak was needed: there is no fact on which the
  incoming side is later or carries content ours lacks.

  This also agrees with the auto-enrichment's fallback rule for this file
  ("intent unknown on one or both sides — take the more recent commit by
  timestamp"): the ours-side blob descends from commits dated 2026-09-17 and
  later, against the incoming commit's 2026-09-01.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket (rule 2e).

STEP 3 check for `.xgd/tickets/hot/bug-93851fea.md`: `git show 04385bca -- <file>`
shows the incoming commit (a) adding `fields.story_points: 2`, (b) setting
`last_field_updated` to `story_points`, and (c) bumping `updated_at`.

Item (a) is present **verbatim** in the staged resolution. Items (b) and (c) are
present in HEAD via a different route: the ticket has since had a further field
change (`status` → `bundled` on 2026-09-16), which re-pointed
`last_field_updated` at `status` and advanced `updated_at` past the incoming
value. That supersedes rather than discards the incoming edit — the *redundant*,
not *discarded*, case described in STEP 4. No hunk was dropped, so the BUG-1301
precedence exception does not apply.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` returns nothing: the UU
class line is gone and the staged blob (`2ac4f433`) is identical to
`HEAD:.xgd/tickets/hot/bug-93851fea.md`, so this pick nets to no diff vs HEAD.
Per STEP 4 that is not a failure and `--skip` was **not** called — the finalize
step will detect the clean staged diff and skip the commit.

The cherry-pick sequencer is untouched: `CHERRY_PICK_HEAD` is still present at
`04385bcaa114618b35e7c74df824e6cf3dc330a1`. Git writes were limited to
`checkout --ours` and `add --sparse` on this single path.

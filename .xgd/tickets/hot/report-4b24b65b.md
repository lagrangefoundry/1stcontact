---
uid: report-4b24b65b
id: REPORT-4562
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:01:15.671253+00:00'
updated_at: '2026-09-20T23:01:15.671253+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping
  ticket (§2e). Resolved per-fact in favour of OURS. Path is
  outside the resync branch's sparse-checkout cone (DOC-986
  §2/§4.1), so the conflict lived in the index only with no
  working-tree markers; resolved with `git checkout --ours` +
  `git add --sparse`.

  Incoming is `9255f773b5` (2026-08-24T21:06:30), the third and
  final commit of the same title-rename operation that produced
  `fe97d3bc34` (21:06:15) and `b0af50e157` (21:06:24). Its entire
  payload is two facts, no body change:

  | fact | base (`d4983a51e8`) | incoming (`ca370cce41`) | ours/HEAD (`29cfe4b6b9`) | taken |
  |---|---|---|---|---|
  | `fields.title` | present | **removed** | already absent | not in conflict — intent already satisfied |
  | `updated_at` | 21:06:24 | 21:06:30 | 2026-08-31T19:19:36 | OURS (later by 7 days) |

  The remaining divergence is inherited base content that OURS
  supersedes with later-positioned intent: `status: draft` →
  `free_and_reconciled`; `last_field_updated: title` → `status`;
  `completed_at: null` → set; and the `## Not started — diagnosis
  only` body → the confirmed-root-cause and fix writeup.

  Worth recording: this commit is upstream's own removal of the
  transient `fields.title` audit residue that `fe97d3bc34`
  created. In the two prior attempts in this queue I dropped that
  residue as stale bookkeeping the later HEAD lineage had
  normalised away; `9255f773b5` confirms the working branch
  reached the identical conclusion six seconds later. The two
  sides agree on this fact — it was never a genuine conflict.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **preserved; no hunk
  dropped under BUG-1301 precedence.** Both incoming facts are
  present in the resolved version in substance: the staged blob
  contains no `fields.title` key (the change this commit makes),
  and carries an `updated_at` strictly later than the one it
  sets. This commit touches no code, no test, and no UAT
  function, so nothing developer-authored was discarded.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached
HEAD` empty, `git status --porcelain` empty). The whole
three-commit rename sequence had already landed on the
main-rooted branch before this resync began, so replaying its
final commit is a genuine no-op. Per the instructions I did not
call `--skip`; finalize's clean-staged-diff detection should
elect to skip the commit.

Per the conflict-intent enrichment this file remains flagged for
post-merge review: intent was unknown on one or both sides, so
resolution fell back to the timestamp/ledger-position rule.

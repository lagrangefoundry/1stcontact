---
uid: report-70f1206d
id: REPORT-4583
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:54:38.578586+00:00'
updated_at: '2026-09-20T23:54:38.578586+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (`bug-*`), rule **2e**. Five conflict hunks plus one auto-merge duplication artifact. All resolved to the HEAD side.

  Incoming commit: `163924e9fd` ("xgd(ticket): update bug bug-23d1ec27", authored 2026-08-25 16:27:28 -0700). It is a large commit — a full body rewrite (Root cause, Fix — as landed, The evidence for this ticket, Watch for — resolved, Out of scope, ✅ Acceptance criteria, the build-artefact Reproduce note) plus a frontmatter touch.

  **The body was already on HEAD.** An earlier commit in this resync queue already landed every one of those sections, in xgd's reflowed single-line store form. The incoming commit carries the same prose hard-wrapped at ~80 columns. So four of the five hunks are the *same semantic content in two different wrappings*, not competing edits:

  | Hunk | HEAD | Incoming | Resolution |
  |---|---|---|---|
  | Root cause → Watch for (the large one) | reflowed, single-line paragraphs | hard-wrapped, pipe table | HEAD — content identical |
  | Out of scope | reflowed | hard-wrapped | HEAD — content identical |
  | Acceptance criteria | reflowed | hard-wrapped | HEAD — content identical |
  | Reproduce note | reflowed | hard-wrapped | HEAD — content identical |
  | frontmatter lifecycle | `status: bundled`, `updated_at: 2026-08-31T05:05:09`, `last_field_updated: status` | `status: free_coding`, `updated_at: 2026-08-25T23:27:28`, `last_field_updated: body` | HEAD — genuinely competing, later intent wins |

  Only the frontmatter hunk is a real intent conflict. HEAD is later-positioned on both measures — ticket `updated_at` (Aug 31 vs Aug 25) and commit date of the side that set it (HEAD-side `b0d981f729`, 2026-08-26, vs incoming 2026-08-25) — and `bundled` is downstream of `free_coding` in the lifecycle. Applying the incoming side would regress BUG-39 from `bundled` back to `free_coding` and roll `updated_at` backwards.

  On the four formatting-only hunks, 2e's later-positioned-intent rule points the same way (HEAD), and keeping HEAD's form also keeps the file consistent with the representation xgd's store already wrote to this branch.

  **Duplication artifact repaired.** Git auto-merged the "blast radius is wider than the reproduce line" paragraph *without* flagging a conflict — HEAD's reflowed copy and the incoming hard-wrapped copy have no matching context, so git treated the incoming one as an independent insertion and emitted the paragraph twice (former lines 53 and 55–57). Left alone this would have shipped a visibly duplicated paragraph in the ticket body. Removed the hard-wrapped duplicate, keeping HEAD's copy.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **the entire body of the incoming commit is present in the resolved file**, in HEAD's wrapping. Verified each section of the rewrite appears exactly once (no longer twice):

  - `blast radius is wider` — 1
  - `Fix — as landed` — 1
  - `AnthropicAccumulator` — 1
  - `Out of scope — a second` — 1
  - `ai-workers.js` (Reproduce note) — 1

  Nothing the incoming commit says about the bug is missing. The only differences from the incoming text are cosmetic and pre-existing on HEAD: line wrapping, the `| suite | before | after |` pipe table rendered by the store as a flat sequence of lines, and one misplaced bold delimiter in `**One double, in **`. These are artifacts of xgd's own markdown normalisation on an earlier already-integrated commit, not content I dropped.

- The frontmatter lifecycle change (`→ free_coding`, `updated_at` Aug 25) is deliberately **not** carried forward, per 2e's genuine-conflict arm: HEAD has already superseded it with `→ bundled` on Aug 31. Superseded lifecycle state is not developer work being discarded.

- No code, test, spec-matrix, or config files were involved. No test function was deleted. STEP 3's code-file verification is not applicable — this cherry-pick touches one ticket file only.

## Staging state

Staged with `git add --sparse`. The resolved file is byte-identical to HEAD (`diff` against `git show HEAD:…` is empty), so `git status --porcelain` is empty and the staged diff is clean. Per instructions `--skip` was **not** called — finalize will detect the empty staged diff and skip the commit. `CHERRY_PICK_HEAD` (`163924e9fd`) is left intact.

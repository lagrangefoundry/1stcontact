---
uid: report-67bc267f
id: REPORT-5319
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T07:32:17.949316+00:00'
updated_at: '2026-09-28T07:32:17.949316+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/doc-edba99c9.md` (DOC-35, `type: doc`) — **ticket/doc file**, conflict class `AA`.
  Cherry-picking `23ac1e1a5c` — *"field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"* — an ancestor of the apply target `b6b7f564`.
  **Rule applied: ours**, via 2b + 2e.

  Reading both sides (2b) showed they differ in *only* four frontmatter lines — the 491-line body is byte-identical (`diff -u` on the two stage blobs reports one hunk, all of it frontmatter). Neither side is a content superset, so 2b does not decide it. That left 2e's per-fact timeline rule on three competing facts, all resolving the same way:

  | fact | ours (HEAD, stage 2) | incoming (stage 3) |
  |---|---|---|
  | `updated_at` | `2026-09-11T09:33:34` | `2026-08-31T19:43:25` |
  | `last_field_updated` | `doc_kind` | `system_kb` |
  | `fields.doc_kind` | `system_kb` | `architecture` |

  This matches the enrichment block's own prescription ("take the more recent commit by timestamp"); ours is eleven days later.

  Resolved index blob: `7769c2ba9e` (= ours stage 2). No unmerged stages remain; `git status --porcelain` is empty, i.e. this pick leaves no net change from HEAD. Per STEP 4 this was **staged and exited `@done` without calling `--skip`** — the finalize step detects the clean staged diff and skips the commit.

## Incoming changes preserved

Proven at the blob level, not inferred.

`4399936414:.xgd/tickets/hot/doc-edba99c9.md` resolves to `aed617700c` — **byte-identical to the incoming stage-3 blob** — and `4399936414` is an ancestor of HEAD (`git merge-base --is-ancestor` exits 0) carrying the *same subject* (`xgd(ticket): update doc doc-edba99c9`), the *same body* (`field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)`) and the *same author date* (`Mon Aug 31 12:43:25 2026 -0700`) as the picked commit. It is `23ac1e1a5c` under a different sha — remapped history. The incoming migration is therefore already fully present on HEAD.

HEAD then carries `75b8755bf7` (Fri Sep 11 02:33:34 2026 -0700, also an ancestor of HEAD), which advances `fields.doc_kind` from `architecture` to `system_kb`. That value is only expressible *because* the DOC-39 3.3 migration had landed — it is the downstream completion of the incoming change, not a competitor to it. Taking incoming would have regressed a later, deliberate field edit back to an intermediate state of the very migration the incoming commit introduced.

Corroborating that `system_kb` is a legitimate `doc_kind` enum value rather than a corrupted write: on HEAD, `git grep -E '^  doc_kind:'` over `.xgd/tickets/hot` shows 4 docs at `doc_kind: system_kb` (alongside 28 `architecture` and six other kinds), and `git grep -E '^  system_kb:'` returns no hits — the boolean is fully retired repo-wide, exactly as the incoming commit message intends.

No hunk was dropped under the BUG-1301 precedence exception. No code files were involved; no UAT function on either side was deleted.

This is the same shape as the earlier resolution of the sibling doc `doc-58cf04a4` (DOC-33) against `f86a1ee873` in this same resync queue, and resolves the same way for the same reasons.

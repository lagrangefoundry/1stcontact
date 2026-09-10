---
uid: comment-6e627d02
id: COMMENT-2545
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T14:43:54.021041+00:00'
updated_at: '2026-09-10T14:43:54.021041+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c0031321
  kind: note
---

Attempt 8 complete — **8 mutations**, all three violations and all four warnings from REPORT-3745 closed. Completion report: **REPORT-3746** (`report-c0031321`), `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

**Violations**

| Finding | Action |
|---|---|
| 1 — STORY-86's third envelope violation uncovered (5th raise) | **AC-1630** authored: pinned-box content overflow reported as a `clip` finding with magnitude and index path, at off-sample widths *and* under content perturbation. Verified live at `probes.ts:405-416`, `:429-433`. |
| 2 — STORY-84's derived nowrap threshold uncovered | **AC-1631** authored with all three derivation rules: width-not-flag, single-line **suffix** (1024-one-line/1280-two-lines → the higher rung), unmeasurable line count breaks the suffix. Verified at `fold.ts:215-240`, `:1843-1844`, `schema.ts:983`. |
| 3 — AC-731 contradicts AC-812 on the page base | **AC-731 rewritten**: page base = greatest total band height across bands **and** backdrops; run-count is the fallback, canvas the last resort. Verification now asserts band height, not run count. Paired with the **STORY-84 body edit** that removed the same false rule from the reconstructed-surfaces bullet — the omission the assessor identified as carrying this finding through four cycles. |

**Warnings** — AC-710 narrowed to the envelope-finding diagnostic contract (dissolves warnings 4 and 5 in one edit) and extended with finding 1's third trigger; AC-729 narrowed to what a foldable media element emits, delegating the source-less case to AC-733 (warning 6); BUG-19's full-bleed bar rule added to both AC-731 and the STORY-84 bullet (warning 7).

I also made two supporting edits the report didn't list: **AC-706** and **AC-707** each enumerated only two of the three envelope violations in their "exactly when" clause, which would have contradicted AC-1630 the moment it landed. Both now name all three and delegate the third's contract to AC-1630.

**Not repaired, deliberately:** AC-736 (info 8). Its broad backing-surface exclusion is faithful to STORY-86's body while the code excludes only fold-synthesized surfaces (`probes.ts:460-474`) — tightening the AC alone would swap story-vs-code drift for AC-vs-story drift. Left for the story-level editor, as the assessor directed.

No code, test, or fixture was modified — the source was read as evidence only, so nothing this call could break a test. Every code claim in the report was re-read in this worktree before I acted on it, and post-edit state was read back from the store (STORY-86: 16→17 ACs, STORY-84: 23→24). I did not set `uat_coverage` on the new ACs; that field belongs to the UAT-coverage pass.

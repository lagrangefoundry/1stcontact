---
uid: comment-af864c67
id: COMMENT-2638
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-11T00:06:30.170974+00:00'
updated_at: '2026-09-11T00:06:30.170974+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6885f18e
  kind: note
---

Assessment complete. Filed **REPORT-3819** (`report-6885f18e`) — `capability_validation`, level `uat`, **result: fail**, 3 violations / 3 warnings / 0 needs_review.

## What I checked

54 active ACs across STORY-98 (edit render, 14 ACs) and STORY-101 (click-to-edit gesture, 40 ACs). Every one has at least one AC-named UAT — there are no uncovered ACs. I read the AC bodies against the test bodies for every AC whose text has moved since the last uat cycle (REPORT-2062, 2026‑08‑16), and carried REPORT-2062's test-by-test validation forward for the rest after confirming the only change to the render-channel suite since then is two added `await`s.

## The three violations

All three are the same shape — an AC's Verification names a scenario no test performs — and all three are additive assertions inside tests that already open the right dialog. None calls for an AC edit.

1. **AC-1039** — "the parameter sheet … keeps its labels" is half the AC's title and an explicit Verification sentence, and is asserted nowhere in the repo. A grep for `.fields-label` outside `dist-assets` finds two sites, both "there are none" assertions. A component change that dropped labels globally would leave this capability green. REPORT-2062 rated this a warning; I raised it because the unproven half is a title clause and the AC carries `uat_coverage: fail`.
2. **AC-997** — rewritten at ac level today (23:34Z) around a three-control dialog; its Verification now requires staging thumbnail + alt text + a sheet parameter in one Save. The covering test does the first two and then asserts the framing axes are *unchanged*. No test anywhere merges a grid pick with a sheet parameter.
3. **AC-1123** — "the sheet's rows appear in the order the surface declared them" has no assertion; the tests check membership only. Load-bearing because the sheet is assembled from two different controls and the surface's order is the only thing fixing the interleave.

Findings 2 and 3 are both fresh drift from today's ac-level fixes. I checked the other four ACs edited in that batch (AC-1000, AC-1028, AC-1043, AC-1140) — their new clauses happen to land on fixtures the existing tests already use, so they hold.

## Notable good news

REPORT-2062's violation V1 is repaired the right way round: AC-1138 was retitled and its "recorded divergence" deleted, and the test was *not* weakened — it still asserts capitalisation on both the box and the words in a real engine. The four intents that were merely imminent last cycle (REQ-139, REQ-140, BUG-34, BUG-35) have all reconciled and each arrived with an AC and a substantive UAT.

Two operational notes, both recorded in the report: the `xgd` CLI in this worktree is dead on a denied config write-back (I ran it through the documented no-writeback shim), and every browser/webui-gated test in this capability reports "unverified" on this machine — so a green run here is not browser-verified evidence.

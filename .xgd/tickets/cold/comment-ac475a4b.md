---
uid: comment-ac475a4b
id: COMMENT-676
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T22:16:59.350395+00:00'
updated_at: '2026-08-05T22:16:59.350395+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6440ca34
  kind: note
---

**REPORT-1320** (`report-6440ca34`) — **FAIL**: 2 violations, 2 warnings, 0 needs_review.

## What I checked

All 24 active ACs across STORY-84 (fold, 13 ACs) and STORY-86 (3-probe gate, 11 ACs) have a substantive UAT under the `test_UAT_AC<number>_*` convention, each driving real entry points — no AST-only stand-ins. I ran all four files: **24 passed, 1.58s**.

So coverage at the "has a UAT" level is complete. Both violations are *consistency* failures — a UAT that doesn't exercise a named clause of its own AC:

**Violation 1 — AC-691's height rule has no evidence.** The AC turns on "a box/image leaf pins height at every keyframe; a text leaf's keyframes carry no height." `test_UAT_AC691` (`tests/reconciliation-l1-fold.test.ts:256`) makes no height assertion at all. Grepping the whole tree, keyframe-height assertions exist only at `reconciliation-l1-fold-full-language.test.ts:162,272,342` — all image/box, under AC-729/730/731. The text-leaf "no height" invariant is proven **nowhere**, including the free-coded sibling. It's live in code (`fold.ts:543-551`, `buildGeometry(withHeight)`) and load-bearing: AC-707's content-robustness probe grows text runs, which only means anything because text height is natural. A regression that started pinning text heights would leave every UAT in this capability green.

**Violation 2 — AC-689's full-language clause is unexercised.** Its `FakeDriver` capture (`:103-133`) carries one text run and `images: []`, so the folded doc has exactly one leaf kind. The four assertions present cover only the REQ-83-era criterion; the clause REQ-92 added ("not text alone… leaves of more than one kind") never runs.

Both live in the same file and are a few lines each.

**Warnings**: AC-694's substantive assertions sit behind a Chromium branch I verified skips here (playwright wants build 1228, cache has 1234) — the always-run path only proves the test's own `CANNED_HINTS` round-trips, and ancestry/position/repeatCount are asserted on neither path. And AC-689 says root is a "container node" where both code and test use `box` (a distinct L1 kind) — an ac-edit wording fix.

I recorded as info rather than re-deriving: the open ac-level gap (no AC for pinned-box content overflow, so no UAT can trace anywhere yet) and the story-level REQ-88/BUNDLE-10 cascade — authoring UATs for either now would trace to nothing on this branch.

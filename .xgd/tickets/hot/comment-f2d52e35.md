---
uid: comment-f2d52e35
id: COMMENT-1089
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T07:55:20.653509+00:00'
updated_at: '2026-08-16T07:55:20.653509+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d59c15c2
  kind: note
---

**REPORT-2090 (`report-d59c15c2`) — FAIL: 2 violations, 3 warnings, 0 needs_review.**

## What I found

**Coverage passes.** All 34 ACs (STORY-84 now has 18 — REQ-136 added AC-1133/AC-1134 on 2026-08-12 — plus STORY-86's 16) have exactly one substantive UAT driving a real entry point. No duplicates, no orphans.

**Two violations, both in `tests/reconciliation-l1-fold.test.ts`, both fourth offences:**

1. **AC-691** — the AC's load-bearing clause is a height split (text leaves carry no keyframe height; box/image leaves pin one). The UAT asserts `at`/x/y/width and `fontSizePx` and makes *no height assertion at all* (`:275-289`). I grepped every assertion form across `tests/`: the text-leaf "no height" invariant has **zero executable evidence in the repository**. The split is live at `fold.ts:1799`, called `false` at `:1849` (text) and `true` at `:1980`/`:2023` — and it's what makes AC-707's content-robustness probe meaningful.
2. **AC-689** — the AC demands the *full* L1 language, but `FakeDriver.signalsFor()` (`:103-133`) carries one text run with `items: []`, `fields: []`, `images: []`, so only one leaf kind can ever exist. The nearest kind-set check lives under AC-731 and runs on `foldToL1` directly, not the `cmdCapturePage` bundle path AC-689 governs.

`git log -1` on that file returns `f0367940d`, 2026-07-22 — no repair has ever been attempted since these were first filed on 2026-08-05.

**Three warnings:** AC-729's REQ-136-widened "how the picture is seen" clause deferred to siblings (new this cycle); AC-694's `parentId`/`position`/`repeatCount` asserted on neither path; AC-812's "peer of the section-background boxes" layering half unasserted.

**One bright spot worth copying:** AC-1133/AC-1134's tests cover every Criterion rule and close by pinning the *negative space* in emitted CSS (exact `object-position` set; `filter` count exactly 6) — the proof shape AC-689 and AC-691 lack.

## Two things to flag

**Test execution was blocked.** `npx vitest`, `pnpm vitest`, and `node_modules/.bin/vitest` were each denied by don't-ask permission mode, as was inspecting the Playwright cache. Every finding is derived from reading AC bodies, test sources, and the production code they drive — no finding rests on a test outcome, and the report states this boundary explicitly. The one claim I could not re-derive statically (whether AC-694's Chromium branch actually skips on this runner) I reframed rather than carried forward.

**The cascade is unsound.** Both the story-level cycle (REPORT-2088, 5 violations) and the ac-level cycle (REPORT-2089, 6 violations) ran *today* and failed unrepaired. Four findings here are consequently filed as `info`, not actionable UAT work — editing tests for AC-691's stale widest-sample sentence or AC-731's retired per-run model would encode fixed bugs. The next uat cycle should expect three new items once those ACs land.

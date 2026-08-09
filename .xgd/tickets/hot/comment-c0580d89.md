---
uid: comment-c0580d89
id: COMMENT-879
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-09T07:44:11.789001+00:00'
updated_at: '2026-08-09T07:44:11.789001+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-03c71b09
  kind: note
---

**REPORT-1731 (`report-03c71b09`) created — result FAIL: 2 violations, 2 warnings, 0 needs_review.**

## What I found

CAP-71 has 2 stories and 32 ACs. Coverage is not the problem — every AC has **exactly one** `test_UAT_AC<n>_*` test driving a real entry point, and I ran all 32 this session: **6 files, 32 passed, 1.15s**. The failures are consistency gaps between three AC bodies and the tests that claim to prove them.

**Violation 1 — AC-691 (`uat-edit`).** The AC's criterion turns on a height distinction: box/image leaves pin height at every keyframe, text leaves carry none. The UAT (`tests/reconciliation-l1-fold.test.ts:256-290`) makes **no height assertion at all**. The split is live in code — `fold.ts:1678` `buildGeometry(withHeight)`, called `false` for text at `:1741`, `true` for box/image at `:1872`/`:1915`. The text-leaf "no height" invariant has zero executable evidence anywhere in the repo, and it's what makes AC-707's content-robustness probe meaningful.

**Violation 2 — AC-689 (`uat-edit`).** The AC requires the capture to emit the **full** L1 language. Its UAT drives `cmdCapturePage` with a `FakeDriver` whose signals carry one text run and `items: []`, `fields: []`, `images: []` — one leaf kind, clause never exercised. The nearest coverage (`full-language.test.ts:330`) belongs to AC-731 and runs `foldToL1` directly, not the bundle path AC-689 governs.

Both are **third offences** (REPORT-1320, REPORT-1662). `git log` confirms `tests/reconciliation-l1-fold.test.ts` has not been touched since `f0367940d`, 2026-07-22 — no repair was ever attempted across six prior cycles. Both fixes land in that one file.

**Warnings:** AC-694's substantive sidecar assertions sit behind a chromium branch that skips here (I confirmed `chromium.launch()` fails — build 1228 vs. what's cached); its always-run assertions only round-trip the test's own `CANNED_HINTS`, and ancestry/position/`repeatCount` are asserted on neither path. AC-812 proves half its layering clause and leaves the backdrop-vs-section-background ordering unasserted despite the fixture already producing both node sets.

**Recorded as info, not uat work:** AC-731's and AC-691's stale bodies, the missing pinned-box-overflow AC, AC-736's over-broad wording, and today's story-level REPORT-1729 findings (`1c repro`/BUG-23 unowned; BUG-18 scalar tracks unexpressed). These are `ac-edit`/`story-body-edit` chains — a UAT written now would encode a fixed bug or trace to no matrix element. Three of them carry follow-on uat work that becomes actionable once the upstream repairs land.

**Note on infrastructure:** `xgd ticket list` was unusable throughout — the cold-index `flock` at `.../main/.xgd/_locks/__cold_index__.flock` timed out after 30s on every attempt, with several dashboard servers and dispatcher runners contending. I sourced the matrix tree and ticket bodies through the dashboard HTTP API on port 5555 instead; `xgd ticket get` and `xgd report create` worked fine.

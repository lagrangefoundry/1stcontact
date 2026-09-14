---
uid: report-fc0da86a
id: REPORT-4231
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-14T05:07:31.519314+00:00'
updated_at: '2026-09-14T05:07:31.519314+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-8e1807f6
  plan_item_index: '2'
---

Story and criteria created and verified.

```
Story #2 created for reconciliation bundle-8e1807f6

Story UID: story-046cfc56 (STORY-148)
Title: The image layer belongs to the toolchain: PNG decoded and encoded in-repo,
       with the fidelity arithmetic running in the cloud runtime
Type: feature (capability-aa030c83 — 1c Capture & Diff Fidelity, 3 points, no deps)
Acceptance Criteria: 14 created (AC-1776 … AC-1789)

Progress: 2 of 10 plan items complete
```

**What the ACs cover** — byte-identical decode against the recorded native-decoder witness in both runtimes (AC-1776); the sRGB channel-expansion contract (AC-1777); corpus coverage of every divergent decode path (AC-1778); the three distinct named refusal classes plus the encode-side guards (AC-1779); encode round-trip on pixels, not bytes (AC-1780); greyscale heatmap storage (AC-1781); the verdicts-do-not-move promise (AC-1782); `1c crop` narrowed to PNG (AC-1783) and clamping (AC-1784); dimensions without decoding (AC-1785); the perceptual diff running in the deployed runtime from the object store (AC-1786); the three non-pixel comparison cores there (AC-1787); the recorded decode measurement and its ceiling (AC-1788); and no native imaging module declared or loaded (AC-1789).

**Judgment calls worth flagging:**

- **AC5 of REQ-156 is deliberately not formalized.** The intent's own appended section declares it undelivered (`cmdGate` still resolves its reference as a filesystem path) and defers it to the reference-store port. Per the chain of authority that deferral *is* the current intent, so no criterion claims it; it's recorded in Technical Context as unblocked-but-not-delivered.
- **The "last native dependency" claim is narrowed in AC-1789** to match the ticket's own honest caveat — `sharp` still enters the lockfile transitively via the workerd test harness, so the AC asserts only that nothing the toolchain ships declares or loads it.
- **Install gating stays out.** Preflight map membership is plan item 3's upgrade of STORY-79; AC-1789 asserts the dependency and import facts only, so the two items don't collide on the same behaviour.
- **Three intent-silent behaviours formalized** under `## Reconciliation Decisions`: magic-byte format naming with a remedy (and a distinct "unrecognised" case), encode-side refusal of impossible rasters, and the measurement carrying a ceiling rather than only a printed number.

No contradiction between intent and code was found for this item.

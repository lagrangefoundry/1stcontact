---
uid: comment-3179a220
id: COMMENT-2426
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T01:28:00.512065+00:00'
updated_at: '2026-09-10T01:28:00.512065+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-eb125804
  kind: note
---

Attempt 8 is complete. **REPORT-3627** (`report-eb125804`): `fixes_applied: 5`, `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

## What I did

Both remaining actionable findings were closed the way the assessor's Notes said they could be — by authoring the browser-gated leg, which needs no browser.

**Finding 1 (violation, AC-720)** — `tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts` gained Part B, `test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs`. It drives real `cmdRepro --sandbox` → real `cmdAlignedCrops --sandbox` against a temp-dir reference bundle (`writeL1` + a 1280px `rest` projection + a real `sharp`-generated screenshot) and asserts what the seam test structurally cannot see: the repro is under `storage/sandbox/` with nothing in `storage/sites/`, `areas.length > 0`, and both PNG halves of every pair on disk. The docstring's "the commit's end-to-end check … is **manual**" concession — quoted by the last six reports — is gone. `cmdAlignedCrops` calls `playwright.chromium.launch()` directly (`aligned-crops.ts:199-200`), so the leg is gated; everything around the browser is real and local.

**Finding 3 (AC-1612, the store's only AC with no test)** — new `tests/reconciliation-gradient-modern-colour-stops.test.ts` plus two fixtures, three legs covering the AC's three Verification clauses on both gradient kinds. The syntax-independence clause is asserted *exactly* via `color-mix(in srgb, X 100%, Y 0%)` (byte-identical to its `#hex` twin by construction, yet unreadable to the tool-side stop regex), with the pinned hex twin ensuring the pair cannot agree by both being empty. The lossy `oklch()` panel is held to 2/255 per channel. `uat_coverage` corrected `missing` → `fail`.

Verification: `5 files passed, 1 skipped; 22 passed, 14 skipped, 0 failed`. Nothing changed state.

## The Chromium escalation, now diagnosed

Three prior reports asked whether this loop can run on a Chromium host without a cause. I probed it. Two independent blockers, neither "no browser installed":

1. The sandbox denies Chromium's Mach bootstrap — `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.<pid>: Permission denied (1100)`, then `SIGTRAP`. No flag or `PLAYWRIGHT_BROWSERS_PATH` shim gets past it.
2. A build pin: the cache holds `chromium-1234`, `playwright@1.61.1` wants `1228`. `npx playwright install` is denied and the network allowlist is empty.

So AC-815's four assertions, AC-720's new leg and AC-1612's three legs remain authored-but-unobserved, and that is an operator/runner action.

**One correction to forward:** the capability body's cluster-2 note says STORY-124's Technical Context still misnames CAP-102. Read live this pass, `story-080c6036` line 70 already reads "Filed under CAP-63" — the story is fixed; it's the capability body's note that is now stale. Editing a capability body is outside this step's remit, so I forwarded it rather than doing it.

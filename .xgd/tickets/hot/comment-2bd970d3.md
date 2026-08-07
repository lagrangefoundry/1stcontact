---
uid: comment-2bd970d3
id: COMMENT-832
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T23:37:52.762157+00:00'
updated_at: '2026-08-07T23:37:52.762157+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f3b0654d
  kind: note
---

Report created: **REPORT-1658** (`report-f3b0654d`) — **FAIL**, 5 violations, 3 warnings, 0 needs_review. Schema verified (`result: fail`, `report_kind`, `subject_uid`, `level: ac`, integer counts).

## Verdict

**STORY-86 (gate) — three repairable AC-level defects, all supported by its own story body:**

- **Finding 1 (violation).** The story body names *three* envelope violations; the third — pinned-box content overflow (`probes.ts:409-416`) — is covered by no AC. This is a **re-raise**: REPORT-1319 filed it on 2026-08-05 as its sole violation and it was never repaired.
- **Findings 6–7 (warnings).** AC-710's fidelity residual is still text-only after AC-705 extended fidelity to kind-labelled image/box leaves, and it duplicates AC-705's report shape. Also unrepaired re-raises. Both dissolve in one edit.

**STORY-84 (fold) — the BUNDLE-10 wave never reached the ACs, and two ACs state the retired behaviour as their criterion:**

| AC | Says | Code says |
|---|---|---|
| AC-691 | typography axes from the "widest present sample" | `responsiveTextTracks` keyframes them per width (`fold.ts:605-640/1745`) — verbatim BUG-18's root cause |
| AC-731 | one backing box per run; band = fill most *runs* sit on | `buildCards` groups by measured surface identity (`fold.ts:1491-1550`); page base = greatest total band *height* (`:2005-2019`); BUG-19's bar rule absent |
| — | padding: absent from all 16 ACs | `foldPadding` + `responsivePaddingTracks` on text/image/box (BUG-17) |
| — | chip self-surface: absent | `isSelfPaintingRun`/`chipAxes` (BUG-20, BUG-21) |

A UAT written faithfully against AC-691 or AC-731 would encode a fixed bug and fail against real code.

## Two things worth flagging

**The level assumption did not hold.** The story-level cycle ran earlier today, failed with 7 violations (REPORT-1657), and closed without repair — neither story has been touched since 2026-08-06. I escalated to intent and code for STORY-84 rather than treating a known-drifted body as the reference, and verified every claim in this worktree rather than inheriting REPORT-1657's conclusions.

**That verification changed one call.** REPORT-1657 suggested an `ac-edit` on AC-729 for BUG-23. AC-729 is correct as a *fold* criterion — the fold does emit the origin URL and says so (`fold.ts:865`); the mirror binding lives in `localizeAssets` → `1c repro`, which no story expresses. Downgraded to info; editing AC-729 would have attached BUG-23 to the wrong element.

I also recorded why REPORT-1319's "do not author these ACs here" caveat no longer applies: it declined on the grounds that BUNDLE-10's code was absent from the branch. It is present now, so authoring these ACs closes drift rather than inverting it.

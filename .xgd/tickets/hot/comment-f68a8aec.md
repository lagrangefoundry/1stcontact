---
uid: comment-f68a8aec
id: COMMENT-1249
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T03:43:02.888815+00:00'
updated_at: '2026-08-20T03:43:02.888815+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a03ac65e
  kind: note
---

All four violations are resolved. Summary of the 11 mutations:

**Finding 1 + 4 (REQ-64 noise audit, REQ-76 cause clustering)** — created **STORY-116** (`story-aaddb221`), the sibling report-surface story the assessor recommended, rather than straining STORY-75's capture scope. Six description items: noise as a reversible per-run overlay over an exact capture; `--collapse` counting defects not cells; derived-axis demotion (`position` as the integral of `gap`/`size`); the Type-A flat / Type-A structural / Type-B repair order that STORY-75 §5 already leaned on; `--clusters` ranked dispositioned causes; and cluster viewport-awareness as the anti-phantom guard. Paired with five ACs (**AC-1285…1289**) so the new story isn't an immediate coverage gap.

**Finding 2 (REQ-72)** — STORY-76 gained a Description item for in-browser resolution of gradient stop colours to `#rrggbb` on both the text-fill and panel paths, plus the Story sentence, In-scope clause, and a Technical Context bullet; attributed via `updated_by`.

**Finding 3 (REQ-73)** — STORY-75 gained item 15: the adjacent-gap axis (row grouping by reference y-overlap, 6px/16px tolerance, HIGH tier, linear inversion) and the paired deliberate retirement of section band vertical padding; Story sentence, In-scope list and a Technical Context bullet updated; attributed via `updated_by`.

**Capability body** — added a Scope bullet for the report surface so STORY-116 has a declared home, and a History entry recording the ledger hole (seven ledgers enumerated bundles only, missing unbundled `free_and_reconciled` requests).

Everything was grounded in live code before editing — `fidelity.ts:271-531`, `values-diff.ts:2493-2541 / 1355-1366 / 2575-2583`, `extract.ts:329-347` — read via explicit decode since those files carry NUL bytes and read as binary to grep. No code edits were needed; all four were matrix coverage gaps, not code/intent disagreements.

Warnings 5–7 were not swept in: BUNDLE-19's `preflight` verb is genuinely absent on this branch (re-verified), and REQ-74 (`adopt-gaps`) and REQ-78 (`aligned-crops` meaning) are live but owned elsewhere — both recorded as deliberate exclusions in the capability History and forwarded in the report as needing an ownership decision (likely CAP-71 and the perceptual pipeline respectively). Report: **REPORT-2355**, `needs_more_work=false`, `progress_made=true`.

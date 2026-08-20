---
uid: report-81bbe352
id: REPORT-2444
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=ac)'
created_by: xgd
created_at: '2026-08-20T13:06:15.693404+00:00'
updated_at: '2026-08-20T13:06:15.693404+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: ac
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: ac

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

Attempt 8's fix (`report-7fdd6d05` + `report-aaef1ab0`, 2026-08-20 12:50/12:57) closed all
12 violations and the 1 warning of `report-af76ac2a` — verified element by element below.
STORY-84 went 18 → 26 ACs; AC-705, AC-731 and AC-736 were rewritten. **Every In-scope
clause of both story bodies now has an AC.** The coverage arrears the last three cycles
were about are gone.

The two violations below are new findings from this cycle's independent read, both on
STORY-86's evaluator half, and both narrow:

- one **consistency** defect where AC-736 states an exemption **wider** than the story body
  and the code allow (it would license a UAT that fails against shipped code);
- one **coverage** gap where the story body's Description names *three* envelope violations
  and the AC tree describes two.

No finding here questions a story body. The bodies are the working reference, as the level
cascade requires; the story level passed at `report-47677418` (2026-08-20 12:33).

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Statuses re-verified this
cycle (not carried over): every one is `free_and_reconciled`, so all count.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | free_and_reconciled | 2026-07-18 | `adopt-values` | YES (retired by REQ-88) |
| REQ-74 | free_and_reconciled | 2026-07-18 | `adopt-gaps` — explicitly left untouched | YES |
| REQ-79 / REQ-82 | free_and_reconciled | 2026-07-19/20 | Framework pivot: L1 substrate, absolute-base form | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | Capture bundle → servable, gate-able site; content column, height probe, no-wrap threshold, padding tracks, materialization | YES |
| BUNDLE-7 | free_and_reconciled | 2026-07-22 | REQ-63/79/82/83/84 + 2 — originating intent of both stories | YES |
| BUG-5 | free_and_reconciled | 2026-07-23 | Occurrence-index pairing; idempotency | YES |
| BUG-14 | free_and_reconciled | 2026-07-23 | Surface reconstruction: band → card → text | YES |
| BUG-17 | free_and_reconciled | 2026-07-23 | Fold drops element padding | YES |
| BUG-18 | free_and_reconciled | 2026-07-23 | Per-width type tracks | YES |
| BUG-19 | free_and_reconciled | 2026-07-23 | Full-bleed bar seeding path | YES |
| BUG-20 | free_and_reconciled | 2026-07-23 | Pill / self-painting run | YES |
| BUG-21 | free_and_reconciled | 2026-07-24 | Control surface boxes double-apply padding | YES |
| BUG-23 | free_and_reconciled | 2026-07-24 | Reproduction hotlinks the captured origin | YES |
| BUG-24 | free_and_reconciled | 2026-07-24 | Translucent scrim flattens to opaque | YES |
| BUG-27 | free_and_reconciled | 2026-07-25 | CSS background images / lazy media not captured | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | L1 pages host behavior modules in their slots | YES (see info 6) |
| REQ-96 | free_and_reconciled | 2026-07-26 | `control` node; controls bind to behavior modules | YES |
| BUNDLE-11 | free_and_reconciled | 2026-08-05 | BUG-27/REQ-94/96/97/98 + 10 — cross-gate verdict | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Framing pair + colour-adjustment stack | YES |

## Alignment Ledger

STORY-84 (26 ACs) — every In-scope clause now lands. The eight ACs authored at attempt 8
close the six REQ-88 / BUG-line behaviours that had none.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689, AC-690, AC-692, AC-693, AC-695, AC-696 | BUNDLE-7, REQ-66 | aligned |
| AC-691 | BUNDLE-7, BUG-18 | aligned — base-from-widest + per-width type track |
| AC-694 | BUNDLE-7 | aligned |
| AC-729, AC-730 | BUNDLE-7, REQ-136 | aligned |
| AC-731 (rewritten) | BUG-14, BUG-19, BUG-20, BUG-21 | aligned on the captured-rect adoption, band guard, accent-bearer fallback, grouping identity and the full-bleed bar; the self-painting exception is stated but unverified (warning 3) |
| AC-732, AC-733 | BUNDLE-7, REQ-96 | aligned |
| AC-812 | BUG-27 (backdrop half) | aligned |
| AC-813 | REQ-96, REQ-88 | aligned (seam rect + rebased control geometry) |
| AC-814 | REQ-88 | aligned |
| AC-1133, AC-1134 | REQ-136 | aligned |
| AC-1345 (new) | BUG-24 | aligned — image-or-scrim fold condition + per-axis widest read (closes prior finding 1) |
| AC-1346 (new) | BUG-17, BUG-18 | aligned — per-side padding + varying-side track (closes prior finding 2) |
| AC-1347 (new) | REQ-88 | aligned — no-wrap threshold, suffix rule, unmeasurable break (closes prior finding 4) |
| AC-1348 (new) | REQ-96, REQ-88 | aligned — the six derived facts + derivation-gap channel (closes prior finding 7) |
| AC-1349 (new) | BUG-23, REQ-88, REQ-93 | aligned — materialization, localization, fold gap, idempotence (closes prior finding 6); two clauses reach past the story body (info 6) |
| AC-1350, AC-1351 (new) | REQ-88 | aligned — column fit and per-axis anchoring with all three refusal rules (closes prior finding 5) |
| AC-1352 (new) | REQ-88 | aligned — probe pair, `yFactor`/`heightFactor`, both attribution rules (closes prior finding 3) |

STORY-86 (16 ACs) — the cross-gate block is fully covered; the two remaining defects are
both on the analytic evaluator.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-705 (rewritten) | BUG-5, BUG-14, REQ-96 | aligned — pairing contract, `mounted` channel, synthesized-surface exclusion, width-ladder-only oracle (closes prior findings 10–12) |
| AC-706, AC-707 | BUNDLE-7 | gap: state the envelope as overlap + clip-beyond-viewport only (violation 2) |
| AC-708, AC-709, AC-724, AC-735, AC-737 | BUNDLE-7, BUNDLE-11, BUG-5 | aligned |
| AC-710 | BUNDLE-7 | gap: enumerates the finding kinds but not the pinned-box content-overflow condition (violation 2) |
| AC-734 | BUNDLE-11 | aligned (non-wrapping row tiling, conservative grid) |
| AC-736 (rewritten) | BUNDLE-11, BUG-14 | **exemption stated wider than the body and the code** (violation 1); slot clip retention now asserted (closes prior warning 13) |
| AC-852 … AC-856 | BUNDLE-11 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-736 | ac-edit | **The overlap exemption is not keyed on the fold-synthesized identity.** AC-736 exempts "a painted surface leaf — a childless box carrying a card/panel/section fill, positioned behind the content it backs". That description also fits the leaf **AC-730** folds from a *genuinely captured* standalone panel, which the code does **not** exempt: `probes.ts:468-474` exempts only `slot` leaves and `box` leaves whose id passes `isSynthesizedSurfaceId` (`section-band-*` / `section-bg-*` / `card-*`), and `probes.ts:465-466` says so in as many words. STORY-86's Technical Context states the rule explicitly — "The exclusion is keyed on the synthesized identity the fold assigns them, so a genuine captured standalone surface still pairs **and still participates in the overlap check**" — and no AC carries that corollary. AC-705 carries only its pairing half ("A genuine captured standalone surface still pairs normally"). As written, a UAT authored from AC-736 could assert a captured standalone panel is overlap-exempt and would fail against shipped code. | Key AC-736's exemption on the fold-synthesized identity (a reconstructed band / section background / card the fold invented, not any childless fill-bearing box), and add the corollary: a genuine captured standalone surface box is real painted content and still participates in the overlap check. Add a verification step asserting two captured standalone surface boxes that intersect **are** reported while a synthesized backing surface under its own content is not. |
| 2 | violation | coverage | STORY-86 / AC-710 (+ AC-706, AC-707) | ac-edit | **Pinned-box content overflow has no AC.** STORY-86's Description names **three** envelope violations the evaluator reports: "sibling overlap, horizontal clip beyond the viewport, **and pinned-box content overflow**", and In scope names "its envelope findings". Shipped at `probes.ts:405-416` — a flow container with a pinned keyframe height whose content height exceeds it pushes a finding detailed `content height Npx exceeds pinned box height Mpx` (emitted under `kind: 'clip'`, `probes.ts:271`). No AC in the capability mentions it: AC-706 and AC-707 phrase the envelope as "no leaf clips **beyond the viewport**", which is strictly the `probes.ts:449-458` check, and AC-710 enumerates the finding shape without this condition. A UAT author reading the AC tree would test viewport clipping only, leaving the check that makes content-robustness meaningful for a pinned *container* untested. | Add the third condition to AC-710's envelope-finding clause (a container whose pinned keyframe height is exceeded by its flowed content height is reported as a clip finding naming both heights and the container's path), and widen AC-706/AC-707's envelope statement from "clips beyond the viewport" to the evaluator's full envelope so the probes' pass condition matches the check they run. |
| 3 | warning | coverage | AC-731 | ac-edit | **The self-painting run is stated but never verified.** AC-731's criterion carries the exception in full ("a fully-rounded pill, or a control with authored vertical inset … it carries that surface on its own text leaf, and it contributes nothing to this reconstruction"), but its Verification section — rewritten at attempt 8 — exercises the dominant-fill band, the adopted rect, the band guard, the accent-bearer fallback, the grouping identity and the full-bleed bar, and **never a self-painting run**. Nothing else in the tree does either: AC-732's verification covers gradient fill, underline, small-caps, list marker and text shadow, not a run's own surface. BUG-20 and BUG-21 (both `free_and_reconciled`) are entirely about this behaviour, and the story body names its positive half — "the fill, corner radius, border and shadow ride on the text leaf itself". | Add to AC-731's Verification: a run whose radius saturates (pill) and a run with authored vertical inset over its own fill each fold their surface onto the **text leaf** (fill, radius, border, shadow), emit **no** backing box and no row, and contribute no evidence to the band or card signature — the enclosing card being defined by its other runs. Optionally state the positive half in the criterion's own clause rather than only inside the exception. |
| 4 | info | coverage | prior findings 1–13 | — | All 12 violations and the 1 warning of `report-af76ac2a` re-checked element by element and confirmed closed: AC-1345 (scrim), AC-1346 (padding + track), AC-1352 (height probe), AC-1347 (no-wrap), AC-1350/AC-1351 (column fit + per-axis anchor), AC-1349 (materialization), AC-1348 (derived config + gap channel), AC-731 (captured rect, full-bleed bar), AC-705 (`mounted`, synthesized exclusion, ladder-only oracle), AC-736 (slot clip retention). | none |
| 5 | info | exclusivity | AC-812 + AC-1345 | — | The two read as near neighbours but are not duplicates: AC-812 owns `backdropNodes` (element-level background photographs, ordered *after* the section boxes) and AC-1345 owns `sectionBgNodes` (the section fold's own background box, matched by section ordinal) — two distinct sets composed at `fold.ts:2299-2303`. Note for a future story cycle: STORY-84's Description bullet attributes the scrim to "the **backdrop** box leaf … The same box also carries the band's translucent scrim", while its own In scope and Technical Context attribute it to the **section-background** box. AC-1345 follows In scope and the code and is correct. | none (story-body wording, not an ac defect) |
| 6 | info | consistency | AC-1349 | — | Two of AC-1349's clauses are named by no STORY-84 sentence: the part-stale failure (a bundle whose L1 seams and `forms.json` bindings disagree fails with a re-capture instruction) and the pre-disk validation of the assembled definition. Both are code-true — `repro.ts:106-125` (cited to REQ-93) and `repro.ts:173` (`validateSite`) — and REQ-93 is `free_and_reconciled`, so the AC is right and the story body is the thinner of the two. Not an ac-level defect; recorded so the next story-level cycle can fold it in rather than re-deriving it. | none at this level |
| 7 | info | exclusivity | AC-729 + AC-1133/AC-1134; AC-705 + AC-724 | — | Re-checked and unchanged from the previous cycle: AC-729 owns the image leaf's shape while AC-1133/AC-1134 own the admission rules and extend to painted surfaces; AC-705 owns the pairing contract while AC-724 owns the idempotence identity that makes a clean AC-705 report falsifiable. Deliberate layering, not duplication. | none |

## Notes for the Editor

**Scale of the remaining work.** Two edits and one verification addition, all inside three
existing ACs on STORY-86's evaluator half and STORY-84's AC-731. No new AC is required and
no story body needs touching. This is a much smaller surface than the last three cycles.

**Violations 1 and 2 are the same shape from opposite directions**, and both live in the
gap between the evaluator's *implementation* and how the ACs describe its envelope: AC-736
describes the overlap exemption more broadly than the code applies it, and AC-706/707/710
describe the clip check more narrowly than the code runs it. An editor working both at once
should read `probes.ts:405-488` end to end — the whole envelope is 80 lines — rather than
patching each clause in isolation.

**Nothing here is a `code-issue`.** Every behaviour named was located in shipped code and
cited by file:line before being written up; the defect is in what the matrix says about
them.

**No `needs_review`.** Every intent in the ledger resolved to `free_and_reconciled`, and
each finding traces to an explicit clause in a story body that passed its own alignment
check one cycle ago (`report-47677418`, 2026-08-20 12:33). Finding 5's story-body wording
tension resolves cleanly against In scope, Technical Context and the code, so it did not
need escalating.

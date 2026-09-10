---
uid: report-acd5b1d0
id: REPORT-3637
type: report
title: 'Capability-Intent Alignment: Palette Management: The Site''s Named Colours,
  Read, Edited & Guarded (level=story)'
created_by: xgd
created_at: '2026-09-10T02:29:06.759825+00:00'
updated_at: '2026-09-10T02:29:06.759825+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a0bba4ec
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Palette Management: The Site's Named Colours, Read, Edited & Guarded
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts: 0.

## Cumulative Intent Considered

Both stories carry `intent_uid: bundle-77b28def` (BUNDLE-19, `free_and_reconciled`,
merged at `b18b859d`). Neither story carries an `updated_by` chain, so the ledger was
built by walking the bundle's members plus every request/bug in the store whose title or
body names a palette surface (`1c palette`, `/api/palette`, `ManagePalette`,
`get_palette`, "palette popup").

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-114 | free_and_reconciled | 2026-07-31 | L1 palette colour model (literal base + palette overlay) and the retrofit | YES — but owned by the **framework substrate** / **site materials** capabilities; explicitly out of scope for CAP-98 |
| REQ-133 | free_and_reconciled | 2026-08-12 | **The primary intent for this capability.** The palette popup (display / pick / edit), `1c palette` as its own command group, `/api/palette` beside it, the reference census, the four writes and their guards, the five operations on the AI toolbox surface, free hex entry bounded to this surface | **YES — primary** |
| REQ-137 | free_and_reconciled | 2026-08-12 | `shade` on the reference replaces named `steps`; an entry becomes exactly one colour. Split out of REQ-133 §2 and landed first | YES as a *dependency* — the model itself is out of scope for CAP-98, but it retires `steps` from anything CAP-98 may describe |
| REQ-140 | free_and_reconciled | 2026-08-15 | Page editor colour fields (text colour, panel background) — the first *pick-mode* caller of this capability's popup | YES as a *consumer*; the segment-side write is owned by the copy-editing capability |
| REQ-142 | free_and_reconciled | 2026-08-15 | Async `SiteStore` port — the seam the atomic rename crosses as one transition | YES as substrate; different capability |
| REQ-145 | free_and_reconciled | 2026-08-15 | control-app becomes the builder (routes, client build artifact) — relocates the toolbar and origin this capability's surfaces sit on | YES as substrate; different capability |
| REQ-119 | (referenced) | — | Made `draft` and `edit` render at request time; this is what withdrew REQ-133's original AC-12 re-render criterion | YES (retiring) |
| BUG-43 | ready_to_reconcile | 2026-09-01 | The builder preview frame is never reloaded **after an assistant turn**. Cites the palette popup's `onChanged: () => …reload()` (`apps/control-app/src/builder/app.js:140`) as the *working* reference implementation the chat pane lacks | imminent — but its subject is the **builder chat** capability. Adds and retires nothing here; it is positive evidence that STORY-114's refresh-after-write claim is landed |
| BUG-67 | draft | 2026-09-09 | 4096-token cap truncates large `set_l1` writes | NO — draft |

REQ-133's comment thread (COMMENT-918) was read for nuance. It resolves two things the
body only states as conclusions: (1) the operator rejected the "panel mode" framing
outright — *"I see this as a popup"* — which is why STORY-114 says it is not a third
channel or a workspace mode; (2) the operator chose restricted delete. The thread's Q3
discussion of first-class `steps` is **superseded by REQ-137** and correctly appears
nowhere in either story body.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-113 (`story-ee073693`, feature) — palette read with census + the four guarded writes | REQ-133 §3/§5/§6, REQ-137 (model dependency), REQ-142 (atomic write path), REQ-119 (re-render retirement) | **aligned**; two divergences from a strict reading of REQ-133 §6 are recorded in the body rather than absorbed — both verified against code below and both judged purpose-preserving |
| STORY-114 (`story-4300366a`, feature) — the palette popup | REQ-133 §1/§3/§4/§5/§7, REQ-140 (pick-mode caller), REQ-119 → frame reload | **aligned**; the three implementation-time revisions REQ-133 §8 records (AC-12 withdrawn, slider shown in manage mode, rename moved into V1) are all carried in the story body as decisions, not omissions |
| CAP-98 body | REQ-133 | **aligned** — all five scope bullets (census, four edits, guards in the write path, choosing a colour, bounded free entry) map onto the two stories; all three out-of-scope bullets correctly hand off to the framework-substrate, site-materials and copy-editing capabilities |

### Coverage of REQ-133's fifteen criteria across the story tree

| REQ-133 AC | Expressed at | |
|---|---|---|
| 1 swatch + name + usage count | STORY-114 → AC-1242 | ✓ |
| 2 empty palette is a legitimate state | STORY-114 → AC-1243 | ✓ |
| 3 continuous shade slider, renderer's own arithmetic | STORY-114 → AC-1244 | ✓ |
| 4 pick resolves to a reference; cancel changes nothing | STORY-114 → AC-1246, AC-1247 | ✓ |
| 5 change a hex, every use at every shade follows | STORY-113 → AC-1230 | ✓ |
| 6 add; duplicate / malformed / alpha-carrying refused | STORY-113 → AC-1231 | ✓ |
| 7 delete guard, server-side, no force | STORY-113 → AC-1232, AC-1233 | ✓ |
| 8 rename rewrites every reference; shades survive | STORY-113 → AC-1234 | ✓ |
| 9 collision / malformed rename refused server-side | STORY-113 → AC-1235 | ✓ |
| 10 shown count and rewritten count are one walk | STORY-113 → AC-1236 | ✓ |
| 11 `1c palette` + `/api/palette` closed vocabulary | STORY-113 → AC-1229, AC-1237 | ✓ |
| 12 no re-render needed (REQ-119) | STORY-113 → AC-1238 | ✓ |
| 13 free hex entry only in this surface | STORY-114 → AC-1249 (see warning #1) | ✓ |
| 14 all operations on the AI surface, one grantable group | STORY-113 → AC-1239 | ✓ |
| 15 suite / build / typecheck | process gate, not story behaviour | n/a |

No reconciled intent in the ledger asks for behaviour this capability's story tree does
not express, and no story text describes behaviour a retired intent removed — in
particular, REQ-137 deleted named `steps`, and neither story body mentions steps
anywhere; both speak only of a continuous position within an entry's family.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | STORY-113 + STORY-114 | story-body-edit | Both story bodies claim REQ-133 AC-13's exclusivity for themselves in the same words. STORY-113 "In scope": *"Free colour entry (choosing a colour by hex) living on this surface and nowhere else"*; STORY-114: *"Typing a colour lives here and nowhere else."* REQ-133 §5a scopes "here" to the **palette editing surface** as against a segment field, which is STORY-114's subject. A reader cannot tell from the bodies which story owns the claim | Narrow STORY-113's bullet to what its surface actually does — a palette write takes an opaque hex as its value — and let STORY-114 keep the *"and nowhere else"* exclusivity claim, or cross-reference STORY-114 explicitly. **Low urgency: the overlap did not reach the AC layer.** Exactly one AC expresses AC-13 (AC-1249, under STORY-114); STORY-113 has no free-hex AC, so no duplicate evidence exists |
| 2 | info | consistency | STORY-113 | — | The body's *"Divergence to note — the census on a write"* is **accurate as written**. Verified: `router.ts:469-470` re-takes the census and merges it into every write response; `edit.ts` returns the operation's result plus the affected entry's own count only (`editPaletteSet` 1610-1616, `editPaletteAdd` 1649-1654, `editPaletteRm` 1701-1706, `editPaletteRename` 1787-1795). REQ-133 §6's *"Every write answers with the operation's result and the whole re-taken census"* carries its own rationale — *"so the popup redraws from what the store now holds"* — and the popup is the origin's client, so intent's stated purpose is met where it is observable. AC-1237 states the full-census answer at the origin; AC-1230/1231/1234 state the operation's result at the other callers. Recorded, not a fix item | none |
| 3 | info | consistency | STORY-113 | — | The body's *"Divergence to note — what a refusal tells the assistant"* is likewise accurate and is **not** drift from intent. The store's `CommandError` names the count (`edit.ts:1690-1695`); the toolbox renders a refusal from the per-code text in `l1-surface.json`, so the model receives `CONFLICT` plus the declared sentence. REQ-133 §5c asks only that the AI *"can now see the count, which it could not before"* — satisfied via `get_palette`, and `l1-surface.json:623` and `:946` both route the model there explicitly. Closing the wording gap is upstream of this repository | none |
| 4 | info | consistency | STORY-113 | — | The *"Reconciliation Decisions"* entry (renaming an entry to its own name is a no-op, auto-defaulted 2026-08-31, formalised as AC-1458) is a correct application of the BUG-1306 default-to-shipped-code policy. REQ-133 is silent on the case; the code's `to !== from` collision exclusion (`edit.ts:1744`) matches, and the story traces the reading to REQ-133 §5d's own stated rationale for the collision refusal (a rename onto an existing name *merges two entries* — self-rename merges nothing). Settled; not re-escalated | none |
| 5 | info | coverage | STORY-114 | — | STORY-114's *"the page displayed beside the popup is refreshed after a write"* is landed, not aspirational: `app.js:140` wires `onChanged: () => panel.frame.contentWindow?.location.reload()`. BUG-43 (ready_to_reconcile) cites this very line as the idiom the **chat pane** is missing, which corroborates rather than contradicts the story. BUG-43 adds no behaviour to CAP-98 | none |

## Notes for the Editor

- **Nothing here requires a fix cycle.** Zero violations, zero needs_review. The single
  warning is a wording overlap between two story bodies that never reached the AC layer,
  and can be taken opportunistically the next time either story is edited.

- **Both stories are unusually well-flagged.** STORY-113 carries two explicit
  "Divergence to note" sections and STORY-114 a "Divergence from intent — none of
  substance" section plus an "Evidence gap worth flagging". Every one of these was
  checked against the implementation for this report and every one is accurate. Treat
  these sections as the drift-prevention artifact working as designed — they are the
  reason this level passes rather than something to repair.

- **One thing a future check should re-verify rather than trust.** STORY-113's
  census-on-write divergence (finding #2) rests on a purposive reading of REQ-133 §6. If
  a later intent ever restates the full-census answer as a property of *all three*
  callers rather than of the popup's transport, this stops being an `info` and becomes a
  `code-issue` against `edit.ts`'s four write functions. The narrowing is currently
  correct because REQ-133's own rationale clause names the popup.

- **STORY-114's evidence gap is a `uat`-level concern, not a story-level one.** The body
  states that the free-coded evidence drives the popup with its own callback and does not
  assert the page refresh end-to-end (the wiring lives at the workspace, `app.js:140`,
  not in the popup). AC-1249 states the behaviour. A `uat`-level pass on this capability
  should confirm a test reaches the workspace rather than the popup alone.

- **A stale illustrative fact, deliberately not raised as a finding.** STORY-114 says
  *"two of the stored sites have no palette at all because their colours are still
  literals"* — a measurement REQ-133 §3 took on 2026-08-12 (`1stcontact` and
  `harbor-cafe` at 0 entries). It is illustrative colour for why an empty palette is a
  legitimate state, not a behavioural claim, and AC-1243 does not depend on it. If a
  retrofit later gives those sites palettes, the sentence goes stale without the
  criterion doing so.

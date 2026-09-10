---
uid: report-11c8bf8e
id: REPORT-3595
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=ac)'
created_by: xgd
created_at: '2026-09-10T00:02:57.498113+00:00'
updated_at: '2026-09-10T00:02:57.498113+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Seven stories, **81 ACs** (67 active, 13 pending, 1 deprecated) — up from 68 at the
last ac-level check (`report-6c3ed8d8`, 2026-09-09T23:44, FAIL 12/2/0). All twelve
violations and both warnings from that report are **resolved**, verified here
element-by-element against the ticket store *and* against production code at HEAD
rather than accepted from the fix reports' own account (`report-a5ba5dc9`,
`report-6a30e8be`).

The three properties are clean:

- **Coverage** — every In-scope item of all seven story bodies is now pinned by at
  least one AC. The nine predicted `ac-add` gaps (STORY-75 ×5, STORY-76 ×2,
  STORY-77 ×3, plus warning 14) are closed by AC-1605 – AC-1617.
- **Consistency** — AC-638's REQ-114 contradiction, on its fifth consecutive
  filing, is repaired; STORY-76's story-level overshoot that orphaned it is
  repaired in the same pass, so the pair is settled together as the prior report's
  note 2 required.
- **Exclusivity** — no duplicate AC within any story. Four near-pairs were checked
  explicitly and are genuinely distinct (listed under Notes).

Every new AC was spot-verified against the code it describes, at the call graph
rather than at nearby comments — the mechanical trap the prior report's note 3
identified as the likely reason findings 6 and 7 survived five cycles.

## Cumulative Intent Considered

Stories record intent as *bundle* UIDs. All eight bundles touching this capability
carry status `free_and_reconciled`, so **every** intent below counts. Re-read this
cycle from the `bundle`, `request` and `bug` stores.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-11 | free_and_reconciled | 2026-06-30 | Structured failure contract (`ENVIRONMENT` code, `--json` envelope) STORY-79 g6 travels | YES |
| REQ-44 | free_and_reconciled | 2026-07-03 | Fail loud on out-of-sync `node_modules`; per-command dependency preflight | YES |
| REQ-58 | free_and_reconciled | 2026-07-13 | Viewport ladder persistence + `values-diff --multi-viewport`; `--json` hygiene; boolean flag parsing | YES |
| REQ-59 | free_and_reconciled | 2026-07-13 | Text-fill gradient stop positions | YES |
| REQ-61 | free_and_reconciled | 2026-07-16 | `responsive-diff` N-way cross-size analysis + classifier | YES |
| REQ-62 | free_and_reconciled | 2026-07-16 | Panel/card surface gradient: capture + diff (+ the now-superseded render leg) | YES |
| REQ-64 | free_and_reconciled | 2026-07-17 | Noise audit; `--collapse` per-defect reporting; derived-axis exclusion | YES |
| REQ-72 | free_and_reconciled | 2026-07-18 | In-browser hexification of modern-colour-space gradient stops | YES |
| REQ-73 | free_and_reconciled | 2026-07-18 | Adjacent-row gap axis; drop the section band-padding proxy | YES |
| REQ-76 | free_and_reconciled | 2026-07-18 | `--clusters` ranked cause view with dispositions | YES |
| BUG-16 | free_and_reconciled | 2026-07-23 | Offline re-extract must reach the bundle's own mirrored faces | YES |
| BUG-22 | free_and_reconciled | 2026-07-24 | Split-control surface attribution (phantom radius delta) | YES |
| BUG-24 | free_and_reconciled | 2026-07-24 | Band overlay as a captured axis, alpha readable via the colour probe | YES |
| BUG-25 | free_and_reconciled | 2026-07-25 | Per-text-node run geometry for multi-run elements | YES |
| BUG-27 | free_and_reconciled | 2026-07-25 | Background images and lazy media captured (backdrop indexing) | YES |
| REQ-84 | free_and_reconciled | 2026-07-20 | Deleted the layout modules that hosted the gradient content field | YES (retired the resolver leg) |
| REQ-89 | free_and_reconciled | 2026-07-22 | Quiet bootstrap; *conditional* container construction | YES (superseded by REQ-150) |
| REQ-96 | free_and_reconciled | 2026-07-26 | Behavior modules layout-agnostic; `config` never aesthetic | YES (retired the resolver leg) |
| REQ-114 | free_and_reconciled | 2026-07-31 | Retired the module-level palette-role alias — colour is L1's | YES (retired) |
| REQ-150 | free_and_reconciled | 2026-08-18 | Plain Vite SSR launcher; Astro out of the repository; unconditional no-transform | YES (supersedes REQ-89) |
| REQ-154 | bundled (in `bundle-8eef3846`, free_and_reconciled) | 2026-08-20 | Cloud Browser Rendering driver behind the existing seam | YES |
| BUG-39 | bundled (in `bundle-8eef3846`, free_and_reconciled) | 2026-08-24 | Companion to REQ-154 in the same reconciled bundle | YES |

**No intent in this capability's tree carries `abandoned`, `deprecated` or
`wont_fix`.** Step 2.5's stale-vehicle case therefore does not arise anywhere in
this report — checked, not assumed, for every REQ/BUG named in a story body.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 `story-d5de22a5` (upgrade, 20 ACs) | REQ-58, BUG-16, BUG-22, BUG-24, BUG-25, BUG-27, REQ-73, REQ-52 | **aligned** — all twelve Description items and every In-scope clause now pinned. The five gaps from `report-6c3ed8d8` closed by AC-1605 (BUG-25 run geometry), AC-1606 (BUG-22 attribution), AC-1607 (BUG-16 re-extract), AC-1608 (BUG-24 overlay), AC-1609 + AC-1610 (REQ-73 gap axis + band-padding supersession) |
| STORY-76 `story-82eb6908` (feature, 7 ACs) | REQ-59, REQ-62, REQ-72; retired by REQ-84 / REQ-96 (resolver leg), REQ-114 (palette-role alias) | **aligned** — the two five-cycle findings are resolved. AC-638 narrowed to `#hex`-only stops with the palette-role alias moved to the rejected side; the story's In-scope restored a clause for the retained **validator** leg and narrowed Out-of-scope to the **resolver** path, so AC-638 is no longer an orphan. AC-1611 (four-clause ancestor selection) and AC-1612 (REQ-72 hexification) close the two coverage gaps. AC-637 correctly deprecated (resolver leg only) |
| STORY-77 `story-16f2793c` (feature, 13 ACs) | REQ-58, REQ-64, REQ-76 | **aligned** — the whole reporting stack is now pinned: AC-1613 (`--multi-viewport`), AC-1614 (`--collapse`), AC-1615 + AC-1616 (`--clusters` roll-up and its two honesty rules), AC-1617 (deterministic per-width cell selection, carried unrepaired across four prior reports). AC-647 extended so In-scope item 5's own claim — the per-rung **value manifest**, not only the screenshots — is asserted |
| STORY-78 `story-2c7069fe` (feature, 9 ACs) | REQ-61 | **aligned** — every In-scope bullet maps to an AC (table/defaults 648, `--sizes` 649, changed-vs-steady + presence flips 650, occurrence alignment 651, `--classify` 652, fail-louds 653/654, `--json`+`--ref` 655, `--out` 721). Re-checked in full this cycle |
| STORY-79 `story-e15a19ef` (upgrade, 15 ACs) | REQ-58, REQ-44, REQ-11, REQ-150 (supersedes REQ-89), BUNDLE-7 store routing | **aligned** — all six guarantees covered with no internal contradiction: g1→656, g2→657/658/659/738, g3→720, g4→1415/1416/1417, g5→739, g6→1013/1014/1015/1016/1017. The bundler-declared-dependency clause of g4 is inside AC-1415; the render-outputs-unchanged clause of g5 is inside AC-739 |
| STORY-124 `story-080c6036` (feature, 10 ACs) | REQ-154, BUG-39 (`bundle-8eef3846`) | **aligned** — explicit bullet→AC mapping holds one-for-one (presets 1459/1460, absent-capability 1461, lease+context 1462, release-on-every-exit 1463, one-navigation 1464, honest limits 1465, shared preconditions 1466/1467, no local stack 1468). Technical Context now reads "Filed under **CAP-63**", retiring the capability History's recorded numeral defect |
| STORY-125 `story-7fa314f5` (feature, 7 ACs) | REQ-154, BUG-39 (`bundle-8eef3846`) | **aligned** — the story body cites its own AC per In-scope bullet and each citation resolves (1469–1475). The three reconciliation decisions (documented-as-intent, AC-1474 restated as observable consequence, AC4 discharged as documentation not an AC) are sound |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-637 `acceptance_criterion-…` (STORY-76) — deprecation note | ac-edit | Residue of the overshoot `report-6c3ed8d8` finding 9 repaired. AC-637's deprecation note still says "STORY-76's live scope is **capture + diff**", the unqualified phrase whose presence in the story body was itself the violation, because it orphans AC-638. The story body now reads "capture + diff, **plus that retained validation leg**". The note's substance is correct — the *resolver* leg is superseded, the live authored axis is CAP-70's L1 leaf — and AC-637 is deprecated, so it asserts no live behaviour and nothing downstream reads it as coverage. Non-gating: recorded so the phrase is not later mistaken for a second statement of scope | Extend the note's scope sentence to match the repaired body: "STORY-76's live scope is capture + diff plus the retained `gradient` content-field **validation** leg (AC-638); this deprecation retires the **resolver** leg only" — the last clause is already in the note's own final paragraph and in the story's Technical Context |
| 2 | info | — | AC-1605 – AC-1617 (13 new ACs) | — | All carry status `pending` and `uat_coverage: missing`. Checked whether `pending` excludes an AC from the matrix: it does not. It is the creation default — 17 of 648 ACs repo-wide sit there, including AC-719 and AC-1458 in other capabilities, both of which carry `uat_coverage: pass`. So the uat level does process pending ACs, and `missing` correctly presents these thirteen as open UAT coverage rather than as silently passing. No action | none |
| 3 | info | — | `bundle-8eef3846` members | — | REQ-154 and BUG-39 read `bundled` while their bundle reads `free_and_reconciled`. Per the status table the bundle's reconciled state is what governs; both count as live intent. Recorded so the member status is not re-derived as "imminent, not yet enforced" next cycle | none |
| 4 | info | — | `packages/framework/src/modules/validate.ts:131`, `:167-168` | — | Carried from `report-6c3ed8d8` note 3 and both fix reports: the comments still read "a bare colour string (hex/role)" and "Absolute value (#hex) or a palette-role alias". The **behaviour** is correct and was re-verified here at the call graph — `validateGradient` (`:130-134`) routes every stop through `validateColor` (`:101-107`), whose own doc comment correctly cites REQ-114. Comment-only staleness; not a `code-issue`, no AC depends on it | Comment cleanup outside this check |

## Verification Performed This Cycle

Every claim asserted by a new or edited AC was checked against HEAD, not carried
from the fix reports:

| AC | Code checked | Result |
|---|---|---|
| AC-1605 | `capture/extract.ts:1123-1125` — `ownRun = runCounts.get(el) === 1`; `glyphs = ownRun ? renderedTextBox(el) : textNodeBox(n)`; `textNodeBox` at `:676` | matches |
| AC-1606 | `capture/values-diff.ts:144` ("Absent on pre-BUG-22 manifests, which keeps the resolution inert"), `:2103` (SPLIT CONTROL) | matches, incl. the inert-on-old-bundle clause |
| AC-1607 | `capture/reextract.ts:50-55` `rewriteMirroredRefs` — every absolute URL whose basename the bundle mirrored → `/<basename>`; the BUG-16 comment at `:67-76` names the exact failure | matches, incl. "a bundle that mirrors no matching asset is served unchanged" |
| AC-1608 | `capture/extract.ts:1047-1071` `overlayOf` — `rgbaOf` (the REQ-52 canvas probe), `if (!(a > 0 && a < 1)) continue` (opaque/transparent are not overlays), `{color, opacity}` shape; `:1425` | matches all three clauses |
| AC-1609 / AC-1610 | `capture/values-diff.ts:1955` `tol(opts.gapTolerancePx, 6, 16)`; `:2493` the adjacent-GAP axis; `:2575` "section band vertical padding is NOT compared" | 6/16 tolerance and the supersession both confirmed |
| AC-1611 | `capture/extract.ts:840-851` `surfaceGradientOf` — tightest-first walk, `clip !== 'text'` skip, `c[3] >= 0.999 → return null`, trailing `return null` | all four clauses present |
| AC-1612 | `capture/extract.ts:334` `hexifyGradient`, applied at `:846` (surface) and `:1132` (text-fill) | both gradient kinds confirmed |
| AC-638 | `modules/validate.ts:101-107` + `:130-134` — every stop through `validateColor`, which errors on anything failing `isColorLiteral` | a role-valued stop is rejected; the AC's new form is right and its old form was wrong |
| AC-1613 | `cli/fidelity.ts:198-210` `cmdValuesDiffMultiViewport` — its **own** no-ladder refusal, distinct from the `--size` path's; `values-diff.ts:2726-2735` worst-first with missing cells surfaced | matches; and confirms AC-1613 does not duplicate AC-641 |
| AC-1614 | `cli/fidelity.ts:318-336` — dedup keyed `` `${d.text} ${d.property}` ``, widths set, worst tier; `index.ts` cells-is-default arm | matches both directions |
| AC-1615 | `cli/fidelity.ts:457-470` `CAUSE_MAP` (arrangement+containment → layout structure; shape+border+outline → control styling; fontLoad → `accept`), `:502` sort `b.count - a.count \|\| TIER_RANK`, `:518-521` disposition summary, examples capped at 3 | matches, incl. count-first-then-worst-tier ranking |
| AC-1616 | `cli/fidelity.ts:388-389` derived split, `:398`/`:414-424` derived acknowledged in the report rather than silently dropped, `:489` `if (d.derived) continue`, `:490` `?? { cause: d.property, disposition: 'review' }` | both honesty rules confirmed, incl. the drill-down clause |
| AC-1617 | `capture/values-diff.ts:2713-2724` `selectProjectionAtWidth` — chromium-at-rest → any-at-rest → `atWidth[0]`, `undefined` when the width is absent | the ordered preference matches the AC exactly |
| AC-647 | `capture/capture.ts` — `runMultiStateCapture` over `RESPONSIVE_VIEWPORTS` → `writeMultiState`, plus the per-width screenshot sibling | the per-rung value manifest claim is real |

Note: the prior report cited this file as `tools/generate/src/cli/capture/fidelity.ts`;
it is `tools/generate/src/cli/fidelity.ts`. The path was wrong, the content was not.
No AC cites a path, so nothing in the matrix inherited the error.

## Notes for the Editor

**1. Nothing to fix. This level passes.** The single warning is cosmetic prose on a
**deprecated** AC and gates nothing; repair it opportunistically or leave it.

**2. The five-cycle findings are genuinely closed, and closed the right way.**
AC-638 had been re-filed identically by `report-728bd245`, `report-cb7ea283`,
`report-15f4892f`, `report-aec8af1b` and `report-6c3ed8d8`. The fix verified it at
the call graph rather than at the two stale comments a few lines away — the exact
trap the prior report predicted — and applied finding 9 in the same pass, so AC-638
is not an orphan of its own story. That coupling is what makes it stay fixed.

**3. Exclusivity — four near-pairs checked explicitly, all distinct.**
AC-1613 vs AC-641 (`--multi-viewport` and `--size` have separate refusal sites in
separate functions); AC-1608 vs AC-816 (overlay as a captured axis vs the backdrop
*exclusion* that keys on it — and each AC names the other); AC-1606 vs AC-633
(attribution vs pairing, distinguished in both bodies); AC-1617 vs AC-639 (which
cell at a width vs which width). AC-632/AC-713 and AC-1466/AC-1467, checked in the
prior cycle, were re-confirmed distinct.

**4. The capability History's two recorded items are both now moot.** STORY-124's
Technical Context reads "Filed under CAP-63"; the value-axis and capture-ownership
rules recorded by overlap clusters 1–4 hold against the current AC surface, with
no AC on any story here reaching into CAP-70's L1 gradient axis or CAP-102's
deployment configuration.

**5. Downstream expectation.** Thirteen ACs at `uat_coverage: missing` land on the
uat level as genuine open coverage. That is the correct next cost, not drift: the
capability's `uat_coverage` field currently reads `fail`, and it should be expected
to keep reading `fail` until those thirteen have substantive UATs. An ac-level PASS
here is not a claim about test evidence.

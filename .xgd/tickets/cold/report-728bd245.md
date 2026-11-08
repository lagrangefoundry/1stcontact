---
uid: report-728bd245
id: REPORT-1327
type: report
title: 'Capability-Intent Alignment: 1c_capture_diff_fidelity (level=ac)'
created_by: xgd
created_at: '2026-08-05T22:56:51.795491+00:00'
updated_at: '2026-08-05T22:56:51.795491+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: ac
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c_capture_diff_fidelity
# Level: ac

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

Scope: the 39 distinct ACs hanging off the five stories of `capability-aa030c83`
(CAP-63) after the 2026-08-05 structural rebalance. All five stories are
`feature`/`upgrade`, so all are in the Capability Matrix and all are expected to
carry ACs; none is task-like.

Per the level cascade, **story bodies are the working reference** here; intent was
consulted only where a story body was itself ambiguous (STORY-76, findings 1–2).

**Both violations land on STORY-76** (`story-82eb6908`, gradients) and both concern
the *same* item — item 2, "Panel/card surface gradients". Its three sub-bullets are
**Captured / Diffed / Authored**: the *Diffed* leg is covered (AC-636), the
*Authored* leg is covered but **mis-titled** (AC-637, finding 1), and the
*Captured* leg is **covered by no AC at all** (finding 2). The other four stories
are clean at this level.

## Cumulative Intent Considered

Condensed from the ledger established at story level (`report-88eb3839` /
REPORT-1326, same cycle), narrowed to the intents that bear on AC-level findings.
Nothing at this level required re-deriving the full chronology.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` = REQ-58 + REQ-59 `request-bc936f38` + REQ-62 `request-90edd177` + REQ-61 | free_and_reconciled | 2026-07-17, main `7a42e182` | `intent_uid` of all five stories. **REQ-59** gradient stop positions (→ AC-634/635). **REQ-62** panel/surface gradient **capture + render + diff** (→ AC-636/637/638 + finding 2). REQ-61 `--size` + `responsive-diff`. REQ-58 T1/T5/T7/T14 + T2/A ladder | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79 `request-87b26bca`, REQ-82/83/84) | free_and_reconciled | 2026-07-22, main `edeb1c2c` | REQ-63 typography/effect axes (→ AC-711/712/713/714). **REQ-79/84 framework pivot retired the semantic layout modules** — the ground for finding 1 | YES |
| BUNDLE-8 `bundle-cceaba25` (BUG-7, REQ-89 `request-bde8d037`, BUG-10, +) | free_and_reconciled | 2026-07-29, main `b1bd5b6b` | REQ-89 quiet bootstrap + conditional Astro container (→ AC-738/739). BUG-10 painted-marker precondition (→ AC-711) | YES |
| BUNDLE-10 `bundle-4ff83a8b`; pre-matrix cohort (REQ-35/47/48/53/64/72/73/74/76) | free_and_reconciled | 2026-07-29 / 2026-07-03…18 | Reach no story, therefore no AC. **Escalated at story level** (REPORT-1326 findings 5–6); not re-filed here | YES — see Notes |
| REQ-80 `request-7756b2e8`, REQ-65, REQ-69 | abandoned | 2026-07-18/19 | Retired; correctly absent from every AC | NO |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27 `bug-2936cebf`) | reconciling | 2026-08-05 | Imminent capture-side ask; no AC expected yet | imminent |

No intent in the ledger retires a behavior any active AC describes — with the
single exception of finding 1, where REQ-79/REQ-84 retired the *module* an AC
title names.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-75** `story-d5de22a5` — 10 ACs | REQ-58 T1/T5/T7/T14, REQ-63, REQ-79, BUG-10 | **aligned.** All seven Description items are covered, 1:1 or 1:2, with no orphan AC: item 1→AC-629 (delta surfaces) + AC-630 (suppression + `--tolerant`); item 2→AC-631; item 3→AC-632 (width+colour) + AC-713 (line style + text-run thickest-painted-side); item 4→AC-633; item 5→AC-711; item 6→AC-712 (effects) + AC-714 (`object-position`); item 7→AC-715. AC-711 carries the BUG-10 painted-marker precondition in full, including the `list-style-type: none` and non-`disc` legs |
| **STORY-76** `story-82eb6908` — 5 ACs | REQ-59, REQ-62 | **NOT aligned — 2 violations.** Item 1 (text-fill stop positions) is cleanly covered by AC-634 (drift surfaces) + AC-635 (absent offsets never fabricate). Item 2's *Diffed* leg → AC-636 ✓; *Authored* leg → AC-637 body ✓ but **title contradicts story, own body, and the live module set** (finding 1); *Captured* leg → **no AC** (finding 2). AC-638 covers the gradient content-field validation |
| **STORY-77** `story-16f2793c` — 8 ACs | REQ-61 §"Size parameter…", REQ-58 (ladder dependency) | **aligned on the Description surface**, 1 warning on Technical Context. item 1→AC-639; item 2→AC-643; item 3's three fail-loud legs→AC-641 (no ladder) + AC-642 (width never reached, names available widths) + AC-644 (no same-width screenshot); item 4→AC-647. AC-640 pins the no-`--size` legacy path (story: "used unchanged"); AC-645 pins vocabulary rejection. Deterministic per-width cell choice unpinned (finding 3). AC numbering skips AC-646 — no such ticket exists; a numbering gap, not a dangling element |
| **STORY-78** `story-2c7069fe` — 9 ACs | REQ-61 §"New command" + §"Phase 2" | **aligned.** Every In-scope bullet has an AC: N-way table→AC-648 (which also carries the join key — verbatim text, or role for text-free nodes); `--sizes`→AC-649; changed/steady + presence flips→AC-650; occurrence alignment→AC-651; `--classify`→AC-652; `--json`/`--ref` required→AC-655; `--out`→AC-721; terminal-fails→AC-653 (stale ref) + AC-654 (un-captured width). AC-650 also pins the sub-pixel-jitter exclusion from Technical Context |
| **STORY-79** `story-e15a19ef` — 7 ACs | REQ-58 T2/A follow-ups, REQ-79 (`09fa7cf5`), REQ-89 (`5dc46d0f`) | **aligned.** g1→AC-656 (both flag orders); g2→AC-657 (one parseable document) + AC-658 (diagnostics on stderr) + AC-659 (stdout restored on the throwing path) + AC-738 (suppressed at source, on either stream, incl. non-rendering commands); g3→AC-720; g4→AC-739. AC-720 and AC-739 both state the negative case, which is where these guarantees actually bite |
| STORY-77 / STORY-78 duplicate index rows | — | Not AC duplication. `ticket list` returned 16 and 18 rows for 8 and 9 distinct AC UIDs — the stale branch index diagnosed in `report-bdaf6840` and REPORT-1326 note 5. Deduplicated by UID before assessment; **no exclusivity finding raised on this basis** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-637 `acceptance_criterion-377af866` (STORY-76 `story-82eb6908`) | ac-edit | AC-637 is titled **"A text-block authored with a gradient panel renders a padded, rounded panel with that gradient surface"** — a claim contradicted three ways. (a) **Its story forbids it**: STORY-76's Out of scope reads "homing the resolved gradient surface fill as an authored render on a specific module (the resolver is exported for any module's surface, but *no module currently owns a padded/rounded/inset gradient-panel render*)". The title asserts precisely the render the story disclaims. (b) **Its own body doesn't say it**: the Criterion describes only that an authored `gradient` value "resolves to a panel/card surface `background-image: linear-gradient(...)`", and the Verification calls the shared resolver directly — "Call the shared surface-gradient resolver (`resolveSurfaceGradient`)… assert it returns a `background-image: linear-gradient(…)` declaration… and returns an empty declaration (no fill) when given a single stop." No padding, no rounding, no module render anywhere in the body. The body is grounded and correct: `resolveSurfaceGradient` lives at `packages/framework/src/modules/text-style.ts:257` and is exercised at `tests/req62-gradient-panel.test.ts:76-82` (two stops incl. a palette role → declaration; one stop → `''`). (c) **`text-block` no longer exists**: the REQ-79/REQ-84 framework pivot (BUNDLE-7, free_and_reconciled) removed the semantic layout modules — `packages/framework/src/modules/dials.ts:10` states "text-block panel, services-grid card chrome, …) are gone — layout is owned by" L1; `packages/framework/src/modules/` now holds only `carousel` and `contact-form` as behavior modules, and no `*text-block*` file exists under `packages/` or `tools/`. So the matrix currently advertises a gradient-panel render on a deleted module. Corroboration that the title is the outlier: `tests/reconcile-gradient-first-class.test.ts` carries `test_UAT_AC634/AC635/AC636/AC638` — every AC of STORY-76 **except** AC-637 | Retitle to match the body and the story, e.g. **"An authored gradient value resolves via the shared resolver to a gradient surface fill; under-specified stops resolve to no fill"**. Criterion and Verification need no change. Do not deprecate — the resolver behavior is live, reconciled REQ-62 intent |
| 2 | violation | coverage | STORY-76 `story-82eb6908` (item 2, "Captured" leg) | ac-add | STORY-76 declares In scope "**capture** of stop positions and surface gradients", and item 2's first sub-bullet states a specific, non-obvious selection rule: "the nearest painting ancestor's surface gradient is recorded, **skipping a text-fill gradient** and **stopping at the first opaque solid** (a gradient hidden behind an opaque fill never shows, so it is not the surface)". **No AC covers it.** AC-636 covers only the *diff* axis — its Verification diffs manifests whose `surfaceGradient` is supplied as fixture input, so it presumes the capture and never exercises which ancestor was chosen; AC-634/635 are text-fill stop positions; AC-637/638 are authoring and field validation. The rule is live code: `surfaceGradientOf` at `tools/generate/src/cli/capture/extract.ts:490-502` walks up to 12 ancestors, returns `hexifyGradient(img)` only when `clip !== 'text'` (:496), and breaks to `null` at `c[3] >= 0.999` (:498). **Failure mode:** delete the `background-clip:text` guard and a wordmark's own glyph paint is recorded as its panel surface — every AC in this capability still passes, while the capture is wrong on every gradient wordmark. Evidence already exists and is unclaimed by any AC: `test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid` (`tests/req62-gradient-panel.test.ts:157` — asserts the panel gradient is captured **and** `surfaceFill` separately records the composited solid `#e8dfd3` behind it) and `test_UAT_FC_REQ-62_text_fill_gradient_not_a_surface_gradient` (`:172` — the wordmark carries `gradient` but `surfaceGradient` is null) | Author one AC under STORY-76, e.g. "**The captured surface gradient is the nearest painting ancestor's, skipping a text-fill gradient and stopping at the first opaque fill**": a run inside a gradient panel records that gradient while `surfaceFill` independently records the composited solid; a text-fill (`background-clip: text`) gradient is captured as the run's own `gradient` and never as `surfaceGradient`; a gradient behind an opaque fill records no surface gradient. Reference the two REQ-62 Chromium UATs above as existing evidence; only the opaque-stop leg needs new coverage |
| 3 | warning | coverage | STORY-77 `story-16f2793c` (+ STORY-78 `story-2c7069fe`) | ac-add | STORY-77's Technical Context states "a single deterministic reference cell is chosen per width (**prefer the primary engine at rest**)", but no AC pins it. AC-639 requires only that "the reference values are those captured at the selected size's width" — satisfied by *any* cell at that width. The rule is real and shared: `selectProjectionAtWidth` (`tools/generate/src/cli/capture/values-diff.ts:2431-2442`) applies a three-tier fallback — chromium-at-rest → any-engine-at-rest → first-at-width — and its own doc comment says "The diff and the responsive table both need one deterministic cell per width". STORY-78 inherits the same unpinned rule (AC-648 asks only for "the node's captured value under each size column"). A ladder carrying hover/WebKit cells at a width could silently supply a hover-state or WebKit reference to a `--size` diff with every AC still green. Filed as a **warning**, not a violation: the rule sits in Technical Context rather than either story's In-scope Description list | Add one AC (most naturally under STORY-77, cited from STORY-78) pinning deterministic per-width cell selection: given a ladder holding several cells at one width, the values compared are the primary-engine resting cell; with no resting primary cell, a resting cell of another engine; the choice is stable across runs |
| 4 | info | consistency | AC-711 `acceptance_criterion-7c503447` | — | Worth recording as a positive: AC-711 is the only AC in the capability that carries a full sub-clause for a *precondition* rather than a value comparison — the BUG-10 painted-marker rule, with all three legs (non-list run records no marker; genuine list item keeps its own type incl. `decimal`; `list-style-type: none` records none) and the CSS-initial-value rationale. This is the shape finding 2 asks for on the gradient-capture side | none |
| 5 | info | exclusivity | AC-645 vs AC-649; AC-641/642 vs AC-653/654 | — | Two near-collisions surveyed and **cleared**. AC-645 (STORY-77: bad `--size` on the two diff commands) vs AC-649 (STORY-78: bad token in `--sizes` on `responsive-diff`) — different flags on different commands. AC-641/642 (values-diff `--size` fail-loud) vs AC-653/654 (`responsive-diff` fail-loud) — same *shape*, different commands, and the two stories carry explicit mutual out-of-scope lines. No intra-story duplication in any of the five sets | none |
| 6 | info | — | all 39 ACs | — | Every AC in the capability carries `intent_uid: None` and `updated_by: None`; AC provenance is recoverable only through the parent story's chain. Uniform across all five stories, so this reads as the matrix's structural convention (ACs inherit intent from their story) rather than drift in this tree. Recorded because it is the AC-level analogue of REPORT-1326 finding 4 — with STORY-75's `updated_by` already overwritten, its ten ACs have no traceable intent path at all | none here |

## Notes for the Editor

1. **Both violations are one repair site.** STORY-76 item 2 has three legs and the
   matrix mishandles two of them. Fix them together: retitle AC-637 (mechanical, body
   already correct) and author the capture AC. Neither requires a story-body edit —
   STORY-76's Description already states both behaviors correctly. This is the one
   place in the capability where the matrix under-describes shipped, UAT-covered code.

2. **Finding 1 is a title-only defect — do not rewrite AC-637's body.** The body,
   the resolver, and the resolver's test all agree with the story. Only the title
   drifted, and it drifted toward a module the framework pivot deleted. Rewriting
   the body toward the title would invent a padded/rounded gradient-panel render
   that does not exist in `packages/framework/src/modules/` and that STORY-76
   explicitly disclaims.

3. **Cascade risk from the story level — read before editing.** `report-88eb3839`
   (REPORT-1326, same cycle) FAILED with 1 violation and 2 needs_review, and the
   story bodies are **still unrepaired** (I re-read all five; STORY-77 has no
   ladder-diff item and the four stale CAP-63/64/65/66 cross-references persist).
   Its violation directs STORY-77 to gain the `values-diff --multi-viewport`
   cell-for-cell ladder-diff item **"then author ACs"** — so a further AC-level pass
   over STORY-77 is owed once that story-body edit lands. I did **not** count it as
   an AC-level coverage gap: at this level the story body is the working reference,
   the behavior is not in it, and it is already tracked upstream. Sequence the
   repairs story-body-first to avoid a wasted AC cycle.

4. **Upstream needs_review deliberately not re-filed.** REPORT-1326 findings 5
   (BUNDLE-10 reconciled but its code absent from `main`) and 6 (nine pre-matrix
   intents unexpressed) are story-tree coverage questions with no AC-level surface —
   there is no story to hang an AC on. Re-filing them here would double-count against
   the gate. `needs_review_count` is therefore 0 at this level, which should **not**
   be read as those escalations being resolved: they remain open and they, not this
   report, are the capability's blocking questions.

5. **Worktree caveat, unchanged from REPORT-1326 note 5.** Human-ID lookups fail on
   this branch (`xgd ticket get STORY-75` / `--id AC-646` → `TICKET_ID_NOT_FOUND`);
   use UIDs. `ticket list` returns stale duplicate rows — STORY-77 and STORY-78
   reported 16 and 18 ACs for 8 and 9 real ones. Deduplicate by UID before counting,
   or the exclusivity check produces nine phantom violations.

6. **AC-646 does not exist** (`AC-645` → `AC-647` under STORY-77). No ticket, archived
   or active, resolves it, and STORY-77's Description surface is fully covered without
   it. Recorded so a later pass does not re-investigate a numbering gap as a deletion.

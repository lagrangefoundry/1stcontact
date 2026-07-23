---
uid: report-e87798af
id: REPORT-850
type: report
title: 'Capability-Intent Alignment: 1c Values-Diff Fidelity (level=ac)'
created_by: xgd
created_at: '2026-07-23T11:34:37.225324+00:00'
updated_at: '2026-07-23T11:34:37.225324+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Values-Diff Fidelity
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

The capability has a single story (STORY-75, `story_kind=upgrade`), touched by two
reconciled intent bundles. Chronological ledger:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6): REQ-58+59+62+61 | free_and_reconciled | 2026-07-17 (merged 7a42e18) | Originating intent for STORY-75. Landed the first fidelity closures: rendered-text extent (ratio + `--tolerant`), composited surface fill, uniform box-border (width+colour), duplicate-text pairing by position. Created AC-629, AC-630, AC-631, AC-632, AC-633. | YES |
| BUNDLE-7 (bundle-31e474b9): REQ-63+79+82+83+84+more | free_and_reconciled | 2026-07-22 | `updated_by` for STORY-75 — the coverage audit (REQ-63) closing remaining blind spots. Extended the story with typography treatment axes, element effect axes, box-border line-style + text-run capture, image object-position, and the fontLoad reverse-direction correction. Created AC-711, AC-712, AC-713, AC-714, AC-715. | YES |

Both bundles are `free_and_reconciled` → both fully count toward cumulative intent.
No retired or abandoned intent touches this capability, so no AC should describe
removed behaviour (and none does).

At `ac` level the STORY-75 body is the working reference; it is internally
consistent and self-contained (7 enumerated fidelity closures + explicit
in-scope / out-of-scope / deferred-residual sections), so no escalation to raw
intent history was required.

## Alignment Ledger

The story body enumerates 7 fidelity closures (C1–C7). Each AC is mapped to the
closure it expresses:

| Element | Closure / intent | Outcome |
|---|---|---|
| AC-629 — extent delta surfaces when computed font values match | C1 (rendered-text extent), BUNDLE-6 | aligned |
| AC-630 — extent suppresses non-differences & honours `--tolerant` | C1 (tolerance/escape-hatch facet), BUNDLE-6 | aligned |
| AC-631 — surface fill compared as effective alpha-composited colour | C2 (composited surface fill), BUNDLE-6 | aligned |
| AC-632 — uniform box-border (width+colour) delta; matching/absent → none | C3 (box-border core), BUNDLE-6 | aligned |
| AC-633 — duplicate text paired by nearest rendered position | C4 (duplicate-text pairing), BUNDLE-6 | aligned |
| AC-711 — typography treatments (font-style/decoration/transform/small-caps) + list marker | C5 (typography treatment axes), BUNDLE-7 | aligned |
| AC-712 — element effects (backdrop-filter/outline presence, blend, pseudo-content, opacity) | C6 (element effect axes), BUNDLE-7 | aligned |
| AC-713 — box-border line style + capture on text runs via thickest painted side | C3 (box-border extension), BUNDLE-7 | aligned |
| AC-714 — image `object-position` captured & compared exactly | C6 (object-position, split out for media), BUNDLE-7 | aligned |
| AC-715 — reference FOUT (`fontLoaded:false`) does not flag a correct render | C7 (fontLoad reverse-direction correction), BUNDLE-7 | aligned |

## Findings

No violations, warnings, or needs-review items. Property-by-property:

**Coverage — FULL.** Every closure in the story body is expressed by at least one
AC (see ledger). Both facets of the multi-part closures are covered: C1 by the
surface/suppress pair (AC-629 + AC-630); C3 by the core width+colour AC plus the
line-style/text-run extension AC (AC-632 + AC-713); C6 by the effects AC plus the
object-position AC (AC-712 + AC-714). No behaviour described in the story body is
left without an AC. Nothing in the story's "Out of scope" / "deferred residuals"
sections (gradient axes, size-aware diffing, perceptual pixel diff, authoring
dials; glyph-shape hashing, per-side border colours, inline-SVG fill) is described
by any AC — correctly absent.

**Consistency — CLEAN.** Each AC accurately reflects its story-body closure,
including the fine detail: ratio tolerance 1.2% and `--tolerant` widening (AC-630);
alpha-aware painter's-over compositing (AC-631); medium severity + distinct-from-
accent-bar (AC-632); treatment axes at MEDIUM under a `treatment` kind with the
list marker under its own `marker` kind and the both-sides-present guard (AC-711);
presence-vs-value split and opacity as exact-numeric LOW/tonal with a `--tolerant`
band (AC-712); style-folded-only-when-both-sides-recorded + thickest-painted-side
text-run capture (AC-713); exact null-normalised object-position (AC-714);
reverse-only inert / forward-still-defect fontLoad rule (AC-715). No AC is
internally inconsistent with its story claim.

**Exclusivity — CLEAN.** No two ACs describe the same criterion. The two
box-border ACs are distinct facets (AC-632 = uniform width+colour surface/suppress;
AC-713 = line-style folding + text-run capture) matching the story's deliberate
core/extension split. AC-629/AC-630 are the positive (surfaces) / negative
(suppresses) pair for the same axis — complementary, not redundant. AC-711 / AC-712
/ AC-714 cover disjoint axis families (typography / element effects / media crop).

## Notes for the Editor

Nothing to repair. STORY-75 is a single well-scoped upgrade story whose ACs form a
clean 1:1-or-split mapping onto the seven fidelity closures in its body, with the
two reconciled bundles' additions (BUNDLE-6 core closures, BUNDLE-7 coverage-audit
extensions) both fully represented. The matrix at AC level is aligned with
cumulative intent.

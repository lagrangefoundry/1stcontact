---
uid: report-abec2d25
id: REPORT-974
type: report
title: 'Reconciliation Plan: BUG-5 — sample-fidelity pairing by occurrence identity'
created_by: xgd
created_at: '2026-07-27T20:35:58.938325+00:00'
updated_at: '2026-07-27T20:35:58.938325+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_plan
  subject_uid: bug-5b7153d2
  anchor_uid: bug-5b7153d2
  items:
  - index: 1
    component: Sample-fidelity probe (3-probe reproduction gate)
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-24098299
    description: 'Document how the sample-fidelity probe establishes oracle↔reproduced
      correspondence: pairing is by stable occurrence identity within a normalized-text
      key (the k-th reproduced text leaf of a key pairs with the k-th oracle element
      of that key, document order, per width) rather than by a text→box map. Repeated
      labels/CTAs therefore each compare against their own box (no phantom deltas
      at sampled widths); an oracle occurrence with no remaining reproduced leaf surfaces
      as an unmatched coverage gap instead of being masked by a stale map hit; and
      a residual on one specific duplicate occurrence is still attributed to that
      occurrence. Also documents the idempotence identity the gate rests on: the analytic
      value-render of the absolute-base fold is deterministic and reproduces every
      occurrence''s own oracle box at each sampled width, with repeated text present.'
    justification: 'Extends STORY-86 (End-to-end 3-probe reproduction acceptance gate,
      CAP-73) in place — no new capability bucket. The behaviour lives entirely inside
      the already-documented sample-fidelity probe: AC-705 asserts each reproduced
      run matches "the corresponding oracle box" but never says how correspondence
      is established and is silent on repeated text, which is exactly the gap the
      free-coded fix closes. The only production change is sampleFidelityProbe in
      tools/generate/src/l1/probes.ts (+31/-3); the pairing semantics, the unmatched-vs-mispairing
      distinction, and the per-occurrence residual attribution are user-visible properties
      of the gate''s verdict, so they belong as ACs on the existing story rather than
      a parallel one. Four FC UATs (test_UAT_FC_BUG-5_*) exist with no AC to link
      to; all four map onto this item.'
    acceptance_criteria_changes:
      add:
      - 'Analytic value-render is deterministic and per-occurrence faithful with repeated
        text: evaluating the absolute-base fold at a sampled width twice yields identical
        leaves, and each of the N reproduced leaves sharing a text key reproduces
        the corresponding one of the N oracle elements of that key (within tolerance)
        — the idempotence identity value-render(value-render(X)) == value-render(X)
        that makes the fidelity verdict meaningful. Verification: fold a multi-width
        capture whose pages carry the same label three times at distinct y positions;
        at every ladder width assert re-evaluation is identity and that each repeated
        occurrence''s y matches its own oracle element''s y within tolerance.'
      modify:
      - 'AC-705 (acceptance_criterion-330b48e4, ''Sample-fidelity probe matches reproduced
        boxes to the oracle at every captured width within tolerance'') — replace
        the undefined notion of ''the corresponding oracle box'' with the explicit
        pairing rule and its consequences for repeated text: (a) at each captured
        width, oracle samples and reproduced text leaves are keyed by normalized text
        and paired by occurrence index in document order, so the k-th oracle element
        of a key pairs with the k-th reproduced leaf of that key — duplicate labels/CTAs
        each compare against their own box and produce no phantom deltas at sampled
        widths; (b) when a key''s reproduced leaves are exhausted before its oracle
        occurrences, the surplus oracle occurrence is reported as unmatched (a genuine
        coverage gap) rather than silently re-paired against an already-consumed box;
        (c) drift affecting only one occurrence of a repeated key is reported as a
        residual naming that occurrence''s width and per-axis deltas — it is not absorbed
        by a nearest-box or last-writer match. Verification extends to a repeated-text
        fixture that gates clean, a surplus duplicate occurrence surfacing as exactly
        one unmatched entry with the other occurrences still clean, and a single shifted
        duplicate occurrence surfacing as exactly one residual with the correct dy.'
      remove: []
    intent_delta_summary: STORY-86 gains a defined, stable pairing contract for the
      sample-fidelity probe (occurrence identity within a text key, per width, document
      order) plus the idempotence identity it rests on. AC-705 is tightened from 'matches
      the corresponding oracle box' to a rule that says which box corresponds and
      how repeated text, coverage gaps, and per-occurrence drift are each reported;
      one new AC pins deterministic, per-occurrence-faithful analytic value-render.
      All prior intent of STORY-86 (three probes, absolute-base/structure-overlay
      split, demand-driven recovery, diagnostic residuals) is preserved unchanged.
    story_uid: null
---

# Reconciliation Plan

**Mode**: commits
**Anchor**: bug-5b7153d2 (BUG-5 — L1 fidelity gate pairs text leaves by string)
**Source commit**: d893b3188b091dc4b54ab523af3558cc493e08d4 — `fix(l1): pair fidelity probe by occurrence identity, not text map [FREE-CODED]`

## Step 0 — Intent

BUG-5's body states the defect precisely: `sampleFidelityProbe` keyed a
`Map<normText, box>`, so repeated labels/CTAs collided and only the last leaf's
box survived; every other oracle sample of that text paired against the wrong box
→ phantom deltas at sampled widths (the 1616px FAIL), even though `evalGeometry`
reproduces the keyframes exactly there.

Declared scope:
- pair oracle↔reproduced leaves by a **stable identity**, not raw text;
- handle duplicate text **deterministically** (positional match within a width);
- **distinguish genuine coverage gaps from mispairing** in the report;
- add an **idempotency suite** (`value-render(value-render(X)) == value-render(X)`)
  over a fold with repeated text, plus a repeated-text regression fixture, named
  `test_UAT_FC_<ticket>_*`.

The ticket's own "Implementation (free-coded, 2026-07-22)" section records the
refinement made mid-implementation: the stable identity chosen is the
**occurrence index within a text key** — the same index `buildResponsiveTable`
already assigns when the fold builds one L1 leaf per row (FIFO document order per
key). **No new `id` field was added to L1 nodes.** That is a deliberate narrowing
of the body's "index path / node id carried through the fold" phrasing, and it
supersedes it: the matrix should describe occurrence-index pairing, not node ids.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commit d893b3188b091dc4b54ab523af3558cc493e08d4 (BUG-5)"
  entry_files:
    - "tools/generate/src/l1/probes.ts"
    - "tests/bug5-fidelity-pairing.test.ts"
  features:
    - name: "sampleFidelityProbe — oracle↔reproduced pairing"
      description: >
        Per captured width, the probe now builds FIFO queues of reproduced
        text-leaf boxes keyed by normalized text (document order), and walks the
        oracle table for that width keeping a per-key cursor: oracle occurrence i
        of a key pairs with reproduced leaf i of that key. Replaces the previous
        `Map<normText, EvalBox>` whose `.set` kept only the last leaf's box.
      entry_point: "sampleFidelityProbe (tools/generate/src/l1/probes.ts:~402)"
      behaviors:
        - "Repeated text (N identical labels/CTAs) pairs 1:1 by occurrence — each
           compares against its own box; no phantom deltas at sampled widths
           (repeated-text fixture gates clean, maxDelta <= tolerance)."
        - "Surplus oracle occurrence of a key (queue exhausted) → exactly one
           `unmatched {text, width}` entry, pass=false; the other occurrences of
           that key still pair cleanly with empty residuals — a genuine coverage
           gap is no longer masked by a stale map hit."
        - "Drift on one specific duplicate occurrence → exactly one residual
           carrying that occurrence's text, width and per-axis deltas; it is not
           absorbed by a nearest-box / last-writer match."
        - "Pairing is deterministic and order-defined (document order per width on
           both sides), so the verdict is reproducible run to run."
        - "Unchanged: tolerance default 2px, per-axis dx/dy/dw residuals, maxDelta,
           pass = residuals.empty && unmatched.empty."
    - name: "Analytic value-render idempotence with repeated text"
      description: >
        The identity the fidelity verdict rests on, now pinned by test:
        `evaluateLayout` of the absolute-base fold is a pure function (re-render is
        identity) and each of the N leaves sharing a text key reproduces the
        corresponding one of the N oracle elements of that key at every ladder
        width.
      entry_point: "evaluateLayout / foldToL1 (exercised via tests/bug5-fidelity-pairing.test.ts)"
      behaviors:
        - "Re-evaluating the same doc at the same width yields identical leaves."
        - "Fold of a capture with 3 identical CTAs yields 3 distinct leaves (not 1),
           each within tolerance of its own oracle box, at all 6 ladder widths."
```

## Step 2 — Existing matrix

- **CAP-73 / capability-8108afab** — End-to-End Reproduction Gate (3-Probe). Owns
  the sample-fidelity probe.
  - **STORY-86 / story-24098299** — "End-to-end 3-probe reproduction acceptance
    gate" (feature, 3 pts, completed). ACs: AC-705 (sample-fidelity),
    AC-706 (off-sample), AC-707 (content-robustness), AC-708 (combined gate),
    AC-709 (demand-driven recovery), AC-710 (diagnostic residuals).
- **CAP-72 / capability-aa030c83** — 1c Values-Diff Fidelity, **STORY-75** already
  covers "duplicate-text pairing" — but for the `1c values-diff` pipeline, pairing
  repeated text *by rendered position*. That is a different subsystem (the CLI
  values-diff gate), a different mechanism (positional/geometric), and untouched
  by this commit. Noted here so the two are not conflated; **not** a reuse target.

## Coverage Map

```yaml
coverage_map:
  - feature: "sampleFidelityProbe — oracle↔reproduced pairing"
    status: partial
    existing_stories: ["story-24098299"]
    existing_acs: ["acceptance_criterion-330b48e4 (AC-705)", "AC-710"]
    gaps:
      - "AC-705 says each reproduced run matches 'the corresponding oracle box' but
         never defines correspondence — the pairing rule is unspecified, which is
         precisely why a text-keyed map passed review."
      - "AC-705 is silent on repeated text: nothing requires N identical runs to
         pair to N distinct boxes."
      - "AC-705's unmatched clause ('no matching reproduced run') does not
         distinguish a genuine coverage gap from a mispairing artefact; its
         verification only drops a run, never duplicates one."
      - "AC-710 requires residuals to be diagnostic but does not require
         attribution to the correct occurrence of a repeated key."
    notes:
      - "Judgment call: upgrade, not feature — same capability bucket, same probe,
         same report shape; only the correspondence rule is being pinned."
  - feature: "Analytic value-render idempotence with repeated text"
    status: uncovered
    existing_stories: ["story-24098299"]
    existing_acs: []
    gaps:
      - "No AC states the idempotence identity (value-render is deterministic and
         per-occurrence faithful to its own oracle) that the fidelity verdict
         presupposes; DOC-27 names it as vocabulary but the matrix never asserts it."
    notes:
      - "Folded into the same upgrade item as a new AC on STORY-86 rather than a
         separate story — it is a property of the same gate and would otherwise be
         a test-only story (prohibited)."
```

## Step 3b — Intent scope vs implementation footprint

**Case 1 — implementation matches intent scope.** The commit touches exactly two
files: `tools/generate/src/l1/probes.ts` (+31/-3, confined to the per-width
pairing block of `sampleFidelityProbe` plus its docstring) and a new test file.
No change to the fold (`buildResponsiveTable`, STORY-84), the renderer (STORY-83),
the evaluator's geometry math, the report shape, or the other two probes. The fix
*relies* on the fold's existing FIFO per-key row ordering but does not modify it,
so no upgrade item is owed to STORY-84.

One deliberate narrowing vs. the ticket body is recorded above (occurrence index
rather than a new node-id field); it is documented in the ticket's own
implementation note, so it is explicit supersession, not drift. No behaviour was
found outside the declared scope, and no potential unintentional regression.

## Plan Items

| # | Component | Type | Points | Deps | Target | Description |
|---|-----------|------|--------|------|--------|-------------|
| 1 | Sample-fidelity probe (3-probe reproduction gate) | upgrade | 2 | - | story-24098299 (STORY-86) | Pin the probe's oracle↔reproduced pairing contract (occurrence identity within a text key, per width, document order), its repeated-text / coverage-gap / per-occurrence-residual consequences, and the analytic value-render idempotence identity it rests on. |

**Total**: 1 item (feature: 0, upgrade: 1), 2 points.

## FC test evidence (binding)

The injected `fc_tests` list was empty because the harness globs `*.py`; this
project's FC tests are TypeScript. `tests/bug5-fidelity-pairing.test.ts` contains
four `test_UAT_FC_BUG-5_*` UATs, all of which are covered by item 1 and none of
which has an AC today:

| FC test | Covered by |
|---|---|
| `test_UAT_FC_BUG-5_repeated_text_fixture_gates_clean` | AC-705 (modified) |
| `test_UAT_FC_BUG-5_value_render_is_idempotent_with_repeated_text` | new idempotence AC |
| `test_UAT_FC_BUG-5_extra_duplicate_occurrence_surfaces_as_unmatched` | AC-705 (modified) |
| `test_UAT_FC_BUG-5_residual_on_a_specific_duplicate_is_not_hidden` | AC-705 (modified) |

Verified green in this worktree: `npx vitest run tests/bug5-fidelity-pairing.test.ts`
→ 1 file, 4 tests passed (after `pnpm --filter @1stcontact/site-schema build`, which
a fresh worktree needs before any test importing the workspace package resolves).

## Observations

- **One item, deliberately.** The commit is a single-function behavioural
  correction inside an already-documented probe. Splitting pairing, coverage-gap
  reporting, and idempotence into separate stories would be per-behaviour
  inflation; the idempotence AC in particular would otherwise become a prohibited
  test-only story.
- **The AC gap was structural, not accidental.** AC-705 specified the *comparison*
  (tolerance, axes, report shape) but not the *correspondence*. Any pairing
  strategy — including the broken text map — satisfied it. The upgrade closes that
  by making the pairing rule itself an acceptance criterion, so the next probe
  refactor cannot silently reintroduce the collision.
- **Duplicate-text pairing now appears in two capabilities** by different means:
  STORY-75 (values-diff, positional/geometric pairing) and STORY-86 (L1 gate,
  occurrence-index pairing). They are genuinely distinct subsystems; the risk is
  future readers assuming one covers the other, so both ACs should stay explicit
  about which pipeline they govern.
- **Uncertainty, low.** Occurrence-index pairing is correct only while the fold
  keeps building one leaf per responsive-table row in FIFO document order per key.
  That coupling is now load-bearing across two stories (STORY-84 → STORY-86) and is
  captured only in the probe's docstring. The modified AC-705 wording states the
  rule in terms of document order on both sides, which makes the dependency
  explicit in the matrix; no further plan item is proposed for it, since no code
  in the fold changed.

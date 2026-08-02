---
uid: report-8bc8d791
id: REPORT-1072
type: report
title: 'Report: overlap_survey for report-98fc5946'
created_by: xgd
created_at: '2026-08-02T17:43:30.644255+00:00'
updated_at: '2026-08-02T17:43:30.644255+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: overlap_survey
  subject_uid: report-98fc5946
  items:
  - index: 1
    boundary: An L1 leaf's absolute literal and its envelope validation
    capability_uids:
    - capability-6e088083
    - capability-ae9d65d6
    story_uids:
    - story-c490f1cf
    - story-d0a8cfad
    description: STORY-80's sole surviving AC-716 ('L1 leaf axes carry the absolute
      (literal) value, validated by the envelope') is not behaviourally distinguishable
      from STORY-83's AC-682/AC-686/AC-725/AC-726. Post REQ-79/REQ-84 the absolute
      base is delivered by L1 leaf literals bounded by the envelope validator — verbatim
      CAP-70's declared scope — and CAP-67's other half (the named overlay) is parked
      in an unbuilt L2. Structurally the same position CAP-68 held before it was retired
      into STORY-83.
  - index: 2
    boundary: Reproduction treatments vs the post-pivot surfaces that deliver them
    capability_uids:
    - capability-938f26ec
    - capability-ae9d65d6
    - capability-ce902be4
    story_uids:
    - story-46e3b3c7
    - story-d0a8cfad
    - story-179b8c06
    description: STORY-82's body states the treatments are 'now owned by L1 leaf axes'
      and, for the form, 'contact-form capability config + L1 slots', and depends
      on both other stories. AC-718 and AC-701 assert the same observable (contact-form
      presentation authored as L1 in named slots); AC-719 asserts L1 leaf colour/border/opacity
      rendering owned by AC-725/AC-682. CAP-69 may be a reproduction-scenario lens
      over two mechanism capabilities or a residual container — ownership of the assertion
      is ambiguous.
  - index: 3
    boundary: Gradient as a values-diff axis vs as an L1 authoring axis
    capability_uids:
    - capability-36dd68c5
    - capability-aa030c83
    - capability-ae9d65d6
    story_uids:
    - story-82eb6908
    - story-d5de22a5
    - story-d0a8cfad
    description: 'Two seams. (a) Diff half: CAP-63 claims ''the axes, tolerances,
      and element-pairing rules of the capture + values-diff pipeline'', and STORY-76
      reuses CAP-63''s tolerance machinery, surfaceFill axis and pairing — so AC-634/635/636
      could sit in CAP-63 as one more axis (like STORY-75''s six) or in CAP-64 as
      a value-type vertical. (b) Authoring half: AC-637/AC-638 name the `text-block`
      module deleted by REQ-84; gradient authoring is now the L1 text-gradient-fill
      / box-surface-gradient axes owned by CAP-70, so framework-side authoring ACs
      sit inside a 1c toolchain capability.'
  - index: 4
    boundary: '`values-diff` contract split between single-width fidelity and size-aware
      diffing (incl. two duplicate-text pairing rules)'
    capability_uids:
    - capability-18a822ac
    - capability-aa030c83
    story_uids:
    - story-16f2793c
    - story-2c7069fe
    - story-d5de22a5
    description: 'CAP-65''s body concedes it ''generalizes'' CAP-63, but the consequence
      is that one command''s contract lives in two capabilities: what values-diff
      compares (CAP-63) vs what width it compares at and how it fails on a missing
      ladder (CAP-65, AC-639/640/641/642/645). Separately, pairing of repeated text
      is asserted twice with different rules — nearest-rendered-centre (AC-633, CAP-63)
      and occurrence-index in document order (AC-651, CAP-65; again AC-724 under CAP-73).
      STORY-86 flags this as ''not to be conflated'' (mis-citing CAP-72), confirming
      the boundary is only prose-resolved.'
  - index: 5
    boundary: CLI hygiene ACs stated as per-command contracts owned elsewhere
    capability_uids:
    - capability-ac7ca849
    - capability-aa030c83
    - capability-18a822ac
    - capability-ce902be4
    story_uids:
    - story-e15a19ef
    - story-d5de22a5
    - story-16f2793c
    - story-179b8c06
    description: STORY-79's own context names CAP-63, CAP-65, the perceptual crops
      pipeline and the L1 substrate/fold/gate capabilities as what its guarantees
      protect. AC-656/AC-657 are stated entirely in terms of `values-diff` (CAP-63);
      AC-739 ('an Astro container is constructed only for pages that carry behavior
      modules') is a render-pipeline/behavior-module condition (CAP-72) filed under
      CLI; AC-720 concerns the `aligned-crops` perceptual pipeline, which no capability
      body clearly claims. The seam between per-command flag semantics and global
      CLI invariants is unstated.
  - index: 6
    boundary: Ownership of the `1c capture` command's guarantees
    capability_uids:
    - capability-aa030c83
    - capability-18a822ac
    - capability-2049c9ec
    - capability-36dd68c5
    story_uids:
    - story-d5de22a5
    - story-16f2793c
    - story-8acc338d
    - story-82eb6908
    description: 'Four capabilities each assert behaviour of the single `1c capture`
      command: per-element value axes (CAP-63: AC-629/631/711-714), gradient capture
      (CAP-64: AC-634/636), per-width reference screenshot persistence (CAP-65: AC-647),
      and fold/oracle/hint emission (CAP-71: AC-689/690/694). ''What does 1c capture
      guarantee?'' has no single home, so a change to the capture manifest shape touches
      ACs in four buckets with no stated arbitration rule.'
  - index: 7
    boundary: Renderer geometry semantics mirrored by the browser-free analytic evaluator
    capability_uids:
    - capability-ae9d65d6
    - capability-8108afab
    story_uids:
    - story-d0a8cfad
    - story-24098299
    description: The interpolate|snap and breakpoint-cascade semantics are defined
      by the renderer (AC-684, CAP-70) and re-asserted by the evaluator that 'mirrors
      the renderer' (AC-734/AC-735, CAP-73); AC-709 asserts the CAP-70 envelope invariant
      from inside CAP-73. STORY-86 records that a defect here was diagnosed as an
      evaluator defect rather than a fold defect — i.e. the same semantic is under
      test in two capabilities and divergence between them is a live failure mode.
  - index: 8
    boundary: Two reproduction acceptance gates over the same capture/values-diff
      spine
    capability_uids:
    - capability-ae9d65d6
    - capability-8108afab
    - capability-aa030c83
    story_uids:
    - story-d0a8cfad
    - story-24098299
    - story-d5de22a5
    description: 'The L1 pipeline has two acceptance gates in two capabilities: the
      browser-backed round-trip identity gate (AC-683, CAP-70) and the analytic 3-probe
      gate (AC-705-708, CAP-73), both built on the CAP-63 capture/values-diff spine
      — STORY-83 says ''the round-trip gate reuses the capture + values-diff pipeline
      (CAP-63)'' and STORY-86 excludes the round-trip check as ''separate''. Best-documented
      cluster of the eight, but ''where is reproduction acceptance defined?'' still
      has two answers.'
---

# Cross-Capability Overlap Survey

**Anchor**: report-98fc5946
**Matrix surveyed**: 11 capabilities, 12 stories (1 archived: STORY-81 under the retired CAP-68)
**Clusters identified**: 8

Method: read every capability body and every story body + AC title list, then
looked for stories whose ACs assert behaviour that another capability's body
claims as its own scope. Prior resolutions are honoured — CAP-68/STORY-81 is
already retired and merged into STORY-83 ("overlap cluster 2 resolution"), so it
is not re-flagged. Clusters below are ambiguities that remain live; several are
partially documented in prose ("out of scope: …") but the AC-level ownership is
still shared, which is what a matrix consumer actually navigates by.

---

## Clusters

### Cluster 1: An L1 leaf's absolute literal + its envelope validation
**Capabilities**: `1c`-side none — CAP-67 (Framework Absolute-or-Overlay Value System), CAP-70 (L1 Layout Substrate + Safety Envelope)
**Stories**:
- story-c490f1cf (STORY-80): Absolute values re-homed in L1 — sole surviving AC-716 "L1 leaf axes carry the absolute (literal) value, validated by the envelope"
- story-d0a8cfad (STORY-83): L1 layout substrate rendered safe by construction — AC-682 (well-formed doc accepted as typed tree), AC-686 (out-of-range/oversize/freeform rejected), AC-725/AC-726 (typed axes render / malformed axes rejected)

**Overlap**: After REQ-79/REQ-84 both CAP-67's body and STORY-80's body state that
the absolute base is delivered by L1 leaf literals bounded by the envelope
validator — which is verbatim CAP-70's declared scope ("every value is a typed
literal or a closed enum" + "an envelope validator that admits only in-range,
in-shape documents"). AC-716 is not distinguishable at the behavioural level from
AC-682/AC-686. CAP-67's other half (the named overlay) is explicitly parked in an
unbuilt L2, so the container currently holds no behaviour CAP-70 does not already
own. This is structurally the same position CAP-68 was in before it was retired
into STORY-83.

### Cluster 2: Reproduction treatments vs the surfaces that deliver them
**Capabilities**: CAP-69 (Framework Reproduction Module Treatments), CAP-70 (L1 Layout Substrate), CAP-72 (Behavior Module Contract & Catalog)
**Stories**:
- story-46e3b3c7 (STORY-82): Reproduction treatments — AC-719 (card/band + footer look via L1 leaf axes), AC-718 (contact-form presentation via capability config + L1 slots)
- story-d0a8cfad (STORY-83): L1 substrate — AC-725 (typed pixel-mover axes incl. surface gradient, scrim, border, opacity)
- story-179b8c06 (STORY-85): Behavior modules — AC-697 (config validated), AC-698 (slots validated as L1 subtrees), AC-701 (contact-form renders from config with L1-authored intro/submit presentation)

**Overlap**: STORY-82's own body says the treatments are "now owned by L1 leaf
axes" and, for the form, "contact-form capability config + L1 slots", and its
Dependencies section names both other stories. AC-718 and AC-701 assert the same
observable (a contact form whose intro/submit presentation is L1 mounted into
slots); AC-719 asserts L1 leaf colour/border/opacity literals rendering, which is
AC-725/AC-682 territory. CAP-69 may be a legitimate *reproduction-scenario* lens
over two mechanism capabilities, or a residual container — but which capability
owns the assertion is currently ambiguous.

### Cluster 3: Gradient as a diff axis vs as an L1 authoring axis
**Capabilities**: CAP-64 (1c Gradient Fidelity), CAP-63 (1c Values-Diff Fidelity), CAP-70 (L1 Layout Substrate)
**Stories**:
- story-82eb6908 (STORY-76): Gradients as a first-class value — AC-634/AC-635/AC-636 (values-diff gradient axes + tolerances), AC-637 (a text-block authored with a gradient panel renders that surface), AC-638 (gradient-typed content field accepts/rejects)
- story-d5de22a5 (STORY-75): Values-diff blind spots — AC-631 (composited surfaceFill), AC-633 (duplicate-text pairing) — the axes and pairing STORY-76's comparison sits on
- story-d0a8cfad (STORY-83): L1 substrate — AC-725/AC-726 (typed pixel-mover axes, which per the story body include text gradient fill and box surface gradient)

**Overlap**: Two seams. (a) The *diff* half — CAP-63's body claims "the axes,
tolerances, and element-pairing rules of the capture + values-diff pipeline", and
STORY-76's own technical note says the gradient comparison reuses CAP-63's
tolerance machinery, surfaceFill axis and pairing; so a gradient axis could sit in
either CAP-63 (as one more axis, like STORY-75's six) or CAP-64 (as a value-type
vertical). (b) The *authoring* half — AC-637/AC-638 are framework-side authoring,
and the module they name (`text-block`) was deleted by REQ-84, with gradient
authoring re-homed to the L1 gradient axes owned by CAP-70/STORY-83. So the
authoring ACs sit in a `1c` toolchain capability while the mechanism they describe
now lives in the framework substrate capability.

### Cluster 4: `values-diff` behaviour split across single-width and size-aware capabilities
**Capabilities**: CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c Size-Aware Diffing)
**Stories**:
- story-16f2793c (STORY-77): Size-aware diffing — AC-639/AC-640/AC-641/AC-642/AC-645 all specify `values-diff` behaviour
- story-2c7069fe (STORY-78): Responsive-diff — AC-651 "aligns repeated identical text occurrence-by-occurrence in document order"
- story-d5de22a5 (STORY-75): Values-diff blind spots — AC-633 "duplicate text is paired by nearest rendered position"

**Overlap**: CAP-65's body concedes the relationship ("CAP-63 supplies the
single-width value comparison this generalizes"), but the consequence is that the
same command's contract is documented in two capabilities: what `values-diff`
*compares* is CAP-63, what width it compares *at* (and how it fails when the
ladder is missing) is CAP-65. Second, element pairing of repeated text is asserted
twice with two different rules — nearest-rendered-centre (AC-633, CAP-63) and
occurrence-index-in-document-order (AC-651, CAP-65; and again AC-724 under CAP-73).
STORY-86 flags this explicitly as "not to be conflated" (while mis-citing it as
CAP-72), which confirms the boundary is real and currently only prose-resolved.

### Cluster 5: CLI hygiene ACs that are really per-command contracts
**Capabilities**: CAP-66 (1c CLI Argument Parsing & Output Hygiene), CAP-63 (Values-Diff Fidelity), CAP-65 (Size-Aware Diffing), CAP-72 (Behavior Modules)
**Stories**:
- story-e15a19ef (STORY-79): CLI flags/JSON hygiene — AC-656/AC-657 (`values-diff --multi-viewport`, `values-diff --json`), AC-720 (`aligned-crops --sandbox` store routing), AC-739 ("an Astro container is constructed only for pages that carry behavior modules")

**Overlap**: STORY-79's own technical context lists CAP-63, CAP-65, the perceptual
crops pipeline and "the L1 substrate/fold/gate capabilities" as the capabilities
its guarantees protect. AC-656/AC-657 are stated entirely in terms of one
command owned elsewhere; AC-739 is a render-pipeline/behavior-module condition
(CAP-72's territory) sitting in a CLI capability; AC-720 concerns the perceptual
`aligned-crops` pipeline, which no capability body clearly claims. A cross-cutting
"hygiene" capability is a defensible choice, but the seam (per-command flag
semantics vs. global CLI invariants) is not stated anywhere, and AC-739 in
particular reads as misfiled.

### Cluster 6: Ownership of the `1c capture` command's behaviour
**Capabilities**: CAP-63 (Values-Diff Fidelity), CAP-65 (Size-Aware Diffing), CAP-71 (Capture-to-L1 Reproduction Fold), CAP-64 (Gradient Fidelity)
**Stories**:
- story-d5de22a5 (STORY-75): capture axes — AC-629/AC-631/AC-711/AC-712/AC-713/AC-714 (what capture records per element)
- story-16f2793c (STORY-77): AC-647 "capturing a page persists a per-width reference screenshot for each ladder width"
- story-8acc338d (STORY-84): AC-689 "capture emits one validated full-language L1 reproduction document", AC-690 "raw multi-viewport sample ladder is retained as the acceptance oracle", AC-694 (capture emits the hint sidecar)
- story-82eb6908 (STORY-76): AC-634/AC-636 capture-side gradient recording (text-fill and surface)

**Overlap**: Four capabilities each assert behaviour of the single `1c capture`
command: its per-element value axes (CAP-63), its gradient axes (CAP-64), its
per-width screenshot persistence (CAP-65), and its fold/oracle/hint emission
(CAP-71). Each is individually coherent, but "what does `1c capture` guarantee?"
has no single home, so a change to the capture manifest shape touches ACs in four
buckets with no stated arbitration rule.

### Cluster 7: Renderer geometry semantics mirrored by the analytic evaluator
**Capabilities**: CAP-70 (L1 Layout Substrate), CAP-73 (End-to-End Reproduction Gate)
**Stories**:
- story-d0a8cfad (STORY-83): AC-684 "geometry keyframes produce per-viewport layout: interpolate varies continuously, snap holds"
- story-24098299 (STORY-86): AC-734 (analytic evaluator tiles a flex row along the main axis), AC-735 (geometry resolves against half-open breakpoint intervals so a reflow at a captured breakpoint does not cascade), AC-709 (recovery returns a valid L1 document)

**Overlap**: The `interpolate|snap` + breakpoint-cascade semantics are defined once
by the renderer (CAP-70) and re-asserted by the browser-free evaluator (CAP-73),
which the story body describes as "mirroring the renderer". STORY-86's own
technical context records that a defect here was diagnosed as an *evaluator*
defect rather than a fold defect — i.e. the same semantic is under test in two
capabilities and a divergence between them is a live failure mode. AC-709
additionally asserts the CAP-70 envelope invariant from inside CAP-73.

### Cluster 8: Two acceptance gates over the same capture spine
**Capabilities**: CAP-70 (L1 Layout Substrate), CAP-73 (End-to-End Reproduction Gate), CAP-63 (Values-Diff Fidelity)
**Stories**:
- story-d0a8cfad (STORY-83): AC-683 "authored axes round-trip: capture(render(L1)) reproduces every literal axis at all widths"
- story-24098299 (STORY-86): AC-705/AC-706/AC-707/AC-708 (three probes + combined verdict)
- story-d5de22a5 (STORY-75): the capture + values-diff pipeline both gates ride

**Overlap**: The L1 pipeline has two acceptance gates in two capabilities — the
browser-backed round-trip identity gate (CAP-70) and the analytic 3-probe gate
(CAP-73) — and both are built on the CAP-63 capture/values-diff spine (STORY-83
says so explicitly: "the round-trip gate reuses the capture + values-diff pipeline
(CAP-63)"; STORY-86 explicitly excludes the round-trip check as "separate"). The
exclusions are stated, so this is the best-documented cluster here, but "where is
reproduction acceptance defined?" still has two answers, and a consumer asking
whether a reproduction is accepted must read both buckets.

---

## Notes for resolution

- Clusters 1 and 2 are the most likely to warrant a *structural* decision
  (retire/merge vs. keep as a scenario lens), because CAP-67 and CAP-69 hold only
  ACs whose mechanism another capability owns — the same shape as the already
  retired CAP-68.
- Clusters 4, 6, 7, 8 are boundary-articulation issues: the capabilities are all
  substantive, but the seam needs to be written into the capability bodies as an
  arbitration rule, not left in per-story prose.
- Cluster 5 contains one probable misfile (AC-739, a behavior-module/render
  condition inside the CLI capability) alongside a genuine cross-cutting question.
- Incidental finding (not itself an overlap): STORY-86's "not to be conflated"
  note cites CAP-72 for the `values-diff` duplicate-text pairing; the correct
  citation is CAP-63.

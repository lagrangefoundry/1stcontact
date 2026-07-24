---
uid: report-feea66e2
id: REPORT-875
type: report
title: 'Report: overlap_survey for report-b1a287b0'
created_by: xgd
created_at: '2026-07-24T06:14:40.381132+00:00'
updated_at: '2026-07-24T06:14:40.381132+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: overlap_survey
  subject_uid: report-b1a287b0
  items:
  - index: 1
    boundary: Gradient comparison as a values-diff fidelity axis
    capability_uids:
    - capability-36dd68c5
    - capability-aa030c83
    story_uids:
    - story-82eb6908
    - story-d5de22a5
    description: STORY-76 defines gradients to be 'compared by values-diff as a fidelity
      axis' — the same axis-by-axis comparison surface STORY-75 owns for Values-Diff
      Fidelity. Gradient diffing could reasonably be filed as a new axis inside Values-Diff
      Fidelity rather than a separate Gradient Fidelity capability. (STORY-76 additionally
      spans capture and framework authoring, but the sharpest ambiguity is the diff
      axis.)
  - index: 2
    boundary: Per-viewport diffing operates on the values-diff command surface
    capability_uids:
    - capability-18a822ac
    - capability-aa030c83
    story_uids:
    - story-16f2793c
    - story-2c7069fe
    - story-d5de22a5
    description: STORY-77 amends 'both fidelity-diff commands' with a --size selector
      (values-diff is one of those commands, owned by STORY-75). STORY-78's responsive-diff
      is a cross-size node comparison — conceptually a values-diff variant. The per-width
      comparison could be an axis/mode of Values-Diff Fidelity rather than a distinct
      Size-Aware Diffing capability.
  - index: 3
    boundary: CLI flag parsing vs the diff commands the flags configure
    capability_uids:
    - capability-ac7ca849
    - capability-18a822ac
    - capability-aa030c83
    story_uids:
    - story-e15a19ef
    - story-16f2793c
    description: 'STORY-79 (CLI) owns flag parsing, propagation into sub-commands,
      and --json output. But the --size selector (STORY-77, Size-Aware Diffing) and
      the diff commands'' --json emission are behaviors of the diff commands themselves.
      Classic CLI-vs-command boundary: does ''--size parses and propagates into values-diff''
      belong to CLI Argument Parsing or to the diff capability?'
  - index: 4
    boundary: Absolute value validation lives in the L1 substrate
    capability_uids:
    - capability-6e088083
    - capability-ae9d65d6
    story_uids:
    - story-c490f1cf
    - story-d0a8cfad
    description: STORY-80's title is literally 'Absolute values re-homed in L1 ...
      carried as a validated literal'. Validated typed literals reaching the browser
      only through the safe emitter is exactly what the L1 Layout Substrate + Safety
      Envelope (STORY-83) owns. The colour/length/radius validation concern could
      belong to either the Absolute-or-Overlay Value System or the L1 substrate.
  - index: 5
    boundary: 'Where per-breakpoint variation lives: module dials vs L1 substrate
      vs capture fold'
    capability_uids:
    - capability-bd0b722e
    - capability-ae9d65d6
    - capability-2049c9ec
    story_uids:
    - story-3569e1a4
    - story-d0a8cfad
    - story-8acc338d
    description: STORY-81 (Responsive Per-Breakpoint Dials) states its own behavior
      is 'carried by the L1 layout substrate rather than by module-level per-breakpoint
      dials ... folded per-viewport from the capture ladder.' The capability's story
      thus relocates responsibility into the L1 substrate (STORY-83) and consumes
      the per-viewport geometry fold (STORY-84, Capture-to-L1 Fold). Three-way ambiguity
      over which capability owns per-viewport variation.
  - index: 6
    boundary: Reproduction treatments expressed via L1 leaf axes and capability-module
      config
    capability_uids:
    - capability-938f26ec
    - capability-ae9d65d6
    - capability-ce902be4
    story_uids:
    - story-46e3b3c7
    - story-d0a8cfad
    - story-179b8c06
    description: STORY-82 expresses treatments 'via L1 leaf axes' (the L1 substrate,
      STORY-83) and contact-form presentation 'via its capability config plus named
      L1 slots' (the capability-module contract, STORY-85). The card-veil/border/footer/contact-form
      treatments could be filed under L1 Layout Substrate, the Capability Module Contract,
      or the Reproduction Module Treatments capability.
  - index: 7
    boundary: The 3-probe gate's sample-fidelity probe is a per-width text-box diff
    capability_uids:
    - capability-8108afab
    - capability-aa030c83
    - capability-18a822ac
    story_uids:
    - story-24098299
    - story-d5de22a5
    - story-16f2793c
    description: STORY-86's sample-fidelity probe checks that 'text-run boxes match
      the retained capture oracle at each captured width, within tolerance' — precisely
      the rendered-text-extent comparison of Values-Diff Fidelity (STORY-75) performed
      per-width (Size-Aware Diffing, STORY-77). The fidelity check could be owned
      by the diff capabilities and consumed by the gate, or re-homed inside the End-to-End
      Reproduction Gate capability.
---

# Cross-Capability Overlap Survey

**Anchor report**: report-b1a287b0
**Clusters identified**: 7

The matrix maps cleanly 1:1 (one story per capability) except **1c Size-Aware
Diffing** (capability-18a822ac), which holds both STORY-77 and STORY-78. The
overlaps below are **structural ambiguities**, not defects — several are a direct
consequence of the post-pivot architecture, where formerly-separate "framework"
concerns (values, dials, treatments) were deliberately re-homed into the single
**L1 substrate**, so their stories legitimately read as belonging to more than
one capability.

## Clusters

### Cluster 1: Gradient comparison as a values-diff fidelity axis
**Capabilities**: 1c Gradient Fidelity (capability-36dd68c5), 1c Values-Diff Fidelity (capability-aa030c83)
**Stories**:
- story-82eb6908 (STORY-76): Gradients as a first-class value — captured, authored, and diffed
- story-d5de22a5 (STORY-75): Values-diff closes capture blind spots
**Overlap**: STORY-76 specifies gradients "compared by `values-diff` as a fidelity
axis" — the same per-axis comparison surface STORY-75 owns for Values-Diff
Fidelity. Gradient diffing could be a new axis inside Values-Diff Fidelity rather
than a standalone capability. (STORY-76 further spans capture and framework
authoring; the diff axis is the sharpest ambiguity.)

### Cluster 2: Per-viewport diffing operates on the values-diff command surface
**Capabilities**: 1c Size-Aware Diffing (capability-18a822ac), 1c Values-Diff Fidelity (capability-aa030c83)
**Stories**:
- story-16f2793c (STORY-77): Size-aware diffing — `--size` selector across the ladder
- story-2c7069fe (STORY-78): Responsive-diff — cross-size N-way node analysis
- story-d5de22a5 (STORY-75): Values-diff closes capture blind spots
**Overlap**: STORY-77 amends "both fidelity-diff commands" with `--size` (values-diff
being one). STORY-78's responsive-diff is a cross-size node comparison —
conceptually a values-diff variant. Per-width comparison could be an axis/mode of
Values-Diff Fidelity rather than a distinct capability.

### Cluster 3: CLI flag parsing vs the diff commands the flags configure
**Capabilities**: 1c CLI Argument Parsing & Output Hygiene (capability-ac7ca849), 1c Size-Aware Diffing (capability-18a822ac), 1c Values-Diff Fidelity (capability-aa030c83)
**Stories**:
- story-e15a19ef (STORY-79): 1c CLI flags parse, propagate, and `--json` emits clean output
- story-16f2793c (STORY-77): Size-aware diffing — `--size` selector
**Overlap**: STORY-79 owns flag parsing, propagation into sub-commands, and `--json`
output. But the `--size` selector (STORY-77) and the diff commands' `--json`
emission are behaviors of the diff commands themselves. Classic CLI-vs-command
boundary: does "`--size` parses and propagates into values-diff" belong to CLI
Argument Parsing or to Size-Aware Diffing?

### Cluster 4: Absolute value validation lives in the L1 substrate
**Capabilities**: Framework Absolute-or-Overlay Value System (capability-6e088083), L1 Layout Substrate + Safety Envelope (capability-ae9d65d6)
**Stories**:
- story-c490f1cf (STORY-80): Absolute values re-homed in L1 — validated literals, named overlay in L2
- story-d0a8cfad (STORY-83): L1 layout substrate rendered safe by construction
**Overlap**: STORY-80's title is literally "Absolute values **re-homed in L1** ...
carried as a **validated literal**". Typed, validated literals reaching the browser
only through the safe emitter is exactly what the L1 substrate (STORY-83) owns. The
colour/length/radius validation concern could belong to either capability.

### Cluster 5: Where per-breakpoint variation lives — module dials vs L1 substrate vs capture fold
**Capabilities**: Framework Responsive Per-Breakpoint Dials (capability-bd0b722e), L1 Layout Substrate + Safety Envelope (capability-ae9d65d6), Capture-to-L1 Reproduction Fold (capability-2049c9ec)
**Stories**:
- story-3569e1a4 (STORY-81): Responsive dials — length params vary per breakpoint, configurable nav collapse
- story-d0a8cfad (STORY-83): L1 layout substrate rendered safe by construction
- story-8acc338d (STORY-84): Fold a multi-viewport capture into one L1 reproduction document
**Overlap**: STORY-81 states its own behavior is "carried by the **L1 layout
substrate** rather than by module-level per-breakpoint dials ... **folded
per-viewport from the capture ladder**." The capability's story relocates
responsibility into the L1 substrate (STORY-83) and consumes the per-viewport
geometry fold (STORY-84). Genuine three-way ambiguity over which capability owns
per-viewport variation — the "Responsive Dials" capability may be largely subsumed
by L1 + the fold post-pivot.

### Cluster 6: Reproduction treatments — L1 leaf axes + capability-module config
**Capabilities**: Framework Reproduction Module Treatments (capability-938f26ec), L1 Layout Substrate + Safety Envelope (capability-ae9d65d6), Capability Module Contract & Catalog (capability-ce902be4)
**Stories**:
- story-46e3b3c7 (STORY-82): Reproduction treatments — card veil/border, contact form, footer overrides
- story-d0a8cfad (STORY-83): L1 layout substrate rendered safe by construction
- story-179b8c06 (STORY-85): Behavioural capability modules — vetted core + typed config + L1 slots
**Overlap**: STORY-82 expresses treatments "via **L1 leaf axes**" (STORY-83) and
contact-form presentation "via its **capability config plus named L1 slots**"
(STORY-85's capability-module contract). The card-veil/border/footer/contact-form
treatments could be filed under L1, the Capability Module Contract, or the
Reproduction Module Treatments capability.

### Cluster 7: The 3-probe gate's sample-fidelity probe is a per-width text-box diff
**Capabilities**: End-to-End Reproduction Gate 3-Probe (capability-8108afab), 1c Values-Diff Fidelity (capability-aa030c83), 1c Size-Aware Diffing (capability-18a822ac)
**Stories**:
- story-24098299 (STORY-86): End-to-end 3-probe reproduction acceptance gate
- story-d5de22a5 (STORY-75): Values-diff closes capture blind spots
- story-16f2793c (STORY-77): Size-aware diffing — `--size` selector
**Overlap**: STORY-86's **sample-fidelity** probe checks that "text-run boxes match
the retained capture oracle at each captured width, within tolerance" — precisely
the rendered-text-extent comparison of Values-Diff Fidelity (STORY-75) performed
per-width (Size-Aware Diffing, STORY-77). The fidelity check could be owned by the
diff capabilities and merely consumed by the gate, or re-homed inside the gate
capability.

## Note on resolution

These clusters name where a single story's behavior straddles a capability
boundary; they are for explicit resolution, not automatic reassignment. Clusters
4–6 in particular reflect the intentional post-pivot consolidation into L1 — the
resolution may be to accept L1 as a shared substrate that other capabilities
*configure* (dependency, not overlap), rather than to move stories.

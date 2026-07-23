---
uid: report-d022ad58
id: REPORT-771
type: report
title: 'Report: overlap_survey for report-9260fc31'
created_by: xgd
created_at: '2026-07-23T06:06:43.813723+00:00'
updated_at: '2026-07-23T06:06:43.813723+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: overlap_survey
  subject_uid: report-9260fc31
  items:
  - index: 1
    boundary: A gradient (text-fill stop positions, panel/card surface fill) captured
      and compared as a values-diff fidelity axis
    capability_uids:
    - capability-36dd68c5
    - capability-aa030c83
    story_uids:
    - STORY-76
    - STORY-75
    description: STORY-76 (1c Gradient Fidelity) explicitly captures gradients and
      has them 'compared by values-diff as a fidelity axis' — the same values-diff
      machinery STORY-75 (1c Values-Diff Fidelity) extends with composited surface
      fill, box border, and element-effect axes. A gradient surface fill is, in effect,
      one more values-diff surface-fill axis; whether it is its own capability or
      belongs under Values-Diff Fidelity is genuinely ambiguous. STORY-76 also claims
      'authorable on a module panel', reaching into the framework authoring surfaces.
  - index: 2
    boundary: 'Per-viewport length/geometry variation: is it a framework ''responsive
      dial'' capability, or the capture-fold + L1-substrate that now carry it?'
    capability_uids:
    - capability-bd0b722e
    - capability-2049c9ec
    - capability-ae9d65d6
    story_uids:
    - STORY-81
    - STORY-84
    - STORY-83
    description: STORY-81 (Framework Responsive Per-Breakpoint Dials) states its per-viewport
      variation is now 'carried by the L1 layout substrate' and delivered by 'foldToL1
      folds the 6-width sampled ladder ... emitting these per-viewport keyframes directly.'
      That fold mechanism is owned by STORY-84 (Capture-to-L1 Reproduction Fold) and
      the per-viewport keyframe geometry axis is an L1 substrate feature owned by
      STORY-83 (L1 Layout Substrate). Post-pivot the responsive capability is almost
      entirely re-homed into fold + substrate, leaving it unclear which capability
      owns per-viewport keyframes.
  - index: 3
    boundary: The typed L1 leaf-axis value surface — shared by the substrate, the
      literal-or-overlay value system, and reproduction treatments
    capability_uids:
    - capability-ae9d65d6
    - capability-6e088083
    - capability-938f26ec
    story_uids:
    - STORY-83
    - STORY-80
    - STORY-82
    description: STORY-80 (Absolute-or-Overlay Value System) makes 'every colour,
      length, and radius dial accept a literal or a named overlay', and STORY-82 (Reproduction
      Module Treatments) expresses card veil/border and footer overrides 'through
      L1 leaf axes'. Both operate on the very typed leaf axes defined by STORY-83
      (L1 Layout Substrate). Whether literal-or-overlay resolution and a specific
      reproduction treatment belong to the substrate, the value-system overlay seam,
      or the treatments capability is ambiguous — all three own the same leaf-axis
      surface.
  - index: 4
    boundary: 'A CLI flag consumed by the diff commands: does parsing/propagation
      belong to CLI arg-hygiene or to the diff capability that gives it meaning?'
    capability_uids:
    - capability-ac7ca849
    - capability-18a822ac
    story_uids:
    - STORY-79
    - STORY-77
    description: STORY-79 (1c CLI Argument Parsing & Output Hygiene) owns generic
      flag parsing, propagation into sub-commands, and --json output hygiene across
      the CLI. STORY-77 (1c Size-Aware Diffing) adds the --size selector that 'both
      fidelity-diff commands' consume. The --size flag's parsing and propagation could
      sit under CLI Arg Parsing while its diff semantics sit under Size-Aware Diffing
      — the canonical 'CLI command that operates on X' boundary. Likely resolves as
      cross-cutting by design, but flagged per the err-toward-flagging rule.
---

# Cross-Capability Overlap Survey

**Anchor report**: report-9260fc31
**Clusters identified**: 4

The matrix is a near-perfect 1:1 capability→story mapping (11 capabilities, 12 stories; only 1c Size-Aware Diffing holds two). The overlaps below are boundary ambiguities where a story's own body invokes another capability's machinery — not defects, but seams worth resolving explicitly. Two dominant seams recur: (a) the shared **values-diff fidelity-axis** surface, and (b) the post-pivot collapse of framework "dials" into the **L1 substrate + capture-fold**.

## Clusters

### Cluster 1: Gradient as a values-diff fidelity axis
**Capabilities**: 1c Gradient Fidelity (capability-36dd68c5), 1c Values-Diff Fidelity (capability-aa030c83)
**Stories**:
- STORY-76: Gradients as a first-class value — stop positions and panel surface gradients, captured, authored, and diffed
- STORY-75: Values-diff closes capture blind spots — rendered-text extent, composited surface fill, box border, duplicate-text pairing
**Overlap**: STORY-76 has gradients "compared by `values-diff` as a fidelity axis" — the exact machinery STORY-75 extends (composited surface fill, border, effects). A panel/surface gradient is one more values-diff surface-fill axis; whether it warrants its own capability or belongs under Values-Diff Fidelity is ambiguous. STORY-76's "authorable on a module panel" clause also reaches the framework authoring surfaces.

### Cluster 2: Per-viewport keyframes — responsive dials vs L1 fold/substrate
**Capabilities**: Framework Responsive Per-Breakpoint Dials (capability-bd0b722e), Capture-to-L1 Reproduction Fold (capability-2049c9ec), L1 Layout Substrate + Safety Envelope (capability-ae9d65d6)
**Stories**:
- STORY-81: Responsive dials — length parameters vary per breakpoint and the nav collapse point is configurable
- STORY-84: Fold a multi-viewport capture into one L1 reproduction document with advisory structural hints
- STORY-83: L1 layout substrate rendered safe by construction
**Overlap**: STORY-81 states its per-viewport variation is "carried by the L1 layout substrate" and delivered by "`foldToL1` folds the 6-width sampled ladder ... emitting these per-viewport keyframes directly." The fold is owned by STORY-84; the per-viewport keyframe geometry axis is an L1-substrate feature owned by STORY-83. Post-pivot the "responsive dials" capability is almost entirely re-homed into fold + substrate — which capability truly owns per-viewport keyframes is unclear.

### Cluster 3: The typed L1 leaf-axis value surface
**Capabilities**: L1 Layout Substrate + Safety Envelope (capability-ae9d65d6), Framework Absolute-or-Overlay Value System (capability-6e088083), Framework Reproduction Module Treatments (capability-938f26ec)
**Stories**:
- STORY-83: L1 layout substrate rendered safe by construction
- STORY-80: Absolute-or-overlay values — every colour, length, and radius dial accepts a literal or a named overlay
- STORY-82: Reproduction treatments — card veil/border, placeholder & inline contact form, footer copyright/colour overrides
**Overlap**: STORY-80's "every colour, length, and radius dial accepts a literal or a named overlay" and STORY-82's treatments "expressed through L1 leaf axes" both operate on the typed leaf axes defined by STORY-83. Literal-or-overlay resolution and specific reproduction treatments could each be attributed to the substrate, the value-system overlay seam, or the treatments capability — all three own the same leaf-axis surface.

### Cluster 4: CLI flag parsing vs diff-command flag semantics
**Capabilities**: 1c CLI Argument Parsing & Output Hygiene (capability-ac7ca849), 1c Size-Aware Diffing (capability-18a822ac)
**Stories**:
- STORY-79: 1c CLI — flags parse correctly, propagate into sub-commands, and --json emits a clean scriptable document
- STORY-77: Size-aware diffing — compare a captured site at a chosen viewport across the persisted ladder
**Overlap**: STORY-79 owns generic flag parsing/propagation and --json hygiene across the CLI; STORY-77 adds the --size selector consumed by "both fidelity-diff commands." The flag's parsing/propagation could sit under CLI Arg Parsing while its diff semantics sit under Size-Aware Diffing — the canonical "CLI command that operates on X" boundary. Most likely cross-cutting by design; flagged per the err-toward-flagging rule.

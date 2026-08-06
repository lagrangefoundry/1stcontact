---
uid: report-5fcb8119
id: REPORT-1348
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-06T01:47:01.730234+00:00'
updated_at: '2026-08-06T01:47:01.730234+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-ee56a66e
  plan_item_index: '3'
---

Done. All mutations verified in place.

**What I read first (chain of authority):** the bundle's BUG-27 body + Resolution section and REQ-96's body + Outcome section, then the code — `extract.ts` (`paintedExtent`/`styleVisible`+`onScreenBox`, `backdropBoxes`, `moduleInvariant`, `accessibleNameOf`), `fold.ts` (`isBackdrop`, `backdropNodes` → background layer, `sectionEdges`, page-base inference, the `rebase`/`rebasedGeometry` control fold), `values-diff.ts` (`assetBasename`, the `backgroundImage` axis), and `repro.ts` `cmdRefold`. Every AC below is grounded in behaviour the intent specifies and the code implements.

Two intent-vs-code notes, left out of the ACs deliberately: BUG-27 named *lazy-loaded media* as cause 2, but the Resolution records it as already fixed by REQ-36's `settlePage` — not this work's behaviour, so no AC. The "only two sections detected" signal is recorded as a symptom of the collapsed-band bug, not an independent cause, so it is documented as the band-extent AC rather than as a section-detector AC. `1c refold` is outside REQ-96's seven declared scope items but is explicitly recorded in its Outcome section as a deliberate excursion, so it is documented (AC-814) rather than treated as drift.

```
Upgrade mutations applied for plan item 3 of 12

Target Stories: story-8acc338d, story-d5de22a5
Primary Story UID: story-8acc338d
Stories Modified: 2
ACs Modified: 1
ACs Added: 7
ACs Removed: 0

tickets_modified:
  stories:
    - "story-8acc338d"   # STORY-84 — fold: backdrops in the background layer, control leaves rebased to the seam, offline re-fold; loses the always-residual rule
    - "story-d5de22a5"   # STORY-75 — capture/values-diff: painted band extent, document-wide backdrops, backgroundImage axis, invariant exclusion
  acceptance_criteria:
    modified: ["acceptance_criterion-0d993a36"]                 # AC-733 (body + title)
    added:
      - "acceptance_criterion-fd94d9ab"   # AC-812  backdrop → box leaf in background layer, edges bound bands (STORY-84)
      - "acceptance_criterion-d8d0a875"   # AC-813  control leaf rebased to the form seam (STORY-84)
      - "acceptance_criterion-96678ac8"   # AC-814  offline re-fold rewrites only fold output (STORY-84)
      - "acceptance_criterion-9ccc1de8"   # AC-815  band box = painted subtree extent, clamped (STORY-75)
      - "acceptance_criterion-ee91ec33"   # AC-816  document-wide backdrops + the three exclusions (STORY-75)
      - "acceptance_criterion-63bc4eb6"   # AC-817  backgroundImage compared by mirrored basename (STORY-75)
      - "acceptance_criterion-66cf5953"   # AC-818  module-invariant elements + their names excluded (STORY-75)
    removed: []

Progress: 3 of 12 plan items complete
```

Scope check: no story tickets created, no runtime code touched, changes confined to the two target stories and their ACs. AC-733 keeps the residual channel for elements the fold genuinely cannot express (including a geometry-less control) while dropping the superseded "a form control always becomes a residual" rule.

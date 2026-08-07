---
uid: report-9d3d87ad
id: REPORT-1574
type: report
title: 'Report: overlap_survey for report-17a279f7'
created_by: xgd
created_at: '2026-08-07T15:39:10.639730+00:00'
updated_at: '2026-08-07T15:39:10.639730+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: overlap_survey
  subject_uid: report-17a279f7
  items:
  - index: 1
    boundary: 'Site scaffold: CAP-89 (Site Materials & Starting Point) restates CAP-81
      (Site Creation & Authoring Start Point) in full, while CAP-81 remains active
      and empty'
    capability_uids:
    - capability-b4ac88fc
    - capability-ccac1b1d
    story_uids:
    - story-86c7c21b
    description: STORY-93 is homed on CAP-89, whose '### The authoring start point'
      section is a near-verbatim restatement of CAP-81's entire body (complete layout
      document, width ladder, document background, laid-out root, one visible run,
      validates/renders/screenshots immediately, one shape no mode selection, reproduction
      import replaces the page wholesale). CAP-81 is status=active with no merged_into
      and now holds zero stories. Either capability is an equally defensible home
      for STORY-93. Contrast the earlier rebalance, which resolved the same situation
      explicitly by setting merged_into + status=deprecated on CAP-64/65/66/67/68/69/72/73.
  - index: 2
    boundary: 'Site asset listing: CAP-89 absorbs CAP-88 (Site Asset Store), which
      remains active and empty'
    capability_uids:
    - capability-b4ac88fc
    - capability-105cfacf
    story_uids:
    - story-c46abfa6
    description: STORY-102 is homed on CAP-89, whose '### The site asset store' section
      restates CAP-88's scope point for point (one listing / three consumers — operator
      CLI, builder origin, editing surface; union of declared registry and draft asset
      directory merged by handle with provenance; one handle vocabulary). CAP-88 is
      status=active, no merged_into, zero stories, and its body still argues at length
      for being 'deliberately held apart' from CAP-80 and CAP-70 — a boundary statement
      that is now stranded. STORY-102 could sit in either capability on the text alone.
  - index: 3
    boundary: 'Asset provenance: CAP-89 absorbs CAP-80 (Asset Provenance & Licence
      Compliance), which remains active and empty'
    capability_uids:
    - capability-b4ac88fc
    - capability-745b9a6c
    story_uids:
    - story-8685be2d
    description: STORY-92 (font provenance and the ship gate) is homed on CAP-89,
      which carries an '### Asset provenance & licence compliance' section covering
      the project-level index, origin and licence terms, and outstanding licence work.
      CAP-80 is status=active, no merged_into, zero stories, and holds the fuller
      articulation of the same subject — the two-questions distinction (self-hosted
      vs shipped across customer sites), the three-state answer with unresolved treated
      as no, the distribution marker, and enforcement. The richer scope statement
      now lives on the empty capability while the story lives on the consolidated
      one.
  - index: 4
    boundary: 'Colour census and palette retrofit: CAP-89 absorbs CAP-83 (Site Colour
      Census & Palette Retrofit), which remains active and empty'
    capability_uids:
    - capability-b4ac88fc
    - capability-e382c142
    story_uids:
    - story-5e7eb0c5
    description: 'STORY-97 is homed on CAP-89 (which claims ''what colours does it
      actually contain'' among its four questions), while CAP-83 — status=active,
      no merged_into, zero stories — is a dedicated capability for exactly and only
      this story''s content: the census, palette derivation by exact alpha collapse
      then hue-family ramp grouping, the lossless-or-refuse write, and re-runnability.
      CAP-83 additionally carries the explicit boundary against CAP-70 for the palette
      model itself; that resolution does not appear on CAP-89, so re-homing has silently
      dropped a stated boundary.'
  - index: 5
    boundary: 'The edit render: CAP-87 (In-Page Copy Editing) absorbs CAP-84 (Edit
      Render Channel), which remains active and empty and is still named as owner
      by two sibling stories'
    capability_uids:
    - capability-12fee326
    - capability-25f7e486
    story_uids:
    - story-af36c2cb
    - story-3bf94bd4
    description: 'STORY-98 and STORY-101 are both homed on CAP-87, whose ''### The
      edit render channel'' section restates CAP-84''s body (third channel, deliberate
      inertness, settled state, derived segmentation, addresses and outlines). CAP-84
      is status=active, no merged_into, zero stories. This one is load-bearing beyond
      bookkeeping: STORY-98''s own body scopes itself as ''renderer-side only'' and
      puts the editor UI out of scope — i.e. it draws precisely the CAP-84/CAP-87
      line the consolidation erased — and two sibling stories still cite CAP-84 as
      a live owner in their Technical Context (''the editable render belongs to CAP-84''
      in STORY-99; ''Depends on the edit rendering (CAP-84) for the region addresses''
      in STORY-101). Cross-capability dependency prose and actual capability homes
      now disagree.'
  - index: 6
    boundary: 'Gradient authoring: an L1 authorable value axis delivered inside a
      capture-and-diff story'
    capability_uids:
    - capability-aa030c83
    - capability-ae9d65d6
    story_uids:
    - story-82eb6908
    - story-c490f1cf
    description: STORY-76 is titled 'captured, authored, and diffed' and its story
      statement asks for a gradient 'authorable as a content value that resolves to
      a surface fill'. Capture and diff are CAP-63; the authorable value is not. CAP-70
      owns the absolute-or-overlay value system — every colour/length/radius carried
      as a validated literal on L1 leaf axes (STORY-80) — and CAP-63's own Out of
      scope explicitly disclaims 'the L1 typed tree, its envelope validator and safe
      renderer'. The authoring third of STORY-76 therefore lands in the capability
      that disclaims it. Splitting the authoring axis onto CAP-70 is as defensible
      as keeping the story whole on CAP-63; the choice has not been made explicitly.
  - index: 7
    boundary: CLI-wide argument parsing and output hygiene homed on one of the several
      capabilities whose commands it governs
    capability_uids:
    - capability-aa030c83
    - capability-a12e557f
    - capability-b4ac88fc
    story_uids:
    - story-e15a19ef
    description: 'STORY-79 sits on CAP-63 because CAP-66 (1c CLI Argument Parsing
      & Output Hygiene) was merged into it, and CAP-63''s scope now carries a ''CLI
      argument parsing and output hygiene'' bullet. But the story''s guarantees are
      CLI-global, not capture/diff-local: the quiet-bootstrap guarantee is asserted
      over ''help, list, repro, l1-gate, capture, values-diff'', and a store-selecting
      flag must reach ''the render/serve it triggers'' — serving is CAP-82. The same
      1c CLI is also the surface for 1c colors (STORY-97) and site creation (STORY-93),
      both now on CAP-89. This is the infrastructure-used-by-many-capabilities shape:
      the story is evidence for a cross-cutting CLI contract that no single capability''s
      animating invariant (''0 value-diffs <=> pixel-faithful'') covers.'
  - index: 8
    boundary: 'Local serving: both CAP-82 (Site Delivery) and CAP-85 (Builder Workspace)
      own a host that serves rendered site bytes on the operator''s machine'
    capability_uids:
    - capability-a12e557f
    - capability-a994b8f3
    story_uids:
    - story-66115f6b
    - story-d34eccd8
    - story-e674c60a
    description: 'CAP-82 is scoped as getting a site ''off the operator''s machine
      and in front of a visitor'', yet STORY-96''s whole subject is an *agreement*
      between the deployed site and the local preview server, and STORY-95 supplies
      that preview server. CAP-85 independently claims ''the workspace origin — one
      host serving ... any rendered channel of any site in the store''. Two capabilities
      therefore own local serving of rendered bytes. STORY-99''s Technical Context
      flags the collision itself: a non-cacheable directive was added to the shared
      file-sending path ''which the standalone local preview server (STORY-95 / STORY-96)
      also uses ... the behaviour now exists outside this story''s declared scope''.
      A change made under CAP-85 altered behaviour attributed to CAP-82, through shared
      code neither capability names as its own.'
  - index: 9
    boundary: The editable-region address vocabulary is defined, stamped and read
      across three capabilities
    capability_uids:
    - capability-f753cecd
    - capability-12fee326
    - capability-25f7e486
    story_uids:
    - story-37a3921b
    - story-3bf94bd4
    - story-af36c2cb
    description: CAP-86 owns 'the address of an editable region, its strict parse
      and its single resolution rule'; the edit render (STORY-98) stamps those addresses
      onto elements; the gesture (STORY-101) turns a clicked element back into one.
      STORY-101's Technical Context states 'One implementation of the address reading.
      The logic that turns a clicked element back into a region address is the same
      source the rendering's stamping is defined against, delivered to the browser
      rather than re-written for it.' One artifact, shared by three capabilities'
      stories. The producer/consumer split is stated in prose on each story, so this
      is weaker than clusters 1-5 — flagged because a single shared address implementation
      with no single named owner is exactly where an unowned regression lands.
---

# Cross-Capability Overlap Survey

**Clusters identified**: 9

**Scope surveyed**: 21 capabilities (13 active, 8 deprecated with `merged_into`), 25 stories.
Story-to-capability assignment was read from each story ticket's own `fields.capability_uid`
rather than from `xgd ticket list --filter`, because the filter index returned stale
assignments for five stories (STORY-92/93/97/98/102 each matched two capabilities).

## Headline

Two distinct kinds of overlap are present.

**Clusters 1-5 are consolidation residue, and they are the same defect five times.** A recent
rebalance moved every story off CAP-80, CAP-81, CAP-83, CAP-84 and CAP-88 into two new
consolidated capabilities (CAP-89 and CAP-87), copying their scope text across — but left all
five originals `status: active` with no `merged_into` and zero stories. The earlier rebalance
handled the identical situation correctly (CAP-64/65/66/67/68/69/72/73 all carry
`merged_into` + `status: deprecated`), so the resolution pattern already exists in the matrix
and simply was not applied here. Until it is, five stories each have two live, textually
near-identical homes.

**Clusters 6-9 are genuine content boundaries** that no capability body currently resolves.

## Clusters

### Cluster 1: Site scaffold: CAP-89 (Site Materials & Starting Point) restates CAP-81 (Site Creation & Authoring Start Point) in full, while CAP-81 remains active and empty
**Capabilities**: capability-b4ac88fc, capability-ccac1b1d
**Stories**:
- story-86c7c21b
**Overlap**: STORY-93 is homed on CAP-89, whose '### The authoring start point' section is a near-verbatim restatement of CAP-81's entire body (complete layout document, width ladder, document background, laid-out root, one visible run, validates/renders/screenshots immediately, one shape no mode selection, reproduction import replaces the page wholesale). CAP-81 is status=active with no merged_into and now holds zero stories. Either capability is an equally defensible home for STORY-93. Contrast the earlier rebalance, which resolved the same situation explicitly by setting merged_into + status=deprecated on CAP-64/65/66/67/68/69/72/73.

### Cluster 2: Site asset listing: CAP-89 absorbs CAP-88 (Site Asset Store), which remains active and empty
**Capabilities**: capability-b4ac88fc, capability-105cfacf
**Stories**:
- story-c46abfa6
**Overlap**: STORY-102 is homed on CAP-89, whose '### The site asset store' section restates CAP-88's scope point for point (one listing / three consumers — operator CLI, builder origin, editing surface; union of declared registry and draft asset directory merged by handle with provenance; one handle vocabulary). CAP-88 is status=active, no merged_into, zero stories, and its body still argues at length for being 'deliberately held apart' from CAP-80 and CAP-70 — a boundary statement that is now stranded. STORY-102 could sit in either capability on the text alone.

### Cluster 3: Asset provenance: CAP-89 absorbs CAP-80 (Asset Provenance & Licence Compliance), which remains active and empty
**Capabilities**: capability-b4ac88fc, capability-745b9a6c
**Stories**:
- story-8685be2d
**Overlap**: STORY-92 (font provenance and the ship gate) is homed on CAP-89, which carries an '### Asset provenance & licence compliance' section covering the project-level index, origin and licence terms, and outstanding licence work. CAP-80 is status=active, no merged_into, zero stories, and holds the fuller articulation of the same subject — the two-questions distinction (self-hosted vs shipped across customer sites), the three-state answer with unresolved treated as no, the distribution marker, and enforcement. The richer scope statement now lives on the empty capability while the story lives on the consolidated one.

### Cluster 4: Colour census and palette retrofit: CAP-89 absorbs CAP-83 (Site Colour Census & Palette Retrofit), which remains active and empty
**Capabilities**: capability-b4ac88fc, capability-e382c142
**Stories**:
- story-5e7eb0c5
**Overlap**: STORY-97 is homed on CAP-89 (which claims 'what colours does it actually contain' among its four questions), while CAP-83 — status=active, no merged_into, zero stories — is a dedicated capability for exactly and only this story's content: the census, palette derivation by exact alpha collapse then hue-family ramp grouping, the lossless-or-refuse write, and re-runnability. CAP-83 additionally carries the explicit boundary against CAP-70 for the palette model itself; that resolution does not appear on CAP-89, so re-homing has silently dropped a stated boundary.

### Cluster 5: The edit render: CAP-87 (In-Page Copy Editing) absorbs CAP-84 (Edit Render Channel), which remains active and empty and is still named as owner by two sibling stories
**Capabilities**: capability-12fee326, capability-25f7e486
**Stories**:
- story-af36c2cb
- story-3bf94bd4
**Overlap**: STORY-98 and STORY-101 are both homed on CAP-87, whose '### The edit render channel' section restates CAP-84's body (third channel, deliberate inertness, settled state, derived segmentation, addresses and outlines). CAP-84 is status=active, no merged_into, zero stories. This one is load-bearing beyond bookkeeping: STORY-98's own body scopes itself as 'renderer-side only' and puts the editor UI out of scope — i.e. it draws precisely the CAP-84/CAP-87 line the consolidation erased — and two sibling stories still cite CAP-84 as a live owner in their Technical Context ('the editable render belongs to CAP-84' in STORY-99; 'Depends on the edit rendering (CAP-84) for the region addresses' in STORY-101). Cross-capability dependency prose and actual capability homes now disagree.

### Cluster 6: Gradient authoring: an L1 authorable value axis delivered inside a capture-and-diff story
**Capabilities**: capability-aa030c83, capability-ae9d65d6
**Stories**:
- story-82eb6908
- story-c490f1cf
**Overlap**: STORY-76 is titled 'captured, authored, and diffed' and its story statement asks for a gradient 'authorable as a content value that resolves to a surface fill'. Capture and diff are CAP-63; the authorable value is not. CAP-70 owns the absolute-or-overlay value system — every colour/length/radius carried as a validated literal on L1 leaf axes (STORY-80) — and CAP-63's own Out of scope explicitly disclaims 'the L1 typed tree, its envelope validator and safe renderer'. The authoring third of STORY-76 therefore lands in the capability that disclaims it. Splitting the authoring axis onto CAP-70 is as defensible as keeping the story whole on CAP-63; the choice has not been made explicitly.

### Cluster 7: CLI-wide argument parsing and output hygiene homed on one of the several capabilities whose commands it governs
**Capabilities**: capability-aa030c83, capability-a12e557f, capability-b4ac88fc
**Stories**:
- story-e15a19ef
**Overlap**: STORY-79 sits on CAP-63 because CAP-66 (1c CLI Argument Parsing & Output Hygiene) was merged into it, and CAP-63's scope now carries a 'CLI argument parsing and output hygiene' bullet. But the story's guarantees are CLI-global, not capture/diff-local: the quiet-bootstrap guarantee is asserted over 'help, list, repro, l1-gate, capture, values-diff', and a store-selecting flag must reach 'the render/serve it triggers' — serving is CAP-82. The same 1c CLI is also the surface for 1c colors (STORY-97) and site creation (STORY-93), both now on CAP-89. This is the infrastructure-used-by-many-capabilities shape: the story is evidence for a cross-cutting CLI contract that no single capability's animating invariant ('0 value-diffs <=> pixel-faithful') covers.

### Cluster 8: Local serving: both CAP-82 (Site Delivery) and CAP-85 (Builder Workspace) own a host that serves rendered site bytes on the operator's machine
**Capabilities**: capability-a12e557f, capability-a994b8f3
**Stories**:
- story-66115f6b
- story-d34eccd8
- story-e674c60a
**Overlap**: CAP-82 is scoped as getting a site 'off the operator's machine and in front of a visitor', yet STORY-96's whole subject is an *agreement* between the deployed site and the local preview server, and STORY-95 supplies that preview server. CAP-85 independently claims 'the workspace origin — one host serving ... any rendered channel of any site in the store'. Two capabilities therefore own local serving of rendered bytes. STORY-99's Technical Context flags the collision itself: a non-cacheable directive was added to the shared file-sending path 'which the standalone local preview server (STORY-95 / STORY-96) also uses ... the behaviour now exists outside this story's declared scope'. A change made under CAP-85 altered behaviour attributed to CAP-82, through shared code neither capability names as its own.

### Cluster 9: The editable-region address vocabulary is defined, stamped and read across three capabilities
**Capabilities**: capability-f753cecd, capability-12fee326, capability-25f7e486
**Stories**:
- story-37a3921b
- story-3bf94bd4
- story-af36c2cb
**Overlap**: CAP-86 owns 'the address of an editable region, its strict parse and its single resolution rule'; the edit render (STORY-98) stamps those addresses onto elements; the gesture (STORY-101) turns a clicked element back into one. STORY-101's Technical Context states 'One implementation of the address reading. The logic that turns a clicked element back into a region address is the same source the rendering's stamping is defined against, delivered to the browser rather than re-written for it.' One artifact, shared by three capabilities' stories. The producer/consumer split is stated in prose on each story, so this is weaker than clusters 1-5 — flagged because a single shared address implementation with no single named owner is exactly where an unowned regression lands.

## Not flagged (checked and judged clean)

- **STORY-82 (Reproduction treatments, CAP-70) vs CAP-71 (L1 Reproduction Pipeline).** The word
  'reproduction' is context, not domain: the story's substance is L1 leaf axes and behavior-module
  config, squarely CAP-70. CAP-71's scope is fold and gate only.
- **STORY-84 (fold, CAP-71) vs CAP-63 (capture).** CAP-71's body explicitly declares the capture
  axes it consumes out of scope. Boundary already resolved in writing.
- **STORY-97 (colour census) vs CAP-70 (the palette model itself).** CAP-83's body explicitly
  resolves this ('the palette *model* itself ... belongs to the framework substrate'). Noted in
  cluster 4 only because that resolution did not travel to CAP-89 with the story.
- **STORY-100 (write path, CAP-86) vs STORY-101 (gesture, CAP-87)** as a producer/consumer pair.
  Both bodies declare the split explicitly. Only the shared *address artifact* is flagged
  (cluster 9), not the dependency.
- **STORY-102's three consumers** (CLI, builder origin, editing surface). One listing with many
  callers is normal dependency; its ambiguity is already captured by cluster 2.

## Constraint compliance

No tickets were modified. Survey only.
---
uid: report-d2b77967
id: REPORT-2286
type: report
title: 'Cross-Capability Overlap Survey: 6 clusters'
created_by: xgd
created_at: '2026-08-20T00:54:43.603342+00:00'
updated_at: '2026-08-20T00:54:43.603342+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: overlap_survey
  subject_uid: report-2485c83c
  items:
  - index: 1
    boundary: 'The site palette: colour model (framework) vs mechanical retrofit (materials)
      vs settings write (authoring)'
    capability_uids:
    - capability-ae9d65d6
    - capability-b4ac88fc
    - capability-2d32662d
    story_uids:
    - story-c490f1cf
    - story-5e7eb0c5
    - story-b3de4571
    description: 'CAP-70 defines the palette colour model, CAP-89 derives a palette
      and rewrites a site onto it, and STORY-107 (CAP-94) makes the palette an authorable
      settings group written by merged structured value. The CAP-70/CAP-89 edge is
      explicitly resolved in both bodies (model vs migration). CAP-94 is the unresolved
      third claimant: its body has no Scope or Out-of-scope section at all and names
      neither. Left unowned: which capability evidences that a settings write to a
      palette family keeps references resolvable and keeps the retrofit a fixpoint.'
  - index: 2
    boundary: A model-generated image is written into the asset registry and directory
      whose listing another capability owns
    capability_uids:
    - capability-2d32662d
    - capability-b4ac88fc
    story_uids:
    - story-b3de4571
    - story-c46abfa6
    description: 'STORY-107 (CAP-94) writes a composed drawing in as an ordinary entry
      in the site image list; STORY-102 (CAP-89) owns the one honest answer to what
      a site can reference, merging the declared registry and the draft asset directory
      with provenance. CAP-89 excludes uploading/importing/converting assets but never
      names a model-authored asset or CAP-94; STORY-107 defers fonts to CAP-89 while
      claiming generated images. Unstated: who owns the registry-entry shape, and
      whether the one asset no person vouched for surfaces in the store listing with
      distinct provenance.'
  - index: 3
    boundary: Behaviour-instance catalog, config validation and vetted default look
      sit on both sides of the module contract
    capability_uids:
    - capability-2d32662d
    - capability-ae9d65d6
    story_uids:
    - story-b3de4571
    - story-179b8c06
    description: 'CAP-70 scope claims the behavior-module contract, the catalog and
      instance validation (the slot-as-L1 security line). STORY-107 (CAP-94) lists
      the catalog, validates an instance config against each behaviour contract before
      the site validator runs, and materialises a vetted default look from that config
      - which, per CLAUDE.md and DOC-25, is an L2 preset and explicitly not a module
      concern. Three artifacts claimed by two capabilities with no rule on either
      side. Sensitive boundary: an aesthetic dial admitted on the authoring side is
      the REQ-96 violation the project warns against.'
  - index: 4
    boundary: Two operations mutate a page element through one write path, and the
      newer one retired part of the older from the control surface
    capability_uids:
    - capability-f753cecd
    - capability-fe236246
    story_uids:
    - story-37a3921b
    - story-189fc1ac
    description: 'CAP-86 states its identity as one path with two producers (operator
      and AI). STORY-106 (CAP-93) explicitly retires the copy-field pair from the
      control surface and asserts One way to change a page, while keeping the operator
      click-to-edit form on CAP-86. So CAP-86 field-level editing is now the operator
      gesture path specifically, not the shared one its body describes, and CAP-93
      scope co-claims everything STORY-100 enumerates (words, pictures, layout, look).
      Unstated: whether field derivation and the closed image pick are one contract
      with two front doors, and which capability proves an assistant-replaced element
      is still editable through the operator form. CAP-87 (capability-12fee326) is
      the consumer that keeps CAP-86 load-bearing.'
  - index: 5
    boundary: The L1 renderer layout semantics are implemented twice - once in the
      renderer, once in the acceptance gate evaluator
    capability_uids:
    - capability-2049c9ec
    - capability-ae9d65d6
    story_uids:
    - story-24098299
    - story-d0a8cfad
    - story-3569e1a4
    description: 'STORY-86 (CAP-71) runs a browser-free evaluator that mirrors the
      renderer per-viewport interpolate|snap geometry and CSS flow stacking; CAP-70
      owns the renderer, the geometry keyframes and the responsive layout mode. CAP-71
      out-of-scope disclaims the renderer artifact but not its semantics, which both
      capabilities now encode. STORY-86 itself records two defects that were the evaluator
      disagreeing with the renderer (row main-axis tiling; half-open breakpoint intervals),
      so the boundary is live. Unstated: where a change to CAP-70 geometry rules must
      be re-evidenced so it cannot silently change what the CAP-71 gate accepts.'
  - index: 6
    boundary: Two local HTTP surfaces serve a site pages, with confinement, URL resolution
      and miss semantics split across them
    capability_uids:
    - capability-a12e557f
    - capability-a994b8f3
    story_uids:
    - story-66115f6b
    - story-d34eccd8
    - story-e674c60a
    description: 'CAP-82 scope reaches into the local preview server (STORY-96 is
      explicitly the agreement between it and production, closed only when both halves
      changed) and owns which URL names which bytes, what a visitor may reach, caching
      and how a miss is answered. CAP-85 independently owns a workspace origin serving
      any rendered channel of any site, confined per site and stale-on-arrival. Neither
      out-of-scope names the other on serving: CAP-85 disclaims publish semantics,
      edit semantics and renderings; CAP-82 disclaims authoring, rendering and the
      canonical store. Unstated: whether the workspace origin is a third serving environment
      the STORY-96 agreement must hold for, and which capability pins its confinement
      and extensionless resolution.'
  cluster_count: 6
---

# Cross-Capability Overlap Survey

**Anchor**: report-2485c83c
**Scope surveyed**: 13 active capabilities, 30 stories (every story is assigned; no orphans).
**Clusters identified**: 6

## Method and what was deliberately *not* flagged

Every active capability body was read in full, including its `## Out of scope`
and `## History` sections, and every story was mapped to its
`fields.capability_uid`. A boundary was treated as **already resolved** — and so
not flagged — where the capability bodies on both sides name each other and
state the rule. That excluded a large number of superficially ambiguous
assignments:

- **CAP-63 / CAP-71 / CAP-89 / CAP-82 — the `1c` CLI (STORY-79).** CAP-63 carries
  an explicit *"CLI mechanism here, verb meaning with the verb's capability"*
  ownership rule naming `repro`/`l1-gate`/`refold` (CAP-71), `colors`/`asset`
  (CAP-89) and `deploy`/`serve` (CAP-82), and its History records this as
  **overlap cluster 3 (2026-08-08), confirmed in place**. Not re-litigated.
- **CAP-63 / CAP-70 — gradients (STORY-76).** CAP-63 carries an explicit *"a value
  axis follows the layer that renders it"* rule, and its History records this as
  **overlap cluster 4 (2026-08-08), confirmed in place**. Not re-litigated.
- **CAP-90 / CAP-91 / CAP-92 — the assistant trio (STORY-103, STORY-104,
  STORY-105).** All three bodies name the other two by UID in their out-of-scope
  clauses and partition conversation / pane / contract cleanly.
- **CAP-85 / CAP-86 / CAP-87 — workspace, write path, gesture (STORY-99,
  STORY-100, STORY-101, STORY-98).** CAP-85 disclaims the gesture, edit
  semantics and the renderings; CAP-87 disclaims the write path and the chrome;
  CAP-86 disclaims the gesture and the addressing render. (A *different*, live
  ambiguity inside this group is cluster 4 below.)
- **CAP-71 / CAP-63 / CAP-70 — the fold (STORY-84).** Reciprocal out-of-scope
  clauses on all three sides.
- **CAP-89 — font provenance (STORY-92).** CAP-89 states licence compliance is a
  build-time boundary, never a serving-time one, which keeps it off CAP-82.

The six clusters below are the boundaries where **no rule is written on either
side**, so the assignment rests on an unstated judgement.

## Clusters

### Cluster 1: The site palette is modelled, migrated and authored in three capabilities

**Capabilities**: Framework Substrate (capability-ae9d65d6), Site Materials &
Starting Point (capability-b4ac88fc), Site Authoring Beyond The Element Tree
(capability-2d32662d)

**Stories**:
- story-c490f1cf (STORY-80): Absolute values re-homed in L1 — the palette colour
  model, the `shade`/`alpha` reference axes, resolution at the load boundary
- story-5e7eb0c5 (STORY-97): Colour census and repeatable palette retrofit
- story-b3de4571 (STORY-107): Author a site's settings — *"a colour palette with
  its families and steps"* written as a merged structured value

**Overlap**: Two of the three boundaries are stated and one is not. CAP-89's
out-of-scope explicitly cedes *"the palette colour model itself"* to CAP-70, and
STORY-97's own out-of-scope repeats it — that edge is clean. CAP-94 is the
unresolved third claimant: STORY-107 makes the palette a writable **settings
group**, so the same artifact is now defined by CAP-70, mechanically derived by
CAP-89, and mutated by CAP-94. CAP-94's body contains no `## Scope` or
`## Out of scope` section at all (977 characters of prose), so it names neither
CAP-70 nor CAP-89. The concrete question left open: when a settings write renames
a palette family or edits a step, is the invariant that must hold (references
stay resolvable; the retrofit remains a fixpoint) evidenced on CAP-94, CAP-89 or
CAP-70? Today no capability's ACs own it.

### Cluster 2: An image the assistant generates enters the store another capability owns

**Capabilities**: Site Authoring Beyond The Element Tree (capability-2d32662d),
Site Materials & Starting Point (capability-b4ac88fc)

**Stories**:
- story-b3de4571 (STORY-107): Generated images — *"becomes an ordinary entry in
  the site's image list, referenced from a picture element like any other"*
- story-c46abfa6 (STORY-102): The site asset store — the listing is the union of
  the declared registry and the draft asset directory, merged by handle with
  provenance

**Overlap**: STORY-107 **writes** into precisely the two sources STORY-102 owns
the reading of. CAP-89's out-of-scope excludes *"uploading, importing, converting
or processing assets"* — which reads as a rule about a person's files, and does
not name a model-authored asset or CAP-94. STORY-107 in turn names only fonts as
out of scope, deferring them to *"the font-registry-and-provenance capability"*,
which is CAP-89 as well — so STORY-107 defers one asset kind to CAP-89 while
claiming another. Left unstated: which capability owns the registry-entry shape a
generated image must take, and whether a generated image appears in the store
listing with a distinct provenance (it is, by STORY-107's own argument, the one
asset *"no person vouched for"* — exactly the kind of disagreement STORY-102
exists to report honestly).

### Cluster 3: Behaviour instances are validated and given a default look on both sides of the module contract

**Capabilities**: Site Authoring Beyond The Element Tree (capability-2d32662d),
Framework Substrate (capability-ae9d65d6)

**Stories**:
- story-b3de4571 (STORY-107): Components instantiated from a closed catalog,
  *"checked against that behaviour's own contract before the site validator
  runs"*, arriving with a *"vetted default look… laid out from the instance's own
  configuration"*
- story-179b8c06 (STORY-85): Behavior modules — the vetted core, typed config,
  named L1 presentation slots, and instance validation

**Overlap**: CAP-70's scope explicitly claims *"the contract, instance validation
(the slot-as-L1 security line)"* and the module catalog; STORY-107 performs
catalog listing and per-instance config validation as an authoring operation.
Separately, the *"vetted default look"* STORY-107 materialises is — per the
project's own rule (CLAUDE.md, DOC-25 §2/§10) — an **L2 preset**, framework
territory, explicitly not a module concern. So the same three artifacts (catalog,
instance-config validation, default presentation) are claimed by an authoring
capability and by the framework substrate, with no rule on either side saying
which owns the definition and which merely calls it. This is the boundary the
post-REQ-96 architecture is most sensitive to: an aesthetic dial admitted on the
authoring side is exactly the violation CLAUDE.md warns about.

### Cluster 4: Two operations change a page element, and one has retired part of the other

**Capabilities**: Structured Copy Editing (capability-f753cecd), Page Authoring
Through The Control Surface (capability-fe236246)

**Stories**:
- story-37a3921b (STORY-100): The field-level write path — words, typography,
  which image a region shows, how a picture is seen, a panel's background image
- story-189fc1ac (STORY-106): The map / verbatim read / bounded replace of the
  element tree

**Overlap**: CAP-86's stated identity is *"never a second mechanism beside the one
the AI uses… Two producers share this one path"*. STORY-106 then explicitly
retires the copy-field pair **from the control surface** (*"The narrower
copy-field pair retires from this surface rather than living alongside its
successor"*) and asserts *"One way to change a page"* for CAP-93, while
STORY-106's own out-of-scope note keeps the operator's click-to-edit form working
on CAP-86. The result is that CAP-86's field-level surface is now the **operator
gesture's** path specifically, not the shared one its capability body describes,
and CAP-93's scope sentence (*"a page's words, its pictures, its layout and its
look are all changed"*) co-claims everything STORY-100 enumerates. Unstated:
whether field derivation and the closed image pick are one contract with two
front doors or two contracts, and which capability's evidence proves an element
the assistant replaced is still editable through the operator's form. CAP-87
(capability-12fee326) is the consumer that keeps CAP-86 load-bearing, and is why
this is a boundary question rather than a straight merge.

### Cluster 5: The renderer's layout semantics are implemented twice, in two capabilities

**Capabilities**: L1 Reproduction Pipeline (capability-2049c9ec), Framework
Substrate (capability-ae9d65d6)

**Stories**:
- story-24098299 (STORY-86): The 3-probe gate's *"browser-free, deterministic
  layout evaluator… mirroring the renderer's per-viewport `interpolate|snap`
  geometry and CSS flow stacking"*
- story-d0a8cfad (STORY-83): The L1 substrate, its envelope validator and single
  safe renderer, including the geometry keyframes
- story-3569e1a4 (STORY-81): Per-breakpoint layout mode — the responsive
  behaviour the evaluator must mirror

**Overlap**: CAP-71's out-of-scope disclaims *"the L1 typed tree, envelope
validator, and safe renderer themselves"* — the **artifacts** — but both
capabilities now encode the renderer's **layout semantics**. STORY-86's own body
records two defects that were the evaluator disagreeing with the renderer (row
main-axis tiling; half-open `[a.at, b.at)` breakpoint intervals), which is direct
evidence that this is a live boundary and not a theoretical one. Unstated: which
capability owns the shared semantics, and therefore where a change to CAP-70's
geometry rules must be re-evidenced so it does not silently change what CAP-71's
gate accepts.

### Cluster 6: Two local HTTP surfaces serve a site's pages, with the serving guarantees split across them

**Capabilities**: Site Delivery (capability-a12e557f), Builder Workspace
(capability-a994b8f3)

**Stories**:
- story-66115f6b (STORY-96): Clean page URLs — explicitly *"the agreement is the
  capability"*, spanning the local preview server and the deployed site, *"closed
  only when both halves changed"*
- story-d34eccd8 (STORY-95): Serving a deployed snapshot to a visitor
- story-e674c60a (STORY-99): The workspace origin, which serves *"any rendered
  channel of any site in the store"*, confined per site, stale-on-arrival

**Overlap**: CAP-82's scope reaches into the local preview server for URL
resolution and owns *"which URL names which bytes, what a visitor is and is not
allowed to reach, caching, and how a miss is answered"*. CAP-85 independently
owns an origin that serves rendered site trees with its own confinement and
staleness rules. Neither body's out-of-scope names the other on **serving**:
CAP-85 disclaims publish semantics, edit semantics and the renderings, but not
serving; CAP-82 disclaims authoring, rendering and the canonical store, but not
the workspace origin. Unstated: whether the workspace origin is a third serving
environment that the STORY-96 agreement must also hold for, or a transport that
inherits CAP-82's rules — and which capability's ACs pin confinement and
extensionless resolution for it.

## Note (not a cluster)

story-c46abfa6 (STORY-102) declares licence and provenance out of scope by
deferring them to **CAP-80**, which was superseded into CAP-89 — the very
capability the story now sits in, alongside story-8685be2d (STORY-92), which owns
that work. The deferral is stale rather than wrong, but it means CAP-89's own
stories describe an internal boundary the consolidated capability no longer
draws. Intra-capability, so not filed as a cluster; recorded here because a
reader resolving cluster 2 will hit it.

---
uid: report-540cf83a
id: REPORT-2024
type: report
title: 'Cross-Capability Overlap Survey: 7 clusters'
created_by: xgd
created_at: '2026-08-16T00:14:23.389667+00:00'
updated_at: '2026-08-16T00:14:23.389667+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: overlap_survey
  subject_uid: report-7ef6a9ea
  items:
  - index: 1
    boundary: 'Field-level region edit vs element-level replace: two operations that
      both change what a page holds'
    capability_uids:
    - capability-f753cecd
    - capability-fe236246
    story_uids:
    - story-37a3921b
    - story-189fc1ac
    description: capability-f753cecd states its regions expose plain words and nothing
      else, but its only story STORY-100 now writes typography, image selection, image
      treatment and panel background images - verbatim the scope sentence of capability-fe236246
      (how a pages words, its pictures, its layout and its look are all changed).
      Both claim to reach the same validated all-or-nothing write path. The real discriminator
      (named-region field change-map vs address-level whole-element replace) is stated
      in neither body, so a story like change the headings colour or swap the image
      in a card has no principled home.
  - index: 2
    boundary: Ownership of the post-write re-render and refresh of the displayed page
    capability_uids:
    - capability-12fee326
    - capability-f753cecd
    - capability-a994b8f3
    story_uids:
    - story-3bf94bd4
    - story-37a3921b
    - story-e674c60a
    description: capability-12fee326 bounds itself at everything between the pointer
      and the write path, yet STORY-101 is titled watch the page update in front of
      me and ends the page reloads showing the change. STORY-100 claims re-render
      for the write path (applied, validated, refused and re-rendered by the identical
      operations). capability-a994b8f3 owns the pane that displays a chosen rendering.
      capability-7e4714b7 out-of-scope independently assigns re-render to the write
      path, contradicting capability-12fee326 story.
  - index: 3
    boundary: 'The palette: overlay mechanism vs retrofit migration vs authored setting'
    capability_uids:
    - capability-ae9d65d6
    - capability-b4ac88fc
    - capability-2d32662d
    story_uids:
    - story-c490f1cf
    - story-5e7eb0c5
    - story-b3de4571
    description: 'Palette is claimed by three active capabilities: ae9d65d6 owns the
      absolute-or-overlay value system with the named overlay parked in L2 (mechanism);
      b4ac88fc owns what colours a site actually contains, the census and migration
      onto a palette; 2d32662d owns structured settings explicitly including a colour
      palette with its families and steps. No stated rule decides which owns a change
      like add a step to an existing palette family.'
  - index: 4
    boundary: Behaviour component catalog, contract validation and vetted default
      look
    capability_uids:
    - capability-2d32662d
    - capability-ae9d65d6
    story_uids:
    - story-b3de4571
    - story-179b8c06
    description: capability-2d32662d says components are instantiated from a closed
      catalog, validated against each behaviours own contract, and arrive with a vetted
      default look. capability-ae9d65d6 names Behavior module contract and catalog
      as one of its three scope sections, and the retired capability-ce902be4 (Behavior
      Module Contract and Catalog) was merged into it. Per CLAUDE.md a vetted default
      look is an L2 preset in packages/framework/src/l2 - framework territory - making
      2d32662d claim on the default look the likelier misfit.
  - index: 5
    boundary: 'Generated images: authoring operation vs site asset inventory and provenance'
    capability_uids:
    - capability-2d32662d
    - capability-b4ac88fc
    story_uids:
    - story-b3de4571
    - story-c46abfa6
    description: capability-2d32662d owns images the assistant composes itself under
      its own grantable capability because it is the one image no person vouched for.
      capability-b4ac88fc owns the asset store as the union of declared registry and
      draft asset directory, merged by handle and reported with provenance. A generated
      image is produced by the first and must appear in the second under a handle
      with exactly the interesting provenance; neither body says who owns that registration.
      STORY-100 is a third consumer of the same listing.
  - index: 6
    boundary: The guarantee that the assistant can only act on one site
    capability_uids:
    - capability-7e4714b7
    - capability-00e77e55
    story_uids:
    - story-a58a0974
    - story-93905de4
    description: capability-7e4714b7 out-of-scope disclaims the declaration and grant
      to capability-00e77e55, which resolves ownership of the declaration but not
      of the site-confinement guarantee in STORY-103 own title. STORY-103 claims it
      via binding (the assistant is offered no operation that takes a site) and via
      only through operations it has been granted; capability-00e77e55 claims it via
      the grant and validation before invocation. STORY-103 priming is also assembled
      from the operations actually granted, so grant-shape changes land in two places.
  - index: 7
    boundary: Which capability owns the local server that serves rendered site output
    capability_uids:
    - capability-a12e557f
    - capability-a994b8f3
    story_uids:
    - story-66115f6b
    - story-d34eccd8
    - story-e674c60a
    description: capability-a12e557f claims URL resolution agreement - the URL an
      author writes resolves the same way in the local preview server and in production
      - plus shareable previews. capability-a994b8f3 claims the workspace origin,
      one host serving any rendered channel of any site in the store. Both own a locally-running
      server serving rendered output. STORY-96 is cross-boundary by construction (one
      URL, two servers) and STORY-95 shareable previews overlaps the workspace preview
      display; preview means different things in each body.
  cluster_count: 7
  capabilities_surveyed: 26
  capabilities_active: 13
  capabilities_retired: 13
  stories_surveyed: 30
  unassigned_stories: 0
---

# Cross-Capability Overlap Survey

**Anchor report**: report-7ef6a9ea
**Matrix surveyed**: 26 capabilities (13 active, 13 retired), 30 stories
**Clusters identified**: 7

## Method and baseline

All 30 stories carry a `capability_uid` and every one resolves to an **active**
capability. The 13 retired capabilities (5 `superseded`, 8 `deprecated`) hold
zero stories and each carries a `merged_into` pointer, so they are tombstones
rather than competing claims and were excluded from the survey.

Story assignment across the 13 active capabilities:

| Capability | Stories |
|---|---|
| capability-ae9d65d6 Framework Substrate | 7 (STORY-80,81,82,83,85,90,91) |
| capability-aa030c83 1c Capture & Diff Fidelity | 5 (STORY-75,76,77,78,79) |
| capability-b4ac88fc Site Materials & Starting Point | 4 (STORY-92,93,97,102) |
| capability-a12e557f Site Delivery | 3 (STORY-94,95,96) |
| capability-12fee326 In-Page Copy Editing | 2 (STORY-98,101) |
| capability-2049c9ec L1 Reproduction Pipeline | 2 (STORY-84,86) |
| capability-00e77e55 Site Control Surface | 1 (STORY-105) |
| capability-2d32662d Site Authoring Beyond The Element Tree | 1 (STORY-107) |
| capability-44a04848 Assistant Pane | 1 (STORY-104) |
| capability-7e4714b7 AI Site Assistant | 1 (STORY-103) |
| capability-a994b8f3 Builder Workspace | 1 (STORY-99) |
| capability-f753cecd Structured Copy Editing | 1 (STORY-100) |
| capability-fe236246 Page Authoring Through The Control Surface | 1 (STORY-106) |

Most active capabilities carry an explicit **Out of scope** section, and those
sections already resolve a large number of adjacent boundaries. This survey
reports only the boundaries that remain ambiguous *after* reading those
disclaimers — see "Considered and not flagged" at the end for the ones the
capability bodies already settle.

## Clusters

### Cluster 1: Two operations both change what a page holds — field-level edit vs element-level replace
**Capabilities**: capability-f753cecd (Structured Copy Editing), capability-fe236246 (Page Authoring Through The Control Surface)
**Stories**:
- story-37a3921b (STORY-100): Change the words, how they are set, which images appear on my page and how a picture is seen — through one validated, all-or-nothing edit, the same path the AI uses
- story-189fc1ac (STORY-106): Have the assistant compose a page — see where everything sits, read an element as it stands, and replace it — without it ever being able to write markup, styles or scripts

**Overlap**: This is the strongest cluster, and it involves a capability body
that its own only story has outgrown. capability-f753cecd states its regions
expose "**plain words and nothing else**, so no control this surface can offer
is capable of carrying raw HTML or CSS". STORY-100 now writes considerably more
than words: "how those words are set", "which image goes there and how that
picture is framed, shaped and colour-adjusted", and "which image is painted
behind it". Those are typography, image selection and image treatment — which is
verbatim the scope sentence of capability-fe236246: "how a page's words, its
**pictures**, its layout and its **look** are all changed".

Both capabilities therefore own an operation that changes page content, and both
state that their operation "reaches the same validated, all-or-nothing write
path". The real discriminator appears to be *shape of the change* — a named
region plus a field change-map (f753cecd) versus an address plus a whole-element
replacement (fe236246) — but that discriminator is not stated in either
capability body. A new story such as "change the heading's colour" or "swap the
image in a card" has no principled home under the text as written.

**Suggested resolution**: state the field-edit vs element-replace discriminator
explicitly in both bodies, and correct capability-f753cecd's "plain words and
nothing else" sentence, which its only story already contradicts.

---

### Cluster 2: Who owns the post-write re-render and the refresh of the displayed page
**Capabilities**: capability-12fee326 (In-Page Copy Editing), capability-f753cecd (Structured Copy Editing), capability-a994b8f3 (Builder Workspace)
**Stories**:
- story-3bf94bd4 (STORY-101): Click the words on my page and change them, and watch the page update in front of me
- story-37a3921b (STORY-100): Change the words, how they are set, which images appear on my page and how a picture is seen
- story-e674c60a (STORY-99): The builder workspace: one browser surface showing my real rendered site, with the controls that act on it, served from a single origin

**Overlap**: Three capabilities each have a claim on what happens *after* a write
lands, and the three claims are not consistent with one another.

- capability-12fee326 says it "owns everything between the pointer **and the
  write path**" — an upper bound that stops at the write. But STORY-101's title
  is "...and watch the page update in front of me", and its loop ends "the page
  reloads showing the change, still editable", which is strictly after the write.
- STORY-100 (capability-f753cecd) states an image edit is "named, read, applied,
  validated, refused **and re-rendered** by the identical operations a copy edit
  is" — claiming re-render for the write path.
- capability-a994b8f3 owns "the pane that displays a chosen rendering of a chosen
  site", which is the thing that must actually show the updated render.

Corroborating the confusion: capability-7e4714b7's own out-of-scope section
assigns "the write path itself — validation, atomicity and re-render..." away to
the write path, i.e. a fourth capability's body asserts re-render belongs to
f753cecd, contradicting capability-12fee326's story.

**Suggested resolution**: assign re-render-after-write to exactly one capability
and align the three bodies plus capability-7e4714b7's out-of-scope line to it.

---

### Cluster 3: The palette — overlay mechanism, retrofit migration, and settings surface
**Capabilities**: capability-ae9d65d6 (Framework Substrate), capability-b4ac88fc (Site Materials & Starting Point), capability-2d32662d (Site Authoring Beyond The Element Tree)
**Stories**:
- story-c490f1cf (STORY-80): Absolute values re-homed in L1: every colour, length, and radius is carried as a validated literal, with a palette overlay for colour
- story-5e7eb0c5 (STORY-97): Colour census and repeatable palette retrofit: measure a site's colours, then migrate it onto a palette without moving a pixel
- story-b3de4571 (STORY-107): Author a site's settings, components, page metadata and generated images through the control surface

**Overlap**: "Palette" is claimed by three active capabilities at once.
capability-ae9d65d6 owns the "absolute-or-overlay value system" with "the named
overlay parked in L2" — the palette *mechanism*. capability-b4ac88fc owns "what
colours does it actually contain" — the census and the *migration onto* a
palette. capability-2d32662d owns the site's structured settings, explicitly
including "a colour palette with its families and steps" — the palette as an
*authored setting*.

A palette therefore has a definitional home, a migration home and an authoring
home, with no stated rule for which owns a given change. A story like "add a
step to an existing palette family" could land in any of the three.

**Suggested resolution**: name the three facets (mechanism / retrofit / authored
setting) explicitly in each body so the split is deliberate rather than implicit.

---

### Cluster 4: Behaviour component catalog, contract validation and vetted default look
**Capabilities**: capability-2d32662d (Site Authoring Beyond The Element Tree), capability-ae9d65d6 (Framework Substrate)
**Stories**:
- story-b3de4571 (STORY-107): Author a site's settings, components, page metadata and generated images through the control surface
- story-179b8c06 (STORY-85): Behavior modules: vetted core + typed config + L1 presentation slots

**Overlap**: capability-2d32662d states components are "instantiated from a
**closed catalog**, validated against **each behaviour's own contract**, and
arrive with a **vetted default look** derived from their configuration".
capability-ae9d65d6 explicitly owns the "**Behavior module contract & catalog**"
as one of its three named scope sections — and the retired
capability-ce902be4 ("Behavior Module Contract & Catalog") was merged into
capability-ae9d65d6, confirming that is the catalog's home.

So the catalog, the contract that instances are validated against, and the
default-look derivation are each named in both bodies. Per project instruction
(CLAUDE.md), a vetted default look is an **L2 preset** in
`packages/framework/src/l2/` — framework territory — which makes
capability-2d32662d's claim on the default look the more likely misfit.

**Suggested resolution**: split *defining* the catalog/contract/preset
(ae9d65d6) from *instantiating* against it through the control surface
(2d32662d), and say so in both.

---

### Cluster 5: Generated images versus the site asset inventory
**Capabilities**: capability-2d32662d (Site Authoring Beyond The Element Tree), capability-b4ac88fc (Site Materials & Starting Point)
**Stories**:
- story-b3de4571 (STORY-107): Author a site's settings, components, page metadata and generated images through the control surface
- story-c46abfa6 (STORY-102): Ask my site what assets it has, and get the truth rather than what it happens to have declared

**Overlap**: capability-2d32662d owns "images the assistant composes itself",
accepted or refused whole "under its own grantable capability, because it is the
one image in a site that no person vouched for". capability-b4ac88fc owns the
site asset store — "one answer to *what can this site reference*" — built as the
union of "the declared registry inside the site definition" and "the site's
draft asset directory", "merged by handle and reported with **provenance**".

A generated image is both: it is produced by 2d32662d's operation and must then
appear in b4ac88fc's inventory, under a handle, with a provenance that is
precisely the interesting case (nobody vouched for it). Neither body says which
one owns that registration and its provenance marking. STORY-100 compounds it by
choosing images "over the same listing of the site's images" — a third consumer
of the same inventory.

**Suggested resolution**: decide whether generated-image provenance is an asset
store concern (b4ac88fc) or an authoring concern (2d32662d), and state the
handoff.

---

### Cluster 6: The guarantee that the assistant can only act on one site
**Capabilities**: capability-7e4714b7 (AI Site Assistant), capability-00e77e55 (Site Control Surface)
**Stories**:
- story-a58a0974 (STORY-103): Hold one continuing conversation about my site with an assistant that can only act on that site
- story-93905de4 (STORY-105): See everything an assistant can do to my site declared in one place, granted narrowly, checked before it runs, and written down call by call

**Overlap**: capability-7e4714b7's out-of-scope correctly disclaims *the
declaration and grant* to capability-00e77e55. But the site-confinement
**guarantee** in STORY-103's own title — "an assistant that can only act on that
site" — is jointly produced and claimed on both sides. STORY-103 claims it
through binding ("the assistant is offered no operation that takes one, so
acting on the wrong site is not a mistake available to it") and through "able to
change the site only through the operations it has been granted".
capability-00e77e55 claims it through "The grant — a separate statement of which
capability groups a given consumer gets" and "validation before invocation".

A related seam: STORY-103's **priming** is "assembled from the operations it was
actually granted" — the conversation capability derives its prompt from the
control surface's grant, so a change to grant shape lands in two places.

**Suggested resolution**: the disclaimer resolves ownership of the *declaration*
but not of the *confinement guarantee*; name which capability's UATs are the
evidence that the assistant cannot touch a second site.

---

### Cluster 7: Who owns the local server that serves rendered site output
**Capabilities**: capability-a12e557f (Site Delivery), capability-a994b8f3 (Builder Workspace)
**Stories**:
- story-66115f6b (STORY-96): Clean page URLs: the link an author writes resolves the same in local preview and on the deployed site
- story-d34eccd8 (STORY-95): Serve a deployed snapshot: shareable previews and live published sites reach a visitor
- story-e674c60a (STORY-99): The builder workspace: one browser surface showing my real rendered site, with the controls that act on it, served from a single origin

**Overlap**: capability-a12e557f claims "**URL resolution agreement** — the URL
an author writes resolves the same way in the local preview server and in
production", and claims shareable previews. capability-a994b8f3 claims "**the
workspace origin** — one host serving the workspace document... and **any
rendered channel of any site in the store**".

Both therefore own a locally-running server that serves a site's rendered
output. STORY-96 is explicitly cross-boundary by construction — its whole point
is that one URL behaves identically in two servers — so it cannot sit cleanly on
either side, and STORY-95's "shareable previews" overlaps the workspace's
preview display. The word "preview" is doing different work in each body.

**Suggested resolution**: distinguish the *workspace origin* (operator-facing,
edit channel, single origin) from the *preview/publish server* (visitor-facing,
deployed snapshot), and state which serves the local preview STORY-96 tests.

## Considered and not flagged

These were examined and judged resolved by the capability bodies, or ordinary
dependency rather than overlap:

- **story-46e3b3c7 (STORY-82) reproduction treatments in Framework Substrate** —
  reads like reproduction-pipeline work, but the story's mechanism is explicitly
  "the framework's post-pivot surfaces — L1 leaf axes... plus named L1 slots",
  and capability-2049c9ec's out-of-scope hands the L1 tree and renderer to
  capability-ae9d65d6. Clearly scoped despite the title.
- **story-8acc338d (STORY-84) fold / story-24098299 (STORY-86) gate** —
  capability-2049c9ec names both "The fold" and "The 3-probe acceptance gate" in
  scope and disclaims the capture axes it consumes to capability-aa030c83.
  Resolved.
- **story-7f437d57 (STORY-104) assistant pane vs story-e674c60a (STORY-99)
  workspace** — capability-44a04848 disclaims "the split's geometry" to the
  workspace and "the conversation itself" to capability-7e4714b7. Resolved on
  both sides.
- **story-86c7c21b (STORY-93) scaffold seeds a valid L1 document** — depends on
  capability-ae9d65d6's definition of validity, but capability-b4ac88fc
  explicitly claims "the authoring start point". Normal dependency.
- **story-8685be2d (STORY-92) font provenance** — a repo-level licence gate
  sitting in a site-materials capability. Sole active home; no second capability
  claims it, so it is a placement question rather than an overlap.
- **Retired capabilities** — all 13 hold zero stories and carry `merged_into`
  pointers. Tombstones, not competing claims.

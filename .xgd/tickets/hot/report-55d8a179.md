---
uid: report-55d8a179
id: REPORT-3561
type: report
title: 'Report: overlap_survey for report-e37a6b4a'
created_by: xgd
created_at: '2026-09-09T22:59:36.262571+00:00'
updated_at: '2026-09-09T22:59:36.262571+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: overlap_survey
  subject_uid: report-e37a6b4a
  items:
  - index: 1
    boundary: A deployed capture that must not be challenged by the builder's own
      sign-in gate
    capability_uids:
    - capability-aa030c83
    - capability-3606e35b
    - capability-a994b8f3
    story_uids:
    - story-7fa314f5
    description: STORY-125 defines a host the deployment owns outright, fulfilling
      every request in-process so a launched browser is never challenged by the operator
      access gate. That is a statement about CAP-103's 'the gate covers every door'
      property and about CAP-85's workspace origin serving a site's rendered channels.
      It sits in CAP-63, whose scope is the 1c capture-to-compare spine and whose
      invariant ('0 value-diffs iff pixel-faithful') this story does not advance.
  - index: 2
    boundary: Capture as a capacity of the deployed runtime vs. platform deployment
      configuration
    capability_uids:
    - capability-aa030c83
    - capability-5d07b533
    story_uids:
    - story-080c6036
    description: 'STORY-124''s in-scope list is dominated by deployed-runtime concerns
      rather than fidelity concerns: browser acquisition by environment injection,
      an unconfigured browser capability being an ordinary state rather than a boot
      failure, and leased/metered/capped browser sessions released on every exit.
      Those are properties of the platform''s own Worker, its configuration seams
      and its degradation behaviour, which CAP-102 owns; CAP-63 owns capture as a
      fidelity instrument, not the runtime''s capacity to host one.'
  - index: 3
    boundary: Who owns canonical site bytes once the store moves to Cloudflare
    capability_uids:
    - capability-c4c7a854
    - capability-a12e557f
    story_uids:
    - story-fde7370b
    - story-5349d01f
    description: 'CAP-82 separates itself from CAP-101 with the clause ''Out of scope:
      the canonical site store (delivery moves serving, not storing - site definitions
      stay canonical on the operator''s machine)''. STORY-121 removes that premise
      by relocating canonical definitions, pages and asset bytes into D1 and R2 -
      the same class of Cloudflare shared storage STORY-94 mints a published revision
      into. The distinguishing clause now rests on a fact that no longer holds, so
      ownership of site bytes in shared Cloudflare storage has no stated answer on
      either side.'
  - index: 4
    boundary: The change log is simultaneously a storage-port write-contract detail
      and a capability of its own
    capability_uids:
    - capability-c4c7a854
    - capability-702b7c02
    story_uids:
    - story-fde7370b
    - story-6cd17452
    description: CAP-99's stated mechanism is a monotone per-site change count that
      every write hands back plus a bounded window of self-describing records; that
      count is produced by the store's write path. STORY-121 lists 'the change log'
      among what its database keeps, and CAP-101's body notes its second implementation
      'keeps a real change count'. The journal's mechanism and the storage port's
      write contract are the same object. CAP-99 disambiguates itself from the revision
      model and from status but says nothing about the storage port, and CAP-101 says
      nothing about the journal.
  - index: 5
    boundary: Two AI-reachable routes to changing the words and pictures on a page
    capability_uids:
    - capability-f753cecd
    - capability-fe236246
    story_uids:
    - story-37a3921b
    - story-189fc1ac
    description: STORY-100 changes words, typography, images and image framing as
      a field-level change map over addressed editable regions, explicitly 'the same
      path the AI uses'. STORY-106 changes the same things as an element-level read/replace
      over the page's closed vocabulary, and CAP-93 states its replace 'is how a page's
      words, its pictures, its layout and its look are all changed'. CAP-93's out-of-scope
      clause cedes only the operator's click-to-edit form (the human gesture) to CAP-86/CAP-87;
      it does not partition the AI route, which is exactly what STORY-100 claims.
  - index: 6
    boundary: Two colour censuses over the same site definition
    capability_uids:
    - capability-a0bba4ec
    - capability-b4ac88fc
    story_uids:
    - story-ee073693
    - story-5e7eb0c5
    description: 'Both capabilities own an artifact called a colour census, each produced
      by traversing the whole site definition and every page and reporting counts:
      CAP-98''s over palette entries and their reference counts, CAP-89''s over colour
      literals and their use counts. The boundary is documented in both directions
      (CAP-98 cedes literal census and palette derivation to CAP-89; CAP-89 cedes
      palette-editor UI back), making this the weakest cluster and possibly already
      resolved. Flagged because the two artifacts collide in name, mechanism and output
      shape, so a story titled ''count the colours in this site'' carries no cue as
      to its home.'
---

# Cross-Capability Overlap Survey

**Clusters identified**: 6

Surveyed all 35 capabilities and all 45 stories. 22 capabilities are `active` and
every one of them holds at least one story; the 13 zero-story capabilities are all
`deprecated` or `superseded` (see "Explicitly excluded" below).

Most capability bodies in this matrix carry an explicit `## Out of scope` section
that names its neighbour by UID. Where such a clause resolves a boundary in both
directions, the pair is **not** flagged. The clusters below are the cases where
either no clause exists, or the clause is stated in terms of a premise another
story has since removed.

## Clusters

### Cluster 1: A deployed capture that must not be challenged by the builder's own sign-in gate
**Capabilities**: CAP-63 (1c Capture & Diff Fidelity), CAP-103 (Operator Access Gate: Who May Reach The Builder), CAP-85 (Builder Workspace: Chrome, Origin & Display Panel)
**Stories**:
- story-7fa314f5 (STORY-125): Self-origin fulfilment: a picture of my own draft is the draft, not a sign-in challenge

**Overlap**: The story's substance is that the deployment *owns its own hostname* —
every request addressed to it is fulfilled in-process or answered not-found
in-process, and nothing is handed to the network — so a browser the deployment
launches is never challenged by the gate. That is a statement about two other
capabilities' subjects: CAP-103's load-bearing property is "the gate covers every
door", and this story defines a host on which the gate is deliberately not the
answering party; CAP-85 owns "the workspace origin ... any rendered channel of any
site in the store", and this story serves the draft and edit channels byte-for-byte
as that origin does. It currently sits in CAP-63, whose declared scope is the `1c`
toolchain's capture→compare spine and whose animating invariant is "0 value-diffs ⟺
pixel-faithful" — an invariant this story does not advance.

### Cluster 2: Capture as a capacity of the deployed runtime vs. platform deployment configuration
**Capabilities**: CAP-63 (1c Capture & Diff Fidelity), CAP-102 (Platform Build, Deploy & Live-Origin Verification)
**Stories**:
- story-080c6036 (STORY-124): Cloud browser capture: the deployed builder can take a picture

**Overlap**: The in-scope list is dominated by deployed-runtime concerns rather than
fidelity concerns: which browser answers is chosen by environment injection; "a
deployment with no browser capability configured is an **ordinary state, not a boot
failure**"; browser sessions are leased, metered, capped, and released on every
exit. Those are properties of the platform's own Worker, its configuration seams and
its degradation behaviour — CAP-102's subject ("a build that refuses before it emits
a broken artifact, a deploy whose ... migration and secret seams belong to the
tickets that need them"). CAP-63 owns capture as a fidelity instrument; it does not
claim the deployed runtime's capacity to host one.

### Cluster 3: Who owns canonical site bytes once the store moves to Cloudflare
**Capabilities**: CAP-101 (Site Storage Port: One Async Store Behind Every Edit), CAP-82 (Site Delivery: Deploy & Public Serving)
**Stories**:
- story-fde7370b (STORY-121): Cloudflare Site Store: Definitions In A Database, Bytes In An Object Store, Scoped To One Account
- story-5349d01f (STORY-94): Publish a site to shared storage: one revision-minting publish, driven from the builder and the command line

**Overlap**: CAP-82 separates itself from CAP-101 with the clause "Out of scope: the
canonical site store (delivery moves serving, not storing — **site definitions stay
canonical on the operator's machine**)". STORY-121 removes exactly that premise: it
relocates canonical site definitions, pages and asset bytes into D1 and R2 — the
same class of Cloudflare shared storage STORY-94 publishes a revision into. The
sentence that distinguishes the two capabilities is therefore stated in terms of a
fact that is no longer true, leaving "which capability owns site bytes living in
shared Cloudflare storage" without a stated answer on either side.

### Cluster 4: The change log — a store mechanism and a capability of its own
**Capabilities**: CAP-101 (Site Storage Port: One Async Store Behind Every Edit), CAP-99 (Draft Change Journal: What Changed On The Draft, And Who Changed It)
**Stories**:
- story-fde7370b (STORY-121): Cloudflare Site Store: Definitions In A Database, Bytes In An Object Store, Scoped To One Account
- story-6cd17452 (STORY-115): Draft change journal: know what changed since you last looked, without re-reading the site

**Overlap**: CAP-99's stated mechanism is "a **monotone per-site change count** that
every write hands back, plus a **bounded window of self-describing records**" — that
count is produced by the store's write path, not beside it. STORY-121 correspondingly
lists "the change log" among the things its database keeps, and CAP-101's own body
notes its second implementation "keeps a real change count". So the journal's
mechanism and the storage port's write contract are the same object. CAP-99 carefully
disambiguates itself from the *revision model* and from `status`, but says nothing
about the storage port; CAP-101 says nothing about the journal. Neither cedes to the
other.

### Cluster 5: Two AI-reachable routes to changing the words and pictures on a page
**Capabilities**: CAP-86 (Structured Copy Editing: One Validated, Atomic Write Path), CAP-93 (Page Authoring Through The Control Surface: Read & Replace The Element Tree)
**Stories**:
- story-37a3921b (STORY-100): Change the words, how they are set, which images appear on my page and how a picture is seen — through one validated, all-or-nothing edit, the same path the AI uses
- story-189fc1ac (STORY-106): Have the assistant compose a page — see where everything sits, read an element as it stands, and replace it — without it ever being able to write markup, styles or scripts

**Overlap**: Both stories are the route by which something acting on the operator's
behalf changes a page's words and images, and both rest their safety on the same
"one validated, all-or-nothing write path". STORY-100 does it as a field-level change
map over addressed editable regions; STORY-106 does it as an element-level
read/replace over the page's closed vocabulary — and CAP-93 states that its replace
"is how a page's words, its pictures, its layout and its look are all changed".
CAP-93's out-of-scope clause cedes only "the operator's own click-to-edit form
(CAP-86 / CAP-87)" — that is, the *human gesture*. It does not partition the AI
route, which is precisely what STORY-100's title claims ("the same path the AI
uses"). A future story of the form "the assistant changes an image on a page" has no
stated home.

### Cluster 6: Two colour censuses
**Capabilities**: CAP-98 (Palette Management: The Site's Named Colours, Read, Edited & Guarded), CAP-89 (Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette)
**Stories**:
- story-ee073693 (STORY-113): Palette management: read the site's colours with their usage counts, and change, add, remove or rename them under guards the store enforces
- story-5e7eb0c5 (STORY-97): Colour census and repeatable palette retrofit: measure a site's colours, then migrate it onto a palette without moving a pixel

**Overlap**: Both capabilities own an artifact called a colour census, both produced
by traversing the whole site definition and every page, both reporting counts.
CAP-98's is over *palette entries* and their reference counts (the fact its delete
rule and rename confirmation are stated in); CAP-89's is over *colour literals* and
their use counts (the evidence a retrofit derives a palette from). The boundary **is**
documented in both directions — CAP-98 cedes "deriving a palette from a folded site's
colour literals, and the census of those literals" to CAP-89, and CAP-89 cedes "any
colour-picker or palette-editor UI" back — so this is the weakest cluster here and
may well be resolved as-is. It is flagged because the two artifacts collide at the
level of name, mechanism and output shape, so a story titled "count the colours in
this site" carries no cue as to which side it belongs on.

## Explicitly excluded (checked, not flagged)

**The 13 zero-story capabilities are not overlaps.** Every one is `deprecated` or
`superseded` and carries a resolution marker — e.g. CAP-64 (`merged_into:
capability-aa030c83`, body: "ABSORBED 2026-08-05 (structural rebalance)"), CAP-83 and
CAP-88 (`superseded_by_uid: capability-b4ac88fc`). Their named domains being occupied
by stories filed under the absorbing capability is the intended post-rebalance state,
not an ambiguity: CAP-64/65/66 → CAP-63; CAP-67/68/69/72 → CAP-70; CAP-73 → CAP-71;
CAP-80/81/83/88 → CAP-89; CAP-84 → CAP-87.

**Boundaries checked and found explicitly resolved in both directions:**
- CAP-90 (AI Site Assistant) / CAP-91 (Assistant Pane) / CAP-85 (Builder Workspace) —
  CAP-91 cedes conversation lifecycle and persistence to CAP-90 and the split's
  geometry to CAP-85 by name.
- CAP-92 (Control Surface) / CAP-93 (Page Authoring) — CAP-93 states the distinction
  in its opening paragraph.
- CAP-102 (Platform Deploy) / CAP-82 (Site Delivery) — CAP-102 names CAP-82 and the
  layering between them.
- CAP-104 (Site Locale Identity) / CAP-105 (Money & Time Presentation) — CAP-105 names
  CAP-104 as the owner of locale resolution; a declared dependency, not an overlap.
- CAP-101 (Site Storage Port) / CAP-106 (Client Material Store) — CAP-106 opens "The
  site store holds *sites*. This holds everything a site is made **from**", and both
  being account-scoped D1+R2 stores is a shared substrate, not a shared subject.
- CAP-106 (Client Material Store) / CAP-100 (System Knowledge Base) — CAP-106's "What
  this capability is NOT" names the knowledge base built over it.
- CAP-86 (Structured Copy Editing) / CAP-87 (In-Page Copy Editing) — CAP-86 cedes the
  gesture, the chrome and the address-stamping render.
- CAP-63 (Capture & Diff) / CAP-70 (Framework Substrate) — CAP-63 carries an explicit
  value-axis ownership rule for the gradient axis.
- CAP-99 (Draft Change Journal) / CAP-82 (Site Delivery) — CAP-99 states "This is not
  the revision model."

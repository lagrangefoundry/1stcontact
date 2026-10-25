---
uid: bundle-f2d4641b
id: BUNDLE-25
type: bundle
title: BUG-45 + BUG-44 + BUG-47 + REQ-157 + REQ-176 + 3 more
created_by: xgd
created_at: '2026-09-09T04:18:20.758885+00:00'
updated_at: '2026-09-09T04:18:20.758885+00:00'
completed_at: null
last_field_updated: created_at
status: ready_to_reconcile
fields:
  commits:
  - working_sha: 9805ee506e68fa9ac1bcb5d533a56d2ef9a5f139
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: d46756fefa43ca8709acb13d64abccb2ac91d961
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 8d93d32d8bc56715af4fb1046c3a3d82260bd081
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 11ca5fea9ae676265d4d492c426df027f249ab53
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: ecbed061a8306552701b6f920f8a7a9cb12e980a
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: b96ff95e1d1a672d9d482bf8d1195426e4c00bac
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 2470b440e36d913b3f7bb43ea46084e7c2ececbc
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: fde87e69df30dfd16d0a987d4124138ba282af73
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 9632cd6ae08c11923bb2f4b1ca1e710581ce5db9
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  auto_merge_back: true
  priority: medium
---

# Bundle

This ticket bundles the following source tickets:


---

## BUG-45: Chat upload: a file dropped on "Put it on the site" is unusable to the assistant

## Symptom

The client dropped an image on the chat, asked for it in the hero, and got a
simplified SVG caricature instead — drawn by the assistant, substituted silently.
Challenged, it explained:

> The image you uploaded is in the system, but it's stored as an **unregistered
> asset**. […] Only registered assets can be referenced on a page. […] The image
> needs to be **registered in the asset manager** — that's done through the
> builder interface, not through our chat.

## What the store actually showed

Read from the local miniflare state before it was reset (tenant `1stcontact`,
site `alpha`):

```
material-a4932624  "Gigabyte Alchemy Gold \"A\" Logo on Navy Background"
  filename: ChatGPT Image Sep 9, 2025 at 11_24_45 AM.png
  role: "reference"        <- not "site"
  republishable: false
```

**That particular file arrived as reference material.** `placeOnSite` returns at
its first line on `role !== 'site'`, so the bytes never reached the site's asset
folder and the republishable gate was never consulted. The assistant's
explanation was confabulated: it knew the material existed from the corpus delta,
could not find it in `list_assets`, and reached for registry vocabulary.

`upload.js` takes the role from the specific button dropped on, per drop, with no
default, and no mislabelling path was found — so whether this was a misdrop or a
legibility problem in the two areas is unresolved and is not addressed here.

**The registration defect is real and independent.** Site `alpha`'s registry held
exactly one entry — `ga-gold-a.svg`, the assistant's own drawing, registered
because `write_image` registers. The client's two genuinely promoted uploads had
bytes on disk, rows in `site_assets`, and no registry entry. The only registered
picture on the site was the substitute.

## Behaviour delivered

1. **Promotion registers.** A file promoted from the chat lands as a first-class
   asset: bytes stored, registry entry created, `site.json` validated as a whole,
   and the write recorded in the draft change journal so the assistant is told a
   picture arrived rather than having to notice. It reaches this through
   `editAssetAdd` — the same path every other asset takes — so there is one set of
   rules about names and one about validity.
2. **The description becomes the alt text.** Ingestion already describes every
   uploaded image ([[DOC-38]] §6); that description was computed, stored on the
   material ticket, and discarded at the one moment a site asset wanted it. The
   ticket's title now lands on the registry entry. A title that is merely the
   filename is treated as no description and leaves `alt` empty — `alt="ChatGPT
   Image Sep 9, 2025 at 11_24_45 AM.png"` is the filename read aloud, and an
   empty field is visibly unfilled where that one looks filled.
3. **The existing gates survive.** Non-republishable material is still refused
   outright, and a refusal registers nothing and stores nothing. A name already
   taken is still renamed rather than replaced, and it is the renamed name that
   gets registered, with its own material's description.
4. **The surface stops describing uploads as impossible.** The absence
   "Uploading a picture, or any file" said a file could not arrive through a
   conversation at all — true before [[REQ-161]], and the paragraph the assistant
   read back, including the instruction to send the client to the builder
   interface. It is now "Fetching a picture, or any file, yourself": the assistant
   still cannot go and get a file, and the remedy it names is the one that works —
   ask for it to be dropped here, on "Put it on the site".
5. **Anything `list_assets` reports can be read by `get_asset`.** It read the
   registry alone, so an asset the listing had just shown raised `NOT_FOUND`; the
   manual agreed with the wrong side, describing an `asset_id` as "the
   **registered** name". Registration is not permission — nothing consults the
   registry before a page references an asset, and every capture-folded page
   points at `/assets/<name>` against an empty one. `get_asset` now answers from
   the listing, by id **or** by the `/assets/<name>` handle a page actually holds,
   and returns the listing's own shape so the two operations agree on what an
   asset is. `registered` stays reportable and is documented as provenance.
6. **No silent substitution.** `write_image` now says plainly that a drawing is
   never a stand-in for a file the client supplied: if their file cannot be found
   or used, say so and ask for it, rather than composing something similar.

## What is mechanical and what is not

Behaviours 1, 2, 3 and 5 are code, with assertions against real stores.

Behaviours 4 and 6 are text in `l1-surface.json`, projected verbatim into the
assistant's manual. Nothing enforces them — a model that ignores the manual can
still substitute a drawing. Their UATs assert the declaration no longer contains
the false claims that produced this incident; they do not assert obedience, and
are written so as not to imply it. A mechanical gate on substitution is a
different and larger design and is not attempted here.

`surface_version` moved 4 → 5: `get_asset` returns a different shape and an
absence inverted its meaning.

## Evidence

UATs, all passing:

`tests/test_UAT_FC_BUG-45_promoted_asset_is_registered.workers.test.ts`

- `..._promotion_registers_the_asset_and_carries_its_description` — behaviour 1, 2
- `..._the_promotion_is_recorded_as_a_draft_change` — behaviour 1
- `..._an_uninformative_title_leaves_alt_empty` — behaviour 2
- `..._a_colliding_name_is_renamed_and_the_renamed_one_is_registered` — behaviour 3
- `..._a_refused_promotion_registers_nothing` — behaviour 3
- `..._get_asset_answers_for_an_unregistered_file` — behaviour 5
- `..._get_asset_still_refuses_a_name_the_site_does_not_have` — behaviour 5

`tests/test_UAT_FC_BUG-45_surface_tells_the_truth.test.ts`

- `..._no_absence_claims_a_file_cannot_reach_the_site` — behaviour 4
- `..._the_absence_says_to_ask_for_the_file_here` — behaviour 4
- `..._registration_is_never_described_as_permission` — behaviour 5
- `..._write_image_forbids_standing_in_for_a_supplied_file` — behaviour 6
- `..._the_surface_version_moved_with_the_surface` — behaviour 4, 5

## Existing tests changed, and why

- `test_UAT_FC_REQ-163_ingestion.workers.test.ts` — the promotion fixture called
  `createDraft` alone, which leaves `site_json` NULL. Registration needs a site
  definition to register into, which every provisioned site has because
  `createStarterSite` writes the scaffold immediately after `createDraft`. The
  fixture now materialises a real site through the shared seed; its own assertion
  (the bytes are copied) is unchanged.
- `test_UAT_FC_REQ-130_beyond_l1.test.ts` — asserted the manual contained
  "cannot take a file from a conversation", the exact sentence behaviour 4
  removes. It now asserts the narrower absence that is still true.

## Regression

Full suite: 2240 passed, 67 skipped, 1 failed —
`bug32-webui-scope-rebrand.test.ts::test_UAT_AC960_...`, which fails identically
on an unmodified `main` checkout and is unrelated to this change.

## Not in scope

- **The n-gram quarantine gate.** [[DOC-38]] §11 specifies an n-gram check on
  control-surface text against the quarantined corpus, so the assistant cannot
  retype third-party copy from reference material onto a page. It does not exist —
  the only occurrence of "quarantine" or "n-gram" in the tree is the comment at
  `material.ts:38` saying v1 ships the prompt-level constraint and the asset gate
  instead. Real, documented, unbuilt; its own ticket.
- **`role` / `republishable` on a search hit.** [[DOC-38]] §11 says every hit
  carries its `republishable` bit; `KnowledgeHit` carries neither it nor `role`.
  Without them the assistant cannot tell reference-only material from a site file,
  so it still cannot say the genuinely useful thing — *"that one came in as
  reference; drop it on 'Put it on the site' and I'll use it."* Raised with the
  operator during this session; left out pending their decision.
- **Why the file was classified `reference`.** Needs a reproduction, not a code
  change.

## Superseded in part by BUG-44 (operator decision, 2026-09-01)

This ticket's fix landed as `fd6aa2bf39` and was then partly unwound. The
analysis that produced BUG-44 found that the registry this ticket set out to
keep in step is read by nothing else in the codebase: not the renderer, not
publish, not import, not the picker. Its `alt` is superseded by the required
`alt` on the L1 image node, its `focalPoint` has no reader anywhere, and eight
of the nine tracked `site.json` files had it empty. The operator's call was to
delete it rather than maintain it — *"we don't actually need the registry at
all"* — landed as `d46756fefa`.

**Withdrawn from this ticket's required behaviour:**

- **1. Promotion registers** — there is nothing to register. Promotion still runs
  through `editAssetAdd` for the collision rules and the journal note, which was
  the part that mattered.
- **2. The description becomes the alt text** — there is nowhere site-side to
  hold it. The material's description stays on the material ticket, and the
  surface now tells the assistant to read it there and write it onto the picture
  element. Noted in BUG-44 as the one thing the deletion cost.
- **5. `registered` remains reportable** — it is reportable nowhere, because
  there is no second state a stored file can be in.

**Kept, and still covered:** `get_asset` answering for anything `list_assets`
shows (behaviour 5's substance), promotion's republishable gate and rename-on-
collision (behaviour 3), the surface no longer claiming a file cannot arrive
through the chat (behaviour 4), and `write_image`'s refusal to stand in for a
file the client supplied (behaviour 6).

This ticket's two UAT files were re-aimed rather than deleted —
`test_UAT_FC_BUG-44_promoted_asset_is_usable.workers.test.ts` and
`test_UAT_FC_BUG-44_surface_tells_the_truth.test.ts` — so the surviving
behaviours keep their coverage under BUG-44.


---

## BUG-44: Builder AI: opaque L1 refusals and unreachable uploaded images burn a turn's budget

## Symptom

A single "build me a draft site" turn burned a large token budget on tool
flailing: five refused `set_l1` calls, two `NOT_FOUND` asset reads, a
first-call parameter-type error, and two knowledge searches for the L1
vocabulary that returned design-research prose. The turn ended with the AI
telling the client it could not use their own uploaded logo and substituting
a hand-drawn SVG.

Transcript captured in this ticket's chat comment.

## Diagnosis (evidence, not yet a fix)

This is **not** a knowledge-base content gap. Per DOC-39 §3.2 the L1 vocabulary
is a machine-readable fact and must be *projected*, never authored into a KB —
the AI searching the KB for it and getting DOC-31 back is the correct system
behaving as designed. Four distinct faults, all in the projection/runtime layer:

**1. The refusal discards the diagnosis the host already computed.**
`tools/generate/src/cli/edit.ts:216-225` builds
`SCHEMA_INVALID` carrying `${first.path}: ${first.message}` — the exact
JSON-pointer of the offending field. `lagrange-framework`
`components/ai/js/src/toolbox/runtime.js:331` (`_renderHostError`) throws
`error.message` and `error.path` away whenever the code is declared, and
returns only the surface's generic prose. The AI is told "look at anything you
invented" without being told which thing, so it bisects a large node by hand.

**2. The declaration promises the behaviour the runtime does not deliver.**
`tools/generate/src/cli/ai/l1-surface.json` — `set_l1.description` states
"the refusal names the field and what it would have accepted". It does not.
The manual is lying to the model, which is why it retried the same shape three
times.

**3. `node` has no declared schema.**
`set_l1.params.node` is `{"type": "object"}`. There is no projected L1 element
vocabulary anywhere in the surface, so the only way to learn a field name is to
read an existing node and generalise from it. `background`, `widthPx` and the
image element shape were all invented for exactly this reason.

**4. The client's file was already on the site; the AI was told it did not exist.**

The KMS is ticket-shaped throughout, and that half works. An upload becomes a
`material` ticket (`apps/control-app/src/material.ts` `ingest`) with its bytes
attached as a blob keyed by the attachment record's uid, and `KnowledgeGet`
returns that ticket whole. The AI read the brand document and the logo's vision
description through it without trouble.

The **site asset store is a different store and is not ticket-shaped**: bytes
under the draft's `assets/`, plus an `assets` registry inside the site
definition. No uid, no blob handle. `list_assets` merges both halves and reports
`registered` per entry; `get_asset` (`edit.ts:1930`) resolves the registry ONLY.

The bridge between them is `promoteToSiteAsset` (`material.ts:536`), reachable
only from `router.ts:442` — an HTTP endpoint the Library UI calls. It is not an
AI tool and is not in `l1-surface.json`.

**And it writes bytes without registering them.** Compare the two writers:

- `editAssetWrite` (`edit.ts:2081`) writes `{ siteJson: newBase, assets: [...] }`
  — registry entry and bytes together, so a drawn image is registered.
- `promoteToSiteAsset` (`material.ts:564`) writes `{ assets: [{ name, bytes }] }`
  — bytes only. A promoted file is permanently `onDisk: true, registered: false`.

So the client HAD promoted their logo through the Library, it WAS in the site's
asset store, and `get_asset` answered `NOT_FOUND` carrying the declared meaning
"Re-read the listing; do not guess again" — advice wrong twice over, because the
AI had read the listing and the thing did exist.

**The AI's resulting inference was also false, and cost the client the most.**
`image.src` in the L1 schema (`packages/site-schema/src/l1/schema.ts:1124`) is
`z.string()`, scheme-checked by the envelope allowlist and NOT checked against
the asset registry. Referencing `/assets/<name>` for an unregistered-but-present
file would have been accepted and would have rendered. Registration governs alt
text and what the picker offers — not whether a page may reference the bytes.
The AI concluded "unregistered means unusable", told the client that adding
their logo was done outside the chat, and substituted a hand-drawn SVG for it.

**What registration is actually worth — the fix follows from this.**

The registry (`site.json`'s optional `assets`, `schema.ts:992`) is read in
exactly one file: `edit.ts`, at the listing merge, `get_asset`, the collision
checks in `add_asset`/`write_image`, and `remove_asset`. Nothing else in the
repo reads `siteJson.assets`.

It is not a gate on anything that matters:

- **Rendering** — `l1ImageSchema` (`l1/schema.ts:1122`) carries its own required
  `alt`, so render-time alt comes from the node, not the registry.
- **Publishing** — `readDraftSnapshot` (`publish.ts:83`) snapshots
  `store.listAssets(slug)`, every byte on disk regardless of registration.
- **The picker** — `imageHandles` (`edit.ts:1909`) filters `listSiteAssets`,
  which is the union, so unregistered files are already offered.
- **Validation** — `image.src` is `z.string()`, scheme-checked only.

`assetRefSchema` gives it two metadata fields and both are dead: `alt` was
superseded by the node's own required `alt`, and `focalPoint` has **zero
readers** anywhere — schema definition and generated `.d.ts` only.

`listSiteAssets`'s own comment (`edit.ts:1876`) already says so: *"The registry
carries metadata (`alt`, `focalPoint`) but every real site in `storage/` has an
empty one."* Confirmed: 8 of 9 `site.json` files under `storage/` have
`assets: []`, and the one that does not (`sandbox/joyfulculinary`, 14 entries)
carries `alt: ""` on every entry — a name list duplicating `listAssets`.

**The only intended semantics for stored-but-not-registered is "undeclared"** —
stated in that same comment as something *"a future browser mode can show"*. It
is a provenance distinction for an operator-facing view that does not exist. It
was never a capability gate, and `get_asset` is the sole consumer that treats it
as one, turning "undeclared" into "does not exist".

**So the fix is `get_asset`, not the write path.** Resolving the same union
`list_assets` reports restores the "one listing, three consumers" intent this
code already states, needs no change to `promoteToSiteAsset`, and covers every
way a file reaches the store rather than just promotion. `get_asset`'s declared
summary ("Read one *registered* image or font") moves with it, as does the
surface saying plainly that registration is not a precondition for use.

Making `promoteToSiteAsset` register was the earlier reading and is rejected:
it would write `{id, src, alt: ""}` that nothing reads, leave every non-promotion
path still invisible to `get_asset`, and add a `site.json` write per promote.

**Open, and larger than this ticket:** whether the registry should exist at all.
An optional field, empty on every real site, whose two metadata fields are dead
and whose one behavioural consumer is the bug above, is a candidate for removal
rather than repair.

Removing it is defensible. **Backing site-asset metadata with material tickets
instead is not**, for three reasons that are worth recording so the question is
not reopened from scratch:

1. **Only one of five paths that write bytes into `draft/assets/` has a ticket
   behind it.** `write_image` (AI-drawn SVG) and `add_asset` (`1c asset add`)
   register but create no ticket; the capture fold mirrors an origin's assets
   and fonts are copied in, neither registering nor ticketing;
   `promoteToSiteAsset` is the only one with a `material` ticket. `gigabytealchemy`
   is the evidence — a `woff2`, `blog.*.css`, `css2` and `index` on disk against
   an empty registry and no tickets. Ticket-backed metadata would describe a
   fifth of the assets and leave the rest undescribable.

2. **The dependency runs the wrong way.** `@1stcontact/generate` depends on
   `@1stcontact/framework` and `@1stcontact/site-schema` only. The ticket store
   is `apps/control-app`, which depends on generate, not the reverse. `edit.ts`
   cannot reach a ticket without inverting that.

3. **A site must stay self-contained.** `readDraftSnapshot` reads asset bytes
   into memory precisely so a revision is immutable — `publish.ts:75` says a
   snapshot pointing at the draft's `logo.svg` "would silently change the day
   someone replaced it". `import-site.ts` moves a whole site as siteJson + pages
   + bytes, with no tenant and no ticket store. Per-asset metadata held in a
   tenant-side ticket would not survive either.

The two things are not duplicates of each other. A **material ticket** is
provenance — what the client gave us, where it came from, whether it is
republishable, what it depicts — tenant-scoped, mutable, CRM-side, not part of
the site. A **site asset** is a byte in the portable artifact, named by filename
and snapshot into immutable revisions. `promoteToSiteAsset` copying bytes across
that boundary rather than referencing them is correct for exactly this reason.

So the registry is not in the wrong *place*; it is an unused *feature*. If
`focalPoint` is ever built it belongs in the site definition again, because that
is where portable per-asset metadata has to live. The case for deleting it now
is that it is dead, not that tickets should take it over.

Not decided here. The `get_asset` fix above stands either way and does not
depend on the outcome.

The `absences` entry "Uploading a picture, or any file" remains correct — the AI
genuinely cannot ingest a file from the conversation — but its advice to "offer
the user the images already in the site's list" is unreachable while the listing
shows entries the AI believes it cannot use.

**5. Minor:** `KnowledgeSearch` refused `kb` as a string on first call — a
declared-parameter-shape friction, not a model error.

## Where each fault is being fixed

Faults 1, 2 and 5 are **not 1stcontact code**. Filed in `lagrange-framework`:

- **lf BUG-39** — `_renderHostError` discards the host's `message`/`path` for a
  declared code (fault 1). Fixing it also makes `set_l1`'s existing description
  truthful, which is fault 2 — no 1stcontact change needed for either.
- **lf BUG-40** — an array-typed parameter refuses a bare scalar (fault 5).

Remaining here, and not yet scoped:

- **Fault 3** — `set_l1.params.node` is an untyped `object`; there is no
  projected L1 element vocabulary anywhere in the surface.
- **Fault 4** — the promote/register asymmetry above. Likely the highest-value
  fix of the four for the client, and independent of lf BUG-39.

## Status

Fault 4 is now understood well enough to scope and does not depend on lf BUG-39.

Fault 3 still waits on lf BUG-39: a refusal that names the failing field may
remove most of the need for a projected vocabulary, so sizing it before that
lands would be guessing at how much is left.
## Decision: remove the registry (operator, this session)

The registry goes. The operator's reasoning, recorded because it overrules a
ticket: *"The fact that the content was not being added to the registry was a
problem that needed to be fixed. What we discovered was we don't actually need
the registry at all."*

### This overrules BUG-45, whose code has already landed

BUG-45 was written before the analysis above and merged into `xgd-working` as
`9805ee506e` at 2026-09-01 17:43, during the conversation that produced this
ticket. It changed `material.ts`, `edit.ts` and `l1-surface.json` and added two
UAT files. Its behaviours 1, 2 and 5 require the registry and are withdrawn
here. Its other behaviours are kept, and two of its changes are kept outright:
`get_asset` answering from the listing, and promotion running through
`editAssetAdd` rather than around it.

### The one thing lost, stated plainly

BUG-45 made a promoted upload carry the material's AI-written description as its
alt text automatically. With no registry there is nowhere site-side to hold
per-asset metadata, so that stops happening. The description is not lost — it is
on the material ticket, which the assistant can read — but it no longer arrives
by itself, and the surface has to say where to find it. This is the price of the
deletion and it is accepted.

## Behaviour required

1. **The site definition carries no asset registry.** `siteSchema` no longer
   declares `assets`. A stored definition that still carries the key validates
   unchanged — it is ignored, never refused — so no existing site breaks. The
   tracked sites under `storage/sites/` are stripped of the dead key.

2. **A site's assets are the bytes its store holds, and nothing else.**
   `listSiteAssets` reports the draft's `assets/` directory alone. There is no
   second class of asset and no `registered` distinction anywhere it was visible:
   not on `SiteAsset`, not in `list_assets`, not in `get_asset`, not in
   `1c asset list`'s output, and not in the surface's descriptions of any of them.

3. **`get_asset` answers for anything `list_assets` shows**, named by its id or
   by its `/assets/<name>` handle, and still refuses an asset the site does not
   hold. Kept from BUG-45.

4. **Adding, drawing and removing an asset write bytes, never `site.json`.**
   `add_asset` and `write_image` refuse a name the store already holds unless
   told to replace it; `remove_asset` acts on a name the store holds and still
   refuses when a module field references it unless forced. Each still records
   its change in the draft journal, so a file promoted from the chat still tells
   the assistant it arrived on the turn it arrives.

5. **Alt text belongs to the picture element.** `add_asset` and `write_image` no
   longer take an `alt`, and `get_asset` no longer reports one: an image's alt
   text is the required `alt` on the L1 image node, written when the picture is
   placed. The surface tells the assistant that a file the client dropped carries
   its description on the material it came from, to be read there and written
   onto the node.

6. **`assetRefSchema` itself stays.** It is the object shape permitted inside a
   `ContentValue` and is used by `backgroundSchema` and `layerChildSchema`. Only
   the site-level `assets` array is removed; removing the shape would break three
   live consumers.

## Test plan

UATs named `test_UAT_FC_BUG-44_*`:

- A site definition validates with the `assets` key present and with it absent,
  and nothing reads it either way (behaviour 1).
- `list_assets` reports every file in the store and no `registered` field, and
  `1c asset list` prints no `(unregistered)` marker (behaviour 2).
- `get_asset` resolves a file by id and by handle, and refuses one the store does
  not hold (behaviour 3).
- `add_asset`, `write_image` and `remove_asset` leave `site.json` byte-identical
  while changing the stored bytes, and each records a draft-journal entry
  (behaviour 4).
- Promotion from the chat still journals and still renames on collision
  (behaviour 4).
- The surface offers no `alt` parameter on `add_asset` or `write_image`, and no
  operation's description claims registration is a precondition for use
  (behaviours 2, 5).
- `backgroundSchema` and `layerChildSchema` still accept an asset reference
  (behaviour 6).

BUG-45's `test_UAT_FC_BUG-45_promoted_asset_is_registered.workers.test.ts` is
removed with the field it asserts on, and its
`test_UAT_FC_BUG-45_surface_tells_the_truth.test.ts` is re-aimed at the surface
this ticket leaves behind.


---

## BUG-47: Library: the "On this site" pill marks where a file was uploaded, not where it is used

## Symptom

A client uploaded three files while a site was open — a PNG on *"Put it on the
site"*, a Markdown file on *"Just for you to read"*, and a PDF. All three came
back in the Library carrying the **"On this site"** pill.

At most one of them belongs on the site. The Markdown file was dropped on the
area whose own hint promises *"they won't appear on your site"*, and the Library
then badges it as being on the site — contradicting, on the next screen, a
promise the product made seconds earlier.

## Cause

`site_slug` records **which site was open when the file was uploaded**. The
badge, the field label and the filter all read it as **"the bytes are on this
site"**. Those are different facts and nothing reconciles them.

The seam is visible in the transport's own comment (`builder/api.js`):

```
 * `slug` is optional and means "and put it on this site if the role says so"
```

The intent is conditional on the role. The storage is not — `material.ts` writes
the field from that value whatever the role was:

```js
...(input.siteSlug ? { site_slug: input.siteSlug } : {}),
```

Meanwhile the thing that actually puts bytes on a site, `placeOnSite` in
`router.ts`, is correctly gated and returns early otherwise:

```js
if (ingested.ticket.fields.role !== 'site' || !slug) return { site_asset: null }
```

So the gate holds where it matters — a `reference` file is still mechanically
incapable of reaching a published site, per [[DOC-38]] §5 — and this is a
**display** defect, not a leak. But every consumer of `site_slug` reads it as
placement:

- `library.js` — `if (site && row.site_slug === site)` → the `On this site` pill
- `library.js` — the rights field labelled **`Used on`**
- `library.js` — the `hereOnly` filter, i.e. "only show what is used here"
- the file comment in `library.js` and the one on `listMaterial` in
  `material.ts`, both of which say *"used on this site"*

All four are describing placement. None of them is what the field holds.

## Second defect, same field

Even for `role: 'site'`, `site_slug` being set does not mean the asset landed.
`placeOnSite` is documented to fail softly — *"a failure here does not lose the
upload"* — and reports the failure in the envelope while the material is kept.
The row already has `site_slug` written by then, so a promotion that failed is
badged identically to one that succeeded.

## Third problem: the field is the wrong shape

[[DOC-38]] §7.7 allows one blob to back two sites, and [[DOC-10]] §4.1 makes
shared knowledge across a client's sites deliberate. Placement is therefore
naturally many-to-many, and a scalar `site_slug` cannot express a material that
is on two of a client's sites. The scalar was tenable while the field meant
"where it was uploaded"; it is not once the field means "where it is placed".

## What it should be

The badge, the label and the filter should key on **actual placement**, recorded
by `placeOnSite` when the write succeeds — not on the upload's context. That
suggests placement lands on the row as its own record and, given §7.7, as a
collection rather than a scalar.

Whether `site_slug` is repurposed or retired in favour of a placement field is
an implementation decision. What must hold afterwards:

- A file dropped on *"Just for you to read"* never carries the pill, on any site.
- A file dropped on *"Put it on the site"* carries it only where promotion
  actually succeeded.
- A material placed on two of a client's sites is badged on both.
- The `hereOnly` filter and the `Used on` field agree with the pill, because all
  three read the same fact.

The tenant-wide listing is not in question and should not change: [[DOC-38]] §7.7
and [[DOC-10]] §4.1 make the site a badge and a filter, never a boundary.

---

## What was implemented

`site_slug` is **retired** from `material` and `reference` and replaced by
`placed_on`, a **list of site slugs**. It is written by the one function that
actually puts a material's bytes on a site, after that write returns, and by
nothing else. (`brief.site_slug` is a different field with a different meaning —
which site a brief belongs to — and is untouched.)

### The write

- `tickets.ts` — `MATERIAL_FIELDS.site_slug` (`type: 'string'`) is replaced by
  `placed_on` (`type: 'list'`), shared by `material` and `reference`. Not
  required: most material is never placed anywhere.
- `material.ts` — `ingest` no longer writes any site field, and the now-dead
  `siteSlug` parameter is deleted from `ingest`, `ingestUpload` and `ingestFetch`.
  The upload's slug reaches promotion directly from the route, which is the only
  thing that ever needed it.
- `material.ts` — `promoteToSiteAsset` appends the slug to `placed_on` **after
  `editAssetAdd` returns**, via a `recordPlacement` helper that unions rather
  than pushes. Placing the same material on the same site twice — a client
  dragging the same logo again — records one placement, not two.
- `router.ts` — `placeOnSite` is unchanged in behaviour; its docblock now records
  why placement cannot be written on the way in. `/api/material/fetch` no longer
  forwards a slug at all: what we fetch on a client's behalf is always
  `reference` and never `republishable`, so it can never be promoted.

### The read

- `material.ts` — `MaterialRow.site_slug: string | null` becomes
  `placed_on: string[]`. A `placedOn` reader treats absence as the empty list and
  drops non-strings, so no consumer has a third state to guard.
- `library.js` — one `placedList`/`placedHere` pair now feeds all three
  consumers: the `On this site` pill, the `Used on` rights row (rendered as a
  comma-joined list, because placement is plural), and the `Used on this site`
  filter. They read one fact and can no longer disagree.
- `api.js` — the `uploadMaterial` docblock records that `slug` is an instruction
  to the promotion and never a label stored on the material.

### Consequences accepted

- **No backfill.** Material that already carries `site_slug` does not gain a
  placement. It cannot: `site_slug` does not distinguish a promotion that landed
  from an upload that merely happened while a site was open, and promotion
  renames on collision, so there is no recoverable link from a material to the
  asset it became. Inventing placements from upload context would re-commit the
  original error. Existing rows read as unplaced until something places them.
- **Placement is recorded, not verified.** If an asset is later deleted from a
  site, `placed_on` still names that site. Reconciling the record against the
  site's live asset library is out of scope here; the ticket asks for placement
  to be recorded where it succeeds, and that is what this does.

## Test plan

`tests/test_UAT_FC_BUG-47_placement.workers.test.ts` — the origin contract,
through `route()` against real D1 and both R2 buckets:

- a file dropped on *"just for you to read"* **while the upload names the open
  site** carries no placement (the reported symptom);
- a promotion that landed records exactly the site it landed on;
- a promotion that failed softly keeps the material and records **no** placement
  (the second defect);
- a material on two of a client's sites records both, and re-promoting to a site
  it is already on does not record it twice.

`tests/test_UAT_FC_BUG-47_library_agrees.test.ts` — the surface, mounted against
the real `webui/split` + `webui/list-detail`:

- exactly the placed rows are badged; the reference note and the failed
  promotion are not;
- the `hereOnly` filter and the `Used on` field agree with the pill, because all
  three read `placed_on`;
- a material on two sites is badged on both, switching site without re-reading
  the list.

Both were confirmed to fail against the old upload-context behaviour before the
fix was kept.

Regression scope: `test_UAT_FC_REQ-161_material_surface.workers`,
`test_UAT_FC_REQ-163_ingestion.workers`,
`test_UAT_FC_BUG-44_promoted_asset_is_usable.workers`,
`test_UAT_FC_REQ-162_ticket_store.workers`,
`test_UAT_FC_REQ-159_project_kb.workers`, plus the three jsdom Library suites
(`REQ-161_library_tab`, `REQ-172_library_document_preview`,
`BUG-42_markdown_rendering`) whose fixtures carried the retired field.


---

## REQ-157: The fidelity surface: the assistant can look, compare and judge

# The fidelity surface: the assistant can look, compare and judge

## Why

The assistant's entire tool surface is 27 site-editing operations ([[DOC-30]],
`l1-surface.json`). It can author a page and it can draw an SVG. It has **never been able to see
anything** — not a reference site, not its own output, not the difference between them. No
operation in any surface returns an image; `get_asset` returns *"its file and its alt text"*.

[[DOC-13]] §6 is titled *"Screenshots — the AI's eyes"*. In the cloud the assistant has none, and
[[DOC-9]] §2.1's "convert an existing site" — named there as the killer demo — is unreachable
without capture.

## A second surface, not more operations on the first

`l1-surface.json` is the **L1 control surface**: the documented, maintained way to *change a site*
([[DOC-30]]). Nothing in this ticket changes a site — capturing, shooting, comparing and judging
are all read-only with respect to the site. Bolting them onto the L1 surface would make that
document's own claim about itself false.

So this is a second declared surface, implemented the same way: declared as data, implemented
against the store, granted per role. The knowledge surface is the working precedent for a second
one — but it is only *half* a precedent: `createL1Toolbox` takes it as a **single named slot**
(`knowledgeSurface`), not as a list, so composing a third surface means generalising that
parameter first. (An earlier draft of this body claimed the parameter was already a list. It was
not; see the Decisions below.)

## The picture vocabulary — "anything against anything"

Today each verb has its own flags: `--ref <bundleDir|refPng>`, `--actual <png>`, `--source
draft|published`, `--size`, `--url`. That is fine for a person typing and useless as a tool
surface, where the model must be able to name any picture in one consistent way.

One **picture source**, resolved in one place:

| Source | Named by |
|---|---|
| a captured reference | bundle id + viewport |
| an authored draft | slug + page + viewport |
| the edit channel | slug + page + viewport |
| a published revision | slug + page + revision + viewport |
| any URL | url + viewport |

`screenshot` takes one. `compare` takes two, in any combination — which is what makes "compare
anything to anything" true rather than aspirational: draft against reference is the reproduction
case, draft against published revision is *what did I just change*, revision against revision is
*what changed between releases*, and reference against reference is a competitor over time.

**Shooting a published revision needs revisions to exist** — [[REQ-149]].

## Operations (provisional)

| Operation | Effect |
|---|---|
| `capture_site(url)` | fetch and capture; returns a reference bundle id |
| `list_references()` / `describe_reference(id)` | what has been captured, and what is in it |
| `screenshot(source)` | an image the model can **see** |
| `compare(a, b)` | perceptual verdict, ranked regions, crop pairs |
| `check_fidelity(actual, reference)` | `gate`'s three-way reconciliation and its verdict |

`check_fidelity` is `1c gate`, and it is included because it is the only verb that catches the
failure the other two cannot: `l1-gate` is blind to colour, font and media by design, and
`values-diff` can only compare elements present in **both** manifests — so a page whose capture
missed its imagery passes both while the perceptual eye reads 80% of pixels wrong. `gate` makes
that **disagreement** the finding, and names the likely cause (`capture-incomplete`,
`reproduction-wrong`, `unexplained-disagreement`). An assistant that could compare but not
reconcile would confidently work value deltas against a reference that was never valid.

## The hard part: an image has to reach the model

This is the risk in the ticket and it should be settled **before** the operations are built.

The Anthropic wire format accepts a `tool_result` whose `content` is an array of blocks including
`{type: 'image', source: {type: 'base64', …}}`, and `api_tools.js:407` passes the operation's
output straight through — **so the transport does not block it.** What is undecided is whether a
Toolbox operation may *declare* an image return at all: every `returns` in `l1-surface.json` names
a JSON shape, and the surface declaration format has no vocabulary for bytes.

That is likely an upstream `@lagrangefoundry/ai` change, exactly as [[REQ-103]] was for the
Workers export rung. Settle it first.

**A tool that returns "a screenshot was taken, it is at this key" and nothing the model can look
at satisfies none of this ticket.** The point is the eyes.

## Grant and safety

- `capture_site` fetches an **arbitrary URL on the operator's behalf**. That is an SSRF surface
  and [[DOC-2]] applies: refuse private and link-local address space, cap redirects, cap response
  size, cap time. The URL and the refusal are journalled.
- Everything a capture returns is a third party's content arriving inside a tool result. The L1
  surface already marks reads `provenance: 'untrusted'`; this is more so, and a captured page's
  text must never be able to read as an instruction.
- The consultant grant is the whole surface: this is the role that builds sites, and looking at
  what it built is not a privileged act. It remains ungranted `Publish` and `ManageAssets`, which
  this ticket does not touch. (This body was written when the role was called the *caretaker*;
  [[REQ-174]] renamed it to the **consultant**, and `consultant` is the only name written
  anywhere now. Read every "caretaker" below as the consultant.)

## Acceptance criteria

1. A second toolbox surface, declared as data and implemented against the store, registered
   alongside the L1 surface rather than merged into it.
2. The picture-source vocabulary resolves all five sources through one function, and every
   operation takes it — no verb carries its own `--ref`-shaped parameters.
3. `screenshot` returns an image the model can actually see. A UAT asserts an image content block
   reaches the backend; asserting that a key or a URL was returned does not satisfy this.
4. `compare` of any two sources returns the verdict `1c diff` returns for the equivalent CLI
   invocation.
5. `check_fidelity` reproduces `1c gate`'s reconciliation, including which of its five verdicts it
   names (`pass`, `structural-failure`, `capture-incomplete`, `reproduction-wrong`,
   `unexplained-disagreement`).
6. `capture_site` is refused for private address space, over-large responses and redirect loops;
   each refusal is journalled with the URL.
7. The consultant is granted the surface and its manual says what it can now do.
8. No operation on this surface can change a site — asserted, not asserted-by-inspection.

## Origin

[[CHAT-27]]. Last of four, and the only one the operator asked for directly; the other three are
what it stands on.

---

## Field evidence: the scope of "cannot see" is wider than this ticket assumed

*Appended from [[CHAT-35]], 2026-09-02 — the first client-shaped session run
against the product. Restored: this section was overwritten by a body rewrite
fourteen seconds after it was appended, and is reinstated here verbatim apart
from its closing note, which had gone stale.*

This ticket frames looking as a **fidelity** capability: capture a reference,
shoot the draft, compare, judge. That framing is right and it is not wide
enough. The session showed the assistant needs to see in order to do ordinary
authoring work, before any question of fidelity arises.

The operator uploaded a hero image and asked for a placeholder site. The
assistant placed it as a large standalone block. The operator's objection was
not about fidelity to a reference — there was no reference — it was that the
image had been *composed* as a backdrop and was being used as a subject:

> "This image was created to be a background image that the hero text would
> layer on top of... loading up this page it looks weird, even at a
> three-quarter sized browser window all I see is my background image."

The judgement required is *backdrop or subject?* — and it is unanswerable from
`{id, src, kind, onDisk}`, which is all `get_asset` returns. The assistant said
so itself, and named the two things it would need: what the image looks like,
and whether it is meant to sit behind something.

**The capability already exists and is pointed elsewhere.** `describe.ts` runs
`claude-opus-5` over every uploaded image at ingestion (REQ-163) and writes a
composition description — *"blue daylight comes through an arched gothic window
on the right"* — into the **material ticket body** for retrieval. The assistant
had that description available by search, did not think to look for it, and told
the operator that its alt text had been written by whoever uploaded the file.
So there are three distinct failures stacked here, and only the first is this
ticket's:

1. No image reaches the assistant's context. (This ticket.)
2. The description that does exist is not attached to the asset, so
   `get_asset` cannot return it and nothing points from the file to the words
   about it. Cheap to fix and independent of the fidelity surface.
3. Nothing prompts the assistant to ask the backdrop-or-subject question when
   an image arrives.

**Status note, updated.** The original note here flagged that this ticket was
still `draft` behind a four-ticket dependency chain, and asked whether (2) should
be scheduled ahead of it. That is now moot for (1): REQ-154, REQ-155, REQ-156 and
REQ-149 have all landed and the fidelity surface is built, so an image does now
reach the assistant's context. **(2) and (3) remain open and are not in this
ticket.** `describe.ts:107-118` names this ticket as one of the two places the
duplicate vision path gets deleted — that deletion is *not* done here, so the
duplication it accepts stays open until (2) is scheduled. Both belong in their
own tickets.

---

## Decisions (design session, 2026-09-02)

The four tickets this stands on have all landed, and they landed further than this body assumed.
`apps/control-app/src/shot.ts` already gives the Worker `shotUrl` and `shotPreview` and says in its
own header that exposing them belongs here; `capture/capture.ts` takes an injected
{@link ReferenceStore} and `driverFactory` and has no `node:fs` in its import graph;
`perceptual-core.ts` was split from `perceptual.ts` so the maths imports into an isolate, and
`png.ts` is a pure-JS codec. So none of the "does this run in workerd" risk is live any more.

### 1. The image reaches the model inside the tool loop, with no upstream change

**The transport was already open and the ticket's "settle it first" is answered by reading the
code rather than by changing it.** This host registers its tools as closures
(`host-core.ts`, `new lib.Tool(name, …, (input) => box.run(name, input))`), and upstream's
`ToolSet.run` returns a closure handler's value **unmodified** — only the *Toolbox* path
stringifies. So a handler that returns an array of Anthropic content blocks has them carried
straight through `ToolOutcome` → `AnthropicWire.record` → `content: [{type:'image', …}]`.

That is strictly better than the alternative considered — returning a handle and having the host
attach the image to the *next* turn's user message via the surface upstream REQ-111 widened.
That alternative works too, but the image would only arrive after the model had already ended its
turn, so "shoot, look, adjust" would cost a turn per look. Inline keeps the loop inside one turn,
which is the loop [[DOC-13]] §6 is about.

`screenshot` therefore returns **two blocks**: a text block naming what was shot and at what size,
and an image block carrying the bytes. The text block is what makes a picture self-describing in a
transcript that no longer holds it (below).

### 2. The cost of inline is transcript weight, and it is bounded by capping the image

The same value the model sees is also yielded as `toolEvent(meta.output)`, and the manager appends
that as a `tool` record — which is a CONTENT kind, so it is drained to the durable session
transcript and carried forward on recycle. Upstream redacts images in `turn_start` and has no
equivalent for tool records, so an uncapped screenshot would put megabytes of base64 into the
session file and into every recycle's carried context.

Two answers, both here rather than upstream:

- **Every image this surface returns is downsampled to a longest edge of 1024px** before it becomes
  a block, and is refused if it still exceeds a declared byte ceiling. Anthropic downscales above
  ~1568px anyway, so the cap costs no fidelity the model could have used, and it bounds what any
  one call can put in the transcript.
- **`meta.output` is stripped of image data before the event leaves `streamPrompt`**, so the
  operator's browser is never sent the base64 twice over SSE. The text block survives, so the
  activity line still says what was shot.

The remaining exposure — capped base64 in the durable transcript — is recorded as the upstream
follow-up this ticket does not take: a `tool`-record redaction shaped exactly like the one
REQ-111 already built for `turn_start`.

### 3. Five picture sources, and the fifth is built rather than dropped

Four of the five resolve against what already exists: a URL and a captured reference directly, and
the draft and edit channels through `shotPreview`, whose `PreviewChannel` is already
`'draft' | 'edit'`. The fifth — a published revision — had nothing behind it, because
`PreviewRenderer` reads `loadDraft` and `previewOriginResolver` refuses any channel that is not
`draft` or `edit`.

It is built here instead of dropped: `SiteStore.readRevision` returns a frozen `StoredSnapshot`,
so a `rev-<id>` channel renders that snapshot through the same `renderSiteFiles` every other
channel goes through. **A revision's assets come from the snapshot's own bytes, not the draft's** —
a revision that pointed at today's logo would not be a picture of that revision.

### 4. The picture source is one declared `param_type`, validated by the declaration

The vocabulary is a single `object` param type with a declared `keys` set, which upstream's
declaration format already supports end to end: `validateParams` enforces the keys and their
enums, and `wireProperties` projects them into the tool's JSON schema with
`additionalProperties: false`. So "one picture source, resolved in one place" is enforced by the
declaration rather than by a convention each operation re-implements, and the model is *shown* the
shape rather than refused for guessing it wrong.

### 5. The surface composes as a list, not a second named slot

`createL1Toolbox` takes `knowledgeSurface` as a **named slot**, not the list this body assumed.
Generalising it to `extraSurfaces: {surface, granted}[]` is the change that makes AC1's "registered
alongside rather than merged into" true; the knowledge surface becomes the first entry in that list
and nothing about it changes.

The fidelity grant is **local**, so it is written in `instances.json` beside the L1 grant. The
knowledge grant travels with its surface because its two scope axes must name the same set; this
one has no such coupling, and putting it in the same place as every other local grant is what keeps
it reviewable.

### 6. SSRF is enforced at the driver's request seam, not only on the typed URL

A pre-flight check on the URL the model supplied cannot see a redirect to link-local space, and the
browser follows redirects itself. `shotPreview` already proves the driver can answer requests
per-request (`driverFactory({ origin: resolver })`), so that is where the guard belongs: every
navigation is checked, not just the first. The URL, the viewport and any refusal are journalled
with the reason.

## Test approach

UATs land in `tests/test_UAT_FC_REQ-157_*.test.ts`, driving the real surface against injected
seams — a fake browser driver, an in-memory store — with nothing reaching the network.
The load-bearing ones assert what the *backend was handed*, not what the surface claims: that an
image content block reaches it (AC3), that a comparison verdict equals `1c diff`'s for the
equivalent invocation (AC4), that each of `gate`'s verdicts is reproduced (AC5), that a private,
oversized or looping URL is refused and journalled (AC6), and that no operation on this surface
moves the site's change counter (AC8).

---

## Behaviour the build settled

Six things the operations must do that fall out of the above as technical
consequence rather than being asked for directly. Written down because each is
asserted, and an assertion with no language behind it reads as drift.

**A comparison crops to the common rectangle.** A reproduction is rarely exactly
as tall as its reference, and refusing a comparison on that basis would fail on
the case the operation most exists for. Both sides are anchored top-left and
cropped to the overlap, and the result reports the `size` actually compared
rather than leaving the caller to assume it was either input's.

**The reference side follows the actual side's viewport.** A page can be right at
one width and wrong at another, so reading a desktop reference against a mobile
reproduction would manufacture a failure that is entirely the gate's own doing.
Whichever viewport the actual picture asked for is the one the reference is read
at.

**A missing ladder member falls back, and says so.** A bundle captured before the
viewport ladder existed still holds a full-page shot. Reading it beats refusing a
comparison the operator can plainly see is possible — but a comparison against a
fallback must never be mistaken for one at the right width, so the picture's
label names it as a fallback.

**The surface is bound to one site at construction**, exactly as the L1 surface
is. No operation takes a `slug`, and no picture names one. That is stronger than
a scope axis that refuses the wrong value: there is no value for a model to get
wrong, and it is the reason a picture of kind `draft` cannot be a picture of
somebody else's draft.

**Each of the five verdicts carries its own next step.** The verdicts are the
whole reason `check_fidelity` exists rather than `compare` alone, and each
implies a *different* action — so they must be distinguishable in what they tell
the reader to do, not merely distinct as values.

**Downsampling averages rather than samples.** Reducing to the 1024px edge by
nearest-neighbour would drop exactly the thin high-contrast detail — rules, one-
pixel borders, small type — that a fidelity judgement turns on. A box filter over
the source pixels is what makes the reduced picture honest about what was there.

---

## As built

### The surface

`fidelity-surface.json` declares six operations in one group, `SeeSite`, every one
`effect: read`. `fidelity-core.ts` implements them against the store and the browser seam and
carries no prose the model ever sees — the same split `toolbox-core.ts` holds to.
`createL1Toolbox` now takes `extraSurfaces: {surface, granted?}[]` instead of the single
`knowledgeSurface` slot, and the knowledge surface became the first entry in that list.

**The grant is narrowed to the surfaces actually composed.** `instances.json` says what the
consultant may do; which surfaces exist is a property of the deployment. A Worker with no
`[browser]` binding, or a `1c` invocation with no server behind it, composes no fidelity surface —
and the Toolbox refuses to construct when a configuration names a surface nobody registered. So
`createL1Toolbox` filters the grant down to the composed set. The filter only ever removes keys,
so it cannot widen a grant.

### The picture vocabulary

One `param_type` (`picture`) with a declared `keys` set, so `validateParams` enforces the keys and
their enums and `wireProperties` projects the shape into the tool's JSON schema with
`additionalProperties: false` — the model is shown the shape rather than refused for guessing it.
Which field a `kind` requires is a cross-field rule no per-key declaration can express;
`resolvePicture` enforces that and names the missing field.

All five sources resolve through `resolvePicture` in `picture.ts`. The fifth was built rather than
dropped: `PreviewRenderer` gained a `rev-<id>` channel that renders a frozen `StoredSnapshot`
through the same `renderSiteFiles`, with **assets read from the snapshot's own bytes** — a
revision that pointed at today's logo would not be a picture of that revision.

### The image reaches the model inside the tool loop

`screenshot` returns `[{type:'text'}, {type:'image'}]` and upstream carries it through unchanged.
The UAT asserts what the **backend was handed**, driving upstream's real `ToolSet`,
`runToolLoop` and `AnthropicWire` through the SDK-free `/core` entry point.

Images are downsampled to a 1024px longest edge by a box filter (`downsampleRaster`, beside
`cropRaster` in `perceptual-core.ts`) and refused over a byte ceiling. `streamPrompt` strips image
data out of `meta.output` before the event reaches the SSE stream, so the operator's browser is
never sent the base64 a second time.

### Three modules had to be split, and it is the same split each time

The fidelity surface runs in workerd, and REQ-146's boundary test named every violation the moment
it did. Each fix is the seam `perceptual-core.ts` already established — the pure half of a module
that was also a CLI command:

- **`gate-core.ts`** — the perceptual floor, the coverage proxies, `reconcileGates`, and
  `cmdL1Gate` (moved from `repro.ts`). `gate.ts` is `1c gate` and is now a *caller* of the
  reconciliation rather than its owner, which is what makes "reproduces `1c gate`'s
  reconciliation" a property of the build rather than of anyone's care.
- **`responsive-table.ts`** — the N-way table builder. `l1/fold.ts` imports it, so the
  `1c responsive-diff` command's `node:fs` graph was reaching every consumer of the L1 fold.
- **`capture/pipeline.ts` is inject-or-fail** — it defaulted four driver seams to Playwright,
  which REQ-155 named as needing this rule and did not apply. The Node convenience is relocated to
  `capture/index.ts`, the barrel that is Node-only by design and says so, so every `1c capture` and
  every real-browser test calls exactly what it always did. `ReconcileInput.perceptual.regions` was
  widened from the CLI report's region type (which carries crop-file paths) to something countable,
  because counting is all `reconcileGates` ever did with it.

Three `../l1` and `../cli/capture` barrel imports became deep paths for the same reason — including
two `import type`s, because REQ-154's bundle check follows every local import regardless of whether
TypeScript erases it.

### Safety

`egress-guard.ts` classifies a URL (scheme, credentials, private/loopback/link-local space
including IPv4-mapped IPv6) and carries the redirect and byte budgets for one capture. It is
installed at **both** drivers' request seams, so it sees every redirect hop and every subresource —
a pre-flight check on the typed URL cannot. `capture_site` also pre-flights, so an obviously bad
address is refused without leasing a metered browser and without three retries. Refusals are
returned to the model under the declared `REFUSED` code and carried in the Toolbox's audit record
with the URL. What it honestly does not do is defeat DNS rebinding: nothing inside workerd can
resolve a name to check it.

### Both hosts

The Worker composition root is `apps/control-app/src/shot.ts` — the file whose own header said this
belonged to REQ-157 — with `leasedDriverFactory` binding one metered session to one driver's
lifetime. Node is wired too: `GlobalOptions.origin` carries what the process is called from
outside itself, which the builder sets per request from the `Host` header, because an ephemeral
port is not knowable until `listen` has bound one. Absent an origin there is no fidelity surface,
which is the honest answer — without one there is nowhere for a browser to navigate to see the
draft.

### Evidence

`tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts` — 27 UATs. The declaration is checked by the
framework's own validator; the Toolbox, the operations, the stores, the diff maths, the
reconciliation and the egress policy are all production code. One thing is doubled — the browser —
and the pictures are real PNGs, because half of what is under test is what happens to pixels.

Three suites belonging to other tickets were updated where this change made their assertions
observe something new, rather than weakened: REQ-126's and AC1071's author-time validation now
validate both declarations together (the instance config names both), and AC1058's offered-tool
set is now the union of the two declarations' operations — still derived from the declarations
rather than written out, which is the property that assertion exists to hold. The AC3 UAT drives
the shared model double (`calls`/`says`) rather than transcribing the wire protocol a second time,
which BUG-39 forbids.

### Suite state

`node`: **2064 passed, 1 failed** — `test_UAT_AC960` (bug32), which names
`tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts`, a file this branch does not touch.
Pre-existing. `workers`: **203 passed, 0 failed**.

### Not taken, and named so it is not mistaken for done

The durable transcript still holds the capped base64: the manager appends the tool event as a
`tool` record, which is a CONTENT kind, so it drains to the session file and is carried across a
recycle. Upstream redacts images in `turn_start` and has no equivalent for tool records. That is
the follow-up, shaped exactly like the redaction REQ-111 already built; the cap here is what keeps
it bounded until then.


---

## REQ-176: Library: a type icon, a one-line row, and the wording clients actually read

# Library: a type icon, a one-line row, and the wording clients actually read

Three changes to the Library list and the upload overlay. They are one ticket
because they touch the same two files and the same handful of strings, and
because the icon is what makes the one-line row fit.

## 1. A type icon on each row

Each row opens with an icon for the material's type, replacing the `kind` pill.

`renderRow` in `library.js` currently emits three pills — kind, role, and the
"on this site" badge. The kind pill is the one an icon says better and shorter,
so it goes and the icon takes its place at the head of the row.

**Four kinds, not two.** `fields.kind` is `document | image | font | capture`
([[DOC-38]] §9), and fonts are real here — `describeFont` parses SFNT name
tables, and the *"Put it on the site"* hint literally says *"Photos, logos,
fonts."* So the mapping needs document, image and font, plus a fallback for
`capture` and for anything a later kind adds. A row must never render iconless.

The icon is a leading element inside the existing `builder-library__row`;
`webui/list-detail` has an icon slot for the expand toggle only, and `renderRow`
owns the whole content cell, so nothing in the component changes.

## 2. The row becomes one line

Today `.builder-library__row` is `flex-direction: column` — title on the first
line, `builder-library__row-meta` pills wrapping onto a second. It should be one
row: **icon, title, then the remaining pills after the title.**

The title is also larger than it should be. `renderRow` builds its own
`builder-library__row-title` span, which has no `font-size` and so inherits the
shell's body size; the component's own `.list-detail-row-title` sets 13px. The
library's title should match the component's rows rather than being the one
list in the builder with a larger one. Set it in `builder.css` — do not change
`webui-list-detail`, which other hosts share.

The title keeps its `text-overflow: ellipsis` and takes the remaining space; the
pills keep their intrinsic width and do not wrap or shrink. Truncation lands on
the title, never on a pill, because a half-rendered pill reads as a bug.

## 3. Wording

Four changes. The first three are unambiguous; the fourth is not — see below.

| Now | Becomes | Where |
|---|---|---|
| `Put it on the site` | `Site asset` | `config.js` `UPLOAD_AREAS[0].label` |
| `Just for you to read` | `Background information` | `config.js` `UPLOAD_AREAS[1].label` |
| `What's this for?` | `Purpose` | `config.js` `UPLOAD_PROMPT` |

The first two reach both surfaces from one edit: `library.js` derives its role
pill from the same constant —

```js
const ROLE_LABEL = Object.fromEntries(UPLOAD_AREAS.map((a) => [a.id, a.label]))
```

— which is exactly what that derivation is for. The upload overlay's two area
labels and the Library's role pill cannot drift apart, and this change should
not introduce a second place to edit them. The `id` values (`site`,
`reference`) are the wire vocabulary the route validates and **must not
change**; only the labels do.

The hints under each area stay as they are. The second one — *"they won't
appear on your site"* — is load-bearing (`config.js` says so), and shortening
the label to `Background information` makes it carry more of the reassurance,
not less.

## The fourth string: "Used on this site"

**Requested:** `Used on this site` → `Live on the site`. **Do not make this
change as written** — it would be false.

`placeOnSite` calls `promoteToSiteAsset`, which copies the bytes across the
bucket boundary and writes them through `editAssetAdd`. That writes to
**`draft/assets`** — its own collision message says so — and a draft is not the
published site. `RenderChannel` is `draft | published` and publishing is a
separate act. So a promoted asset is in the client's working copy, and reaches
the public site only when they publish.

Of the three readings:

1. *currently on the published site* — **no**
2. *in a version of the site* — **no**, not until published
3. *in the draft, including unpublished work* — **yes, this is what it means**

`Live on the site` asserts (1). A client who reads it and does not publish has
been told their logo is on their website when it is not.

Wording that is true of the draft: **`On this site`** (what the pill already
says), **`Added to the site`**, or **`In your draft`**. Recommendation:
`Added to the site` for the pill and `Added to` for the `site_slug` field label
in `RIGHTS_FIELDS` — it says a real thing happened without claiming the public
site shows it. **Confirm the wording before implementing**; the intent behind
the request may be that promotion *should* be publish-visible, which is a
different and much larger ticket.

If the label does change, the rationale comment on `.builder-library__badge--here`
in `builder.css` changes with it — it explains why that badge carries the accent
in terms of the old wording.

## Ordering against BUG-47

[[BUG-47]] is about the same badge: it currently fires from `site_slug`, which
records *where the file was uploaded*, not where it is placed, so it appears on
`reference` material that is not on any site. **BUG-47 should land first.**
Renaming a badge that is showing on the wrong rows makes it wrong in new words,
and BUG-47 may replace the field the badge reads — at which point this ticket's
wording change would have to be redone against the new one.

The other three wording changes and both layout changes have no such dependency
and can go ahead regardless.

## What must hold afterwards

- Every row shows exactly one type icon, including `capture` and any kind added
  later.
- No row shows a `kind` pill.
- A row is one line at the list's normal width; the title truncates and the
  pills do not.
- The row title's size matches `webui/list-detail`'s own rows.
- `webui-list-detail` is unchanged.
- The overlay's two area labels and the Library's role pill read identically,
  from one constant.
- `role` wire values are still `site` and `reference`.


---

## What was implemented

Everything above **except the fourth string**, which is still awaiting the
confirmation this ticket asks for. See *"Still open"* below.

### 1 & 2 — the icon and the one-line row

`KIND_ICON` in `library.js` names the three kinds a client uploads — `document`,
`image`, `font` — and `KIND_ICON_FALLBACK` catches `capture` and whatever
[[DOC-38]] §9 adds next. The map is **partial by design**: a `kind` the map has
never heard of lands on the paperclip rather than rendering an empty leading
cell, because an iconless row reads as a rendering fault rather than as a kind.
Emoji rather than SVG, matching the upload overlay's own area icons.

`renderRow` emits the icon, then the title, then the meta strip — which now
carries the role pill and the placement badge only. The `kind` pill is gone.

**The icon is labelled, not hidden** — a technical consequence of removing the
pill rather than a separate request. The pill was the only place the row said
its type *in words*, so the glyph carries `role="img"` and
`aria-label="<kind>"`: the fact moved to the icon, it did not leave the row. An
`aria-hidden` glyph — which is what the overlay's area icons are, correctly,
because a visible label sits beside them — would have silently deleted the kind
for a screen reader.

`builder.css` makes `.builder-library__row` a row axis; the title is
`flex: 1 1 auto; min-width: 0` with `font-size: 13px` to match
`.list-detail-row-title`; the icon and `.builder-library__row-meta` are
`flex: none` and the meta strip no longer wraps. `webui-list-detail` is
untouched.

### 3 — the three unambiguous wording changes

`UPLOAD_PROMPT` is `Purpose`; the two `UPLOAD_AREAS` labels are `Site asset` and
`Background information`. The `id` values are unchanged. The hints are
unchanged. `ROLE_LABEL` derives the Library's role pill and role filter from the
same constant, so the rename reached both surfaces from one edit.

### The rename reaches the assistant's own manual

Not in the original scope, and load-bearing: the L1 surface declaration's
"cannot fetch a file" absence note tells the client to drop a file onto the
conversation and **choose the area by name**. A note quoting a button that no
longer exists sends them hunting for it, so
`tools/generate/src/cli/ai/l1-surface.json` was renamed with the label.

Two existing suites asserted the old literal against that note and were updated
with it — `test_UAT_FC_BUG-44_surface_tells_the_truth` and
`test_UAT_FC_REQ-130_beyond_l1`. Their invariant is unchanged: *the note quotes
the drop area's own words*. This ticket's own UAT asserts that invariant
**against the constant** rather than against a literal, so the two can no longer
drift apart the way they just did.

Comments in `router.ts` and `tickets.ts` that quoted the old labels as UI copy
were updated for the same reason — a comment naming a button nobody can see is
a false landmark.

### BUG-47's ordering constraint is discharged

[[BUG-47]] is `free_coded` and landed before this. The badge reads `placed_on`,
which records where the bytes actually went, so the rows wearing it are the
right rows. Nothing here was blocked.

## Still open — the fourth string

`Used on this site` → `Live on the site` is **not implemented**, per the
analysis above: `placeOnSite` writes to `draft/assets`, and `Live on the site`
would tell a client who has not published that their logo is on their website.

Note that BUG-47 moved the strings this section describes. The three renderings
today are:

| Surface | Reads |
|---|---|
| the row pill | `On this site` |
| the rights field on `placed_on` | `Used on` |
| the list filter checkbox | `Used on this site` |

The recommendation stands — `Added to the site` for the pill, `Added to` for the
field label, and the filter following them — but it needs the operator's
confirmation, or a decision that promotion *should* become publish-visible,
which is a different and much larger ticket.

## Test plan

`tests/test_UAT_FC_REQ-176_library_row_and_wording.test.ts` — nine UATs:

- every row opens with exactly one non-empty icon, over a fixture holding all
  four §9 kinds plus one the map has never heard of; the three named kinds are
  distinct and the two unnamed ones share the fallback
- the icon still says the kind to a screen reader
- no row carries a `kind` pill, and the role and placement pills survive
- the row lays out on one axis, the title shrinks and ellipses
- the pills are `flex: none` and do not wrap
- the title is 13px, matching the component's own rows
- the overlay asks `Purpose` and names its two areas plainly, with the `site` /
  `reference` wire values unmoved and the second hint unchanged
- the overlay's labels and the Library's role pills read identically, from one
  constant, with both surfaces mounted
- the assistant's manual names the area the client will actually see, asserted
  against the constant

Layout is asserted through the CSS contract that produces it rather than by
measuring boxes: jsdom computes no layout and would report zero either way.

Regression scope run green: the four Library and upload suites, both surface
suites, both workers placement suites, and the builder-origin suite.


---

## REQ-174: Rename the assistant role: caretaker -> consultant

# Rename the assistant role: caretaker -> consultant

## Why

The role the client talks to is named `caretaker` throughout the code, the
system prompt, the role grant and the tests. The word is wrong for what the
role does and wrong for what we sell.

A caretaker maintains something that already exists and is not expected to
have a view. What this role actually does is take a client from nothing to a
live site, form judgements about their brand, argue for a layout, and say when
a request would make the site worse. [[DOC-33]] already calls that work *"The
Consultation Playbook"* and the sessions in it read as consultation, not
custody. The vocabulary should match the job.

This matters beyond taste. The role name is in the system prompt the model
reads about itself, and a model told it is a caretaker will behave more
passively than one told it is a consultant. The observed session behind
[[CHAT-35]] shows exactly that failure register: the assistant centred every
block of text on the page, and when challenged said *"I was building quickly
and didn't stop to think about it."* It also declined to raise the image-role
question with the client until asked. A consultant leads; a caretaker waits to
be told.

## What changes

Rename the role and every symbol, string and document that carries the old
word. There are ~122 occurrences outside the ticket store:

- `tools/generate/src/cli/ai/roles.ts` — `CARETAKER_SYSTEM`, `CARETAKER_PURPOSE`,
  `caretakerReminder`, `CARETAKER_ROLE = 'caretaker'`
- `tools/generate/src/cli/ai/instances.json` — the `caretaker` instance key
- `tools/generate/src/cli/ai/host.ts`, `host-core.ts`, `toolbox.ts`, `toolbox-core.ts`
- `apps/control-app/src/ai.ts`
- the UAT and reconciliation suites that name the role
- [[DOC-33]] (four occurrences in prose)

The prose the client-facing system prompt uses changes with it: *"You are the
caretaker of a website your user owns"* becomes the consultant framing. This is
not a mechanical find-and-replace on that sentence — the surrounding paragraph
describes a custodial posture and should be rewritten to describe an advisory
one, while keeping the existing constraint language about the closed vocabulary
intact.

Concretely, the rewritten preamble must tell the assistant to form a view and
state it, to say so when what the client has asked for would make the site
worse, and never to build past an open question and leave it unmade — the three
things the observed session did not do. The closed-vocabulary paragraph (no
HTML, CSS or JavaScript; a malformed change is refused whole) is unchanged, and
"user" becomes "client" throughout, because that is the relationship the word
consultant describes.

Two strings beyond the preamble carry the same register and change with it: the
per-turn reminder, and `CARETAKER_PURPOSE` — the sentence that primes knowledge
retrieval with what the role is for, which said the role "looks after" a
website. The role name is also the KEY of the grant in `instances.json`, so the
rename has to move that key or no session can construct a Toolbox at all.

The rename must leave nothing behind. A straggler in a comment, a test helper or
a JSON key is how a rename half-happens and then rots, so a guard scans the
working tree for the old word and allows it in exactly one file: the declaration
of the compatibility alias below. `kb/` and the inlined copy under `generated/`
are excluded — they are the system knowledge base, exported from the ticket
store and rebuilt by `1c kb build`, so DOC-33's rename reaches them on the next
KB build rather than in this commit.

## The stored-role compatibility question — decided: accept on read

`CARETAKER_ROLE` is persisted in session records (`role: "caretaker"` appears in
the `xgd-session` header of every archived chat, and in the `session_start`
record of a live junction). The session manager resolves a resumed session's
role by looking that stored name up in the role map it was constructed with, and
throws on a miss — so a rename alone would strand every conversation started
before it.

**Decision: accept the old value on read. There is no migration.** The old name
is registered as a second key onto the *same* role object, declared as
`LEGACY_ROLE_NAMES` in `roles.ts` beside the reasoning. Migrating instead would
mean rewriting an append-only record stream and the archives of every
deployment, including a store-backed one in production, to change a word; the
alias costs one entry, behaves identically for the file archive, the junction
and the store-backed archive, and needs nothing to be run anywhere.

Only one path is live. Nothing is ever *written* under a legacy name —
`createSession` records `CONSULTANT_ROLE` and `aiStatus` reports it alone — so
the alias is read-only and ages out with the sessions that need it.

## Out of scope

Renaming `DOC-4 Webcaretaker` and `DOC-5 Gendev Website Caretaker Architecture`.
Those are historical architecture documents whose titles are part of the record.

## Evidence

`tests/test_UAT_FC_REQ-174_consultant_role.test.ts`, against the real builder
origin with only the Anthropic client doubled:

1. the preamble the model actually receives names a consultant, never the old
   word, asks for judgement, for the "would make the site worse" pushback and
   for the open question to be settled — and still carries the closed-vocabulary
   constraint;
2. a new session is recorded in the archive header and reported by
   `api/ai/roles` under the new name alone;
3. the grant in `instances.json` and the corpus purpose are the consultant's,
   and the purpose no longer says the role "looks after" a site;
4. a session whose stored role name is aged back to the old value reopens with
   its turns intact and takes another turn that reaches the tools and changes
   the site — verified to fail when the alias is removed;
5. no file in the working tree carries the old word except the alias
   declaration.


---

## BUG-49: kb build should infer CLOUDFLARE_ACCOUNT_ID from the API token

## What is wrong

`1c kb build` refuses to run unless the operator sets **both** `CLOUDFLARE_ACCOUNT_ID`
and `CLOUDFLARE_API_TOKEN`:

```
The knowledge index needs Workers AI: set CLOUDFLARE_ACCOUNT_ID and
CLOUDFLARE_API_TOKEN (the same credentials `pnpm deploy:*` uses). …
```

The account id is not a second credential. It is a path segment in the Workers AI
REST URL (`/accounts/{id}/ai/run/{model}`) and the API token already knows which
account it belongs to — `GET /client/v4/accounts` returns exactly the accounts the
token can see. Asking the operator to look up and paste a value the token can
answer for itself is friction with nothing behind it.

This repo already knows how to do the lookup. `bin/access-token`'s
`resolve_account()` infers the account when the token sees exactly one, refuses to
guess when it sees several, and treats `CLOUDFLARE_ACCOUNT_ID` as an override.
`resolveEmbedder` in `tools/generate/src/cli/kb.ts` simply never learned the same
trick — so two entry points to the same Cloudflare account disagree about what the
operator must supply.

## What should happen

`resolveEmbedder` discovers the account id the way `bin/access-token` does, and the
API token becomes the only value the operator must set.

1. **The token alone is enough.** With `CLOUDFLARE_API_TOKEN` set,
   `CLOUDFLARE_ACCOUNT_ID` unset, and a token that sees exactly one account, the
   build resolves an embedder bound to that account and proceeds. No prompt, no
   second lookup for the operator to perform.
2. **An explicit account id still wins, and costs no call.** When
   `CLOUDFLARE_ACCOUNT_ID` is set it is used verbatim and no discovery request is
   made. It stays the override for the cases discovery cannot serve, and a build
   that already has the answer should not go and ask for it.
3. **Several accounts are named, never guessed.** A token scoped to more than one
   account gets an error listing each account's name and id and asking for
   `CLOUDFLARE_ACCOUNT_ID`. Picking the first would bind the index to whichever
   account Cloudflare happened to list first — a coin flip the operator never saw,
   and one that surfaces later as a working build against the wrong account.
4. **No accounts is a scope problem, and says so.** A token that can list accounts
   but sees none is told its scope is the problem, not that the build is broken.
5. **A token that cannot list accounts is diagnosed, not misreported.** Discovery
   is an extra permission: a token scoped narrowly to Workers AI may run the model
   and still be refused `GET /accounts` (403, or Cloudflare's `success: false`
   envelope with a 200). Either refusal — and equally a discovery request that
   cannot complete at all, which the operator cannot tell apart from a refusal
   without being told — must produce an error naming the narrow-scope case,
   carrying the reason Cloudflare gave, and telling the operator to set
   `CLOUDFLARE_ACCOUNT_ID` explicitly. This is the one failure that would otherwise
   read as "the knowledge build is broken" when the credentials are fine and only
   unusually scoped. In particular the `success: false`-under-200 shape must not be
   read as a successful empty list, which would report criterion 4's scope problem
   to an operator whose scope is fine.
6. **The missing-token message stops asking for both.** With no
   `CLOUDFLARE_API_TOKEN`, the error names the token as the thing to set and
   `CLOUDFLARE_ACCOUNT_ID` as the optional override it now is. Continuing to demand
   a value the tool can derive would be the original bug, restated.

`LAGRANGE_KM_EMBEDDER` keeps precedence over all of this, unchanged: the named-seam
escape hatch is checked before any credential is read, which is how the test suites
build fixture indexes with no Cloudflare account at all.

## Scope

`resolveEmbedder` in `tools/generate/src/cli/kb.ts`, its doc comment, and the `kb`
usage text that currently states both variables are required. `bin/access-token` is
the precedent and is not changed.


---

## REQ-177: Discontinue the raw-server hosting path (1c serve)

# Discontinue the raw-server hosting path — and stop calling the test fixtures "servers"

## Why

The operator's instruction was to discontinue any aspect of the system still
using raw servers, on the reading that everything now runs on Cloudflare. That
reading is right about *hosting* and wrong about *tooling*, and the difference
matters enough to write down before anything is deleted.

There is exactly one raw server an operator can start as a way to look at a
site: `1c serve <slug>`. It is a `node:http` static file server over
`dist/<slug>/<channel>/`. Nothing deploys through it, nothing depends on it, and
it presents a second, divergent way to view a site next to the real one
(`wrangler dev`, which serves through the same routes and runtime as
production). It should go.

Everything else that looks like a raw server is **in-process test and capture
scaffolding**, and removing it would break the build.

## What must NOT be removed

`startServe` and `startBuilder` are library functions, not hosts. They bind an
ephemeral loopback port inside a test or a CLI run and close it again:

| Function | Used by | Consequence of removal |
|---|---|---|
| `startServe` | `1c shot`, `1c aligned-crops`, `conformance/harness.ts` | Screenshots and the module conformance harness lose the origin Playwright points at |
| `startBuilder` | **42 test files** | The control-app router loses its test transport |

`startBuilder` is already demoted correctly — `1c builder` starts `wrangler dev`
and the comment at `index.ts:720-728` explains that keeping two live paths would
be the two-code-paths problem. That reasoning is sound and this ticket does not
disturb it.

The screenshot loop is the load-bearing one. `1c shot` renders to disk, serves
the directory on a loopback port and drives a browser at it. Replacing that with
workerd would make the fidelity loop slower for no gain in fidelity — the bytes
under test are static render output, not Worker behaviour — and [[REQ-157]]
depends on that loop continuing to work.

## What this ticket does

**1. Remove `1c serve`.** The command, its `case 'serve'` arm, its help text and
its usage line. The CLI's own help currently advertises it as a way to view a
site, which is the part that misleads.

**2. Say what the fixtures are, in their own headers.** `serve.ts` and
`builder.ts` should state at the top that they are test and capture
infrastructure, never a hosting path, and that the only supported way to serve a
site is a Worker. The code already earns this — `builder.ts` says it, `serve.ts`
does not — and the point is that the next person auditing for "raw servers"
reaches the same conclusion this ticket did without re-deriving it.

**3. Leave `startServe` exported.** `shot.ts`, `aligned-crops.ts` and the
conformance harness import it directly; the CLI command is what goes, not the
function under it.

## What is deliberately not in scope

The file-backed local store (`1c new`/`render`/`publish`/`checkout`/
`revisions`, `storage/sites/`). It is not a server. It is the local authoring
and reproduction tier that feeds `bin/publish` into D1 and R2, and [[DOC-12]]
treats it as a tier rather than a legacy path. Nothing here argues against it.

## What landed

Commit `246333cbfe` — `refactor(cli): discontinue the raw-server hosting path`.

**Observable behaviour after this change:**

- `1c serve <slug>` is no longer a command. It falls through to the CLI's
  unknown-command default: a `Unknown command: serve` refusal on stderr followed
  by the usage text, and exit code 1. No port is bound.
- `1c help` no longer advertises any way to serve a site outside a Worker. The
  `1c serve` usage line is gone; `1c builder` (which starts `wrangler dev`) is
  what the help offers instead.
- `startServe` remains exported from `tools/generate/src/cli` and still binds an
  ephemeral loopback origin over a site's rendered output. This is the half that
  had to survive: the command is what goes, not the function under it, and the
  screenshot / conformance loop drives it directly.

**Code changes:**

- `cli/index.ts` — removed the `case 'serve'` arm, its usage line, the
  now-unused top-level `startServe` import (the re-export still comes straight
  from `./serve`, so the fixture stays exported), the `run()` doc-comment caveat
  about a command that never returns, and `serve` from the help text's list of
  ungated offline verbs.
- `cli/serve.ts` — new file header stating this is the static-preview **capture
  fixture**, that it is not a hosting path, that `1c serve` existed and was
  removed and why, and that the only supported way to serve a site is a Worker.
  `startServe`'s own doc-comment is reworded from "serve a site for browser
  viewing" to what it actually is.
- `cli/builder.ts` — same "not a hosting path" statement added at the top of the
  existing header, which already made the argument but did not state the
  conclusion in those terms.
- `tools/generate/README.md` — dropped the `1c serve` row from the command table.

**Consequential test edits.** Two existing preflight UATs
(`req44-install-preflight`, `reconciliation-1c-install-preflight`) enumerate the
offline verbs that are never gated on an install check, and both listed `serve`.
The assertions still passed after removal — `assertInstall` is a no-op for a
command not in `COMMAND_DEPS`, including one that no longer exists — but the
lists would have been asserting something about a verb that is gone. `serve` was
dropped from both. No assertion semantics changed.

## Test plan

`tests/req177-discontinue-raw-server.test.ts` — three UATs, pinning both halves
of the hosting-vs-tooling distinction:

- `test_UAT_FC_REQ-177_serve_is_no_longer_a_command` — `run(['serve','demo'])`
  reports `Unknown command: serve` and sets exit code 1.
- `test_UAT_FC_REQ-177_help_advertises_no_raw_server` — the usage text has no
  `1c serve` line, and does offer `1c builder` / `wrangler dev`.
- `test_UAT_FC_REQ-177_capture_fixture_still_binds_a_loopback_origin` — drives
  `startServe` over real HTTP against a rendered snapshot and asserts a 200 with
  the expected bytes. Deliberately not a type-level assertion: keeping the export
  while deleting the implementation must not pass.

Regression scope run and green: the new file, `req113-serve-extensionless`,
`reconciliation-clean-page-urls`, `req37-launcher`,
`reconciliation-1c-aligned-crops-sandbox-routing`, `bug30-relativize-fragment`,
both install-preflight suites, and the three suites that reference the usage
text (`reconciliation-system-knowledge-base`, `req83-capture-to-l1-fold`,
`reconciliation-l1-fold`). `tools/generate` and `apps/control-app` typecheck with
no new errors (one pre-existing `session-knowledge.ts` error is unrelated and
present on the base commit).

## Related

- [[DOC-41]] — Build and Deployment. Documents the two supported environments
  and records `1c serve` as discontinued rather than silently omitting it.

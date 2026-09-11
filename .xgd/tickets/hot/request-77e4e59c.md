---
uid: request-77e4e59c
id: REQ-228
type: request
title: 'One picture catalogue: the Library is the catalogue, and being on the site
  is a mark on it'
created_by: BUG-80
created_at: '2026-09-11T22:15:59.242213+00:00'
updated_at: '2026-09-11T22:31:15.363228+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-37c2fe15
---

## What this is

A proposal for how the two picture stores should look **to the assistant**, and
the answer to the question that prompted it: the ticket API was implemented so
that exactly this would be reachable, and the assistant cannot reach it.

Supersedes REQ-227 (`request-a15815f4`), which reported the gap without proposing
a shape.

## Why the assistant cannot see this as tickets

Nothing is missing from the design. Three things are missing from the **wiring**,
and each of them is small.

**1. The ticket surface is shipped and not granted.**
`@lagrangefoundry/ai-ticketing` declares a `tickets` surface —
`get`, `query`, `comments`, `backlinks`, `history`, `create`, `update`,
`append_body`, `comment` — in two groups, `ReadTickets` and `WriteTickets`. It
exports `TicketToolbox`, `instanceConfig` and `ticketToolbox(store, config)`,
which is the same triple `@lagrangefoundry/ai-knowledge` exports and which
`ai/host.ts` already composes through `HostDeps.extraSurfaces`. It carries
`scope_axes` for `project`, `project_write` and `ticket`, every one of them
`when_unset: deny`, so a grant is a per-session allow-set rather than a blanket
one.

`instances.json` grants the consultant `l1` and `fidelity` and nothing else.
**The assistant is the only actor in this system that cannot read the project's
own tickets.**

**2. Promotion exists, is gated, and is wired only to the client's UI.**
`promoteToSiteAsset` in `material.ts` copies a material's bytes into the site's
`assets/` through the ordinary `editAssetAdd` path, refuses anything whose record
is not `republishable` (`NotRepublishableError`), and records the placement. Its
own header says it "ships WITH its refusal, unrouted", so a surface could later be
wired "to something that is already safe". `router.ts` then wired it — to the
Library tab's HTTP route, for a human clicking. No AI operation reaches it. The
gate everyone was waiting for has been in place for some time.

**3. The mark the proposal needs already exists.**
`MaterialRow.placed_on: string[]` is, in its own words, "the sites this
material's bytes are ON — where it landed, not where it was uploaded from"
(BUG-47). `promoteToSiteAsset` is "the one function that puts a material's bytes
on a site, so it is the only thing that knows the fact the Library's pill, its
`Used on` field and its 'used on this site' filter are all trying to state."

So the client's Library tab is *already* one catalogue of items with metadata,
where being on the site is a mark on the item. The data model is the proposed one.
Only the assistant sees something else.

**Why it turned out this way.** REQ-161 built the Library for the client's UI, and
every capability added after it — the placement record, the promotion gate, the
edit recipe — was wired to an HTTP route for that UI. The assistant's toolbox was
never pointed at the same store. Each step was reasonable; the shape nobody chose
is the one we have.

## The proposal

**One catalogue. Every picture is a catalogue item. Being on the site is a field
on the item, not a different place to look.**

Concretely, what the assistant should be able to do:

- **List and search the catalogue**, the way a person scrolling the Library tab
  does — by kind, by role, by rights, by whether it is placed on this site, by
  what the describer wrote about it.
- **Read one item's metadata**: its title, the client's own filename, the
  description, `kind`, `role`, `rights`, `republishable`, `placed_on`, the edit
  recipe, when it arrived and where from.
- **Look at it** — `screenshot` already does this, by any name the item goes
  under, and needs no change.
- **Place it on the site**, which sets the mark.

Nothing above is a new concept. Three of the four are reads of a ticket, and the
fourth is a function that already exists.

### Half A — grant the ticket surface (small, and the direct answer)

Compose `ai-ticketing`'s `TicketToolbox` into the consultant's toolbox through
`extraSurfaces`, scoped to this client's project, with `ReadTickets` granted.
This is the same wiring `ai-knowledge` already has in `host.ts`, so it is a known
shape and not an experiment.

`WriteTickets` is a **separate decision and should not ride along.** The
engagement record already has its own narrow verb (`record_decision` on the
ledger surface), and an assistant that can create and patch arbitrary tickets in
the client's project is a much larger grant than anything this ticket needs.
Start read-only.

The grant must travel with the surface rather than sitting in `instances.json` —
the in-repo declaration validator only knows about surfaces this repository holds,
and a grant there for a framework surface is a grant nothing can check. `ai.ts`
already states this rule for the knowledge surface; the same applies here.

### Half B — a picture-shaped view of the catalogue

A raw ticket is not a picture. The assistant's vocabulary for a picture is
`StoredImage` — `name`, `where`, `mediaType`, `title`, `aliases` — and
`resolveStoredImage` is, deliberately, the single rule for what a picture's name
means. That must stay the one rule; a second naming vocabulary is the failure
this whole module was written to avoid.

So the catalogue view should return picture-shaped rows carrying the item's
metadata alongside the name `screenshot` already takes, rather than ticket JSON
the assistant has to translate. The shape is the merged `ImageLibrary.list()`
already produces, plus the material fields, plus `placed_on`.

**Open question, stated rather than settled:** whether this is an extension of
`list_assets` or a peer operation beside it. Extending it keeps one verb, at the
cost of changing what an existing operation means. A peer keeps `list_assets`
meaning "what this site can reference today", which is a genuinely different and
still-useful question. My recommendation is the **peer**, with `list_assets`
gaining a sentence pointing at it — because "what is on the site" and "what the
client has given us" really are two questions, and the bug was that only the
first was askable.

**The listing must be bounded**, the way `list_references` is. An engagement's
Library can hold every upload of the whole engagement, and an unbounded listing
spends the tokens this is meant to save.

### Half C — placing a picture on the site

A `place_on_site` operation over `promoteToSiteAsset`, in its **own group** and
not folded into `ManageAssets`.

It is a real trust boundary and should read as one: the private bucket holds the
client's confidential material and the site's `assets/` serves the public
internet, so promotion is a copy across that boundary and a publication decision.
DOC-38 §5 calls promoting a capture-sourced asset "the most damaging single
action available in the system". The refusal is already written and already fires
on the record rather than on an argument. A distinct group is what lets a
deployment grant looking without granting publishing.

Its result should be the `/assets/…` handle, so the next thing the assistant does
is write it into a picture element. And it should carry forward what
`promoteToSiteAsset` already says about alt text: the description lives on the
material ticket, and the assistant is the one that writes it onto the picture
element that places the image.

### Half D — closing the catalogue, so the mark means what it says

Half A–C make the Library readable and placeable. They do **not** yet make the
catalogue complete, and this is the part that needs a decision rather than an
implementation.

A picture can be on the site without being in the Library. Three of the four
doors are correct — a client upload mints a ticket, `create_image` mints one
through `generatedMaterialStore`, and promotion records `placed_on`.

**The assistant's own `write_image` drawings are deliberately excluded**
(operator decision, 2026-09-11): the client does not need the assistant's working
sketches in their Library. They stay site assets, reachable through `list_assets`
where the assistant already finds them.

What remains is the seed/push door, filed with evidence as **BUG-84
(`bug-cd883d86`)** — a picture mirrored from a captured third-party site can
reach a client's assets with no rights record, going around the gate promotion
enforces.

Fonts and other mirrored subresources are not catalogue material either; the rule
is about pictures the client has a stake in.

The honest statement of the destination, with drawings excluded: **the catalogue
is the complete account of the client's material, and `list_assets` is the
complete account of the site's contents.** They are not the same list and should
not become one. They overlap exactly where `placed_on` says they do; the
assistant's drawings live in the second and not the first, by choice.

That is why Half B recommends a peer listing rather than folding the catalogue
into `list_assets`. "What is on the site" and "what the client has given us" are
two real questions, and the whole bug was that only the first was askable. What
Halves A–C must not do is build the catalogue as a second-class view of the site
store — the catalogue is the source of truth for the client's material, and
BUG-84 is what stops a picture reaching the site without one.

## What good looks like

The 2026-09-11 session (`chat-d73a11e1`) is the acceptance test. The assistant
generated three candidate illustrations and then asked the client "how do the
mold shapes look?" three times without looking at them, because it believed they
were unreachable. With this, the same session reads its own catalogue, sees three
items it made, looks at them, forms a view, and places the one it chose — without
asking the operator to drag a file into the chat a second time.

## Prior art in this repo, for whoever builds it

- `tools/generate/src/cli/image-library.ts` — the one name rule, and the header
  explaining why the two stores are two.
- `apps/control-app/src/material.ts` — `MaterialRow`, `listMaterial`,
  `promoteToSiteAsset`, `recordPlacement`, `materialImageLibrary`.
- `tools/generate/src/cli/edit.ts` — `siteImageLibrary`, `editAssetList`,
  `editAssetAdd`.
- `tools/generate/src/cli/ai/host.ts` — how `ai-knowledge` is composed through
  `extraSurfaces` with its own grant. The pattern to copy.
- `apps/control-app/dist-assets/builder/library.js` — what a human sees, which is
  the thing being reproduced.

## Not in scope

- BUG-80, the stored-picture render path — already fixed.
- Unifying the two buckets. They are separate on purpose and stay separate; this
  is about the catalogue over them, not the storage under them.
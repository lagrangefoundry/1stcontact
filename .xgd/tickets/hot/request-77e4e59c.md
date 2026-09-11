---
uid: request-77e4e59c
id: REQ-228
type: request
title: 'One picture catalogue: the Library is the catalogue, and being on the site
  is a mark on it'
created_by: BUG-80
created_at: '2026-09-11T22:15:59.242213+00:00'
updated_at: '2026-09-11T22:36:42.676940+00:00'
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

### Half B — the catalogue IS the listing

**Decision, 2026-09-11 (operator): there is one list.** SVG drawings go into the
Library like everything else, and `list_assets` is either dropped or becomes a
view over the ticket API. The earlier plan of a peer listing beside `list_assets`
is withdrawn — two listings is the thing being fixed, not the fix.

So the shape is: **every asset a site holds is a catalogue item**, and the site's
listing is a query over the catalogue filtered by `placed_on`. A picture, a
drawing the assistant composed, a font, a stylesheet mirrored from a capture —
all of them are items. What differs is `kind`, and the **client's Library view
filters on `kind`**, which is where the "the client does not need to see the
assistant's sketches" concern belongs. Visibility is a filter on one list, not a
reason to keep a second one.

A raw ticket is not a picture, so what the assistant reads back must still be in
the `StoredImage` vocabulary — `name`, `where`, `mediaType`, `title`, `aliases` —
because `resolveStoredImage` is deliberately the single rule for what a picture's
name means and must stay so. The catalogue is where the rows come from; it is not
a new way to name one.

**The listing must be bounded**, the way `list_references` is. An engagement's
catalogue can hold every asset of every site plus every upload, and an unbounded
listing spends the tokens this is meant to save.

#### The constraint that makes this safe, and it is not optional

`list_assets` **used to** read a registry, and BUG-45 records what that cost:

> "`list_assets` reported the union of `site.json`'s `assets` array and the
> store, so a file with bytes and no entry was listed — and `get_asset` on that
> same name raised NOT_FOUND. An assistant that lists, probes, and reads a manual
> describing an `asset_id` as 'the REGISTERED name' can only conclude that an
> unregistered asset may not be used. **It cost a client their uploaded logo,
> replaced by a drawing.**"

BUG-44 fixed it by deleting the registry, so that "what a site's assets ARE is
the bytes its store holds" and "the listing and the site can no longer disagree."

Pointing `list_assets` at the catalogue **reintroduces a registry**. That is
acceptable — and is the right destination — but only under one invariant:

> **The catalogue must be complete by construction, not by convention.** Every
> write path into a site's assets mints or updates its catalogue item as part of
> the same operation. There is never a moment where bytes exist and an item does
> not.

BUG-44's lesson is not "never have a registry". It is "never have two sources
that can disagree". One source is fine. Two is what cost the logo.

Two consequences follow, and both are requirements rather than notes:

1. **Order of work.** Close BUG-84 and bring every write path into the catalogue
   **first**; verify completeness; cut `list_assets` over **last**. Cutting over
   while any door still writes bytes without an item reproduces the logo
   incident exactly.
2. **A completeness check.** Something that asserts the store and the catalogue
   agree for a site — every asset has an item, every item marked `placed_on` has
   bytes — so "complete by construction" is a verified property and not a hope.

#### What else reads this listing

`listSiteAssets` is not the AI's alone. Cutting it over touches all of these, and
the third is the one to think hardest about:

- `imageHandles` — the builder's image picker.
- `1c asset list` — the CLI, in the Node host, which has no ticket store.
- **`validateOrThrow`** — every write that touches a page checks its asset
  references against this listing, so a dangling reference is refused at the
  write. Making it ticket-backed makes **page validation depend on the ticket
  store**. That is a real coupling and needs a deliberate answer, not a
  discovery during implementation.
- `router.ts`'s asset route, which the builder UI reads.

"Drop it" and "make it a view" are genuinely different answers here. Dropping it
means those four callers each need their own answer. Making it a view keeps one
listing with one implementation swapped underneath, which is the smaller change
and the one I would take — with the caveat that the Node CLI has no D1, so the
view needs to resolve through whatever store the host actually has.

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

### Half D — the doors that bypass the catalogue

Half B's invariant only holds if every door mints an item. Today three do and the
rest do not.

**Correct already:** a client upload mints a ticket through `material.ts`'s
ingestion; `create_image` mints one through `generatedMaterialStore`; promotion
copies bytes onto the site, checks the rights gate and records `placed_on`.

**Doors that write bytes and mint nothing:**

- **`write_image`** — the assistant's SVG drawings. Now **in scope** (the earlier
  decision to exclude them is withdrawn): 14 drawings are live on sites with no
  catalogue item. They should mint items with an `origin` of their own — a
  drawing this system composed is a third provenance, distinct from `uploaded`
  and `generated` — and the client's Library view filters them out by `kind`
  rather than by their absence.
- **`add_asset`** — a file from the operator's own disk.
- **Seed / push** from `storage/sites/<slug>/draft/assets/`. This is BUG-84
  (`bug-cd883d86`), and it is the one with an exposure attached: a subresource
  mirrored from a captured third-party site reached a client site with no rights
  record, going around the gate `promoteToSiteAsset` enforces.

**Fonts and build output.** They are in `list_assets` today — its own summary is
"the images and fonts this site can use" — so if the listing becomes a catalogue
view they need items too, or the union comes back and with it the two-sources
shape. The answer that keeps one list is that they are items with a `kind` the
client's Library filters out, exactly as drawings are. Worth confirming
explicitly when this is scoped, because "mint a ticket per mirrored stylesheet"
sounds wrong right up until the alternative is two sources of truth again.

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
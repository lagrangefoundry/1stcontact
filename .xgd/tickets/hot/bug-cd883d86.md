---
uid: bug-cd883d86
id: BUG-84
type: bug
title: A capture-mirrored picture can reach a site's assets with no catalogue ticket
  and no rights record
created_by: BUG-80
created_at: '2026-09-11T22:27:15.822174+00:00'
updated_at: '2026-09-12T00:28:21.298711+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  severity: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-10050685
  commits:
  - working_sha: c9c468fbd6c66c5ac17e04afc964acae85b62e60
    reconcile_sha: null
    main_sha: null
  version: 0.2.174
  story_points: 3
---

## What is wrong

A picture can land in a site's assets without ever becoming a catalogue item, so
the catalogue is not a complete account of what is on a site.

**Scope, 2026-09-11 (operator, revised).** An earlier decision excluded the
assistant's `write_image` drawings from the catalogue; it has been **withdrawn**.
REQ-228 now takes the strong form — one list, every asset is a catalogue item,
and what the client sees in their Library is a filter on `kind` rather than a
second list. Drawings are in.

That makes this ticket one door among several rather than the whole gap. The
others — `write_image` and `add_asset` — are named in REQ-228's Half D. **This
one keeps its own ticket because it is the only one with an exposure attached**,
and that exposure stands whatever happens to the catalogue.

## The exposure

Setting drawings aside — they are a catalogue gap, not a rights one — the raster
picture on a site with no record is **one file**:

```
non-SVG pictures in site_assets : AlchemistLabWithTech.png (2.4 MB)
                                  DSC_7975.jpg (12.7 MB)
material ticket for DSC_7975.jpg: yes — promoted, placed_on recorded correctly
material ticket for Alchemist…  : none
```

Its provenance is the point:

```
storage/references/gigabytealchemy.ai/index/assets/AlchemistLabWithTech.png
storage/sites/gigabytealchemy/draft/assets/AlchemistLabWithTech.png
→ site_d669b155… (slug: gigabytealchemy)
```

It is a subresource **mirrored from a captured third-party website**, which then
reached a site's assets through the seed/push door (`storage/sites/<slug>/draft/`
→ `1c push`). No material ticket was minted, so no `rights` block was ever
written, and `republishable` was never evaluated.

`promoteToSiteAsset` refuses exactly this picture — it checks `republishable` on
the material's own record and raises `NotRepublishableError` for anything
capture-sourced, because DOC-38 §5 calls promoting a capture-sourced asset "the
most damaging single action available in the system": it publishes third-party
copyright under the client's own domain. **That gate is correct, and this door
goes around it**, because a picture with no ticket has nothing for the gate to
read.

The instance here is a development fixture and harms nobody. The door is the bug.

## What works, stated so it is not re-litigated

- **A client upload** mints a `material` ticket through `material.ts`'s
  ingestion — classified, described, indexed.
- **`create_image`** mints one through `generatedMaterialStore` in `imagegen.ts`,
  which exists precisely so that "a generated image is an ordinary `material`".
- **Promotion** copies a material's bytes onto the site, checks the rights gate,
  and records `placed_on` — `DSC_7975.jpg` is in both places, correctly marked.

Three of four doors are right. This is about the fourth.

## The doors that bypass the catalogue

1. **Seed / push from `storage/sites/<slug>/draft/assets/`.** Whatever is in that
   directory becomes a site asset. Capture-mirrored subresources land there, so a
   third party's imagery can reach a client's site with no rights record and no
   gate. This is the live instance and the one that matters.

2. **`add_asset`** — a file from the operator's own disk. Same absence, lower
   stakes: the operator is asserting their own material, and the operation is not
   granted to the consultant.

`write_image` is a third door and is now in scope for the catalogue — but it is
**REQ-228 Half D's**, not this ticket's. A drawing this system composed has no
rights question: it is owned and republishable by construction. Keeping it here
would mix a catalogue gap into a rights gap and blur what this ticket is for.

Fonts (`satoshi-*.woff2`), stylesheets and other mirrored subresources
(`blog.*.css`, `css2`, `index`) are likewise REQ-228's to decide. Note that they
arrive through the *same* seed/push door as the picture above, so whatever answer
that door gets has to cover them — which is part of why the door, rather than the
file type, is the right thing to fix.

## What we want

A **picture** that lands in a site's assets through the seed/push door gets a
catalogue entry carrying its provenance and its rights block — or, if minting a
ticket per seeded asset is the wrong shape, the rights question is answered at
that door some other way. What must not survive is a picture on a client's site
that no record can account for.

The narrower framing, if the broad one is too much: **a capture-mirrored image
must not reach a site's assets without passing the same gate promotion passes.**
That is one rule, at one door, and it closes the exposure without touching the
catalogue's shape.

## Relationship to REQ-228

REQ-228's Half B makes `list_assets` a view over the catalogue, and states the
invariant that makes that safe: **the catalogue must be complete by
construction** — every write path into a site's assets mints its item as part of
the same operation, so there is never a moment where bytes exist and an item does
not. BUG-45 is the evidence for why that is not optional.

This door is one of the ones that breaks the invariant, so closing it is a
precondition of the cut-over rather than an improvement alongside it. The
difference from the other doors is that this one is *also* a rights hole, and
would be worth closing even if the catalogue were never unified.

## Questions to settle when scoping

- Whether the seed/push door mints tickets, or is gated some other way.
- Whether the existing `AlchemistLabWithTech.png` is left alone (a dev fixture),
  or is the test case for whatever gate is added.
- Whether a capture bundle's images should be catalogue items in their own right
  — they are the client's *reference* material, which is a real category with a
  `rights` answer of its own, distinct from anything they own.

## Related

- REQ-228 (`request-77e4e59c`) — the catalogue proposal. Half D names this gap.
- BUG-47 — established `placed_on` as placement rather than upload context.
- BUG-45 — made promotion go *through* `editAssetAdd` rather than past it, so a
  file arriving by one door is treated like one arriving by another. This is the
  same argument, at a door that has no gate at all.


---

## Scope settled, 2026-09-11 (implementation)

The three scoping questions above are answered as follows.

**The seed/push door is gated, not made to mint tickets.** Minting a `material`
ticket per seeded asset is REQ-228's shape decision — it is the one that has to
cover fonts, stylesheets and build output too, and the ticket says so. More to
the point, minting a ticket for a capture-mirrored picture would *record* the
infringement rather than prevent it: there is no `rights` block that makes a
third party's photograph publishable on a client's domain, so the only honest
entry is one that refuses. This ticket therefore takes its own narrower framing:
**a capture-mirrored asset must not reach a site's assets without passing the
same gate promotion passes.** REQ-228's invariant is still served — after this,
the door either writes bytes that some record can account for, or writes nothing.

**`AlchemistLabWithTech.png` is the test case, and is left where it is.** The
local reproduction under `storage/sites/gigabytealchemy/draft/` is what `1c
repro` exists to produce and what the fidelity loop reads; deleting its mirrored
assets would break the framework-growth loop rather than close a hole. The
refusal is at the push door, so the reproduction keeps rendering locally and
stops being publishable. Measured against the real corpus, the rule is exactly
discriminating: all five of that draft's assets are byte-identical to members of
`storage/references/gigabytealchemy.ai/index/assets/`, and none of the nine
assets under `storage/sites/xgd/draft/assets/` matches anything in any bundle.

**Whether a capture bundle's members become catalogue items in their own right
is REQ-228's**, and nothing here decides it.

## The rule

> Bytes this system mirrored from a captured page may not enter a site's assets.

**Identity is the sha256 of the bytes.** The copy into
`storage/sites/<slug>/draft/assets/` destroys every other link back to the
capture — the file arrives under its own basename in a directory that records
nothing — so the content hash is the only evidence that survives it. That is
also why the gate reads bytes rather than provenance: a path-based or
name-based test would be defeated by the rename the copy already performs.

**Every mirrored subresource counts, not only pictures.** The scan is the
bundle's `assets/` prefix, which is where the capture pipeline puts every
subresource it mirrored. A third party's stylesheet or licensed webfont
republished on a client's domain is the same act as their photograph, and a
type test would be one more thing to get wrong. The bundle's own derived and
observed members (`multistate.json`, the screenshot ladder, `rendered.html`)
are deliberately **not** scanned: they run to tens of megabytes, nothing copies
them into a draft, and reading them on every import would put a Worker's limits
between the operator and their push.

**The refusal is hard and has no override.** `NotRepublishableError` has none
either, for the same reason: an escape hatch on a rights gate is the gate not
existing. `--force` remains what it has always been — BUG-51's answer to
replacing builder changes — and does not reach this.

## Where it is enforced

Both halves of the one door, because each half holds different evidence and
neither alone is sufficient.

1. **`1c push` (Node).** Checked against the operator's own
   `storage/references/` bundles, before anything crosses the wire. **This is
   the half that catches the reported instance**: the gigabytealchemy capture
   was taken on the operator's disk and was never adopted into any tenant's
   cloud store, so a Worker-side check alone would have found nothing to match
   and let it through.
2. **`POST /api/import` (the Worker).** Checked against the tenant's R2
   reference store, which is where a capture taken in the cloud lives. The
   Worker is the writer, and a rule only the client enforces is not a rule: a
   request posted by hand must be refused by the same rule that refuses the CLI.

One predicate, two call sites, two adapters of the one `ReferenceStore` port.

## What must not change

- A push carrying no assets, or a tenant holding no captures, is unaffected —
  there is nothing to match against and no extra work is done.
- A deployment with no `BLOBS` binding has nowhere for captures to live, so the
  import route has nothing to check and proceeds as before rather than failing.
- The refusal names the offending asset and the bundle member it mirrors, so
  the operator is told *which* file and *where it came from* rather than that
  the push was refused.
- BUG-51's 409 conflict and this refusal are different answers to different
  questions and must stay distinguishable: the import route answers this one
  with **403**, because the request was well formed and the rule said no.

## Not in scope

- `write_image` and `add_asset` — REQ-228 Half D's, named there.
- Cataloguing fonts, stylesheets and build output — REQ-228 Half B's.
- The `AlchemistLabWithTech.png` row already in a dev deployment's `site_assets`
  is an operator cleanup, not a code change; the door it came through is shut.


## Behaviour this adds, stated so it has evidence

- **A refused import leaves nothing behind — not even an empty draft.** The gate
  runs before `createDraft`, for the same reason BUG-51's 409 refuses ahead of
  the write rather than rolling back after it: a slug that has never been
  imported must not come into existence because somebody tried to publish a
  picture they may not publish.
- **Nothing is uploaded when the CLI refuses.** The check runs while reading the
  draft, before the request is formed, so a refused push never puts a third
  party's bytes into anyone else's storage on the way to being told no.
- **The gate reads bytes, not names.** The same bytes under a different name are
  refused; different bytes under the captured name are not. That is what makes
  the rule survive the rename the copy into `draft/assets/` already performs.
- **One business's captures never gate another's push.** The reference store is
  bound per business by `forTenant` and the gate inherits that barrier rather
  than re-enforcing it — one client's private material must not decide what a
  different client may publish.
- **`readSitePayload` now takes the reference store it checks against**, and
  `PushOptions.references` is required rather than optional: an optional store is
  a gate a caller can forget, and a forgotten gate looks exactly like a clean
  push. A caller with no bundles passes one that lists none.

## Known consequence, accepted

`bin/publish` with no slugs named pushes every site in `storage/sites/`, so a
checkout holding a `1c repro` reproduction will now stop at that site rather
than publishing it. That is the bug being surfaced rather than a regression —
the reproduction is a local framework-growth artifact and was never publishable
— and the refusal names the file and the bundle it came from.
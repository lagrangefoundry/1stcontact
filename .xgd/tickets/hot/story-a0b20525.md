---
uid: story-a0b20525
id: STORY-179
type: story
title: Assistant reads the client's Library as one catalogue and places an item on
  the site
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:17:49.567233+00:00'
updated_at: '2026-11-09T23:17:49.567233+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-374f88d6
  capability_uid: capability-e9324eb7
  story_kind: feature
  story_points: 3
---

## Story

**As a** client working with the site assistant, **I want** the assistant to read the same Library of material I have given it — every picture, document and font, with what each one is and whether it is already on my site — and to place one of my pictures on the site itself, **so that** it looks at what I gave it and uses it, instead of asking me to hand over the same file again or asking my opinion of pictures it has never looked at.

## Description

The assistant's conversation gains a `library` surface over the client's material catalogue — the same catalogue the client's own Library tab shows. Being on the site is a mark on a catalogue item (`placed_on`), not a second place to look.

In scope:
- **Listing the catalogue** (`list_library`): every kind of material (images, documents, fonts, captures), newest first. It can be filtered by kind, by role (what the client said it is for), by whether it is placed on *this conversation's* site, and by text. The listing is bounded by a default page and always reports how many items matched and whether some were held back.
- **Reading one item** (`get_library_item`): everything the listing carries plus the item's description, which is what alt text is written from.
- **Placing an item on the site** (`place_on_site`): copies the item's bytes into the site's draft assets, marks the item as placed, and returns the `/assets/…` handle to write into a picture element, plus the item's description. Material the record says may not be republished is refused. A name already in use on the site is renamed, never overwritten. Placing does not publish.
- **One naming rule.** A catalogue item is named exactly as `screenshot` and `edit_image` name a stored picture: by its catalogue name, the client's filename, or its title. A name that fits more than one item is refused, and the refusal lists the candidates.
- **Grant and presence.** Reading (`ReadLibrary`) and placing (`PlaceOnSite`) are separate capability groups, both granted by the surface itself. The surface exists only where the deployment holds a ticket store (the hosted control app). The local `1c` CLI consultant has no catalogue tools.

Out of scope:
- REQ-228 half A (read access to the business's tickets). That is a separate plan item.
- Cutting `list_assets` over to the catalogue, and the doors that write site bytes without a catalogue item (REQ-228 half D, BUG-84). REQ-228 requires those doors to close *before* any cut-over.
- The assistant's own `write_image` SVG drawings entering the Library. The operator excluded this on 2026-09-11 (REQ-228 "Not built here").
- Changing an item's rights, role or republishability, and deleting or un-placing items. The surface declares these as deliberate absences.

## Technical Context

- **Reuses existing capabilities and adds no concept.** The listing is the Library tab's own list (CAP-113 / STORY-144). The detail read is the Library detail pane's read. Placement is the existing republishability-gated promotion (STORY-143, REQ-163), which is not re-implemented here. That promotion refuses non-republishable material on the record, renames around collisions, and records `placed_on` after the bytes land. This surface only gives that refusal the surface's declared `NOT_REPUBLISHABLE` code.
- **Naming.** One projection from a material record to a named item is shared by this catalogue and by the Library half of the merged picture library that `screenshot`/`edit_image` read. The single name resolver from REQ-218 is applied to the whole catalogue, not only to images, so the two cannot drift.
- **Placement renders the current picture.** The deployment's image renderer is passed to placement so the placed bytes reflect the material's edit recipe (REQ-229, REQ-219). Those ACs belong to the REQ-229 plan item, not this story.
- **Tenant isolation.** Both the ticket store and the site store reach the surface already bound to one business. No parameter on this path can name another client's material.
- **Architecture.** This is bounded Worker work: one catalogue read per call, filtered and paged in memory (DOC-5 item 35, no per-item store query). Private material crosses into the public site only through the existing rights gate (DOC-5 item 26; DOC-38 §5 calls capture-sourced promotion the most damaging single action).
- Related: CAP-92 (declared, granted, validated control surfaces), CAP-106 (client material store), CAP-88 (site asset store / `list_assets`).

## Reconciliation Decisions

- **Default page of 20, with total and `more`** (decided at reconciliation, 2026-11-09): REQ-228 requires the listing to be bounded, to take a limit, to default it, and to report the total matched and whether rows were held back. It does not name a number. The code defaults to 20. `total` counts the *filtered* matches, not the whole catalogue. A missing, zero, negative or non-integer limit falls back to the default. Formalized as the paging AC.
- **"Placed" is relative to this conversation's site** (decided at reconciliation, 2026-11-09): intent says "whether it is already on this site" without covering a business with several sites. The code tests `placed_on` for the session's site, so an item placed only on another site counts as not placed. Formalized in the filter AC.
- **Text filter haystack** (decided at reconciliation, 2026-11-09): intent says filtering covers "text the describer or the client wrote". The code matches a case-insensitive substring against the item's catalogue name, title (the describer's title or the client's name), filename and aliases. It does not search the full description body, which the listing deliberately omits for size. The declaration's parameter prose says "title, filename or description", and here "description" means the describer's title. The AC formalizes what the code searches. If the full-body search is wanted, that is a future upgrade.
- **No `rights` filter** (decided at reconciliation, 2026-11-09): the proposal section lists "by rights" as a filter. The later "Scope, as built (2026-09-11)" section names four dimensions: kind, role, placement and text. The as-built section outranks the proposal. Rights is still returned on every item.
- **NOT_FOUND names up to 12 existing items**, or says the client has given nothing yet (decided at reconciliation, 2026-11-09): intent requires that a refusal help the model ask again and says nothing about not-found lists. The code bounds the hint at 12 names with an ellipsis, consistent with the listing's own bound.
- **Default placed name is the client's filename** (decided at reconciliation, 2026-11-09): intent is silent. The code defaults to the material's filename, overridable with `as`, so a picture placed by the assistant and the same picture placed from the client's Library land under the same name.
- **`list_assets` coexists with the catalogue** (noted at reconciliation, 2026-11-09): this is not a contradiction. REQ-228's operator decision of 2026-09-11 ("there is one list") also sets the order of work: close BUG-84 and every bypassing write path first, cut `list_assets` over last. Until then the surface declares how the two lists differ. No AC is written for the cut-over, which belongs to future work.

## Dependencies

None.

## Story Points

3

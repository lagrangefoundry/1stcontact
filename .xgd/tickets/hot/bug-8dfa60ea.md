---
uid: bug-8dfa60ea
id: BUG-45
type: bug
title: 'Chat upload: a file dropped on "Put it on the site" is unusable to the assistant'
created_by: xgd
created_at: '2026-09-01T22:31:24.397792+00:00'
updated_at: '2026-09-02T00:43:49.587342+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-88619077
  severity: high
  commits:
  - working_sha: fd6aa2bf39a5520f4ee501738d88b43399fbaf72
    reconcile_sha: null
    main_sha: null
  version: 0.2.41
  story_points: 3
---

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

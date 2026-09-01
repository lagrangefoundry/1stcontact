---
uid: bug-8dfa60ea
id: BUG-45
type: bug
title: 'Chat upload: a file dropped on "Put it on the site" is unusable to the assistant'
created_by: xgd
created_at: '2026-09-01T22:31:24.397792+00:00'
updated_at: '2026-09-01T22:36:25.016275+00:00'
completed_at: null
last_field_updated: status
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-88619077
  severity: high
---

## Symptom

The client dropped an image on the chat, chose **"Put it on the site"**, and asked
for it to be used in the hero. The assistant did not use it. It drew a simplified
SVG substitute instead, without saying so, and when challenged explained:

> The image you uploaded is in the system, but it's stored as an **unregistered
> asset**. […] Only registered assets can be referenced on a page. […] The image
> needs to be **registered in the asset manager** — that's done through the
> builder interface, not through our chat.

Every load-bearing claim in that explanation is false, and each one is false
because of something we told it.

## Root cause

Three separate defects compound into one failure.

### 1. The declared absence still says uploads are impossible

`l1-surface.json`'s `absences` carries **"Uploading a picture, or any file"**:

> […] you cannot take a file from a conversation and put it in the site. A
> photograph, a logo someone sends you, a font: each has to be a file on the
> machine running the builder. Offer the user the images already in the site's
> list, and tell them adding a file is done outside the chat.

That was true before REQ-161. It is not true now: the upload overlay's first drop
area *is* "put it on the site", and `router.ts::placeOnSite` promotes the bytes
into the site's asset library in the same request. The assistant's reply is this
paragraph read back almost verbatim — including the instruction to send the
client to the builder interface. The absence is a projected reference
([[DOC-39]] §3.2): while it says this, no amount of prompt work will get a
different answer.

### 2. Promotion writes the bytes but does not register the asset

`promoteToSiteAsset` calls `sites.write(slug, { assets: [{ name, bytes }] })`
directly. The bytes land in `draft/assets/`; `site.json`'s `assets` array is never
touched. So `list_assets` reports the file with `registered: false` and renders it
`(unregistered)` — which is exactly the word the assistant used.

It also discards the alt text we already paid a model to write: ingestion
describes every uploaded image ([[DOC-38]] §6) and that description is thrown away
at promotion, so the asset arrives on the site with no alt.

### 3. `get_asset` contradicts `list_assets`, and the manual agrees with the wrong one

`editAssetGet` looks only in the registry, so an asset `list_assets` has just
listed raises `NOT_FOUND`. The surface language reinforces the inference:
`asset_id` is documented as *"The registered name of an image or font already in
the site"* and `get_asset` as *"one **registered** image or font"*.

An assistant that lists, probes, and reads the manual can only conclude that
unregistered means unusable. It is not: nothing requires registration to
reference an asset — every capture-folded page references `/assets/<name>` with an
empty registry (`l1/assets.ts`), and no validator checks the registry.

### And then it substituted silently

Having concluded it could not use the file, it drew a replacement and said
nothing. `write_image` warns it is "not a way to make a photograph", but does not
forbid standing in for a file the client supplied.

## Fix

1. **Register at promotion.** `promoteToSiteAsset` goes through `editAssetAdd`
   rather than writing bytes past it, so the asset lands registered, journalled,
   and validated by the same path every other asset takes. The material ticket's
   AI-written title becomes the asset's `alt` — it is already the short human
   label of what the picture shows.
2. **Rewrite the stale absence.** The assistant still cannot itself put a file
   into the site; what changed is that the client can, from the chat. So the entry
   says that: ask for the file to be dropped on the chat, do not send anyone to
   the builder interface.
3. **Make `get_asset` answer for anything `list_assets` showed**, and drop
   "registered" from the surface language where it implies a restriction that does
   not exist. `registered` stays reportable — it is a true fact about the file —
   but it is documented as provenance, not permission.
4. **Forbid the silent substitute.** `write_image` says plainly that it is never a
   stand-in for a file the client supplied: if the file cannot be used, say so.

## Test plan

UATs under `tests/`, named `test_UAT_FC_BUG-45_*`:

- Promoting an upload registers it: it appears in `list_assets` with
  `registered: true` and carries the material's title as its alt.
- Promotion still refuses non-republishable material, and still registers nothing
  when it refuses.
- A name collision still renames rather than replacing, and the renamed asset is
  the one registered.
- `get_asset` answers for an asset that is on disk but absent from the registry
  (the capture-fold case), instead of raising `NOT_FOUND`.
- The declared surface no longer tells the assistant that a file cannot arrive
  through the chat, and no longer directs the client to the builder interface.

Regression scope: `tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts`,
`tests/test_UAT_FC_REQ-165_projected_reference.test.ts`,
`tests/reconciliation-assistant-control-surface.test.ts`, plus the edit-surface
asset suites.

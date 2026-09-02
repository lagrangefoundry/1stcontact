---
uid: bug-8dfa60ea
id: BUG-45
type: bug
title: 'Chat upload: a file dropped on "Put it on the site" is unusable to the assistant'
created_by: xgd
created_at: '2026-09-01T22:31:24.397792+00:00'
updated_at: '2026-09-02T00:09:27.199848+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-88619077
  severity: high
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

**The file arrived as reference material.** `placeOnSite` returns at its first
line on `role !== 'site'`, so the bytes never reached the site's asset folder and
the republishable gate was never even consulted. The image was not an unregistered
asset; it was not on the site at all. The assistant's explanation was
confabulated — it knew the material existed from the corpus delta, could not find
it in `list_assets`, and reached for registry vocabulary to explain the gap.

Whether the drop landed on the wrong area or the two areas are less legible in use
than in code is not settled. `upload.js` takes the role from the specific button
dropped on, per drop, with no default, and no mislabelling path was found.

## The four defects

### 1. Promotion writes bytes but never registers (CONFIRMED, independent of the above)

`promoteToSiteAsset` (`apps/control-app/src/material.ts:563`) calls
`sites.write(slug, { assets: [{ name, bytes }] })` with `siteJson` omitted. The
bytes land in `draft/assets/`; `site.json`'s `assets` array is never touched.

Only two functions ever write that array: `editAssetAdd` (`edit.ts:1984`) and
`editImageWrite` (`edit.ts:2082`). Chat promotion goes past both.

The evidence is exact. Site `alpha`'s registry held **one** entry —
`ga-gold-a.svg`, the assistant's own drawing, registered because `write_image`
registers. The client's two genuinely promoted uploads (`ChatGPT Image Jun
22…png`, `image (6).png`) had bytes on disk and `site_assets` rows and no registry
entry. The only registered picture on the site was the substitute.

It also discards alt text we already paid for: ingestion describes every uploaded
image ([[DOC-38]] §6), and promotion drops that description on the floor.

### 2. The declared absence still says uploads are impossible

`l1-surface.json`'s `absences` carries "Uploading a picture, or any file":

> […] you cannot take a file from a conversation and put it in the site. […]
> Offer the user the images already in the site's list, and tell them adding a
> file is done outside the chat.

True before [[REQ-161]]; false now. The overlay's first area *is* "Put it on the
site", and the upload route promotes in the same request. The assistant's reply —
including sending the client to the asset manager — is this paragraph read back.
It is a projected reference ([[DOC-39]] §3.2): while it says this, no prompt work
changes the answer.

### 3. `get_asset` contradicts `list_assets`, and the manual backs the wrong one

`editAssetGet` reads only the registry, so an asset `list_assets` has just listed
raises `NOT_FOUND`. The surface language compounds it: `asset_id` is "The
registered name of an image or font already in the site", `get_asset` is "one
**registered** image or font".

Registration is not permission. Nothing checks the registry before a page may
reference an asset — every capture-folded page points at `/assets/<name>` against
an empty registry (`l1/assets.ts`) and renders. Left alone, this reproduces the
same refusal on the next unregistered file.

### 4. The substitute was silent

`write_image` warns it is "not a way to make a photograph" but does not forbid
standing in for a file the client supplied. It drew one and reported completion.

## Behaviour required

1. **Promotion registers.** A file promoted from the chat lands as a first-class
   asset: bytes stored, registry entry created, `site.json` validated, and the
   write recorded in the draft change journal so the assistant is told it arrived
   rather than having to notice. It reaches this by the same path every other
   asset does, so there is one set of rules about names and one about validity.
2. **The description becomes the alt text.** The material ticket's AI-written
   title lands on the registry entry, instead of the entry being created with an
   empty `alt`.
3. **Existing gates are unchanged.** Non-republishable material is still refused
   outright, and a refusal still registers nothing and stores nothing. A name
   already taken is still renamed rather than replaced, and it is the renamed name
   that gets registered.
4. **The surface stops describing uploads as impossible.** The assistant still
   cannot itself put a file into a site; what it must no longer say is that a file
   cannot arrive through the chat, or direct the client to the builder interface.
   The correct move when it needs a picture is to ask for it to be dropped on the
   chat.
5. **Anything `list_assets` reports can be read by `get_asset`**, including an
   asset with bytes but no registry entry. `registered` remains reportable — it is
   a true fact about the file — but is described as provenance, not permission, so
   nothing on the surface implies an unregistered asset may not be used.
6. **No silent substitution.** A drawn image is never a stand-in for a file the
   client supplied. If the client's file cannot be used, the assistant says so
   instead of composing a replacement.

## Test plan

UATs named `test_UAT_FC_BUG-45_*`:

- Promoting an upload registers it — it appears in `list_assets` with
  `registered: true` and carries the material's title as its alt (behaviour 1, 2).
- The promotion is journalled, so it shows up as a draft change (behaviour 1).
- Non-republishable material is still refused, and registers nothing (behaviour 3).
- A colliding name still renames rather than replaces, and the renamed asset is the
  registered one (behaviour 3).
- `get_asset` answers for an asset on disk but absent from the registry, rather
  than raising `NOT_FOUND` (behaviour 5).
- The declared surface no longer says a file cannot arrive through the chat, and
  no longer directs the client to the builder interface (behaviour 4).
- The declared surface forbids substituting a drawing for a supplied file
  (behaviour 6).

Regression scope: `test_UAT_FC_REQ-163_ingestion.workers.test.ts`,
`test_UAT_FC_REQ-165_projected_reference.test.ts`,
`reconciliation-assistant-control-surface.test.ts`, and the edit-surface asset
suites.

## Not in scope

- **The n-gram quarantine gate.** [[DOC-38]] §11 specifies an n-gram check on
  control-surface text against the quarantined corpus, so the assistant cannot
  retype third-party copy from reference material onto a page. It does not exist —
  the only occurrence of "quarantine" or "n-gram" in the tree is the comment at
  `material.ts:38` saying v1 ships the prompt-level constraint and the asset gate
  instead. Real, documented, unbuilt; its own ticket.
- **Why the file was classified `reference`.** Needs a reproduction, not a code
  change. Separate if it recurs.

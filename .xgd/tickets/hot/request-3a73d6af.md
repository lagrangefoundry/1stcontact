---
uid: request-3a73d6af
id: REQ-287
type: request
title: The upload confirmation names the catalogue label, not the stored filename
created_by: EPIC-19
created_at: '2026-09-20T22:04:23.388789+00:00'
updated_at: '2026-09-20T22:29:01.622516+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  story_points: 1
  chat_comment: comment-d2af2014
  commits:
  - working_sha: 5c6b767192b69fa4171ee79bc7b02b5d4f98e117
    reconcile_sha: null
    main_sha: null
  version: 0.2.297
---

## What changes

The sentence a drop gets back in the conversation names the material's
**catalogue label** instead of its stored filename.

Today, uploading a picture says:

> 📎 **3d727c09-fe22-4b7e-8035-ff2ac6878fb9.png**
>
> Added, and it's on your site as `3d727c09-fe22-4b7e-8035-ff2ac6878fb9.png`.

It should say:

> Added, and it's on your site as **IMAGE-25**.

## Why the filename is the wrong name to say

[[REQ-280]] gave every material a label — `IMAGE-25`, `DOCUMENT-4` — and made it
the name the client and the consultant share. It is what the Library shows in
its rows, and since [[REQ-218]] it is a name the assistant *accepts back*: a
picture answers to its catalogue label as well as to its filename and its uid.

The filename is the opposite of that. A browser upload arrives named by whatever
produced it, and for anything off a phone or a design tool that is a uuid. It is
a storage key: it is how the bytes are addressed under `site_assets`, and it is
correct there. Reading it aloud to the person who just dropped the file tells
them nothing they can use, and — worse — it is the one name in this system that
is *unusable in the next sentence they type*, because they cannot be expected to
transcribe 36 hex digits to ask for a change to it.

So the confirmation currently ends by naming the material in the single way that
cannot be said back. The label was invented precisely to close that gap, and
this is a place it never reached.

## Why it cannot simply be swapped in

The client does not have the label to print. `uploadNote`
(`apps/control-app/src/builder/app.js`) can only say what the upload route
answered with, and `materialEnvelope` (`apps/control-app/src/router.ts`) does
not carry `label` — it echoes `uid`, `title`, `kind`, `rights`, `role`,
`origin`, `description_status` and the attachment, and stops there.

The gap is an omission rather than a decision, and the neighbouring route proves
it: `POST /api/material/role` returns its row through `readMaterial`, whose
`rowOf` *does* project `label`, so the same material is described with its label
on one path and without it on the other. The envelope predates [[REQ-280]] and
was simply never revisited when labels arrived.

So this is two halves:

- **`materialEnvelope` carries `label`.** It is allocated during ingest, before
  the ticket is written — `material.ts` allocates it there deliberately, so that
  there is never a window in which the Library could list a row that has no
  label. By the time the envelope is composed the value is in hand; nothing
  needs to be read back.
- **`uploadNote` names it** in the placement sentence.

## Where there is no label

`MaterialRow.label` is `string | null` and stays that way. Material ingested
before [[REQ-280]] has none, and that is recorded as a gap in an old Library
rather than a defect. Where the label is null the sentence keeps the filename it
uses today, which is the honest name for a thing that has no other one.

## What does not change

- **The gate on the sentence.** The line is conditional on the material actually
  having been placed on the site. Only the name inside it changes; a material
  that was stored but not placed still says what it says now.
- **The asset's name on the site.** `site_asset` remains the filename the bytes
  are served under, and the URL in the published page is untouched. This ticket
  changes one sentence of prose, not an address.
- **The three other lines** — the reference-role note, `site_asset_error`, and
  the unindexed warning — are untouched, as is the refusal path.
- **The filename is still shown**, on the first line, in bold, as the thing the
  client dropped. They recognise the file by that; they refer to it afterwards
  by the label. Both belong in the note and they answer different questions.

## Two consequences of putting it in the envelope rather than beside it

- **The fetch route is named the same way.** `POST /api/material/fetch` and the
  upload route converge on `ingest` and compose the same `materialEnvelope`, so
  material we pull on the client's behalf comes back carrying its label too.
  That is a consequence of there being one envelope rather than a second
  decision, and it is the right one: a fetched brief is catalogued as `DOC-1`
  exactly as a dropped one is.
- **`label` is on every envelope, `null` where there is none.** The key is
  present rather than omitted, for the reason `description_model` is: a caller
  deciding what to call the material then never has to tell absence from
  emptiness. Nothing ingested through this path can lack a label — it is
  allocated in the same `create` as the classification — but the row's field is
  `string | null` and the envelope should not be the one place that claims
  otherwise.

## Test plan

Two UAT files, one per half.

- `tests/test_UAT_FC_REQ-287_the_envelope_carries_the_label.workers.test.ts` —
  over real D1 and a real site store, through `route()`: a placed upload answers
  with `IMAGE-1` and that is the same string `listMaterial` shows for the row; a
  uuid-named drop is answered with a name the client could repeat while
  `site_asset` still holds the uuid; an unplaced reference document is labelled
  `DOC-1` just the same; and the fetch route's envelope carries a label too.
- `tests/test_UAT_FC_REQ-287_the_note_names_the_label.test.ts` — through the real
  builder and the real chat pane, with only the HTTP calls injected: the
  placement sentence reads *"Added, and it's on your site as **IMAGE-25**."* and
  not the uuid; the filename is still the note's first line in bold; a `null`
  label keeps the backticked filename; and a material with a label but no
  placement produces no placement sentence at all — the gate is unchanged, and
  that is the way this change could have broken it.
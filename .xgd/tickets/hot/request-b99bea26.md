---
uid: request-b99bea26
id: REQ-220
type: request
title: 'The image modal: viewer, editable Library name, and the editing tools'
created_by: EPIC-1
created_at: '2026-09-10T21:50:53.431733+00:00'
updated_at: '2026-09-10T21:56:00.885763+00:00'
completed_at: null
last_field_updated: depends_on
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-219
  chat_comment: comment-8f31e389
---

## The gap

A client can look at a picture in the Library and change nothing about it. The
detail pane renders the image, offers a download link, and stops. To crop a
photograph they must leave the product, crop it elsewhere and upload it again —
at which point they hold two files and the product holds two materials.

They also cannot fix its name. A generated image is titled from the prompt that
made it, so it arrives in the Library under a sentence nobody chose to call it.

## What changes

**Clicking a picture opens it in a modal, with the editing tools.** Opened from
the Library's detail pane and from the picture in the chat, which is the same
picture and must go to the same place.

**The pattern already exists.** `mountReader` opens documents in a modal host
(REQ-172) and `library.js` already owns the detail pane and its editable fields
block. This is that furniture extended to pictures, not a second way of showing
a file.

**The Library name is in the modal and it is editable.** One field, one meaning,
both places — the name shown here is the name the item appears under in the
Library, and editing it in either place changes the same thing. This is the fix
for generated images arriving named after their own prompt.

**The tools are the shared vocabulary and nothing more:** crop, rotate, resize,
and adjustment of brightness, contrast and saturation. The same list the
assistant's `edit_image` uses, because there is one list.

**Undo and redo, throughout the session.** The client can step back through what
they have done in this sitting without thinking about recipes.

**And the picture is never destroyed.** Closing and reopening the modal a month
later, a crop can be widened again — the recipe is revisable, so what a crop took
away is still there. The client does not need to know why; they need it to be
true, and the editor must not offer any control that makes it false.

**Interaction is local; truth is rendered.** Dragging a crop box moves a CSS
overlay so the gesture is immediate, and committing re-fetches the real bytes
from the renderer. What the client is looking at after a commit is what will be
published.

**Crop and focal point are different things and both stay.** `assetRefSchema`
already carries `focalPoint` — *when a band forces an aspect on this picture,
keep this bit in frame*. Cropping says *this picture is that shape*. The modal
should let a client set the focal point too, and must not present the two as
alternatives.

## Depends on

The recipe model and the renderer. This ticket is the surface over them; it
introduces no operation of its own and no second definition of what an operation
means.
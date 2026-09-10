---
uid: request-1f64eecf
id: REQ-218
type: request
title: 'The assistant can look at a stored image: a sixth picture kind'
created_by: EPIC-1
created_at: '2026-09-10T21:50:07.330391+00:00'
updated_at: '2026-09-10T21:50:07.330391+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
---

## The gap

The assistant cannot look at any picture in the Library. Not one it generated,
not one the client uploaded, not an SVG it drew itself.

`screenshot`'s `picture` type (`tools/generate/src/cli/ai/fidelity-surface.json`)
offers five kinds — `reference`, `draft`, `edit`, `revision`, `url`. Every one of
them is a *page*. Nothing addresses a stored image, so the one thing the client
is holding in their hand and asking about is the one thing the assistant is blind
to. An upload's one-time text description at ingest is the model's only access to
it, ever — and a generated image's surface says outright that the picture never
enters the conversation.

The client's experience of this is the assistant apologising for not being able
to see a picture it made ten seconds earlier.

## What changes

**`picture` gains a sixth kind: a stored image, named the way the Library names
it.** `screenshot` then answers for it exactly as it answers for a page — the
image comes back as an image, and the assistant is looking at the picture rather
than reading a description of it.

**`compare` gains it for free**, and that is the interesting half. The same
operation that measures a reproduction against a captured reference can now
measure a generated image against one — *"is this hero in the mood we captured
from their old site"* becomes a number and a list of places.

**It shows the picture as it currently stands**, which is the original with the
edit recipe applied, so the assistant that has just cropped something can look at
what it did. It can also ask for the original, because *"what did the crop take
away"* is a real question. Where no recipe exists the two are the same image.

**It is downscaled on the way in**, exactly as a page screenshot is. The
machinery and the argument are already in `fidelity-core.ts`.

## Why it is a deliberate act and not an automatic return

The picture is not handed back by whatever produced it. An image in context
costs real tokens **and stays in every subsequent turn** — `fidelity-core.ts`
already carries that warning. So the assistant asks when it has a reason to
look, which is the discipline the picture tools already impose, rather than
paying for a picture on every generation whether anyone needed it or not.

It also means the capability is about *stored images*, not about *generated*
ones: an uploaded photograph the client is asking about is reachable by the same
call, which is the larger half of the value.

## Depends on

The renderer that applies a recipe, from the recipe ticket — this operation needs
something to ask for the current state of an edited picture. Against an unedited
image it works on the bytes as stored, so it is not blocked on the editor.

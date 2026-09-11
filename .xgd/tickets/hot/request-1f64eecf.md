---
uid: request-1f64eecf
id: REQ-218
type: request
title: 'The assistant can look at a stored image: a sixth picture kind'
created_by: EPIC-1
created_at: '2026-09-10T21:50:07.330391+00:00'
updated_at: '2026-09-11T01:40:20.024056+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-219
  chat_comment: comment-d7e6b937
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


---

## Answered from EPIC-1, 2026-09-10

**1. Which namespace: both, addressed the way each is already named.**

Restricting to site assets would exclude the epic's originating complaint. The
client's words were *"ask AI to create an image → AI says it can't see it"* — and
a generated image is **material** (`imagegen.ts`: `IMAGE_MATERIAL_TYPE =
'material'`), not a site asset. Restricting to material would exclude the
assistant's own drawings, which are site assets with no material record at all.
Both are pictures the assistant made, and the epic's rule is about pictures, not
about which store happens to hold them.

**The objection that the assistant cannot enumerate material does not bite.** It
does not need to: the handle arrives in the tool result that created the picture,
which is exactly the case this epic exists to fix. A material *listing* operation
is a different capability and is deliberately out of scope — the assistant can
look at a picture it was told about, and at any site asset `list_assets` shows.

**2. Raster lands after REQ-219. SVG does not, and takes the browser path.**

For raster formats the answer is the Images binding, and the `depends_on` already
records it. It normalises arbitrary stored bytes to PNG, which preserves both
things the cheap `describe.ts` path would give up — the downscale, whose *reason*
is the strongest argument in the epic, and the `size` field the `picture` shape
documents as "after any reduction" — and it is the only thing that makes
`compare` work at all.

**SVG cannot go that way** and must not wait for it. Cloudflare Images does not
transform SVG, so a drawn wordmark needs rasterising and the only rasteriser here
is the browser. `measure-core.ts` is the precedent to copy, and its reason is the
right one for this case specifically: it navigates the site's own draft preview
**because the page is the font context**, which is precisely what a wordmark
needs. Site assets are already served in-process at
`/preview/<slug>/<channel>/assets/<name>`, so no new plumbing is required.

So this ticket has two paths behind one kind, and the SVG path can be built
before REQ-219 exists.

**3. The CLI host omits the kind.**

Following `adoptCapture`, and following `imageSurface` returning `null` where the
deployment cannot do the thing — the property `imagegen.ts` states as its second:
a deployment without the capability has no tool, so the manual never mentions it
and the model cannot propose, apologise for, or probe for one. A CLI session
simply has five kinds.

## Corrections to the body above

Two sentences are wrong as written and the investigation is right about both.

- *"It is downscaled on the way in… the machinery and the argument are already in
  `fidelity-core.ts`."* The machinery is there and is **PNG-only** —
  `decodePng` / `refuseNonPng`, deliberately so since REQ-156. It works because
  all five existing kinds get their bytes from `driver.screenshot()`, which is
  always PNG. `ResolvedPicture.bytes` carries an unstated PNG contract that this
  kind is the first to break.
- *"`compare` gains it for free."* Free for a stored PNG. `compare` decodes
  **both** sides, so for any other format it needs a raster nothing in the repo
  can currently produce. It is free only once the binding normalises.

Also worth carrying into the implementation: `drivableSteps` needs its own
refusal sentence for the new kind — a stored image is not a page, so `after` is
meaningless against it — and `pictureUrl` must return `null`, since it is the
"has a live page" predicate the value gates read.


## The design, settled

**Both namespaces, one name.** The product stores pictures in two places and a
client does not know which. Site assets are what `list_assets` shows — a drawing
`write_image` made, a file already placed on the site — named by their filename.
Library items are material tickets — what the client dropped on the conversation,
what the generator made — named by their record and titled the way the Library
titles them. A stored image is addressable **however it is referenced**: the
site filename, the `/assets/…` handle a page holds, the bare name a drawing was
written under, the Library record, or the Library title. One rule, one place, so
the two namespaces cannot answer differently. A name that matches more than one
picture is refused and the candidates are named, because guessing between two
pictures is the one outcome worse than asking again.

**The assistant can see what is there.** `list_images` answers with every stored
picture across both namespaces and the name to ask for each by — the cheap first
move, exactly as `list_references` is for captures. Without it the Library half
is unreachable: nothing else on any surface the assistant holds lists material,
so a picture it was never told about could only be guessed at.

**Every stored picture is normalised to a screenshot on the way in.** A page
picture is PNG because a browser made it, and everything downstream — the
reduction, the diff, the value gates — is built on that. A stored picture is
whatever the client's camera or the generator produced, so it is put in front of
the same browser this surface already owns and comes back as a picture of itself.
That is what makes **`compare` gain it for free** true rather than aspirational,
and it is why the reduction argument in `fidelity-core.ts` applies unchanged
instead of being restated. A format the browser will not decode is refused by
name rather than returned blank.

**A drawing is rasterised outside the site's own page**, so its text renders in
the browser's default face rather than the site's. The picture says so, in the
same caption that says which channel it is of. `measure_drawing` is what reads a
drawing's real geometry, and looking is not a substitute for it.

**Asking for the original is accepted now.** Until the recipe exists every
picture is its own original, which is what "where no recipe exists the two are
the same image" means; the field is the seam the renderer fills in, not a
promise deferred.

**A stored picture cannot be driven.** `after` drives a page into a state, and a
stored picture is not a page — it refuses by name, as the other four
non-`draft` kinds do.

**A deployment that holds no image store does not answer for the kind.** The
builder in the cloud has both namespaces; the local `1c` has the site's assets
and no Library, because the Library is tickets and it has none. Each says which,
the same way a deployment with no browser says it cannot take pictures.

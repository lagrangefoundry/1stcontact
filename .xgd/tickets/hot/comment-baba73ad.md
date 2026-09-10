---
uid: comment-baba73ad
id: COMMENT-2593
type: comment
title: Comment on epic EPIC-1
created_by: xgd
created_at: '2026-09-10T20:02:03.176351+00:00'
updated_at: '2026-09-10T22:23:28.568224+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-34760bf1
  kind: chat_transcript
---

<!-- xgd-turn id="f2867810-f56d-4b5c-a8ca-8e0001dbcd79-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T20:01:35.881965+00:00" -->
#### You
Lets talk about the image creating experience - right now it is pretty poor.

Today - 
- ask AI to create an image
- image created
- I have to go to the library to look at it
- No tools avaliable to edit (crop, colorize etc)
- AI says it can't "see" it :-(

I think a created image needs to appear in the chat - it can be small - clicking on it would open a modal with the image in our (limited) editing tool suite. The image, of course, appears in the library too. The modal should include the item name that it appears under in the library - user should be able to edit that.

Lets discuss the product experience and the practicalities first - you are an Epic ticket so your job is not to implement code, but rather to create and manage tickets. This project will likely require changes to lagrage-framework - you can create tickets there too.

<!-- xgd-turn id="f2867810-f56d-4b5c-a8ca-8e0001dbcd79-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T20:06:39.996998+00:00" -->
#### Claude
I dug through the actual surfaces before answering. Here's what's really there, then the decisions I think you need to make.

## What's actually broken (verified, not assumed)

**"The AI can't see it" is designed-in upstream, not a bug.** `components/ai_imagegen/js/src/imagegen_surface.json` tells the model, in its overview: *"A generated image is not returned to you as a picture. It is stored, and you are told the id of the ticket holding it… the picture itself never enters this conversation."* So the model is correctly reporting a deliberate framework decision.

**And it's wider than generated images.** `screenshot`'s `picture` type (`tools/generate/src/cli/ai/fidelity-surface.json`) has exactly five kinds — `reference`, `draft`, `edit`, `revision`, `url`. **None of them addresses a stored image.** So the assistant cannot look at *any* image in the library: not one it generated, not one the client uploaded, not an SVG it drew itself with `write_image`. Uploads get a one-time text description at ingest and that's the model's only access to them, ever.

**The chat has no image channel but does have the machinery.** `webui-chat` already ships a card mechanism (`{kind:'card', meta:{card_kind, payload, id}}` + a registry, `components/webui/chat/js/src/cards.js`) explicitly documented as "adding an application-specific card is a dev-time registration, not a core edit". And the sanitizer is stock DOMPurify, which already permits `<img>` — so a markdown image in a turn would render today if anything emitted one.

**The library already has most of the modal.** `library.js` renders the image, has an editable fields block, and `mountReader` already opens documents in a **modal host** (REQ-172). A picture modal is that pattern extended, not new furniture.

**Editing: nothing exists anywhere.** No crop, rotate, resize, adjust — not in the UI, not as a tool. There *is* pure-JS PNG decode/encode/crop (`tools/generate/src/cli/png.ts`, `perceptual-core.ts`) but it's PNG-only and lives in the CLI/fidelity path, not the worker's material path.

## The decisions I need from you

**1. Does the chat thumbnail survive a reload?** This is the one that changes the design most. A replayed transcript is `{role, markdown}` only — cards are ephemeral, so a card-based thumbnail would vanish on refresh, which is worse than never showing it. Two routes:
- **Markdown image in the turn** — survives replay for free, renders today. But *who writes it*: the host appending a trailer after the turn (reliable, always in the same place), or the model writing it inline where it makes sense in its sentence (natural placement, fragile — it can get the handle wrong).
- **Cards** — richer payload, click target is structured, but needs transcript persistence for cards, which is a lagrange-framework change.

My lean: markdown image, host-emitted. Cheapest, robust, and clicking is a delegated handler on the pane.

**2. Which images appear — only generated ones?** I'd argue the rule is *any image this turn produced*: generated, **drawn with `write_image`** (equally invisible today, and the drawing sessions are where it hurt most), and arguably the screenshots it takes. Same fix, and a rule is easier to hold than a list.

**3. Does the AI see it automatically, or only when it asks?** I'd say only when it asks. An image in context costs ~1–2k tokens *and stays in every subsequent turn* — `fidelity-core.ts` already flags exactly this. Giving it a sixth `picture` kind means it looks deliberately, and **`compare` comes free** — it could measure a generated image against a captured reference.

**4. What does an edit produce — new bytes on the same material, or a new material?** Genuine fork. Editing in place means a picture already placed on a page changes silently under the draft, and the describer's text is now wrong for a crop. A derived material keeps materials immutable but clutters the library. I lean derived-with-a-link, but it's your call.

**5. Which tools?** Crop (with aspect presets), rotate/flip, resize, brightness/contrast/saturation are all browser-canvas work and handle JPEG/PNG/WebP for free. **"Colorize" and background-removal are not** — those are model work, i.e. an `edit_image` operation over the provider's edits endpoint, which is a **lagrange-framework** ticket in `components/imagegen`. Worth separating: canvas edits and generative edits are different capabilities with different costs.

**6. Is editing user-only, or also a tool?** DOC-48 currently instructs the assistant to "crop an interesting strip and set the text beneath it" — advice it cannot act on. If the crop is an operation, both surfaces share one implementation. I'd build the operation, ship the UI first, grant the tool as a follow-on.

## Ticket shape I'd propose

| Where | Ticket |
|---|---|
| 1stcontact | Chat: an image a turn produced appears in the conversation, click-to-open |
| 1stcontact | The assistant can look at a stored image — a sixth `picture` kind (`compare` free) |
| 1stcontact | The image modal: viewer + editable library name + limited canvas editing |
| lagrange-framework | `imagegen`: `edit_image` — generative edits (colorize, background) |
| lagrange-framework | *(only if we go the card route)* cards survive transcript replay |
| lagrange-framework | Amend the `create_image` surface prose — it currently tells the model the picture never enters the conversation |

Tell me your calls on 1, 4 and 5 and I'll write EPIC-1's body as the umbrella and cut the children. Also: EPIC-1 is currently untitled — want me to title it something like *"Making a picture is a thing you can see"*, or do you have a name for it?

<!-- xgd-turn id="755601a2-db29-4b9d-be59-35273d480218-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:10:07.526333+00:00" -->
#### You
1. Lets do the markdown image - it should be written by the tool, I think...
   
   2. Agreed any image can appear this way.
   3. only when it asks
   4. Lets discuss the edit modality.(a) its important that we have an "UNDO" capability so at least while using the editor I can go back to previous states (b) I should always retain the original, if I create a crop for example, and later decide it needs to be a little wider I don't want the image outside of the crop to be lost.
   
   At some level this relates to five. I suggest that we stick with tools that are browser canvas, I think this implies that any edits can be captured purely in terms of operations. So if we have the original image and the list of operations we can always go back to any intermediate state.
   
   I think this needs to be an AI tool as well as a user-tool.
   
   Once you have responded to this, I think there is a secondary discussion about image size that we should have. For images displayed on the site, how many versions of the image should we keep? Images taken with a modern iPhone are huge we don't necessarily want to serve those on a website at that scale it would be very wasteful of bandwidth. I'm bringing her up in this contacts partly to ask the question should image resizing be one of the tools capabilities? And then orthogonally should we have automatic capabilities for image sizing.
   
   Note that our tickets can have multiple attachments, so it might be natural to maintain versions and sizes in the same ticket.

<!-- xgd-turn id="755601a2-db29-4b9d-be59-35273d480218-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:12:27.095909+00:00" -->
#### Claude
Good — the recipe idea is the right call and it makes several other things fall out for free. Some practicalities on each, then the sizing discussion.

## 1. Markdown image "written by the tool" — one wrinkle

A tool result doesn't become a chat bubble; it goes back to the model (and to the tool pane). Only an **assistant text turn** is in the transcript, and the transcript is what replays on reload. So "written by the tool" has to mean: **the tool authors the exact markdown line and hands it to the model, and the surface prose tells the model to paste it verbatim into its reply.** Tool authors the string, model places it. That's the version that survives reload, and placement stays natural ("here's the hero — want it warmer?").

The failure mode is the model not pasting it. It's visible and cheap (the image is still in the library), and the surface has an `absences` section built for exactly this kind of instruction. I don't think it's worth host-injecting a trailer to close it, but say if you'd rather be certain.

Small note that connects to your sizing question: day one the chat `<img>` can just be CSS-constrained and download the full bytes — fine on a builder-local fetch. It wants to become a thumbnail rendition once the ladder below exists.

## 2. Edits as a recipe

This is the part I'd nail down carefully, because the design has one genuinely open question.

**What's stored.** The original bytes, forever, as the material's own attachment. Beside it, an ordered list of parameterised operations on the record. Any state = original + a prefix of the recipe.

**Your 4(b) falls out without a history log.** "The crop needs to be a little wider" isn't undo — it's *editing the crop op's parameters*. Because ops are parameterised rather than baked, every past state is reachable by editing or removing an op, in any order, forever. So I'd **persist the recipe and keep the undo/redo stack as editor session state only**. Cheaper, and it gives you something better than undo: an edit list you can revise out of order, months later.

**Two things that will bite if we don't decide them up front:**
- **Coordinates must be normalised** (fractions, not pixels). If crop is in pixels and a resize is inserted before it, the crop silently moves. Normalised fractions plus a canonical order (geometry before adjustments) keeps a recipe meaningful under editing.
- **A closed op vocabulary, shared by the UI and the tool** — one list, one implementation, or they drift within a month. My proposed minimum: `crop`, `rotate`, `flip`, `resize`, `adjust{brightness,contrast,saturation}`.

**The open question: who flattens the recipe into bytes?** Canvas-only means *the browser is the renderer* — and the public site must serve edited images whether or not a builder browser was ever open. Three ways out:

| | |
|---|---|
| **Worker renders** | Needs JPEG/WebP decode+encode in workerd. We have PNG-only today (`tools/generate/src/cli/png.ts`), and REQ-156 already established no-native-modules as the constraint. Real work, but it's the only version where an AI crop reaches the published site on its own. |
| **Browser renders, uploads bytes** | Nearly free. But an AI edit doesn't take effect until someone opens the builder, and the site can serve a stale image meanwhile. |
| **Hybrid** | Browser renders when present; worker renders lazily on first request for a stale rendition. Best behaviour, most moving parts. |

I lean **worker renders**, precisely because you want this as an AI tool. An AI capability that silently needs a human's browser open isn't one. This is the decision I most need from you — it's the difference between a small ticket and a real one.

**As an AI tool**, `edit_image` composes with decision 3: the assistant looks at the image, crops, looks again. The sixth `picture` kind should be able to show either the original or the current recipe state, or the model can't check its own work.

## 3. Sizing — I'd split it in two, hard

These are two different things and conflating them is how a library ends up with five copies of everything:

- **Editorial versions** — *what the picture is*. The recipe. The client's business, visible, editable.
- **Delivery renditions** — *the same picture at several widths*. A consequence of publishing. The client should never see them, never be asked about them, and never be able to get them wrong.

**Your multi-attachment instinct is already proven in the codebase.** A capture bundle is one ticket carrying 11–99 attachments addressed by member name — `transport.fileUrl(uid, member)` in `library.js` is the existing accessor. So "one material, many byte-streams" isn't new machinery, it's an established pattern. Original + current rendition + a width ladder in one ticket is exactly the shape it already supports.

**What I found on the delivery side:**
- `assetRefSchema` is `{id, src, alt, focalPoint?}` — **one `src`, no `srcset`**. But the good news is the schema doesn't need to change: `packages/framework/src/l1/render.ts:2459` is the single place an `<img>` is emitted, and it could emit `srcset`/`sizes` from a rendition manifest without the site document knowing anything about it.
- **`focalPoint` already exists**, which means someone already thought about the same picture at different aspect ratios. Worth being deliberate that crop and focal point don't fight: **crop is "this picture is that shape"; focalPoint is "when a band forces an aspect on it, keep this bit in frame."** Both earn their place; the editor UI should probably let you set the focal point too.

**Answers to your two questions:**
- **Should resize be a tool capability?** Yes — but for an editorial reason (a logo that is 400px wide because that's what it is), not a bandwidth reason. The surface prose has to say so explicitly, or the model will start hand-optimising delivery and fight the ladder.
- **Should sizing be automatic?** Yes, entirely. Generated at promote-to-site-asset, never upscaled past the source, ladder capped at the original's own dimensions. A client answering "what size should this be?" is a question we failed to absorb.

**One risk on "images taken with a modern iPhone":** the default capture format is **HEIC**, which browsers cannot decode in `<img>` or canvas. A HEIC upload today can't be previewed, can't be edited client-side, and can't be served. I haven't confirmed what our upload path does with one — worth checking before we design around canvas.

## What I need from you

1. **Who flattens** — worker codec, browser, or hybrid? (My lean: worker.)
2. **HEIC** — convert at the door, or refuse it? (I'll check what we do today either way.)
3. **Ladder trigger** — on promotion to a site asset, or only at publish?
4. Does the editor also expose **focal point**, or is that a later thing?

Give me those and I'll title EPIC-1, write its body as the umbrella, and cut the children — which now looks like: chat image; sixth `picture` kind; the recipe model + editor modal + `edit_image` tool; the rendition ladder + `srcset` in `render.ts`; and the two lagrange-framework tickets (the `create_image` surface prose, which currently promises the model the picture never enters the conversation, and generative `edit_image` for colorize/background if you still want that).

<!-- xgd-turn id="f786b6ad-7d4a-4f46-ad9f-c72c2ebd151f-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:23:34.483473+00:00" -->
#### You
Our principle is JAMStack - all the rendering, flattening, resizing for publication should be done at build time (publish)

HEIC - ideally convert on upload

<!-- xgd-turn id="f786b6ad-7d4a-4f46-ad9f-c72c2ebd151f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:25:41.069088+00:00" -->
#### Claude
That principle resolves the hard question, and there's a good surprise in the wrangler config.

## Where "build time" actually is

`POST /api/publish` **renders the revision inside the control-app Worker** and writes bytes to R2; `public-site` only serves what's there (`apps/public-site/src/index.ts` — "D1 says which revision, R2 holds its bytes"). So build time is workerd. No node, no sharp, no CI step. That's the constraint everything else has to fit.

But two bindings already declared change the picture:

- **`[browser]` — Browser Rendering**, headless Chromium via `@cloudflare/puppeteer` (REQ-154), already in production for screenshots. That is a canvas we already pay for.
- Not yet bound, but available on the platform: the **Images binding** (`env.IMAGES.input().transform().output()`), which is a *declarative* transform pipeline — resize, rotate, trim, background, brightness, contrast, gamma, sharpen, format conversion.

That second one matters because **our op vocabulary maps almost one-to-one onto it**. A recipe wouldn't need a canvas at all — it would be a transform chain. Which gives the cleanest possible answer to "who flattens":

**One renderer, used in three places.** The Images binding applies the recipe: for the editor's true preview, for the model's view of a picture, and at publish for the flattened output plus the width ladder. The client browser only does the *interaction* — dragging a crop box with a CSS transform overlay — then commits the recipe and re-fetches the real bytes. That's how real editors behave anyway, and it means the preview and the published artifact are produced by the same code, which is the property that stops a client cropping one thing and publishing another.

Two honest caveats: it's a new platform dependency that needs enabling on the account and bills per transform, and I'd want to confirm the exact op list (I'm confident about crop/rotate/resize/brightness/contrast/format; **flip** I doubt, and we may have to drop it or do it client-side). The fallback if you don't want the dependency is Browser Rendering as the canvas — already bound, already paid for, but heavier per publish and it **cannot decode HEIC**, which brings us to:

## HEIC

Chrome does not decode HEIC, so neither the client's canvas nor Browser Rendering can read an iPhone upload. Conversion has to happen **server-side on the upload path** (`material.ts`), and the Images binding is the thing on the platform that does it. This is the strongest single argument for taking that dependency — without it, "convert on upload" needs a wasm libheif in the Worker.

It also has to be **synchronous with the upload**, or the Library shows a broken image until it finishes.

One tension to settle: converting at the door means the HEIC bytes are gone, which brushes against your rule that the original is never lost. I'd **keep the HEIC as the archival original and treat the converted JPEG as the working original the recipe applies to** — one extra copy, principle intact. Say if you'd rather just discard it.

## Sizing, under JAMStack

The split becomes very clean, because a published revision is *already* a frozen byte snapshot:

- **The ladder is generated at publish**, into that revision's own R2 prefix (`<root>/<slug>/rev/NNNN/assets/…`). Immutable, versioned with the revision, disposable — exactly the semantics that already exist.
- **The draft gets no ladder.** It isn't the public site; it serves the working rendition. That halves the work.
- **`render.ts:2459` is the single place an `<img>` is emitted** — it gains `srcset`/`sizes` from the ladder manifest, and **`assetRefSchema` never changes**. The site document stays innocent of delivery.
- Never upscale; the ladder caps at the source's own dimensions.
- **Content-address each rendition** on `sha(original + recipe + width)`. Publishes are frequent and image edits are rare, so an unchanged picture costs zero transforms on republish. The material store already content-addresses blobs (`t/<tenant>/blob/<sha256>`), so it's the established pattern rather than a new one.

And `resize` still earns its place in the *editorial* op list — a logo that is 400px because that's what it is — with the surface prose stating plainly that delivery sizes are handled automatically, so the model doesn't start hand-optimising bandwidth against the ladder.

A bonus: the sixth `picture` kind gets easier. The Worker applies the recipe and downscales to something model-sized in the same call — which answers the context-cost worry directly, and matches what `fidelity-core.ts` already does to screenshots.

## Last four decisions

1. **Take the Images binding dependency?** It buys HEIC, the ladder, and one renderer for preview/model/publish. Without it we're on Browser Rendering plus a wasm HEIC decoder.
2. **Keep the HEIC original alongside the converted JPEG, or discard it?**
3. **Ladder widths** — I'd propose 480 / 960 / 1440 / 2048 long edge, capped at source. Object if you want different steps.
4. **Flip** — drop it from the vocabulary if the platform can't do it, or keep it as a client-side-only op? (Keeping it means two renderers again, which I'd avoid.)

Answer those and I'll title EPIC-1, write its body as the umbrella — the principle being *a picture you made is one you can see, name, change without losing what it was, and publish at a sane size* — and cut the children: chat image; sixth `picture` kind; recipe + editor modal + `edit_image` tool; HEIC-at-ingest; publish-time ladder + `srcset`; and the two lagrange-framework tickets for the `create_image` surface prose and generative `edit_image`.

<!-- xgd-turn id="d513713d-70a4-48a4-8149-15dfc1559904-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:47:37.917674+00:00" -->
#### You
1- sure 
2 - discard it we can't do anything with it and the user has a copy by definition
3 - whatever is conventional
4 - drop it for now - lets keep things simple for v1

<!-- xgd-turn id="d513713d-70a4-48a4-8149-15dfc1559904-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:53:09.995112+00:00" -->
#### Claude
Decisions locked. Writing the epic and cutting the children.

Done. EPIC-1 is titled, its body records the problem, the eight decisions and their rationale, and what was rejected and why; eight children are cut.

**EPIC-1 — *A picture you made is one you can see, name, change, and publish at a sane size***

In 1stcontact, in landing order (all six attached as `epic_children`):

| | |
|---|---|
| **REQ-219** | An edit is a recipe: the operation vocabulary, one renderer, and `edit_image` |
| **REQ-217** | Chat: an image a turn produced appears in the conversation |
| **REQ-218** | The assistant can look at a stored image: a sixth `picture` kind |
| **REQ-221** | HEIC converts at the door, so an iPhone photograph is an ordinary image |
| **REQ-220** | The image modal: viewer, editable Library name, and the editing tools |
| **REQ-222** | Publish builds the width ladder; the renderer emits `srcset` |

In lagrange-framework (tickets only — no branch, no code there):

| | |
|---|---|
| **REQ-149** | `create_image`'s surface promises the picture never enters the conversation |
| **REQ-150** | imagegen: edit an existing image — the *colorize* half, deliberately not v1 |

REQ-219 leads because it carries the renderer the other five ask for. REQ-217 and REQ-218 are independent of it against unedited images, so they can run in parallel.

Two things I want to flag rather than leave buried in a ticket body:

**The Images binding needs enabling on the Cloudflare account** — that's an operator task, not a coding one, and REQ-219, REQ-221 and REQ-222 all block on it. Worth doing early.

**I asserted the transform op list from knowledge, not from the docs.** I'm confident about crop/resize/rotate/brightness/contrast/format-conversion and about HEIC input, less so about `saturation`. REQ-219 says the vocabulary maps "almost one-to-one" precisely because of that — whoever picks it up should confirm the exact option names against the current binding docs before fixing the vocabulary, since the whole design rests on one renderer being able to express every operation. If saturation turns out to be absent, it drops from v1 the same way `flip` did rather than earning a second renderer.

No code was written and no branch cut — this was scoping.

<!-- xgd-turn id="84332c87-a165-4fd7-a661-29fd6d654dd6-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:55:14.029266+00:00" -->
#### You
Did you populate dependency fields in the tickets? Do the Lagrange Framework changes need to be done first?

<!-- xgd-turn id="84332c87-a165-4fd7-a661-29fd6d654dd6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:57:18.559679+00:00" -->
#### Claude
Good catch — I wrote "Depends on" as prose but left `fields.depends_on` empty. And your second question surfaced something I got wrong in my summary.

Both gaps fixed. Answering your two questions directly:

## Dependency fields — no, I hadn't. Now populated

I'd written "Depends on" as prose only. `fields.depends_on` is now set on the four that need it, all pointing at **REQ-219** (the recipe model and renderer): REQ-218, REQ-220, REQ-221, REQ-222. REQ-219 itself has no ticket dependency — it's the root. REQ-217 has none either, for the reason below.

One deliberate omission: I did **not** put the framework ticket in `depends_on`. Those fields hold local IDs, and 1stcontact already has its own REQ-149 (freeze the draft as a revision) — a bare `REQ-149` there would resolve to the wrong ticket. The repo's existing convention is to name cross-repo dependencies in prose as "lagrange-framework REQ-NNN", which is what I've done.

## Do the framework changes come first? One of them, partly — and I understated this before

I told you REQ-217 was independent. That's wrong for half of it, and your question is what made me check properly:

- **`write_image` (the assistant's SVG drawings) is ours.** `toolbox-core.ts` owns that tool and its surface prose, so a drawing can appear in the chat with no upstream change at all.
- **`create_image` is not.** Two things upstream block it: the plugin composes the result and offers **no seam for the host to contribute a display handle** (only 1stcontact knows how to form a material URL), and its overview tells the model *"the picture itself never enters this conversation"* — so even a smuggled handle would contradict the manual the model read first. And `imagegen.ts`'s own header forbids the local workaround: *"If any of that ever needs more than wiring, the finding belongs upstream."*

So **lagrange-framework REQ-149 is on the critical path** and worth starting now, in parallel with REQ-219 — it's the longest pole because it's in another repo. REQ-217 can start and half-land against `write_image` while it's in flight.

**lagrange-framework REQ-150 blocks nothing.** Every mechanical operation in this epic is expressible in the transform pipeline; REQ-150 only makes *colorize* answerable later.

Both the epic body and REQ-217 now record this, with the reasoning, so whoever picks up REQ-217 hits the constraint before writing code rather than after.

The genuine first move is still the operator one: enabling the Images binding on the Cloudflare account, which gates REQ-219, REQ-221 and REQ-222.

<!-- xgd-turn id="b4d41380-dfc9-4472-8aea-cb547076905e-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:23:28.024177+00:00" -->
#### You
Review every ticket in this epic's epic_children for unanswered questions: read each child's chat transcript (its chat_transcript comment) and current body/fields. Where you have enough context from this epic's design conversation to answer a question confidently, update that child ticket directly (e.g. via `xgd ticket update <uid> --stdin` appending to its chat_transcript, and/or amending its body if the answer changes scope) — do not change the child's own status or otherwise act as if you were the child's session. Where you are not confident you can answer correctly, surface the question here in this chat instead of guessing.

<!-- xgd-chat-end -->
---
uid: comment-baba73ad
id: COMMENT-2593
type: comment
title: Comment on epic EPIC-1
created_by: xgd
created_at: '2026-09-10T20:02:03.176351+00:00'
updated_at: '2026-09-10T20:06:40.085641+00:00'
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

<!-- xgd-chat-end -->
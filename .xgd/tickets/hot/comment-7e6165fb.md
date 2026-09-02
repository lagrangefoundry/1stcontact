---
uid: comment-7e6165fb
id: COMMENT-2121
type: comment
title: Comment on chat CHAT-35
created_by: xgd
created_at: '2026-09-02T19:34:08.793362+00:00'
updated_at: '2026-09-02T20:22:59.974660+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-9c9c5a3b
  kind: chat_transcript
---

<!-- xgd-turn id="d13aa072-4215-4bc9-98b2-5c4c0fafaf3d-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T19:34:00.060869+00:00" -->
#### You
I am having an initial conversation with the product, discussing an example site - can you see the conversation? If so please summarize the issues

<!-- xgd-turn id="d13aa072-4215-4bc9-98b2-5c4c0fafaf3d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T19:39:59.572845+00:00" -->
#### Claude
I'll look for the conversation. Let me check the session ticket and any recent chat/session artifacts.

Found it — the live conversation is `chat-cdd0f518` ("site-alpha") in the local D1 store. Let me verify which of the AI's claims about L1 are actually true before summarising.

Yes — the conversation is `chat-cdd0f518` ("site-alpha"), 5 turns, 18:34–19:29 today, building a placeholder site for Gigabyte Alchemy from an uploaded brand PDF and hero image. I've dumped it to `.xgd/tmp/site-alpha-transcript.md`.

## What went wrong in the output

**Illegible text.** The caretaker set a dark brand palette (near-black `#0d0d0f`, gold `#c9a84c`, off-white `#f0ece4`) but never changed the page background from the default white — so the hero headline, tagline and "Where engineering meets empathy" were off-white on white. Its own diagnosis is the damning part: `"background": "#ffffff"` was returned in the `update_page` response, it read it and carried on anyway.

**Everything centre-aligned, top to bottom.** It agreed without argument: "a template habit, not a design decision… I was building quickly and didn't stop to think about it."

**Hero is a giant standalone image.** You get a full viewport of backdrop before any content. The image was authored to sit *behind* text; it ended up framed as a subject.

## Platform gaps it hit (verification agent running on these now)

1. **No text-over-image anywhere.** Containers appear to accept no `background` at all — not colour, not image, no overlay/scrim. This kills the single most-cited "expensive vs template" tell in your own [[DOC-17]]. It tried a carousel as a workaround; the carousel stacked image above text rather than layering.
2. **No image sizing or cropping.** `heightPx`, `objectFit`, `objectPosition` all rejected — so the fallback (crop an interesting strip, text underneath) was blocked too. Both routes you named were unavailable.
3. **Page-level `background`/`textColor` unreachable.** They sit one level above path `0` in the L1 document; `set_l1`'s path `0` is the root container. Readable, not writable. You already flagged this should be first-class.
4. **No vision on images.** `get_asset` returns metadata only. Its understanding of the image came from a description document in the KB, and it was unsure whether that was model-generated or human-written.
5. **No render feedback.** It can read what it wrote, never what renders — which you're already addressing with the screenshot tool.

## The one you didn't raise, and I think it's the biggest

**Field-level schema discovery is pure trial and error.** Roughly a third of the transcript is refusal-driven guessing:

`sizing/width` must be an object · `minHeightPx` invalid · `letterSpacingPx` invalid · `wrap` invalid · `gap` invalid on a row · `background` invalid on a container · `picture` invalid → `image` works · `slot` requires `name` · carousel `slide` presentation must be a list · nav entries take `target` not `url` · `target` needs a `kind` discriminator · `pageId` not `page`

Two compounding causes. The refusals say "Invalid input" and point at a path, but don't enumerate what the node *would* accept — so each rejection buys one bit of information. And the model twice said the schema simply isn't in its corpus: *"The knowledge base doesn't have a detailed schema reference"* and *"The schema docs are DOC-7 through DOC-16, which aren't in my corpus."* That's notable given the projected manual is 37,389 of the 38,030 priming characters — nearly the entire budget — and still leaves it guessing field names.

The `picture` → `image` episode is the clearest case: it spent several turns concluding images might not be placeable at all, considered a carousel purely as an image-delivery workaround, and only found `image` by guessing from the asset's own `kind` field.

## Behavioural / prompt gaps, distinct from capability

- It never read the image-description document at the start, though it was in the KB. It called this out itself: *"a process gap, not a capability gap."*
- It didn't surface the constraint early. The right opening move was *"this image was made as a backdrop; I can't overlay text yet — crop it, or wait?"* Instead it quietly built a layout that didn't fit the image's intent and only explained afterward.
- It couldn't find your example site: *"Only one site here — xgd must be a different workspace."*

## What you and it converged on

- **Contrast as metadata, not a warning** — return background colour, text colour and computed WCAG ratio alongside each text element. Deterministic, no judgement. Its point: it had both colours and still got it wrong, so a printed ratio is what makes the mistake unmissable.
- **A prompt rule first, tool second** — never place text without confirming what it sits on.
- **Backdrop vs. subject as an asset-level property** — this is the interesting one. Your framing (backdrop → overlay text; subject → crop a strip, text below) it understood and could apply, but only if it knows which the image is. That suggests a field on the asset, or a question at upload, plus a vision pass writing structured composition notes (dark/light regions, open centre, intended role).

I'll report back when the verification agent confirms which of the five capability claims are genuinely absent versus present-but-undiscoverable — that distinction decides whether these are build tickets or manual/error-message tickets.

Verification is back, and it inverts most of the diagnosis. The caretaker reported five platform gaps to you. **Three of them don't exist** — the capability is there and it couldn't find the field name.

## Claim vs. ground truth

| Caretaker told you | Actually |
|---|---|
| "Containers don't accept a `background` field with an image… no overlay mechanism. This is architecturally first-class, not a nice-to-have." | **`axes.backgroundImageUrl` exists** on every box-rendering kind (`schema.ts:701`), and **`axes.overlay = {color, opacity}`** is documented in the schema as *"a full-bleed translucent scrim painted over the background (hero overlay)"* (`schema.ts:566-571`). The exact pattern it said was impossible is a named, built feature. |
| "The image element doesn't accept `heightPx`, `objectFit`, or `objectPosition`." | `objectFit` and `objectPosition` both exist (`schema.ts:1025`, `:1034`). Height is `sizing.height = {mode:'fixed', px}` (`:254-268`). There are also mask shapes including `featherTop`/`featherBottom`. The crop-strip fallback was available too. |
| "`gap` is not valid on a row container." | The field is **`gapPx`**. Off by a suffix. |
| "`picture` may not exist as a child element." | Correct — but `l1-surface.json` calls it "**a picture element**" in prose six times (`:23, :72, :231, :251, :698, :909`) and never once prints the literal kind string `image`. The manual actively misled it. |
| "Page-level `background` is unreachable." | **True, and worse than it said.** They're siblings of `root` on the L1 document; path `"0"` is `root` itself, so no path reaches them (`edit.ts:400-416`). No tool writes them — the only writer in the toolchain is the scaffolder at site-creation (`scaffold.ts:69-70`). They're also *unreadable*: `describe_page` never returns them. |

So: with `backgroundImageUrl` + `overlay` on the hero container, the site you wanted was buildable in one call. And the page-background problem it kept hitting has a workaround it never found — paint the **root container's** `axes.surfaceFill`, which *is* at path `"0"`.

## The real gaps, now that they're separated

1. **Page `background`/`textColor` are outside the addressable space** — unreadable and unwritable. Genuine, and your instinct that it should be first-class L1 is right.
2. **No contrast data anywhere.** The only WCAG reference in the codebase is a tap-target rule (`conformance/checks.ts:235`), and `conformance` isn't wired to the AI surface at all. Also `get_l1` returns colours **verbatim and unresolved** — palette refs stay refs — so the model can't even compute a ratio itself from what it's given.
3. **No vision on site assets.** But there *is* a vision pass — `claude-opus-5`, on ingestion (`describe.ts:120-181`). It writes into the **material ticket body** for retrieval, not onto the asset and not as alt text. So your intuition was right: it does have a tool for looking at images, just pointed somewhere else. The blocker is structural: the AI host's Worker surface is text-only, `promptStream(ref, text)`, with no image content block anywhere in it (`describe.ts:108-118`).
4. **Background image is pinned** to `cover/center/no-repeat` with no position control (BUG-13, `render.ts:582-587`) — a real but much smaller limitation than the one it reported.

## The root cause

> The model is never given the L1 field vocabulary.

`roles.ts:38-80` deliberately doesn't enumerate it. The manual is projected purely from `l1-surface.json`, which **describes no node fields at all** — `set_l1`'s `node` parameter is literally `{"type": "object"}` (`:347-351`). Every field name — `backgroundImageUrl`, `overlay`, `objectFit`, `gapPx`, `sizing` — is learnable only by reading an existing node that already happens to use it.

On a blank page there is nothing to read. That's why this session degenerated into guessing, and it's why 37,389 of 38,030 priming characters bought no field-level knowledge.

## The failure mode I'd take most seriously

The caretaker cannot distinguish *"the platform doesn't support this"* from *"I couldn't guess the field name"* — and it reported the second as the first, confidently, twice, with architectural recommendations attached. You were told to build a background-image capability that has been there all along.

That's worse than the contrast bug. A tool that reports non-existent gaps to its own creator will misdirect the roadmap. Whatever the fix to discovery is, the prompt rule that goes with it is: **a refusal is evidence about your syntax, not about the platform's capabilities — never report a missing capability without confirming it against the surface.**

## Where I'd go

The cheapest high-leverage fix is making refusals informative: the validator is Zod with `.strict()` schemas, so it already knows the accepted key set at the failing node. Echoing that list back would have collapsed most of this session, and it beats enlarging a manual that's already consuming the whole priming budget.

Want me to write this up as tickets? I'd suggest four: field-vocabulary discovery (the big one), page background as first-class L1, contrast metadata on read, and image-role/vision at placement time. Say the word and I'll draft them.

<!-- xgd-turn id="41a472da-5b92-4804-8286-ba567f341d95-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T20:22:59.737554+00:00" -->
#### You
Ok there is a lot here to address its all important so lets go through it carefully. I have some questions know you have context:
1) We reproduced gigabytealchemy.ai with text over the background image - can you look at that and see how its done?
2) We have the ability to feed images to Claude - is that just not being exposed as a tool?
3) We are automatically generating tooling documentation that is part of the knowledge base, I believe, how come this is so inadequate?

<!-- xgd-chat-end -->
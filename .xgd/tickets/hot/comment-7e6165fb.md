---
uid: comment-7e6165fb
id: COMMENT-2121
type: comment
title: Comment on chat CHAT-35
created_by: xgd
created_at: '2026-09-02T19:34:08.793362+00:00'
updated_at: '2026-09-02T23:48:29.674348+00:00'
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

<!-- xgd-turn id="41a472da-5b92-4804-8286-ba567f341d95-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T20:27:28.842780+00:00" -->
#### Claude
Good questions — let me dig into each.

The reproduction does use it — exactly one `backgroundImageUrl` and one `overlay`. Let me extract that node.

The background box has **no children** — the text is layered separately. Let me see how.

Now the vision path and the doc generator.

Decisive findings on all three. Let me confirm the last details.

Correction: `projections()` **is** wired in — my earlier grep ran from a stale working directory. Let me get the membership right.

The system KB *is* bundled (575KB, not null) — so it was mounted. The question is why `REF-l1.md` didn't surface. Note the index is dated **Aug 31 17:58** but the REF docs **Sep 1 11:53**.

Found the root cause of Q3. Let me confirm the ordering bug.

All three answered, and Q3 has a concrete root cause.

## 1. How gigabytealchemy.ai does text-over-image

`storage/sites/gigabytealchemy/draft/pages/home.json`, node `0/6`:

```json
{ "kind": "box", "id": "section-bg-0",
  "axes": {
    "backgroundImageUrl": "/assets/AlchemistLabWithTech.png",
    "overlay": { "color": { "ref": "slate", "shade": -0.599 }, "opacity": 0.3 }
  },
  "geometry": { "keyframes": [ {"at":320,...}, ... {"at":1440,"x":0,"y":0,"width":1440,"height":900} ] } }
```

So it is `backgroundImageUrl` + a 30% slate `overlay` scrim — the exact pair the caretaker told you didn't exist. **It has zero children.** The hero text is not nested inside it. Children `15`–`18` ("Gigabyte Alchemy", "Intentional Software", the tagline, the body copy) are *siblings* at root, positioned at y=79…448 inside the same 0–900 band, and they paint on top purely by DOM order.

Worth knowing: this whole page is importer output, not authorable-by-caretaker output. 70 flat siblings at root, every one absolutely positioned with geometry keyframes at all six breakpoints, nesting depth zero. It's a captured computed layout. The band structure is three stacked layers — `section-band-0` (solid `surfaceFill`) → `section-bg-0` (image + scrim) → text.

Two consequences:

- The **mechanism** transfers directly and is the fix for site-alpha. And it's simpler for authored pages: put the text *inside* the box as children and let it flow — the renderer paints background/scrim on the box and children land on top without any geometry at all.
- The **style** doesn't transfer. If a caretaker studied this page as a worked example it would learn "hand-place 70 absolute nodes across 6 breakpoints," which is the wrong lesson. So this is a good source for the field names, a bad one for the idiom.

## 2. Vision — yes, and it's deliberately not exposed

The capability is live: `apps/control-app/src/describe.ts`, `VISION_MODEL = 'claude-opus-5'`, 5MB ceiling, jpeg/png/gif/webp. It ran on your upload — the alt text in the corpus ("dark medieval alchemy laboratory… blue daylight comes through an arched gothic window on the right") is model-generated, not human-written. The caretaker was wrong when it told you otherwise.

It isn't a tool because of a structural seam, and the code says so in as many words (`describe.ts:107-118`):

> The AI component's Worker surface is text-only — `promptStream(ref, text)`, with no image content block anywhere in it — so an image cannot be described through the host this Worker already runs. Rather than widen that surface from here, this calls the SDK directly.
>
> That is duplication and is accepted as such… either [[REQ-157]] (the fidelity/"looking" surface) or an image block on the AI component's own surface. Whichever lands, this function is what is deleted.

So this was a known, dated, deliberately-taken debt with a named payoff — REQ-163 (`bundled`) took it; REQ-439cd0c8's body already describes *"the AI component grows eyes"* widening `promptStream`/`prompt`. It's not an oversight, it's a queued consolidation. The gap you felt in the chat is real, but it's one surface change away, not a capability you lack.

Also note the description lands in the **material ticket body** for retrieval, never on the asset. That's why `get_asset` returns `{id, src, kind, onDisk}` and the caretaker concluded it couldn't see — it had the description available by *search* and didn't think to look.

## 3. The documentation is not inadequate — it was never indexed

This is the one to act on. `kb-projection.ts` generates `REF-l1.md` from the Zod schemas by walking the node union and closing over every reachable shape. The output is 477 lines and it contains, verbatim:

```
- `gapPx` — number, at least 0
- `objectFit` — `cover` | `contain` | `fill` | `none` | `scale-down`
- `surfaceFill` — color. The painted fill behind the node's content.
- `backgroundImageUrl` — text. A background image (scheme-checked by the envelope…)
- `overlay` — overlay. A full-bleed translucent scrim painted over the background (hero overlay).
```

Every single thing the caretaker spent two hours guessing at, with the doc-comment prose attached. The generator is right, the design rationale is right, the `writeProjections()`-before-`buildKb()` ordering in `index.ts:793` is right.

**But the shipped index doesn't contain it.** From the bundle at `apps/control-app/src/generated/kb.js`:

```
docs:              DOC-17, DOC-31, DOC-33, DOC-35, REF-behaviors, REF-l1, REF-surface, awareness
index manifest:    DOC-17, DOC-31, DOC-33, DOC-35
chunks manifest:   DOC-17, DOC-31, DOC-33, DOC-35
```

The three REF projections ship as text and are absent from both the document index and the chunk index. Semantic search can never return them.

The stamps tell the story. `1c kb build` last ran `2026-09-01T00:57:52Z` and indexed the four DOCs. The REF files were written **Sep 1 11:53** — by a later `1c kb export`, which calls `writeProjections()` but does no indexing. Then `1c assets` at **Sep 1 17:40** inlined `docs` and `index` independently: it picked up the new REF files into `docs` and the stale index alongside them.

That also confirms the caretaker's report was accurate rather than lazy. It retrieved DOC-17 fine — DOC-17 *is* indexed, which is why it could quote the design log about overlays reading as expensive. And "the knowledge base doesn't have a detailed schema reference" was literally true of the searchable corpus.

The underlying defect is that nothing checks the index manifest covers `docs`. `1c kb export` can write documents that no build indexes, and `1c assets` will happily ship that skew silently. `awareness.md` is missing from the manifest too.

## What I'd do

The cheapest fix is a coverage assertion — `1c assets` refuses to inline (or at minimum warns loudly) when a doc has no manifest entry. Re-running `1c kb build` fixes today's instance, but the skew will recur because `export` and `build` are separate verbs writing to one tree.

That reorders my earlier recommendation. Improving refusal messages is still worth doing, but it's no longer the main event — the field vocabulary was written, correct, and shipped; it was just unsearchable. Fix the index coverage and most of that session doesn't happen.

Want me to scope this as tickets? I'd suggest: **(a)** index/docs coverage check in `1c assets` + `kb build` — the real bug; **(b)** page `background`/`textColor` as addressable L1 — still genuinely unreachable and unreadable; **(c)** contrast metadata on `get_l1`/`describe_page`, which needs palette refs resolved since `get_l1` returns them unresolved; **(d)** image content block on `promptStream`, which is really just REQ-157 landing. Say which and I'll scope them under CHAT-35 properly.

<!-- xgd-turn id="2a3cd673-18be-487a-a25b-026c6a6107c0-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T20:46:05.305350+00:00" -->
#### You
We need to switch language caretaker -> consultant please.

The consultant needs all the flexibility of the reproduction system - we need a ticket for this please background/text color and ANYTHING ELSE developed for reproduction - the consultant needs all the power of L1 - and it needs to automatically get all the new features as we add them.

The decision not to include the image access to the consultant as a tool is a massive misunderstanding in scope - another ticket  (ah this is REQ-157 which is in progress)

A ticket to include the tools documentation in the system kb please - or is this a missing build step? How did we include half the docs and not the others?

The cheapest fix is a coverage assertion — `1c assets` refuses to inline (or at minimum warns loudly) when a doc has no manifest entry. Re-running `1c kb build` fixes today's instance, but the skew will recur because `export` and `build` are separate verbs writing to one tree. <-- I don't understand - are you saying the reason that the test is failing is that we missed a build step?

Just create tickets and update docs here please? Saying which can you bring any docs up to date with these changes

<!-- xgd-turn id="2a3cd673-18be-487a-a25b-026c6a6107c0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T20:52:18.329897+00:00" -->
#### Claude
Let me answer your build-step question precisely first, then gather what I need to write the tickets.

Confirmed: **13/13 tests pass — nothing is failing.** Let me scope the terminology change and find the docs that need updating.

No test is failing — 13/13 pass. Let me answer that properly, then create the tickets.

**On the build step:** the pipeline is correct and tested. `1c kb build` runs `writeProjections()` *then* indexes (`index.ts:793`). What's stale is the artifact in this checkout. `1c assets` inlines `docs` and `index` from **two different places**: `docs` is a directory read, so it picks up new files instantly; `index` is a build artifact that only changes when `1c kb build` runs. The REF files were written Sep 1 11:53 by `1c kb export` (which projects but never indexes); the last actual build was Sep 1 00:57. So yes — a missed build step, but one the toolchain lets you ship silently. That's why it's worth a ticket rather than just a rebuild.

REQ-174 created. Now the parity ticket — the important one.

REQ-157 first — and a correction: its status is `draft`, not in progress.

Now the docs. Let me check what's there before appending.

Done. Consultant it is from here on.

## Your build-step question, first

**No test is failing.** The REQ-165 suite passes 13/13 — I ran it. It builds a corpus in a temp dir and asserts the projections land, and they do. The pipeline is correct.

What's stale is the artifact in this checkout, and yes — a build step was missed. But the reason it's worth a ticket rather than a rebuild is *how* it was missed:

`1c assets` inlines the system KB from **two sources with different clocks**. `docs` is a directory listing, so it picks up new files instantly. `index`/`chunks` are build artefacts that only change when `1c kb build` runs. Nothing compares them.

So: `1c kb build` ran Sep 1 00:57 and indexed the four DOCs. Then `1c kb export` ran Sep 1 11:53 — it calls `writeProjections()` but never indexes — writing the three REF files. Then `1c assets` at Sep 1 17:40 inlined the new docs beside the old index. That's your "half the docs": the four that existed at the last *build* are searchable; the four written after it are shipped as text and invisible to retrieval. `awareness.md` is in the invisible half too, which means the system KB's own landing point wasn't searchable either.

`1c kb build` fixes today. Nothing stops it recurring, and nothing says it happened.

## Tickets created

**REQ-174 — Rename the assistant role: caretaker → consultant** (draft, 5pts)
~122 occurrences: `roles.ts` (`CARETAKER_SYSTEM`, `CARETAKER_PURPOSE`, `caretakerReminder`, `CARETAKER_ROLE`), `instances.json`, the hosts and toolboxes, `ai.ts`, the UAT and reconciliation suites, DOC-33. I flagged that the system prompt's *"You are the caretaker of a website your user owns"* needs its paragraph rewritten, not just the noun swapped — the surrounding prose describes a custodial posture. Also flagged a real migration question: `role: "caretaker"` is persisted in every archived session header, so the rename must migrate or accept-on-read. Left DOC-4/DOC-5's titles alone as historical record.

**REQ-175 — The consultant gets the whole of L1, and keeps getting it** (draft, 13pts)
Two halves. The document-level keys — `background`, `textColor`, `widths`, `column`, `resources` — become readable and writable (colour must accept palette refs; reproduction writes `{"ref": "sand"}`). And a **parity test fixtured on `storage/sites/`** that fails when reproduction can write something the surface can't. I made the second half the point of the ticket: without it the next reproduction feature reopens the gap silently. Scope is explicitly open — the document keys are what's been found, the test is what finds the rest.

**BUG-48 — A document in the corpus that is not in the index is a shipped lie** (draft, 5pts)
Fail (not warn) on skew in `1c assets`, rebuild to fix the instance, and close the hole so `export` and `build` can't disagree.

**REQ-157 — appended, not duplicated.** One correction worth having: its status is `draft`, not in progress, and it depends on REQ-154/155/156/149. I appended the field evidence and separated three failures that were stacked together — (1) no image reaches context, which is this ticket; (2) the ingestion description exists but isn't attached to the asset, so `get_asset` can't return it — cheap and independent; (3) nothing prompts the backdrop-or-subject question. **(2) would have changed this session's outcome on its own and doesn't need the dependency chain.** Worth pulling forward.

## Docs updated

**DOC-30** (L1 Control Surface API) — new section recording the parity rule, the unaddressable document keys, and something worth having written down: `set_l1` **inherits new vocabulary automatically**, because its `node` param is `{"type":"object"}` and Zod is the gate. That's your "automatically get all the new features" — capability-wise it already works. The trap is that the same declaration that makes new fields callable is why the surface names none of them, so automatic capability must be paired with reliable description or it gets reported as absent.

**DOC-39** (Knowledge Management) — new §12. §3.3 defined membership as a build-time filter, which is the *corpus* rule; retrieval reads the index. Also noted that §3.2's "a generated fact cannot go stale" holds for the file on disk and did not hold for the `REF-l1` the assistant could search.

**DOC-17** (Design Lessons Log) — appended lessons D–G, which is what that log is for: the contrast precondition (with the point that a contrast tool wouldn't have caught this one — both values were known, the question was never asked), centred body copy as a template tell, image role as backdrop-vs-subject, and reporting a syntax failure as a platform gap.

**Not done:** DOC-33's four `caretaker` occurrences. Renaming prose while the code still says `caretaker` creates a temporary split — it belongs in REQ-174 so code and docs land together.

Two things I did not do: I didn't re-run `1c kb build` (it needs Workers AI over the network, which this sandbox blocks) and I didn't touch CHAT-35's body, since that's the live transcript.

<!-- xgd-turn id="b022d13a-28a6-49af-a51a-a62d8d5278d2-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:04:20.069997+00:00" -->
#### You
Please can you create a doc for me "Build and deployment" - I would like a simple documented walk through of build and deployment steps including the credentials needed etc for our different environments:
(1) Raw - I think this should be abandoned we should explicitly discontinue any aspect of the system that is still using raw servers (unless I am missing something) If so do not include instructions for this but create a ticket to deprecate associated commands and code paths
(2) local CF simulation
(3) running on CF

For the other two I would like a summary of the commands to be run as a code block and then a per-command description of what its doing and why its needed

<!-- xgd-turn id="b022d13a-28a6-49af-a51a-a62d8d5278d2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:08:18.828745+00:00" -->
#### Claude
Let me map the actual build and deploy paths before writing this.

Now the "raw" path — let me find what still runs on a non-Cloudflare server.

I have the full picture — and one important correction to your assumption. Let me create the deprecation ticket with the right scope first.

Now the doc itself.

`doc_kind: system_kb` would sweep an operator runbook into the consultant's corpus. Let me check what the other docs use.

Done — **DOC-41 "Build and Deployment"** and **REQ-177**.

## On (1) raw — you're right about hosting, but there's something you're missing

There is exactly one raw server an operator can start: **`1c serve <slug>`**, a `node:http` static file server over rendered output. Nothing deploys through it. It should go, and REQ-177 removes it.

But three things *look* like raw servers and are load-bearing. They bind an ephemeral loopback port inside a test or CLI run and close it again:

| | Used by | If removed |
|---|---|---|
| `startServe` | `1c shot`, `1c aligned-crops`, conformance harness | screenshots and conformance lose the origin Playwright points at |
| `startBuilder` | **42 test files** | the control-app router loses its test transport |
| the file-backed store | `1c new`/`render`/`publish`, `bin/publish` | the local authoring and reproduction tier |

The screenshot loop is the one that matters: `1c shot` renders to disk, serves that directory on loopback, drives a browser at it. The bytes under test are static render output, not Worker behaviour — moving it to workerd costs speed and buys no fidelity, and **REQ-157 depends on it continuing to work**.

So REQ-177 is scoped to removing the `1c serve` command and its help text, relabelling `serve.ts`/`builder.ts` as capture/test infrastructure in their own headers, and explicitly keeping `startServe` exported. `builder.ts` already says this about itself; `serve.ts` doesn't, which is why it reads as a hosting path. The point of item 2 is that the next person auditing for raw servers reaches this conclusion without re-deriving it.

## What's in the doc

§0 one-time setup, §1 raw/discontinued, §2 local CF simulation, §3 Cloudflare, §4 the system KB, §5 end-to-end ordering. Both environments have the command block then per-command prose, as asked, with credential tables.

A few things worth surfacing from the write-up:

**A gotcha I found while checking.** `1c builder` and `pnpm dev:control` both start `wrangler dev` on the control app, but `1c builder` spawns it with **no `--env-file` flags**. Wrangler falls back to its default `.dev.vars` lookup — so Access is correctly off, and `ANTHROPIC_API_KEY` is never loaded. The builder comes up and the assistant can't take a turn. Documented in §2; worth a small ticket if you want them aligned.

**`1c kb build` is not in `bin/build`.** It needs `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` for the embedder, so it's a separate manual step — which is the mechanical reason BUG-48 happened. §4 says plainly: run `kb build`, not `kb export`, whenever a KB document changes, then `bin/build` to re-inline. I flagged it as a temporary instruction pending BUG-48.

**The secrets hook logic** is worth knowing before your next deploy: export `ANTHROPIC_API_KEY` only when *setting or rotating*. If it's already in `wrangler secret`, the hook reads the name back and leaves it alone. If it's in neither, the deploy stops before uploading.

**`CLOUDFLARE_API_TOKEN` won't work for `bin/publish --production`** — Access needs the `CF_ACCESS_CLIENT_ID`/`CF_ACCESS_CLIENT_SECRET` pair, and the API token is refused exactly like no credential.

One correction I made after creating it: I'd initially filed DOC-41 as `doc_kind: system_kb`, which would sweep an operator runbook into the consultant's corpus. Changed to `architecture`, matching DOC-30/DOC-39 and DOC-39 §3.1's exclusion.

I have not run `1c kb build` or `bin/build` — both need network the sandbox blocks, and neither was asked for.

<!-- xgd-turn id="547e2fc3-847e-4373-820e-b9b4d18aebdb-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:48:29.472142+00:00" -->
#### You
**A gotcha I found while checking.** `1c builder` and `pnpm dev:control` both start `wrangler dev` on the control app, but `1c builder` spawns it with **no **`--env-file`** flags**. Wrangler falls back to its default `.dev.vars` lookup — so Access is correctly off, and `ANTHROPIC_API_KEY` is never loaded. The builder comes up and the assistant can't take a turn. Documented in §2; worth a small ticket if you want them aligned. <-- please create a ticket - and have the ticket update the doc when its done please

<!-- xgd-chat-end -->
---
uid: comment-38dea542
id: COMMENT-2689
type: comment
title: Comment on bug BUG-80
created_by: xgd
created_at: '2026-09-11T02:26:02.664956+00:00'
updated_at: '2026-09-11T22:23:31.376015+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-db01897e
  kind: chat_transcript
---

<!-- xgd-turn id="a72614ba-b4b0-487d-972c-46a13559f2c8-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T02:25:37.404272+00:00" -->
#### You
Please review the tail of the Lagrange Foundry chat transcript. The AI is having difficulty placing a picture on the page and encountered some errors including: *400 {"type":"error","error":{"type":"invalid_request_error","message":"prompt is too long: 22131466 tokens > 1000000 maximum"},"request_id":"req_011CevqVe2SFetXuAnKiUzzz"}*

<!-- xgd-turn id="a72614ba-b4b0-487d-972c-46a13559f2c8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T02:32:20.286029+00:00" -->
#### Claude
Reviewed the tail of the session (`chat-d73a11e1`, transcripts `comment-40c95649` / `comment-ca74b1b7`). The 22M-token error has a precise cause, and it's in this repo.

## What killed the turn

The last two tool calls:

```
screenshot {"of":{"image":"DSC_7975.jpg","kind":"image"}}
  → 'DSC_7975.jpg' names 2 pictures… (correct refusal)

screenshot {"of":{"image":"material-aa46d9cb","kind":"image"}}
  → Error: screenshot failed. net::ERR_ABORTED at data:text/html;base64,PCFkb2N0…
                                                              ← 22,611,384 bytes
```

That second result is a 22.6 MB string sent verbatim to the model. That *is* the 22,131,466 tokens.

`tools/generate/src/cli/capture/screenshot.ts:133` builds a `data:text/html;base64,…` URL with the picture base64'd inside a document that is itself base64'd — roughly (4/3)² the image size. `rasterizeImage` at line 190 then calls `driver.navigate(thatURL)` with no `try`. Playwright's navigation error message is `"<code> at <url>"`, so the whole wrapper URL becomes the error message and propagates untouched into context.

Two separate defects on that one line:

1. **A failure here can end a conversation permanently.** The oversized message is now in session history, so every subsequent turn 400s. The *image* path is already capped (`MAX_IMAGE_EDGE`, and `withoutImageData` redacts image bytes from the transcript); error *text* has no equivalent bound.

2. **Any stored non-PNG picture over ~1.1 MB cannot be photographed at all.** `net::ERR_ABORTED` is Chromium refusing a URL longer than `url::kMaxURLChars` (2 MiB) — not a decode failure. Working the double encoding back gives a ceiling of ~1,179,000 bytes on the picture itself, so an ordinary camera JPEG is over the limit rather than an edge case (this one was ~12 MB). PNG never hits it — `storedPicture()` passes PNG straight through, which is why the renaissance-study PNG screenshot in the same turn succeeded.

The Library holds no reduced copy to fall back on; `read()` has only `original: true|false` and both are the same bytes.

## Two other things in the tail, not this bug

- **The AI spent three rounds of image regeneration asking "how do the mold shapes look?" while never looking at them**, then discovered mid-session that `screenshot` does accept a Library handle. There's no operation that enumerates the Library — `list_assets` shows site assets only — so it had concluded the generated images were unreachable. Its own words: *"there are two separate picture stores, and I only checked one."*
- **It still cannot move a generated or client-uploaded image into the site's assets**, so it repeatedly asked the operator to re-drop the file into the chat. That's the same `ManageAssets`/`add_asset` grant gap already written up on `comment-c9afb02b` on 2026-09-01 (the gold A logo) — same failure, ten days later.

## Ticket

BUG-80 is populated with the diagnosis and a proposed fix, at severity `high`, still `draft`. Proposed scope, both in `rasterizeImage`:

1. Catch the navigation, rethrow `ImageNotRenderableError` with the error code kept and any `data:` URL stripped, under a hard character cap.
2. Check byte length against the navigable ceiling and refuse *before* leasing a browser, naming the picture and saying it's too large to photograph.

Explicitly out of scope and recorded as such: actually making large pictures photographable (needs the `OriginResolver` seam instead of a `data:` URL, touching both drivers), and a general tool-result size cap (that renderer is `lagrange-framework`'s `runtime.js` — a different repo).

Confirm the scope and I'll cut the branch and code it. Say the word if you also want tickets filed for the Library-discoverability and asset-registration gaps — I haven't created any.

<!-- xgd-turn id="7a68aeb2-f102-4f9d-b630-17c626adba18-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T21:42:04.068807+00:00" -->
#### You
This is confusing lets go a step at a time, I want you to fix all the problems.

**A failure here can end a conversation permanently.** The oversized message is now in session history, so every subsequent turn 400s. The *image* path is already capped (`MAX_IMAGE_EDGE`, and `withoutImageData` redacts image bytes from the transcript); error *text* has no equivalent bound. <-- ok so your picture size limit solves this going forward, but I still want  start a new session with the chat context.

**Any stored non-PNG picture over ~1.1 MB cannot be photographed at all.** `net::ERR_ABORTED` is Chromium refusing a URL longer than `url::kMaxURLChars` (2 MiB) — not a decode failure. Working the double encoding back gives a ceiling of ~1,179,000 bytes on the picture itself, so an ordinary camera JPEG is over the limit rather than an edge case (this one was ~12 MB). PNG never hits it — `storedPicture()` passes PNG straight through, which is why the renaissance-study PNG screenshot in the same turn succeeded. <-- is this fixed with your limit, as you thought?

**The AI spent three rounds of image regeneration asking "how do the mold shapes look?" while never looking at them**, then discovered mid-session that `screenshot` does accept a Library handle. There's no operation that enumerates the Library — `list_assets` shows site assets only — so it had concluded the generated images were unreachable. Its own words: *"there are two separate picture stores, and I only checked one." <-- I saw that but didn't understand, what does it mean there are two stores? Is this a data organization issue or a documentation issue?*

**It still cannot move a generated or client-uploaded image into the site's assets**, so it repeatedly asked the operator to re-drop the file into the chat. That's the same `ManageAssets`/`add_asset` grant gap already written up on `comment-c9afb02b` on 2026-09-01 (the gold A logo) — same failure, ten days later. <-- ok this is a gap can you create a ticket for this the ai needs the ability to make changes like this

Explicitly out of scope and recorded as such: actually making large pictures photographable (needs the `OriginResolver` seam instead of a `data:` URL, touching both drivers), and a general tool-result size cap (that renderer is `lagrange-framework`'s `runtime.js` — a different repo). <-- I don't understand this - we have the ability to resize pictures right? Does the AI have access to a tool for that (it needs to)? Can't the AI just make a smaller version if the image and look at that?

<!-- xgd-turn id="7a68aeb2-f102-4f9d-b630-17c626adba18-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T21:56:52.183927+00:00" -->
#### Claude
Now I have the facts. Let me update the ticket to reflect the corrected scope, then cut a branch.

Now the implementation:

Code landed. Now the session repair:

Taking your four points in order.

## 1. The dead session — fixed, and the diagnosis was different from what I said

I was wrong about *where* the poison was. The stored transcript is clean: `comment-40c95649` (the session file) is 26 KB and stops before the fatal turn, and the tool transcript already elides oversized results (`[elided — kept 5800 of 22611384 bytes]`).

What kept it dead is `backend_ref` in the session file's header — the handle the host uses to `--resume` the *backend's* own conversation. That conversation holds the 22 MB message, so every resume re-sent it.

I cleared it. This is a supported state, documented upstream: a header with no `backend_ref` "takes the cold-start path on its next turn: a new conversation, seeded from the summary and the window." Same chat ticket, same visible transcript, fresh backend — exactly what you asked for. Backup at `.xgd/tmp/comment-40c95649.backup.md`.

**Restart `wrangler dev` before you reopen that chat.** A warm isolate holds the session in memory and would overwrite the edit.

## 2. "Is the 1.1 MB problem fixed by the size limit?" — no, and that was the wrong fix

You caught the right thing. A refusal is not a fix; it just makes an ordinary phone photograph politely unviewable. So I fixed the plumbing instead.

The bytes no longer travel in the URL. The browser is navigated to a small fixed shell holding an empty `<img>`, and the picture's base64 is delivered over the driver's evaluation channel in bounded chunks, then assembled and decoded in the page. The evaluation channel has no URL-length limit. **The ~1.1 MB ceiling is gone** — a 12 MB JPEG is now photographable, as is one many times that.

Two other guards on the same path:
- Every browser interaction is wrapped. What escapes is a bounded sentence with `data:` URLs and long base64 runs stripped, under a hard character cap. No failure on this path can end a conversation again — not just the one we saw.
- A sanity ceiling (64 MB) refused *before* a browser is leased, so an absurd input doesn't become an unbounded number of round trips.
- The stored media type is now sanitised before it goes into the `src` — it's a field somebody wrote down, and it was being interpolated into a document raw.

## 3. "Two stores" — neither a data problem nor really a docs problem

Two stores is correct and deliberate, and `image-library.ts` says so: a **site asset** serves the public internet; a **Library item** is the client's confidential material in a private bucket behind Access. That module already unified the one thing that should be — the *name* — which is why `screenshot` can photograph a Library item at all.

The actual problem is **two missing operations**:
- Nothing enumerates the Library. `list_assets` shows site assets only. `ImageLibrary.list()` returns both halves and is deliberately not exposed, on the reasoning that "a picture's handle arrives in the result of whatever made it" — which holds for one turn and fails across a session. That's why the AI asked you to judge its own illustrations three times instead of looking at them.
- Nothing promotes a picture from the Library onto the site.

## 4. "Can't it just make a smaller version?" — it shouldn't need to, and now it doesn't

There is no resize tool, and I deliberately didn't add one. The pipeline already reduces every picture twice: `MAX_RASTER_EDGE` (4096) bounds the layout size, and `MAX_IMAGE_EDGE` (1024) downsamples what the model is actually shown. That machinery was working fine — the bytes just never reached the browser.

And a resize tool couldn't have worked anyway: this product has no JPEG decoder by design (REQ-156). The browser *is* the decoder. Fixing the delivery is what restores access to it, and a separate "make a smaller copy" verb would be a second way to do what every picture already goes through.

---

**Landed:** BUG-80 at `free_coded`, commit `3f1480ce1c`, version 0.2.168, merged to `xgd-working`. 7 new UATs plus 2 updated REQ-218 assertions; the REQ-218, REQ-157, REQ-154 and REQ-216 suites all pass. The full node run has 12 failing files — I checked three against a clean `xgd-working` and they fail there too; none touch this path.

**Filed:** REQ-227 (`request-a15815f4`), `draft`, priority high — "Picture stores: the AI cannot list the Library or move a picture onto the site." Covers both gaps from point 3, including the `ManageAssets`/`add_asset` grant gap from `comment-c9afb02b`. It's at draft; promotion is yours.

<!-- xgd-turn id="fa5f0843-a599-4be9-ad12-b858001d8159-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T22:12:48.371311+00:00" -->
#### You
Can you create a ticket to resolve 2 stores - make a proposal for how this should look to the AI.

I would argue that it should look to the AI exactly the way it looks to a human looking at the library - 1 set of catalogue items with metadata - one aspect of the data is the attachment, another is the mark saying if this is a site asset or not. Note: my intention was that the ticket API would be used to access this that was the WHOLE POINT of implementing this as tickets. Why is the AI not able to access these as tickets as intended.

<!-- xgd-turn id="fa5f0843-a599-4be9-ad12-b858001d8159-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T22:16:35.778365+00:00" -->
#### Claude
Created **REQ-228** (`request-77e4e59c`), draft, priority high. REQ-227 is marked abandoned with a pointer to it — it reported the gap without proposing a shape, and one of its claims was wrong (below).

## Why the AI can't access these as tickets

I went looking, expecting a design problem. It isn't one. Your intention is intact in the data model — it's the wiring that never happened. Three findings:

**The ticket surface for the AI is shipped and simply not granted.** `@lagrangefoundry/ai-ticketing` declares a `tickets` surface — `get`, `query`, `comments`, `backlinks`, `history`, `create`, `update`, `append_body`, `comment` — in two groups, `ReadTickets` and `WriteTickets`. It exports `TicketToolbox` / `instanceConfig` / `ticketToolbox(store, config)`, the same triple `ai-knowledge` exports, and `host.ts` already composes that one through `HostDeps.extraSurfaces`. It even carries `scope_axes` for project/ticket with `when_unset: deny`, so the grant is a per-session allow-set.

`instances.json` grants the consultant `l1` and `fidelity`. Nothing else. **The AI is the only actor in the system that can't read the project's own tickets.**

**Promotion already exists, already gated, wired only to the human's UI.** `promoteToSiteAsset` in `material.ts` copies the bytes through the ordinary `editAssetAdd` path, refuses anything not `republishable`, and records the placement. Its header says it "ships WITH its refusal, unrouted", so a surface could later be wired "to something that is already safe." `router.ts` then wired it — to the Library tab's HTTP route. The gate has been sitting there ready.

**Your proposed model is already the data model.** `MaterialRow.placed_on: string[]` — "the sites this material's bytes are ON — where it landed, not where it was uploaded from" (BUG-47). That is exactly "one aspect is the attachment, another is the mark saying if this is a site asset." The client's Library tab already renders it as a pill and a filter. Only the assistant sees two stores.

What happened is ordinary: REQ-161 built the Library for the client's UI, and every capability added afterwards — the placement record, the promotion gate, the edit recipe — got an HTTP route for that UI. The toolbox was never pointed at the same store.

**Correction to what I said last turn:** I called this "the `ManageAssets`/`add_asset` grant gap." That's wrong, and it would have misled whoever built it. `add_asset` takes a path on the operator's own disk and its own description says it "is not a way to accept a file from a conversation." Granting it would have fixed nothing. The missing verb is promotion, which is a different function.

## The proposal, in four parts

- **A — grant the ticket surface.** Compose `TicketToolbox` through `extraSurfaces`, scoped to the client's project, `ReadTickets` only. `WriteTickets` is a much larger grant and shouldn't ride along; the engagement record already has its own narrow verb. The grant travels with the surface, not in `instances.json`, for the reason `ai.ts` already states for knowledge.
- **B — a picture-shaped view.** A raw ticket isn't a picture. The rows should come back in the `StoredImage` vocabulary `screenshot` already takes, plus the material fields and `placed_on` — so `resolveStoredImage` stays the single naming rule. I recommend a peer operation rather than extending `list_assets`, because "what's on the site" and "what the client has given us" are genuinely two questions and only the first was askable. Bounded, like `list_references`.
- **C — `place_on_site`** over the existing `promoteToSiteAsset`, in its own group. It's a copy across the private/public bucket boundary and a publication decision; a distinct group is what lets a deployment grant looking without granting publishing.
- **D — the part that needs your decision.** A–C don't make the catalogue *complete*. `write_image` (a drawing the AI makes) and `add_asset` both put bytes in the site store and mint no ticket, so the site holds pictures the catalogue has never heard of. Until every door mints a catalogue item, "one catalogue with a mark" isn't quite true. I scoped that as the destination rather than the work — it touches ingestion, the drawing path and the capture pipeline — but asked that A–C be built so they don't have to be unpicked to get there: catalogue as source of truth, site listing as a view of it.

The acceptance test in the ticket is the session that started this: the same run reads its own catalogue, sees the three illustrations it made, looks at them, and places the one it picked — without asking you to drag a file in a second time.

<!-- xgd-turn id="e4238d92-7cb3-445d-a6c2-3068270eb916-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T22:23:30.079120+00:00" -->
#### You
Note that REQ-15o in lf is adding xgd ticket fetch to retrieve attachments via the ticket API so that closes one last potential gap, right?

<!-- xgd-chat-end -->
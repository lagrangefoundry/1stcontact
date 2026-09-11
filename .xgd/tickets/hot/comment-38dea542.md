---
uid: comment-38dea542
id: COMMENT-2689
type: comment
title: Comment on bug BUG-80
created_by: xgd
created_at: '2026-09-11T02:26:02.664956+00:00'
updated_at: '2026-09-11T02:32:20.349871+00:00'
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

<!-- xgd-chat-end -->
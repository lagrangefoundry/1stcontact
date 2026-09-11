---
uid: bug-db01897e
id: BUG-80
type: bug
title: 'screenshot: a failed stored-picture render returns the whole 22MB data URL
  to the model'
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:24:18.255769+00:00'
updated_at: '2026-09-11T02:31:53.100454+00:00'
completed_at: null
last_field_updated: severity
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-38dea542
  severity: high
---

## Symptom

In the Lagrange Foundry chat session (`chat-d73a11e1`, 2026-09-11 ~02:08), the
assistant tried to photograph a picture the client had uploaded and the turn died
with:

```
400 invalid_request_error: prompt is too long: 22131466 tokens > 1000000 maximum
```

The conversation could not be continued — the oversized message is in the session
history, so every subsequent turn fails the same way.

## What actually happened

The last two tool calls of the turn, from the tool transcript
(`comment-ca74b1b7`):

```
screenshot {"of":{"image":"DSC_7975.jpg","kind":"image"}}
  → Error: screenshot failed. 'DSC_7975.jpg' names 2 pictures: 'DSC_7975.jpg',
    'material-aa46d9cb'. Ask for one of those names...          (correct refusal)

screenshot {"of":{"image":"material-aa46d9cb","kind":"image"}}
  → Error: screenshot failed. net::ERR_ABORTED at
    data:text/html;base64,PCFkb2N0eXBlIGh0bWw+…                  (22,611,384 bytes)
```

The second result is a **22.6 MB string**, sent verbatim to the model as a tool
result. That is the 22,131,466 tokens.

## Root cause

`tools/generate/src/cli/capture/screenshot.ts`:

- `wrapperDocument()` (line 133) builds a `data:text/html;base64,…` URL with the
  picture's bytes base64'd *inside* a document that is itself base64'd — so the
  URL is roughly `(4/3)²` the size of the image.
- `rasterizeImage()` (line 190) calls `driver.navigate(wrapperDocument(...))`
  with no `try`. Playwright's navigation error message is `"<code> at <url>"`,
  so **the entire wrapper URL becomes the error message**, which propagates
  through the toolbox unchanged and lands in the model's context.

Two independent defects sit on that one line:

**1. A failure on this path can end the conversation.** Nothing between
`driver.navigate` and the model bounds the size of a tool result's *text*. The
image path is already capped (`MAX_IMAGE_EDGE` in `ai/fidelity-core.ts`, and
`withoutImageData` in `ai/host-core.ts` redacts image bytes from the transcript);
the error-text path has no equivalent. Any browser error carrying a payload is a
prompt bomb.

**2. Any stored non-PNG picture over roughly 1.1 MB cannot be photographed at
all.** Chromium refuses to navigate to a URL longer than `url::kMaxURLChars`
(2 MiB) — that is the `net::ERR_ABORTED`, not a decode failure. Working the
double encoding backwards, the ceiling on the picture's own bytes is about
1,179,000 — so an ordinary phone or camera JPEG is *over* the limit, not an edge
case. The failing picture was ~12 MB. (PNG is unaffected: `storedPicture()` in
`picture.ts` passes PNG straight through and never reaches the browser. That is
why the earlier `a-renaissance-era-invention-study…png` screenshot in the same
turn worked.)

The Library holds no reduced copy to fall back on — `ImageLibrary.read` has only
`original: true|false` and both are the same bytes today.

## Fix

Both halves land in `rasterizeImage`:

1. **Never let a driver error carry the document out.** Wrap the `navigate` and
   rethrow as `ImageNotRenderableError` with the navigation's error code kept and
   any `data:` URL removed, under a hard character cap on the emitted message.
   This is the half that matters most: it turns an unrecoverable session into a
   sentence the assistant can act on.

2. **Refuse before leasing a browser.** Check the picture's byte length against
   the navigable ceiling and refuse above it, naming the picture, saying it is
   too large to photograph, and saying what is still available (the Library's own
   description of it; asking the client for a smaller copy). No browser is taken
   and no oversized URL is ever constructed.

The refusal is honest rather than silent: the assistant is told the picture
exists and could not be shown, which is the one thing it must not have to guess
at — a blank or missing picture reads to a model exactly like a picture it saw.

## Out of scope (recorded, not fixed here)

- **Large stored pictures still cannot be photographed.** After this fix they
  refuse cleanly instead of killing the session, but the capability gap stands.
  Closing it means delivering the bytes to the browser through the existing
  `OriginResolver` in-process host seam rather than a `data:` URL, which touches
  both drivers, or holding a bounded working copy in the Library.
- **A general cap on tool-result text.** No single tool result should be able to
  exceed a budget regardless of which operation produced it. That renderer is
  `lagrange-framework` `components/ai/js/src/toolbox/runtime.js` — a different
  repository.

## Test plan

UATs named `test_UAT_FC_BUG-80_*`, against `rasterizeImage` with a fake driver:

- a driver whose `navigate` rejects with a message containing a `data:` URL →
  the error that escapes contains neither the URL nor the base64, is under the
  cap, and still names the picture and the navigation code.
- a picture over the ceiling → refuses without the factory ever being called
  (no browser lease), and the sentence names the picture.
- a picture under the ceiling → unchanged: navigates, decodes, returns bytes.
- an undecodable picture under the ceiling → still the existing
  `ImageNotRenderableError` wording (no regression on the decode path).

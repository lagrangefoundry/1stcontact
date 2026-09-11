---
uid: bug-db01897e
id: BUG-80
type: bug
title: 'screenshot: a failed stored-picture render returns the whole 22MB data URL
  to the model'
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:24:18.255769+00:00'
updated_at: '2026-09-11T21:47:04.574695+00:00'
completed_at: null
last_field_updated: status
status: free_coding
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

The conversation could not be continued — every subsequent turn failed the same
way.

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

- `wrapperDocument()` built a `data:text/html;base64,…` URL with the picture's
  bytes base64'd *inside* a document that is itself base64'd — so the URL is
  roughly `(4/3)²` the size of the image.
- `rasterizeImage()` called `driver.navigate(wrapperDocument(...))` with no
  `try`. Playwright's navigation error message is `"<code> at <url>"`, so **the
  entire wrapper URL becomes the error message**, which propagates through the
  toolbox unchanged and lands in the model's context.

Two independent defects sit on that one line:

**1. A failure on this path can end the conversation.** Nothing between
`driver.navigate` and the model bounds the size of a tool result's *text*. The
image path is already capped (`MAX_IMAGE_EDGE` in `ai/fidelity-core.ts`, and
`withoutImageData` in `ai/host-core.ts` redacts image bytes from the transcript);
the error-text path had no equivalent. Any browser error carrying a payload is a
prompt bomb.

**2. Any stored non-PNG picture over roughly 1.1 MB could not be photographed at
all.** Chromium refuses to navigate to a URL longer than `url::kMaxURLChars`
(2 MiB) — that is the `net::ERR_ABORTED`, not a decode failure. Working the
double encoding backwards, the ceiling on the picture's own bytes was about
1,179,000 — so an ordinary phone or camera JPEG was *over* the limit, not an
edge case. The failing picture was ~12 MB. (PNG was unaffected: `storedPicture()`
in `picture.ts` passes PNG straight through and never reaches the browser. That
is why the earlier `a-renaissance-era-invention-study…png` screenshot in the same
turn worked.)

## Fix

Both halves land in `rasterizeImage`, and the second one **closes the capability
gap rather than refusing more politely**.

1. **Carry the picture to the browser by script, not by URL.** The browser is
   navigated to a small, fixed shell document holding an empty `<img>` — a URL of
   constant, trivial length that no picture can inflate. The picture's base64 is
   then delivered in bounded chunks through `driver.query`, which travels over the
   driver's evaluation channel and is subject to no URL-length limit, and a final
   script assembles it, sets the `src` and awaits `decode()`. A 12 MB photograph
   is photographable; so is one many times that. The chunk bound is what makes the
   *failure* path safe too: no single message a driver could echo back in an error
   is larger than one chunk.

   The stored media type is sanitised before it is interpolated into the `src`,
   for the same reason any stored string is sanitised before it reaches a
   document: it is a field somebody wrote down, not a value this code chose.

2. **Never let a driver error carry its payload out.** Every browser interaction
   on this path is wrapped, and anything that escapes is rethrown as
   `ImageNotRenderableError` with the driver's own message kept but any `data:`
   URL and any long base64 run removed, under a hard character cap. This is the
   half that matters most: it turns an unrecoverable session into a sentence the
   assistant can act on. It holds for every future failure on this path, not just
   the one observed.

3. **A sanity ceiling, refused before a browser is leased.** A stored picture
   beyond an absurd size is refused by name without taking a browser and without
   constructing anything large. This is not the old ~1.1 MB limit — it sits far
   above any real photograph — it is the backstop that keeps an unbounded input
   from becoming an unbounded number of chunks.

The refusal is honest rather than silent: the assistant is told the picture
exists and could not be shown, which is the one thing it must not have to guess
at — a blank or missing picture reads to a model exactly like a picture it saw.

**No resize tool is added, deliberately.** Once the bytes reach the browser, the
existing reduction does the rest with no new vocabulary: `MAX_RASTER_EDGE` bounds
the size the picture is laid out at, and `MAX_IMAGE_EDGE` in `fidelity-core.ts`
downsamples what the model is actually shown. A separate "make a smaller copy"
verb would be a second way to do what the pipeline already does on every picture,
and this product has no decoder of its own for a JPEG anyway — the browser is the
decoder, which is exactly what this fix restores access to.

## The poisoned session

Recorded here because it is the same incident, and because the diagnosis is
non-obvious. The durable transcript is **clean**: `comment-40c95649` (the session
file) is 26 KB and stops before the fatal turn, and the tool transcript already
elides oversized results (`[elided — kept 5800 of 22611384 bytes]`). What kept the
conversation dead is the session header's `backend_ref` — the handle the host
resumes the *backend's* conversation by. That conversation holds the 22 MB
message, so every resume re-sent it.

Clearing `backend_ref` in the session file's `<!-- xgd-session -->` header is the
repair, and the upstream code already documents it as a supported state: a header
carrying no `backend_ref` "takes the cold-start path on its next turn: a new
conversation, seeded from the summary and the window." Same chat ticket, same
visible transcript, fresh backend. Applied as data repair; no code change.

## Out of scope (recorded, not fixed here)

- **A general cap on tool-result text.** No single tool result should be able to
  exceed a budget regardless of which operation produced it. This ticket bounds
  the one path that was observed to blow it; the general guard belongs in
  `lagrange-framework` `components/ai/js/src/toolbox/runtime.js` — a different
  repository.
- **The two picture stores.** That the assistant could not enumerate the Library,
  and cannot move a picture from it onto the site, is a separate capability gap
  with its own ticket.

## Test plan

UATs named `test_UAT_FC_BUG-80_*`, against `rasterizeImage` with a fake driver:

- a driver whose `navigate` rejects with a message containing a `data:` URL →
  the error that escapes contains neither the URL nor the base64, is under the
  cap, and still names the picture and the driver's own code.
- a driver whose `query` rejects echoing its script → same guarantee, so the
  bound is on the path and not on one call.
- a picture far larger than the old ~1.1 MB URL ceiling → is photographed: the
  navigated URL stays small and constant, the bytes arrive through `query` in
  bounded chunks, and the picture comes back.
- a picture over the sanity ceiling → refuses without the factory ever being
  called (no browser lease), and the sentence names the picture.
- a stored media type carrying quote/script characters → cannot escape the `src`
  it is interpolated into.
- an undecodable picture → still the existing `ImageNotRenderableError` wording
  (no regression on the decode path).

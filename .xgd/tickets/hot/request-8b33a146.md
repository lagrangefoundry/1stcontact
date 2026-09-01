---
uid: request-8b33a146
id: REQ-172
type: request
title: 'Library detail: render documents inline, with an expand-to-modal reader'
created_by: xgd
created_at: '2026-09-01T21:04:04.214569+00:00'
updated_at: '2026-09-01T21:33:14.205261+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-972387b5
---

## What the client sees today

The Library detail pane renders **images** inline and offers everything else as
a bare download link. A client who has just uploaded their brand guidelines or a
positioning note gets a filename and a download — the pane can show them a
photograph but not a document, which is the same "recognise it by its path"
problem [[REQ-132]] removed from the image picker.

## What changes

**A document is shown, not named.** The preview slot above the metadata gains a
bounded, scrolling reader window for the kinds we can render, with the download
link kept beneath it in every case:

| The bytes are | Shown as |
|---|---|
| `image/*` | inline `<img>` — unchanged |
| `text/markdown` | the markdown, rendered |
| any other `text/*` (plain, csv, log), plus JSON and XML | the text itself, preformatted |
| `application/pdf` | the browser's own PDF viewer, in a frame |
| anything else | the download link alone — unchanged |

The window is capped at the height the image preview already uses and scrolls,
so a fifty-page brand book does not push the rights record and the description
off the bottom of a pane whose job is to show them together.

**An expand button, top right of the reader.** Two arrows pointing away from each
other. Pressing it opens the same content in the builder's existing modal shell
at modal size, so a long document can be read without the list and the metadata
competing for the pane. Escape, the backdrop and the close button all shut it, as
they do for every other builder dialog — the shell is reused rather than rebuilt,
which is what makes that true without this ticket implementing any of it.

**PDFs — yes, and cheaply.** The file route already serves the stored content
type with `content-disposition: inline`, which is exactly what the browser's
built-in PDF viewer wants, so a frame pointed at that URL is a real scrollable
viewer with no library, no build step and no second transport. Two honest limits,
both accepted: it is the *browser's* viewer, so its chrome differs a little
between browsers and we do not control it; and iOS Safari renders only the first
page inside a frame — irrelevant while the builder is a desktop surface
([[DOC-14]] §8). The bytes are read once: the frame asks the route for them
itself, so nothing fetches them a second time to show the file once.

## Technical consequences of the above

These are not separate asks; they are what the above requires.

**The row has to say what the bytes are.** The detail decides how to render from
the content type, and `MaterialRow` carries only `kind` — which is `document` for
markdown, text and PDF alike. So the resolved content type is duplicated onto the
material ticket's own fields at ingest, exactly as `filename` already is and for
the identical reason: the alternative is an `attachments()` call per row to draw
a list. It is written from the same variable the attachment record gets, so the
[[BUG-41]] repair recorded there cannot drift from what the Library reads.

**Material that predates the field resolves its type from its own name.** A
client's existing corpus has no `content_type` on its tickets, and treating
absence as a fourth state would leave every document they already had as a
download link — the bug, still there, for everyone already using this. The row
falls back to `resolveContentType`, which is the same mapping the field caches,
so nothing has to be backfilled. A stated type is still kept over what the
extension would say, and an unmapped extension still degrades to
`application/octet-stream` and no reader — this widens what can be shown without
changing what happens to what cannot.

**Rendered markdown is sanitized.** Markdown reaches the DOM as HTML, and a `.md`
can arrive from `/api/material/fetch` as well as from the client's own disk, so
these bytes are not necessarily trusted. It is rendered through the same
`renderSafe` seam the chat panel and the description cell already use
(`webui-chat` over `webui-markdown` + DOMPurify), which degrades to escaped source
rather than raw HTML when the sanitizer has not loaded. A hand-rolled second
sanitizer for the same origin would be a second security boundary to keep in step
with the first.

**And it repaints when the engines land.** [[BUG-42]]'s failure applies to this
window exactly as it did to the transcript and the description: a reader painted
while `marked`/DOMPurify are still coming down from a CDN shows escaped source,
which is right when they are absent and wrong when they are merely late. The
window therefore waits on the same `markdownReady` signal and repaints once —
including into an expanded dialog that is already open.

**Plain text is not rendered as markdown, and HTML is not run.** A `.txt` put
through a markdown parser loses its own line breaks and gains headings its author
did not write, so it is shown as itself. An uploaded `.html` is shown as its
source for the stronger reason: rendering a client-supplied document as live
markup would be a script-execution surface offered as a convenience.

**An SVG stays a picture.** It decodes as text, and it is the one textual type the
reader refuses — `kindOf` files it as an image and the pane already has an `<img>`
for it. Showing a client their own logo as angle brackets would be a regression
dressed as a feature.

**The reader is destroyed with the detail.** It owns an in-flight fetch and
possibly an open dialog, and `list-detail` swaps details as the client browses. A
reader left behind would repaint an element no longer on screen and leave its
expanded window hanging over the file that replaced it.

**A record whose bytes are gone says so**, in the same words the missing-image
path uses, rather than showing an empty window.

**The markdown seam is re-exported from the builder's own module.**
`bug32-webui-scope-rebrand` permits the component scope in its declaration and in
`src/builder` alone, and a suite asserting *rendered* markdown must inject the
engines because a CDN import cannot run under vitest. So `markdown.js` — already
"the builder's markdown engines, in one place" — re-exports `setParser` and
`setSanitizer` beside `renderSafe`.

## Why free-coded

A pane that renders four content types where it rendered one, inside a component
vocabulary and a modal shell that both already exist. No new design decision, no
new transport.

## Test plan

`tests/test_UAT_FC_REQ-172_library_document_preview.test.ts` (jsdom, real
components, `WEBUI_INSTALLED`-gated as its [[REQ-161]] sibling is): which reader a
content type selects; markdown rendered into the window above the metadata; a
`.txt` shown as itself with the engines present; a PDF given a frame at the file
URL and its bytes not read twice; an image keeping its `<img>`; an unrenderable
kind offered exactly as before; missing bytes reported; the cold-load repaint;
the expand button opening the builder's dialog shell with the same content;
Escape closing it and the button reopening it; and browsing to another row taking
the expanded window with it.

`tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts` (workerd,
through `route()` against real D1 and R2, on the REQ-161 surface suite's pattern):
three documents one `kind` cannot tell apart arriving with three content types;
the row and the attachment record agreeing; a stated type kept over the
extension; material written before the field resolving from its filename; and an
unnamed binary staying unnamed.

---
uid: request-8b33a146
id: REQ-172
type: request
title: 'Library detail: render documents inline, with an expand-to-modal reader'
created_by: xgd
created_at: '2026-09-01T21:04:04.214569+00:00'
updated_at: '2026-09-01T21:20:09.705813+00:00'
completed_at: null
last_field_updated: status
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
| any other `text/*` (plain, csv, log) | the text itself, preformatted |
| `application/pdf` | the browser's own PDF viewer, in a frame |
| anything else | the download link alone — unchanged |

**An expand button, top right of the reader.** Two arrows pointing away from each
other. Pressing it opens the same content in the builder's modal shell at modal
size, so a long document can be read without the list and the metadata competing
for the pane. Escape, the backdrop and the close button all shut it, as they do
for every other builder dialog.

**PDFs — yes, and cheaply.** The file route already serves the stored content
type with `content-disposition: inline`, which is exactly what the browser's
built-in PDF viewer wants, so a frame pointed at that URL is a real scrollable
viewer with no library, no build step and no second transport. Two honest limits,
both accepted: it is the *browser's* viewer, so its chrome differs a little
between browsers and we do not control it; and iOS Safari renders only the first
page inside a frame — irrelevant while the builder is a desktop surface
([[DOC-14]] §8).

## Technical consequences of the above

These are not separate asks; they are what the above requires.

**The row has to say what the bytes are.** The detail decides how to render from
the content type, and `MaterialRow` carries only `kind` — which is `document`
for markdown, text and PDF alike. So the resolved content type is duplicated onto
the material ticket's own fields at ingest, exactly as `filename` already is and
for the identical reason: the alternative is an `attachments()` call per row to
draw a list. Material ingested before this change has no such field, so the row
falls back to resolving the type from its own filename — no migration, and the
mapping is the one `resolveContentType` already owns.

**Rendered markdown is sanitized.** Markdown reaches the DOM as HTML, and a `.md`
can arrive from `/api/material/fetch` as well as from the client's own disk, so
these bytes are not necessarily trusted. It is rendered through the same
`renderSafe` seam the chat panel already uses (`webui-chat` over `webui-markdown`
+ DOMPurify), which degrades to escaped source rather than raw HTML when the
sanitizer has not loaded. A hand-rolled second sanitizer for the same origin
would be a second security boundary to keep in step with the first.

**Plain text is not rendered as markdown.** A `.txt` put through a markdown
parser loses its own line breaks and gains headings its author did not write, so
it is shown as itself.

## Why free-coded

A pane that renders four content types where it rendered one, inside a component
vocabulary and a modal shell that both already exist. No new design decision, no
new transport.

## Test plan

`tests/test_UAT_FC_REQ-172_library_document_preview.test.ts` (jsdom, real
components, `WEBUI_INSTALLED`-gated as its REQ-161 sibling is) covering: markdown
rendered into the reader; a `.txt` shown as text and not as markdown; a PDF given
a frame at the file URL; an unrenderable kind still offered as a download alone;
the expand button opening a modal holding the same content and closing cleanly.
Origin coverage extends the REQ-161 material-surface suite with the content type
travelling on the row, including the filename fallback for material that predates
the field.
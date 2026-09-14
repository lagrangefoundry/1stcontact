---
uid: acceptance_criterion-4deb8be1
id: AC-1811
type: acceptance_criterion
title: The content type decides which reader the detail shows, in a bounded scrolling
  window above the record, with the download link kept in every case
created_by: martin-github@westhead.me
created_at: '2026-09-14T07:07:02.004720+00:00'
updated_at: '2026-09-14T07:07:02.004720+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

What the bytes are — not how the material is filed — decides how the detail shows them. The
filing vocabulary calls a markdown note, a plain-text export and a brand book all *document*, so
it cannot be what chooses; the content type is:

| The bytes are | Shown as |
|---|---|
| a picture | rendered in place, as it always was |
| markdown | the markdown, rendered |
| any other text, plus JSON and XML | the text itself, with its own line breaks kept and nothing parsed out of it |
| a PDF | the browser's own viewer, reading the same address the download link points at, so the bytes are fetched once |
| anything else | the download link alone, exactly the pane it reached before |

The reader sits in a window **above** the record, is bounded at the height a picture already
occupies and scrolls inside that bound, so a long document does not push the rights record and
the description off the pane. While the bytes are still arriving the window says it is reading,
rather than showing an empty box. The download link is present in every one of these cases.

## Verification

For each of the five rows above, select a material of that content type in the Library and
observe the stated rendering: a markdown document showing its headings and emphasis rather than
their markers; a plain-text file showing its own lines unparsed; a PDF given a frame pointed at
the same file address the download link uses, with no second request for the same bytes; a
picture keeping the rendering it already had and gaining no reader window; and a font or
unrecognised binary offered as a download with no window at all. Observe in every case that the
reader window precedes the record in the pane, that it is bounded and scrolls rather than
growing to the document's length, and that the download link is present. Select a document whose
bytes have not yet arrived and observe the window saying it is reading.

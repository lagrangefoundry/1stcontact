---
uid: acceptance_criterion-74b13779
id: AC-1813
type: acceptance_criterion
title: Each listed material carries what its bytes are, a stated type wins over the
  extension, and material predating the value resolves it from its own filename
created_by: martin-github@westhead.me
created_at: '2026-09-14T07:07:29.776084+00:00'
updated_at: '2026-09-14T07:25:32.394200+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Because the pane renders from what the bytes are, each listed material carries its content type
alongside its filename — one value per row, so drawing a list of documents costs no extra read
per row:

- Documents that share a single filing kind but differ in content arrive on the list with
  **different** content types, one per rendering: a markdown note as a markdown type, a
  plain-text export as a plain-text type, a brand book as a PDF type.
- The type on the row is the same type the record of the stored bytes carries, and the same type
  the file address serves the bytes with: the list, the stored record and the served file cannot
  disagree about what a file is.
- A type the sender actually stated is kept, even where the filename's extension would say
  something else — the sender observed the bytes and this surface did not.
- Material stored before the row carried this value resolves its type from its own filename, by
  the same mapping that would have been recorded, so nothing has to be backfilled and a client's
  existing documents are readable immediately rather than becoming download links.
- A filename whose extension names nothing recognised still yields the generic binary type, and
  so still reaches the download-only pane: this widens what can be shown without changing what
  happens to what cannot.

## Verification

Through the platform's own material surface against a real store, upload three files that share
one filing kind but differ in content — a markdown note, a plain-text export and a PDF — and
observe one kind and three content types across the listed rows. Assert that the type on a row
equals the type on the record of its stored bytes and equals the type the file address serves.
Upload a file whose stated type contradicts its extension and observe the stated type kept.
Write a material directly with no content type recorded, list it, and observe the type resolved
from its filename. Upload a file with an unrecognised extension and no stated type, and observe
the generic binary type.
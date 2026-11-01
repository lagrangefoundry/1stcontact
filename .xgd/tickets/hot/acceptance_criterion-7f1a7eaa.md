---
uid: acceptance_criterion-7f1a7eaa
id: AC-1689
type: acceptance_criterion
title: A text-shaped file becomes material whose body is a digest of its decoded contents,
  with the contents kept in full on the text comment
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:22:43.514110+00:00'
updated_at: '2026-11-01T03:16:20.507791+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

A text-shaped file — plain text, Markdown, structured text such as JSON or XML, or a vector
image expressed as markup — becomes material whose **body is a digest of its decoded contents**,
with the decoded contents themselves **kept in full** beside the body.

- The body is the describer's digest of the decoded text, not the text itself and not a summary
  of the file's name and size.
- The file's decoded text is returned in full alongside the description (the ingestion keeps it
  on the text comment — STORY-140).
- The title is the first substantial line of that text, with any leading heading marks removed,
  and the filename only where no line qualifies. The describer never supplies the title, and the
  derived title survives a digest that could not be written.
- A leading, closed front-matter block is **skipped rather than read as a title**: its fence is
  never the title, and where the block declares a title of its own, that declared title is
  preferred over anything derived from the text below it — an author's own title beats an
  inferred one, the same rule a portable document's declared title already follows.
- An opening fence that never closes is an ordinary horizontal rule in a document that happens
  to begin with one, not a block: the title is taken from the text as usual rather than the
  rest of the file being skipped.
- A line that is only a rule — dashes, equals signs, asterisks or underscores — is never a
  title, wherever it appears.
- The recorded outcome is the described outcome, and the recorded describer names the model
  that wrote the digest and the decoding reader that produced the text.

## Verification

Hand the description step, with a text describer configured, a Markdown file whose first line is
a heading and whose body contains a distinctive phrase; assert the full text contains that
phrase, the body is the digest, the title is the heading text without its marks, and the outcome
is described with a describer naming the model and the decoding reader. Repeat for a
structured-text file to show the type family, not one extension, is covered. Then cover the
three front-matter cases — a block declaring its own title (that title wins), a block declaring
none (the title falls through to the heading below the block), and an opening fence that never
closes (the title comes from the text below it) — asserting no case is ever titled by the
fence. Repeat once with no text describer and assert the file's words are still returned in full
and the title is still derived from the text.

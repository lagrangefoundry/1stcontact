---
uid: acceptance_criterion-6130ba2a
id: AC-2369
type: acceptance_criterion
title: Every message is delivered with a plain-text part derived from its HTML body,
  in which every anchor appears as its words followed by its address
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T04:11:55.142343+00:00'
updated_at: '2026-11-08T04:11:55.142343+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
Every message is delivered with a plain-text part derived from its HTML body. Every URL that appears in an `href` in the HTML part appears verbatim in the text part. The derivation rules:
- **Anchors.** An anchor renders as its words followed by its address in angle brackets (`Accept your invitation <https://…>`). An anchor whose words already are its address renders the address once.
- **Blocks and tags.** Block-level elements become line breaks between paragraphs, and every other tag is removed.
- **Non-content markup.** The contents of `<style>`, `<script>`, `<head>` and `<title>` never appear in the text.
- **Entities and whitespace.** HTML entities are decoded, and line-wrapping and runs of whitespace in the source collapse, so the text reads as the page reads rather than as the source is laid out.

## Verification
For each shipped default template (`invite`, `signin`, `lapsed`), render it with a `cta_url` value and send it through the credentialed sender with a recording provider double. Collect every `href` in the provider's HTML field and assert each one appears verbatim in its text field.

Then send hand-built bodies and inspect the text field:
- An anchor with words and a different href yields `words <href>`; an anchor whose words equal its href yields the href once.
- A body containing `<style>` and `<title>` content yields text containing neither.
- Paragraphs wrapped across source lines yield one line per paragraph, separated by blank lines, with no stray line breaks inside a paragraph.
- `&amp;` and a numeric reference such as `&#8212;` are decoded.

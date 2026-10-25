---
uid: request-003b3e81
id: REQ-430
type: request
title: 'Toolbox: serialise structured tool results compactly, not indented'
created_by: EPIC-20
created_at: '2026-10-22T23:07:22.618043+00:00'
updated_at: '2026-10-22T23:07:39.815631+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Symptom

Every structured tool result reaches the model pretty-printed: `toolbox/provenance.js:128` returns `JSON.stringify(plain(result), null, 2)`. For deeply nested results, the indentation and line breaks are a large share of the bytes. In 1stcontact's Ariel's Arc Welding session, a Delegate account capped at 24,000 characters of compact JSON arrived as about 53 KB. Every tool result is written to the cache once and then re-read on every later request of the run, so the whitespace is paid for many times over. This applies to the consultant (Opus) and the builders (Haiku) alike, and builder runs in that session averaged 23 requests.

## Ask

Serialise structured tool results compactly (`JSON.stringify(plain(result))`), or make the indent a backend/toolbox setting that defaults to compact. The `<<<untrusted>>>` provenance wrapping is unchanged.

## Why it is safe

Models read compact JSON as well as indented JSON. Nothing parses these strings back: they are model-facing text. Transcripts that want readable JSON can pretty-print at render time.

## Test plan

- A structured result is delivered with no indentation or line breaks between tokens, still wrapped as untrusted.
- Measure the token difference on a representative nested result (e.g. a 1stcontact delegation account) using the API's token counting, and record it on this ticket.

Filed from 1stcontact EPIC-20 (token cost).
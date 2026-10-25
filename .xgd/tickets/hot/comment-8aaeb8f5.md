---
uid: comment-8aaeb8f5
id: COMMENT-5559
type: comment
title: Comment on epic EPIC-20
created_by: xgd
created_at: '2026-10-22T23:09:40.487882+00:00'
updated_at: '2026-10-22T23:09:40.487882+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-0923bb64
  kind: note
---

## Ariel's Arc Welding cost review (2026-10-22)

- **Metered total ~$52:** consultant $27.92 (75 turns), builders $24.08 (71 runs). BUG-254: at least 3 builder runs went unmetered. Lagrange's $57.10, repriced for 1-hour writes (BUG-242), is about $68, so Ariel's is not actually the most expensive build.
- **Builder caching works.** The shared ~45k starting context was written at the 1-hour rate only 6 times across 71 runs; every other run read it from cache. Conversation writes are at the 5-minute rate. Median run is 23 requests (Bob's Salon 3: 31). BUG-243 is confirmed fixed for accepted reports. Refused reports still loop: BUG-253.
- **Consultant:** the 17 delegation turns cost $17.46 of $27.92, with 982k tokens of cache writes. The cause is Delegate results: 1.07 MB across 85 calls, up to 54 KB each, because the 24k difference budget is measured on compact JSON and the result is sent pretty-printed (BUG-252 here; framework REQ-217 for compact serialisation generally).
- **Other consultant leaks (not filed):** ~4.7k uncached tokens per request ($5.31; the reminder tail explains only ~1.5–2k of that); image aging (`DEFAULT_IMAGE_TURNS = 2`) rewrites recent turns (~$2); three 1-hour cache expiries (~$2.6).
- **Rework:** 54% of builder spend was new work; redo 35%, repair 8%, owner changes 3%. The header and logo took 33 runs and $12.44. Drivers: parallel builders making the same thing on different pages, width fixes changing base values, throwaway measuring SVGs, fonts missing from page font lists, and divergent motion fields. Priming draft: `.xgd/tmp/epic20/ariel-priming-draft.md`.

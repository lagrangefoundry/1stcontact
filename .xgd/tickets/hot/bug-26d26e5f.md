---
uid: bug-26d26e5f
id: BUG-291
type: bug
title: 'Consultant cache: history is rebuilt after a builder wait over 5 minutes,
  and request rows never store the 5m/1h write split'
created_by: EPIC-20
created_at: '2026-10-26T00:46:13.844827+00:00'
updated_at: '2026-10-26T01:52:15.441527+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-36f47520
  story_points: 2
  commits:
  - working_sha: a7d03f452fb84c5660bb923dbf14ad1e976fdf5f
    reconcile_sha: null
    main_sha: null
  - working_sha: 0267d19a1726e5003cbdc2b7e5c86335495fdbd8
    reconcile_sha: null
    main_sha: null
  version: 0.2.658
---

## Symptom

First-Draft-Test Dina's Diner 4 (local dev, 2026-10-26). `claude` (the consultant, Opus 5.5) is configured `cache_ttl: "1h"`. Twice, after waiting on builders for more than 5 minutes, its next request found its history uncached:

| sent | gap since previous consultant request | cache read | cache write | cost |
|---|---|---|---|---|
| 00:05:55.6 (holder, request 11) | 6.5 min | 0 | 140,550 | $1.17 |
| 00:05:55.7 (cue turn, sent concurrently) | — | 0 | 88,123 | $0.74 |
| 00:12:34.9 (holder, request 15) | ~5.1 min | 79,792 (system only) | 78,317 | $0.73 |

That's about $2.60, a quarter of the run. Gaps under 4 minutes read the whole history as expected. In 5–60 minute gaps across all dev sites, the system prefix usually survives (19 of 21) but the history doesn't: the 1-hour lifetime isn't protecting the consultant's history, or entries are being lost. Long builder hand-offs make 5+ minute waits normal, so this will happen on most builds.

## Why we can't tell which: the split is never stored

`request_spend.cache_write_5m_tokens` / `cache_write_1h_tokens` are null on **every** row, including every row since BUG-273 landed. BUG-273's "per-request rows drop the cache-write split" section was not implemented, and this ticket takes it over. Likely cause, not yet confirmed: the framework's `usage.js` lands the split **flat** on the record (`ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens` beside `cache_creation_input_tokens`, REQ-216), while 1stcontact's `countersOf` (`spend-core.ts` ~404) reads it only from a **nested** `usage.cache_creation`, so it never finds it. The same reader feeds `requestRowFor` (`apps/control-app/src/spend.ts` ~173).

## Fix

1. **Store the split.** Read both shapes: the raw API's nested `cache_creation` and the framework record's flat keys. Store the split on every request row and price each part at its own rate. (BUG-273's UAT: 900 at 5m + 100 at 1h are stored and priced separately.)
2. **Diagnose with the split.** On the next build, read whether the consultant's history writes are 1h or 5m.
   - If they're 5m: find where the message breakpoints lose the configured lifetime (framework `anthropicMessages` / `cacheTtl.messages`, or the Workers host's backend construction) and fix it. Framework fixes go in a lagrange-framework ticket.
   - If they're 1h and still missed: record the evidence (request ids) and find what changes the prefix.
3. **Concurrent cue and holder requests.** At 00:05:55 a cue turn and the holder's request were sent 0.1 s apart, so both paid a full write. Make the cue (or the holder) wait for the other's first response, so the second one reads the first one's cache.

## Test plan

- UAT: a request whose usage carries the split, in either the nested or the flat shape, stores both parts on its `request_spend` row and is priced per part.
- UAT: the consultant's request carries `ttl: "1h"` on its message (history) breakpoints when `cache_ttl` is `"1h"`.
- UAT: a cue turn and a holder request started together don't both send before the first has a response.
- Evidence: after a builder wait of 5–60 minutes, the consultant's next request reads its previous history from cache (`cache_read` covers the history, not just the system prompt).


## Outcome (implemented 2026-10-25)

### 1. The split is stored — done

Confirmed cause: `countersOf` (`tools/generate/src/cli/ai/spend-core.ts`) read the split only nested under `usage.cache_creation`. The framework's request records carry it flat (`ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens` beside `cache_creation_input_tokens`). It now reads both shapes, nested first, so the split reaches every `request_spend` row (`cache_write_5m_tokens` / `cache_write_1h_tokens`). Each part is priced at its own rate, and any remainder at the backend's requested lifetime, as before. A record with no split, or a split of two zeros, still stores null for both parts. Turn rows and the live meter go through the same reader, so they also price the split part by part now.

### 2. Diagnosis — the lifetime is fine; framework image clearing breaks the cache

Read off this run's junction log, which keeps the framework's flat split and the REQ-218 fingerprints for every request:

- **Every consultant write is 1h** (`ephemeral_1h_input_tokens`, `ephemeral_5m_input_tokens = 0`), and long gaps do hit: request 16→17 was 10.1 min and read the whole 161,638-token history, and 22→23 was 6.7 min and read all of it too.
- **The prefix did not change on our side.** The system (`a39c0ca19189c994`) and tools (`c8838b8d8744b21c`) fingerprints are identical on every request. Request 11's first history breakpoint (`through 65`, `234ce92b8f9021f4`) is request 10's last, and request 15's (`through 73`, `6efe9b8d998b0ecb`) is request 14's.
- **What request 11 and request 15 share:** each follows a `Delegate` result carrying screenshot tiles. Request 11 has the conversation's first image. The framework adds `context_management` and the `context-management-2025-06-27` beta only once a tool has returned a picture (BUG-95 `imageClearing`), so request 11 is the first to carry them. It missed everything, the system prefix included. The talker cue turn 130 ms later got its first image at the same moment and missed the same way. By request 15 more than three image-returning `Delegate` uses had happened. The clear trigger is a fixed 80k tokens, below the consultant's own ~80k system prefix, so clearing is always armed: the oldest results were cleared and the history broke from there, while tools and system still hit.
- The 5-minute pattern is a coincidence of timing: long builder hand-offs are the ones that come back with screenshots.

Request ids: turn `0d4bb2da34b74ba4867c48084fe8b3ed`, requests 11 (`at` 1792973155622) and 15 (1792973554892). Talker turn `1008e2188d17…` (1792973155752). Site session `site-site_99aa2f2e5742a00dc562d7bca14c28bc`.

**The fix is the framework's: lagrange-framework BUG-98 (bug-4560f108).** It asks for no mid-session `context_management` flip and a clear trigger set per backend. No 1stcontact code depends on it. Once it lands, the consultant's trigger goes in `backends.json`.

### 3. Concurrent cue and holder — not implemented, by decision

The two requests at 00:05:55 are different conversations: the holder's turn and the talker's cue round, both triggered by the same builder report. They share only the system prefix. Both missed it because both got their first image at that moment (item 2), not because they raced. Once BUG-98 removes the flip, the system prefix stays warm from the holder's own requests, and serialising the two would save nothing unless the shared prefix were cold. That only happens when a builder runs for over an hour. Making one wait would delay the talker's reply to the client for a rare saving, so it is left out. Reopen it if the split shows concurrent full system writes after BUG-98 lands.

### Test plan as landed

- `tests/test_UAT_FC_BUG-291_cache_write_split.test.ts`: a request record whose usage carries the split, nested or flat, keeps both parts and is priced part by part. A record without one carries none.
- `tests/test_UAT_FC_BUG-291_cache_write_split.workers.test.ts`: through the real route (raw API usage nested → framework record flat → D1), both of the consultant's `request_spend` rows store 900 at 5m and 100 at 1h with the per-part price. Its second request's history breakpoints all carry `ttl: "1h"`.
- Evidence item: covered by the diagnosis above. The history miss is the framework's, tracked as BUG-98.
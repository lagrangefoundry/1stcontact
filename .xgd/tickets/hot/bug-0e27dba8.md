---
uid: bug-0e27dba8
id: BUG-241
type: bug
title: 'Chat: segments run together in one bubble (bold breaks), and the consultant
  names our internals to the client; bc: for out-of-character debugging'
created_by: EPIC-19
created_at: '2026-10-21T01:18:26.515729+00:00'
updated_at: '2026-10-21T13:19:26.806359+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-24cb5d98
  commits:
  - working_sha: 2554af922c07f95a4a5c4d971dfc8bc13db8cf26
    reconcile_sha: null
    main_sha: null
  - working_sha: 86f21d027ea22ac0de99ae0cc49525ab5509d554
    reconcile_sha: null
    main_sha: null
  version: 0.2.564
---

## Symptoms (Bob's Salon 3, 2026-10-21)

1. **Bold rendered as literal asterisks.** A reply ended "**Are you happy to call
   colours and lettering done, or does anything still feel off?**"; a host
   continuation round's reply ("Bob, the layout check flagged …") was appended to
   the same live chat bubble with no separator, giving `…off?**Bob,` — a closing
   `**` between punctuation and a letter is not a closing delimiter in Markdown.
   Same defect earlier in the run: "…about 5 minutes._The opening movement…" (the
   status note and the result joined). The stored transcript keeps them as
   separate turns, so this shows live only.
2. **Internal vocabulary reaches the client.** The consultant told the client
   about "builders", "the layout check", "BUG-237" and "a known false alarm". The
   only rule is the one-line reminder "Do not name framework concepts to your
   client", and the host's own cues to the consultant use those words.

## Decisions (operator, 2026-10-21)

**To the client, the consultant is one person doing all the work, and nothing
behind the curtain is named:**

| instead of | say |
|---|---|
| "a builder is adding…" / "the worker…" | "I'm adding…" |
| "the layout check found…" | "I checked the page on a computer and a phone, and…" |
| ticket ids (BUG-237…), "known false alarm" | nothing. A problem in our tools that doesn't affect the client's site isn't mentioned; one that does is "something on our side isn't working yet; we're fixing it", reported with ReportBug |
| "talker", "host", "round", "stage tool", "delegate" | nothing |
| progress stages | the banner names ("Colours & fonts", "Finishing touches") |

Unchanged: Library labels (IMAGE-5, DOC-7) are client vocabulary (REQ-280);
"The consultant" in third-person status lines (DOC-66, BUG-234).

**Breaking character is allowed, for debugging:**
- A client message beginning **`bc:`** (or `bc` as its first word) is the
  operator talking out of character. The consultant answers that message out of
  character, in operator language — tickets, mechanisms, tools, what it did and
  why — and returns to client vocabulary on the next message without `bc`.
- Once the operator has used `bc` in the conversation, the consultant may itself
  open an out-of-character note with **`bc:`** when it has something the operator
  should know (a tool failing, a suspected product bug, a decision it isn't sure
  the product supports), kept separate from the in-character reply. It never does
  this in a conversation where `bc` hasn't been used.

## What changes

1. **Segments in one bubble are separated.** Whenever consecutive assistant
   segments land in one live chat bubble — continuation rounds (REQ-409/415),
   the status note and the result, talker/worker hand-off — they are joined with
   a paragraph break, so Markdown in one never runs into the next. Live render
   and reload replay agree. (Find whether the join is in our chat.js or the
   vendored webui-chat; if upstream, file it there and fix our side as far as it
   can be.)
2. **Vocabulary rule in the consultant priming:** the table and the `bc` rules
   above replace the one-line `no-framework-vocabulary` reminder (keep a short
   per-turn reminder pointing at it). Update any UAT pinning the old line.
3. **Host cues stop teaching the wrong words.** The host's cues to the consultant
   (layout continuation, REQ-409 continuation, the post-build picture/report,
   refusals it may quote) say "the build you started" / "the page" rather than
   naming builders and the layout check as things to repeat, and each says what
   it is: guidance for the consultant, not words for the client.

## Test plan
- Live chat: two assistant segments in one bubble, the first ending `**…?**` and
  the second starting with a letter, render as bold followed by a new paragraph;
  replay after reload renders the same.
- Priming contains the vocabulary table and both `bc` rules; the old one-liner is
  gone and its pinning UAT updated.
- Host cue texts carry no client-facing instruction to name builders, the layout
  check, ticket ids, or the talker.


## Implementation (as landed)

**1 — Segments.** Investigation showed the framework already separates text
blocks *within* one turn (`BLOCK_SEPARATOR`, `\n\n`, between tool-loop
iterations). The join was at the **round boundary**: a round the host
continues (REQ-409 continuation, REQ-415 layout continuation) is a new turn
streamed into the same live bubble, and nothing separated them. That also
explains "…about 5 minutes._The opening movement…" (the status note ended
round one; the result opened the continuation). Fix: `continuedTurn`
(`host-core.ts`) puts a paragraph break in front of a continued round's first
visible words (none if what was shown already ends with a blank line, one
newline if it ends with one). It is added above the manager, so the stored
transcript, which keeps rounds as separate turns, is unchanged; reload shows
them as separate bubbles, so both render bold correctly. No upstream
(webui-chat) change was needed. Forked worker text is not counted as shown.

**2 — Priming.** New entry `client-vocabulary` in both consultant priming
orders, after `conduct`: "## What your client hears" (one person doing all
the work, host guidance is never words to repeat, the vocabulary table,
"something on our side isn't working yet; we're fixing it" + ReportBug, Library
labels stay client vocabulary) and "## Out of character: bc" (both rules). It
names no DOC id (BUG-65). The per-turn reminder `no-framework-vocabulary` is
replaced by `client-vocabulary`: "One person to the client, naming none of our
machinery: “What your client hears”." (short because the reminder tail has a
600-character budget, REQ-171). The coordinator's own reminder is unchanged.

**3 — Host cues.** `continuation-cue` and `layout-continuation-cue` open with
"guidance for you, not words for them", say "the build you started" / "brief
the fix" instead of naming builders and the layout check, and the layout cue
says that to the client this is "checking the page on a computer and a phone".
The post-build report (`hostLook`) says "what the build you started wrote …
This is guidance for you, not words for your client", "Layout at …", "No
layout faults at either width", and ends with how to say it to the client.
The talker cue answers "from the build's status … as your own work" and says
it is "taking it into the work under way" rather than "passed it on". Other
refusals are covered by the priming rule that host text is guidance, not words
to repeat.

## UATs (`tests/test_UAT_FC_BUG-241_one_voice_and_separate_segments.test.ts`)
- prose after a tool call is a new paragraph live and in the reloaded transcript
  (`**…?**` then `\n\nBob, …`)
- a round the host continues starts a new paragraph in the same bubble
  ("Carrying on from here.\n\nDone: …")
- the consultant's priming carries the table and both `bc` rules; the old line is
  gone from the tail; the new reminder is there
- both continuation cues are marked as guidance and name no builder, layout check,
  talker or ticket id

Updated pins: BUG-235, REQ-415 (report/cue wording), REQ-283 (reminder line).
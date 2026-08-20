---
uid: comment-a86c1b28
id: COMMENT-1407
type: comment
title: Comment on request REQ-18
created_by: xgd
created_at: '2026-08-20T21:37:15.196915+00:00'
updated_at: '2026-08-20T21:38:42.346147+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-72e890ab
  kind: chat_transcript
---

<!-- xgd-turn id="95d56885-f2c5-4230-bff5-c503522defd9-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T21:37:11.582938+00:00" -->
#### You
think this ticket has been superseeded by development that went in a different direction. If so please move it to abandoned.

<!-- xgd-turn id="95d56885-f2c5-4230-bff5-c503522defd9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T21:38:42.243467+00:00" -->
#### Claude
I'll read the ticket first.

Confirmed superseded, and moved to `abandoned`. Original body preserved; a supersession note appended.

**Why it's superseded** — every load-bearing noun in REQ-18's premise was replaced by the framework pivot:

- REQ-18 was "reproduce with the current **module library** → bucket as covered/generalizable/new module → **module backlog** histogram." The pivot (REQ-79/82/84/85/96, DOC-24/DOC-23) deleted the semantic layout modules. Layout is the single typed **L1 substrate**; "module" now means *behavior module* (DOC-25). There's no module catalog whose coverage a histogram could rank, and layout gaps close by adding a typed L1 axis.
- DOC-21's REQ-85 update already re-based the attribution ladder onto L1 axes + behavior-module config, and DOC-26 replaced DOC-14's lifecycle. The single-exemplar reproduction loop is live and worked (REQ-36) — it just doesn't feed a module backlog.
- DOC-27 reframes reproduction as value-space identity (fold + idempotence, push the three qualifiers toward "all") rather than coverage scoring — a different target entirely.
- The corollary that justified the crawl is served elsewhere: REQ-19 (ceiling proof), REQ-21 (import benchmark, `legacy_done`).

Nothing was implemented — no crawler, corpus store, classifier, or histogram; the `test_UAT_FC_REQ-18_*` UATs were never written. So this is a clean abandon, not a rework: a future corpus effort under L1 would share the vocabulary but almost none of the content, and should be scoped fresh.

DOC-15 is left standing as the program-level intent — if a coverage effort is revived, re-specify there first. No code changes, so no commit.

<!-- xgd-chat-end -->
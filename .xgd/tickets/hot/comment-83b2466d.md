---
uid: comment-83b2466d
id: COMMENT-4633
type: comment
title: Comment on request REQ-348
created_by: xgd
created_at: '2026-09-30T19:53:44.520712+00:00'
updated_at: '2026-09-30T20:04:22.281780+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-c79ff229
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a597b793-c753-4f9e-bebf-63aa6548907c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5632446f-2b15-4490-8d25-8f253c44ee78-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T19:52:23.868364+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5632446f-2b15-4490-8d25-8f253c44ee78-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T20:04:22.021145+00:00" -->
#### Claude
Reading the ticket turned up a `kb/` directory, which looks like the knowledge base the ticket means. I'm checking how its documents are laid out and indexed.

Found the delegation tool's result vocabulary. Now finding its source so the document uses the exact tool and field names.

Created DOC-63. Now rebuilding the system KB so I can confirm it's exported and indexed.

The document exports into `kb/system/DOC-63.md`. Last step: recording the outcome on REQ-348 without touching its existing body.

The document is written and included in the system knowledge base's exported files, but it isn't searchable by the builder AI yet: the search index needs rebuilding with a Cloudflare credential this session doesn't have.

**What was built.** Documents in the system knowledge base (`kb/system/`) come from doc tickets tagged `doc_kind: system_kb`. So the deliverable is **DOC-63**, *"Briefing a delegated builder — what works and what breaks"*, filed under EPIC-20. Since it's a ticket and no code changed, there's no free-coding commit, branch or UATs.

**How I shaped the seed:**
- It's written for the builder AI as it writes a brief for a worker session. It opens with the brief shape that worked: one phase, exact values the worker must not recompute, schema lines quoted, one single-clause check, and trust the host's record of changes over the worker's summary. Each rule is then explained.
- It uses the delegation tool's actual field names, including `account`, the field that carries the host's record of what changed.
- It includes the ticket's later revisions: "one job" became "one phase" (if a brief says "then", it's probably two delegations), and checks draw on the same budget as the work. The tool now rejects a check entry that bundles several checks, but five separate checks still cost as much, so the rule still stands.
- The runs are kept as a dated log at the end, so the document can keep growing the way the ticket asked. New runs go in the log, and a rule is revised in place when a run contradicts it.
- The ticket calls the false-capability-denial run "Run 5" in one place and "Run 6" in another. I used Run 6 throughout. No Run 5 is described anywhere.

**Checked:** `1c kb export` writes `kb/system/DOC-63.md` with the right tag and content. I added an Outcome section at the end of REQ-348 and left the existing body as it was. The ticket stays at `draft`; changing its status is your call.

**To finish:** with `CLOUDFLARE_API_TOKEN` set, run `1c kb build` (or `bin/kb-release`). That makes DOC-63 searchable. The build also reported that `REF-l1`, a knowledge-base page generated from the code, is out of date; the same run regenerates it.

<!-- xgd-chat-end -->
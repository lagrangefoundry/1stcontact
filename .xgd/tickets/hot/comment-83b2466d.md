---
uid: comment-83b2466d
id: COMMENT-4633
type: comment
title: Comment on request REQ-348
created_by: xgd
created_at: '2026-09-30T19:53:44.520712+00:00'
updated_at: '2026-09-30T20:31:52.916243+00:00'
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

<!-- xgd-turn id="ed9b2f57-08bd-4cc0-a179-e64d788fc160-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T20:29:47.497578+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="ed9b2f57-08bd-4cc0-a179-e64d788fc160-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T20:30:43.635738+00:00" -->
#### Claude
Right now there's nothing to commit, so to complete free-coding I'll add a UAT proving the guide ships in the system KB, then land it through the branch/commit/merge path. First, checking how existing tests cover KB membership.

I stopped before writing any code. The only UAT I could write here would fail everywhere except `xgd-working`, so I'd like your call before committing one.

**Why there's nothing to free-code yet.** All the ticket delivered is DOC-63, a knowledge-base doc ticket, and documentation is exempt from free-coding. To move REQ-348 to `free_coded`, the gate needs at least one commit on `xgd-working` that carries a version bump. That means some code or a test.

**The obvious UAT, and why it breaks.** The natural test runs the corpus export against the real ticket store and asserts the guide is in the system KB. There's precedent: REQ-164 already has a test against the real store. But doc tickets don't reach `main`. DOC-63 isn't there, and neither is DOC-51 or DOC-60. Nothing moves ticket-only commits to `main` any more (known gap 7 in the branch-topology doc). Reconcile, regression and `test_fix` all run on branches cut from `main`, so this UAT would fail on every one of them. The fix loop would then try to "repair" it: it would either loop until reconcile fails outright, or it would delete the test. The REQ-164 test gets away with it because it only asserts the KB has more than zero members, and `main` already has older docs.

**Options:**
1. **Leave it as a doc-only delivery (my recommendation).** DOC-63 is done. REQ-348 stays out of the free-coded pipeline and you set whatever status you like. Nothing fragile gets committed.
2. **Commit the UAT anyway,** matching the doc by title rather than ID. I'd write the `main` gap into the ticket body. Expect it to fail in reconcile until doc tickets can reach `main`.
3. **Make the guide a file in the repo** and have the KB export pick it up, the way the `REF-*` pages are generated. That's robust on `main` and properly testable, but it's a real design change to how the KB is sourced — more than this ticket asked for.

Which would you like? If it's 2 or 3, I'll cut the branch and take it through commit, merge and `free_coded`, with tests in the foreground.

<!-- xgd-turn id="1e1cac32-159b-4de6-aad9-05bd1832eea8-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T20:31:52.840182+00:00" -->
#### You
Sorry that's a canned prompt - have you finished the work? If so move the ticket to legacy done

<!-- xgd-chat-end -->
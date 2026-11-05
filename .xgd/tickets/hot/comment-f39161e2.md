---
uid: comment-f39161e2
id: COMMENT-3040
type: comment
title: Comment on request REQ-268
created_by: xgd
created_at: '2026-09-17T23:06:08.757708+00:00'
updated_at: '2026-09-17T23:59:26.001232+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-c8c83140
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "44459ed2-4a97-4baa-85a2-c178156535b2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="96333053-50b5-492a-bd44-44261d6684da-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T23:04:45.799716+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="96333053-50b5-492a-bd44-44261d6684da-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T23:37:00.020835+00:00" -->
#### Claude
Now let me look at addContact, acceptances, grants, and control-app's lead.ts capture path.

Now acceptances.ts and grants.ts write paths, plus the baseline schema for these tables.

Now the baseline schema for the four tables.

No blocking questions — DOC-54 §2 settles the shape and the ticket pins the behaviour. Two decisions I'll make and record rather than ask about: the marker's run id rides on `Scope` (presence *is* synthetic context, so a marked row can never exist without a run id), and collection tidies the now-parentless `accounts` row addContact mints alongside each contact. Starting now.

Now the migration.

Now the marker module.

Now the reserved field name in `fields.ts`.

Now `Scope` and the structural predicate.

Now `people.ts` — the five reads plus `addContact`.

Now I'll apply the people.ts edits.

Now derivation in `events.ts`, `acceptances.ts`, `grants.ts`.

Now the child *reads* — `eventsOf`, `provenanceOf`, `acceptancesOf`.

Now the collection module.

Now wire the sweep into the cron.

Now the seam: `captureLead` accepting a run id, and `public-site` verifying the marker.

Now update the test harness's migration list and `atHead` marker.

Now typecheck before writing UATs.

Now run the suite.

REQ-267 landed an overlapping gutter on `xgd-working` while I was building — columns, a `realOnly` read handle, and a reserved-address marker for inbound mail. Its own body says it owns *"the inbound carrier, not the marker primitive"*. Let me merge and rework onto it.

Now re-apply the `addContact` marking on top of their `people.ts`.

Now append collection to their `gutter.ts`.

Now update the marker module's header to record the split with REQ-267, then rework the test.

The collision is real and worth pinning: a marked submission at an address a real contact already holds must not attach to them.

Now the full regression sweep on the merged tree.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="689e8079-db28-46be-94de-feb3ffd9cc76-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T23:40:42.227285+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="689e8079-db28-46be-94de-feb3ffd9cc76-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T23:59:25.695275+00:00" -->
#### Claude
Making the instant an argument rather than a default — the framework's own established pattern, per the `intl.ts` precedent the REQ-152 guardrail names.

Now the callers.

Now the REQ-223 closed-list assertion, which must grow with the deliberate fourth reserved field.

All green. Now the ticket body — several behaviours the UATs assert arrived as implementation consequences and need language before the commit.

Fast-forwarded; my commit is the tip. Claiming now, before any ticket auto-commit can land on top.

Done. REQ-268 is landed and at `free_coded`.

**What changed in this session** (the prior one had the implementation built but mid-merge and untested):

- **Reworked onto REQ-267**, which landed the gutter's columns and run registry on `xgd-working` while this was being built. My original `0014_test_gutter.sql` was dropped; what remains is `0016_gutter_collection.sql` — the two indexes collection reads.
- **Fixed two real failures** the merged tree introduced, both caught by the node suite:
  - `marker.ts` read the ambient clock via a `Date.now()` default argument, which violates REQ-152's rule that nothing under `packages/framework/src` does. Rather than carve an exemption into that guardrail, I made `now` a required argument on `signMark`/`verifyMark` — the same shape `intl.ts` already uses, and the reason the guardrail names it as needing no exemption. The Worker with a request supplies the instant.
  - A `Uint8Array<ArrayBufferLike>` typecheck failure against `crypto.subtle`, fixed by copying through the `ArrayLike` constructor rather than asserting the buffer type.
- **Updated REQ-223's closed reserved-field assertion** to include the marker as its fourth member — that assertion existing is what forced the new machine artefact to be declared rather than silently stored in a contact's provenance.
- **Extended the ticket body** to cover behaviour the UATs assert that arrived as implementation consequences: the run-scoped find-or-create lookup and its loud refusal on address collision, the unchanged frozen acknowledgement, the unconfigured-deployment case, the parentless-account collection, the run-id-must-be-minted guard, and where the marker module lives and why it takes its clock as an argument.

**Test results, run in the foreground:**
- `workers` project: 124 files / 1113 tests, all passing.
- `node` project: 3 failures remain — `bug32-webui-scope-rebrand`, `req51-object-grouped-report`, `test_UAT_FC_BUG-67_backend_settings`. I confirmed all three fail identically on the `xgd-working` baseline, so they are pre-existing and not from this work. The two that *were* mine are now green.

Commit `7b68d0294a` (version `0.2.244`), fast-forwarded onto `xgd-working`, `story_points: 8`, branch cleaned. The ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->
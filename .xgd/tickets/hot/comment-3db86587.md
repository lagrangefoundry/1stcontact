---
uid: comment-3db86587
id: COMMENT-2903
type: comment
title: Comment on request REQ-242
created_by: xgd
created_at: '2026-09-13T22:11:26.790709+00:00'
updated_at: '2026-09-13T23:07:11.831929+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-921ba107
  kind: chat_transcript
---

<!-- xgd-turn id="6b5492b2-d2b0-4c3f-8657-197fabb369cf-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:10:48.613400+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6b5492b2-d2b0-4c3f-8657-197fabb369cf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T22:16:17.016797+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

I've read REQ-242, its dependency REQ-240, and the code it touches (`lead.ts`, `events.ts`, `contact-events.js`, `terms.ts`, `contact-form/meta.ts`, the module validators and the publish path). One blocking question, then a set of decisions I'll take myself unless you object.

## Blocking: REQ-240 does not exist yet

REQ-242 declares `depends_on: request-a4186018` (REQ-240), and REQ-240 is at `draft` with no commits. I verified against the code — there is **no acceptance concept anywhere**:

- no key registry module (REQ-240 AC1)
- no state table (only migrations `0001`–`0003`; nothing acceptance-shaped)
- no service write function (REQ-240 AC7)
- no acceptance-definition ticket lookup (REQ-240 AC8)

The nearest thing is `terms.ts`'s hardcoded `users.tos_version` / `tos_accepted_at` pair, which REQ-240 §1 already names as the thing being generalised.

REQ-242 §4 is *"the submission writes acceptance state and acceptance events through the service ([[REQ-240]])"*. Without the service there is nothing for the form to call — ACs 1, 2, 3 and 5 are all "the service was called and the state moved". So:

**(a)** I implement REQ-240 here as well, committed against REQ-240 (FREE-CODING.md permits implementing another ticket from this session when explicitly asked, and flags it as unusual), then REQ-242 on top.
**(b)** You run REQ-240 in its own session first; I pick REQ-242 up after. ← **my recommendation** — REQ-240 is a substantial ticket in its own right (registry, migration, service, ticket-backed definitions, 8 ACs), and it is the foundation for REQ-245 and probably REQ-244 too, so it deserves its own scope and its own reconciliation.
**(c)** I build the minimum slice of REQ-240 here, against REQ-242. I'd advise against this: it pre-empts REQ-240's design decisions (the three types, the ticket-uid reference, the indexed query) while leaving a half-registry that REQ-240 then has to unpick.

## Decisions I'll take myself (tell me if any is wrong)

1. **Checkbox → key mapping.** A new `acceptance` entry on the `fields` itemSchema: `{ type: 'enum', required: false, values: <type-2 and type-3 keys only> }`. Enum-with-values means a type-1 key is *structurally unauthorable*, so AC6 falls out of the contract rather than out of a runtime check — which is BUG-86's reasoning as §3 asks for.

2. **Implied acceptances.** `accepts: { type: 'list', itemSchema: { key: enum(...), wording: { type: 'string', required: true } } }`. The declarative validator already refuses a missing required item field, but its message names the path (`accepts[1].wording`) and AC4 wants the **key** named — so a bespoke message in the contact-form validation path.

3. **Where AC4's refusal lands.** `validateBehaviorInstance` (framework), which `assertBehaviorInstance` calls from `editModuleAdd`/`editModuleConfigure` in `tools/generate/src/cli/edit.ts`. A config that cannot be written cannot be published.

   ⚠️ **Worth flagging**: `validateSite` — the actual publish gate in `publishSite` — does **not** run module-config validation at all today. `validateModuleContent` and `validateBehaviorSlots` are called only from tests. So "the form does not publish" holds via the write path, but a config that reached the store some other way would publish unchecked. Closing that is a cross-cutting change affecting every module and I'd keep it out of this ticket unless you say otherwise.

4. **AC5 idempotency** (second submission does not double-record) is a property of REQ-240's service — grant-when-already-granted writes no row and no event. REQ-242 just calls it, and pins the behaviour at the form level.

5. **AC7's deletion** — `consent[]` comes out of `provenanceOfSubmission` entirely, per CLAUDE.md's no-legacy rule; the `contact-events.js` doc comment on `FORM_SUBMITTED` gets its consent sentence corrected in the same commit.

Which of (a)/(b)/(c) for REQ-240?

<!-- xgd-turn id="18c534e2-b4a7-42c4-8ed7-6b30fed7ec2e-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:37:15.664168+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="18c534e2-b4a7-42c4-8ed7-6b30fed7ec2e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T23:07:11.739943+00:00" -->
#### Claude
REQ-240 has landed since (status `ready_to_reconcile`, commit `2272ca73`) — my blocking question is answered. Reading the full ticket bodies and REQ-240's implementation.

Everything I need is in hand. Starting the free-coding flow.

Now cutting the branch.

Now the `contact-form` contract additions.

Now `lead.ts` — the core of the change.

Now the config readers and the definition lookup.

Now `provenanceOfSubmission` — replacing the `consent[]` blob.

Now the skip report and the wiring into `captureLead`.

Now the `contact-events.js` doc comment correction, and the test fixture.

Now updating the two existing tests that assert the deleted `consent[]`.

Now writing the workers UAT file.

Now the contract-level UAT file.

All 5 workers UATs pass. Now the regression scope — the touched areas.

Typechecks clean. Now the full suite, since `isMissing` is framework-wide.

While that runs, updating the ticket body with the decisions taken.

Pre-existing on `xgd-working` — not from my diff. Now updating the two suites that pin the exact config key list.

Full suite: 3924 passed, 2 failed — both reproduced on `xgd-working` beforehand. Reviewing the diff before committing.

Now the merge-back: lock, merge by hand, then mark `free_coded`.

Merged cleanly. Now the `free_coded` gate and cleanup.

REQ-242 is done and landed on `xgd-working` — `free_coded`, commit `250e1fef`, version `0.2.187`, story points 5.

**Your blocking question from last session resolved itself**: REQ-240 landed in the meantime (`2272ca73`, now `ready_to_reconcile`), so I built REQ-242 on top of the real acceptance service rather than pre-empting it.

## What I built

**Two config settings, one closed key set.** `fields[].acceptance` names a checkbox; `accepts: [{key, wording}]` declares what the press itself asserts. Both are enums over `newsletter`/`beta_requested`/`whitepapers` — every document key omitted — so AC6's refusal is the contract's, not a runtime check.

**The `consent[]` blob is gone, and nothing is lost.** A named box writes state + a granted/withdrawn event carrying its label. An *unnamed* box becomes an ordinary answer in `fields`, recorded for every declared box ticked or not (`'yes'` / `''`) — so the one thing the blob was right about ("they were asked and said no") survives its deletion.

## Decisions worth flagging

- **Two framework additions came out of AC4.** `BehaviorConfigSpec.itemKey` (opt-in, per list) so the refusal reads `accepts[newsletter].wording` rather than `accepts[1].wording`. And **a whitespace-only string now counts as absent in behaviour config**, where only `''` did — `'   '` passing a contract every consumer then has to trim and skip is the same silent-acceptance shape this ticket is about. That one applies to every module's config, deliberately.
- **The L2 preset now emits the implied wording above the submit control**, because §2's claim is conditional — "only true if the page said so beside the button" — and a preset that stored the sentence without rendering it would produce, from config alone, a form recording a consent nobody was shown.
- **AC4's "does not publish" holds via the write path only.** `validateBehaviorInstance` refuses it in `1c module add`/`set`, and a config that cannot be written cannot be published. `validateSite` — the actual publish gate — does not validate module config for *any* module today; widening it could refuse sites that currently publish, so I left that pre-existing gap alone and covered its one consequence with a read-side skip. This is recorded as §6.7 of the ticket body.
- `acceptance` is read only on a `checkbox`; a request key is recorded on every submission (no state to dedupe); an unticked box on a non-revocable key records nothing.

## Tests

13 new UATs across two files (`test_UAT_FC_REQ-242_*`), one per AC plus the registry-seam subset check. Full suite: **3924 passed, 2 failed** — `bug32-webui-scope-rebrand` and `BUG-67 backend_settings`, both of which I reproduced failing identically on `xgd-working` before my commit. I updated four existing tests whose claims this change moved (the two `consent[]` assertions and the two that pin contact-form's exact config key list); BUG-78's wording claim got *sharper* — the published revision's box names no acceptance, so an acceptance under the draft's sentence could only have come from the draft.

Ticket body now carries a §6 recording all of the above. It's parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->
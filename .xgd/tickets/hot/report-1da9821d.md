---
uid: report-1da9821d
id: REPORT-10883
type: report
title: 'Report: fix_plan for story-7d255580'
created_by: xgd
created_at: '2026-11-04T17:43:54.940868+00:00'
updated_at: '2026-11-04T17:55:31.844238+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-7d255580
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - tests/test_reconciliation_outgoing_messages.workers.test.ts::test_UAT_AC2281_message_body_reaches_the_provider_as_html
    - tests/test_UAT_FC_REQ-196_mail.workers.test.ts::test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id
    dependency_tests:
    - test_UAT_FC_REQ-196_
    - test_UAT_AC2275_
    - test_UAT_AC2276_
    - test_UAT_AC2277_
    - test_UAT_AC2278_
    - test_UAT_AC2286_
    hypothesis: 'resendMailer at apps/control-app/src/mail.ts:200 submits the body
      as Resend text (REQ-196 shape) while REQ-197, the later in-scope intent, decided
      the body is HTML in one part; the adapter must send html: message.body and the
      FC_REQ-196 exact-payload assertion pinning text is superseded.'
    instructions: 'Root cause confirmed by the iteration-1 builder: apps/control-app/src/mail.ts:200
      sends `text: message.body`, so the provider never receives `html` and AC-2281
      fails. REQ-197 (request-704fe21e.md:123, later than REQ-196) decides "The body
      is HTML, and it is one part", and REQ-196 itself prescribed this as one line
      in the adapter. code_frozen is lifted for mail.ts in this batch: change the
      Resend payload to carry the body as `html` (one part only; do NOT add a derived
      text part or port textFrom, because multipart is REQ-205 and out of scope),
      and correct the Message.body doc comment (~lines 52-53) that says the adapter
      sends it as text. The exact-shape assertion in test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id
      expects `text: ...`; REQ-197 supersedes that, so rewrite only that field expectation
      to `html:`, keeping the rest of the exact payload/endpoint/bearer/id checks.
      All mail.ts consumer tests (FC_REQ-196 suite, AC2275-2278, AC2286) must stay
      green.'
    test_scope: test_UAT_AC2281_ or test_UAT_FC_REQ-196_ or test_UAT_AC2275_ or test_UAT_AC2276_
      or test_UAT_AC2277_ or test_UAT_AC2278_ or test_UAT_AC2286_
    ladder:
      rung1: 'Decided here: REQ-197 (later, in scope) says the body is HTML and sent
        in one part, superseding the REQ-196 plain-text adapter shape, which REQ-196
        anticipated as a one-line adapter change.'
      rung2: 'Reference mail.ts:386-392 sends html: message.body (plus a REQ-205 derived
        text part that is out of scope), consistent with rung 1 on the html field.'
      rung3: 'Not needed; the AC-2281 test stands and the code changes, while the
        FC_REQ-196 text: assertion is superseded under rung 1.'
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-197 (later intent in scope) requires the message body to
        reach the provider as HTML in one part; mail.ts:200 sends it as text, so the
        settled AC-2281 test is right and the adapter is wrong. REQ-196 itself named
        this exact one-line adapter change.
      files:
      - apps/control-app/src/mail.ts
      tip_evidence:
      - file: apps/control-app/src/mail.ts
        lines: 380-392
      trust_boundary: false
  batches_pending: false
---

# Fix Plan — Iteration 2

## Hypothesis
`resendMailer` in apps/control-app/src/mail.ts:200 submits the body as Resend's `text` field (REQ-196's original plain-text shape), but REQ-197 — the later intent in scope — decided "The body is HTML, and it is one part", so the adapter must submit `html: message.body`; the code is wrong, the test is right, and only a `code_frozen` override lets the builder make the one-line change.

## Analysis
- Iteration 1 (report-18b12df9) batched the single failing test without an override. The builder (report-df962c87) made no edits and returned `blocked_by: code_frozen` with a concrete diagnosis: `payload.html` is undefined because mail.ts:200 sends `text: message.body`. I verified this in the working tree (`grep` shows `text: message.body` at line 200, no `html:` anywhere in the file).
- Intents in scope (bundle-5052a63c): REQ-190..198 + BUG-55. REQ-196 defined the port and the plain-text adapter, and itself anticipated the change: "When REQ-197 writes one that wants markup it is one field here and one line in the adapter." REQ-197 (later) records, in its Decisions section (request-704fe21e.md:123-126): "**The body is HTML, and it is one part.** … a button does not exist in plain text." Story-7d255580's Reconciliation Decisions already flag this as a CODE-ISSUE. Rung 1 decides: the code changes.
- REQ-197 also says "no HTML/text multipart decision; the body is one thing" and the story lists "multipart HTML+text" as out of scope. The reference state (reconcile-src-BUNDLE-37:apps/control-app/src/mail.ts:386-392) sends `html: message.body` plus a derived `text` part, but that second part comes from REQ-205, which is NOT in scope. The builder must therefore send the body as `html` only and must not port `textFrom`/REQ-205 multipart into this run.
- **Conflict in the same surface:** `tests/test_UAT_FC_REQ-196_mail.workers.test.ts:44` (`test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id`) asserts the exact JSON payload with `toEqual({... text: 'Alice — your builder is ready.'})`. That pins REQ-196's superseded plain-text shape and will break when the adapter changes. By rung 1 (REQ-197 supersedes REQ-196 on the body format), that assertion is rewritten to expect `html:` in place of `text:` (the rest of the exact shape — from/to/subject, endpoint, bearer, id read-back — stays). Both tests are in ONE batch so the fix and the contradicting assertion are settled together.
- The doc comment on `Message.body` (mail.ts ~lines 52-53, "the Resend adapter sends it as `text`") must be corrected along with the code so that the file does not contradict itself.
- No isolation/contamination signal. The failure is deterministic and reproduces when the test runs alone (the builder ran it with `-t`).
- Only two test files touch mail.ts: tests/test_UAT_FC_REQ-196_mail.workers.test.ts and tests/test_reconciliation_outgoing_messages.workers.test.ts. Their tests are the dependency set.

## Spec Changes Made
None. AC-2281 already encodes REQ-197's intent. The FC_REQ-196 test's payload assertion will be updated by the builder under rung 1 (the later intent supersedes it on the body-format surface).

## Weak Evidence Flags (preventative — best effort)
- tests/test_reconciliation_outgoing_messages.workers.test.ts::test_UAT_AC2275_credentialed_send_submits_once_and_returns_the_provider_id — weak-observation — asserts from/to/subject but not the body field, so it could not catch the html/text bug; it should also assert that `payload.html` carries the body.
- tests/test_UAT_FC_REQ-196_mail.workers.test.ts::test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id — overlaps with AC2275 (same send against a double, same assertions) — consider consolidating once the body field is corrected.

## Batches
One batch: the failing AC-2281 test, plus the REQ-196 adapter-shape test that contradicts it, plus every other test that exercises mail.ts (AC2275-2278, AC2286, the FC_REQ-196 suite). The change is one line in one production file plus one assertion, and splitting would separate the contradiction.

## Mode overrides (REQ-892)
- Batch 0: `code_frozen` lifted for `apps/control-app/src/mail.ts` only. Rung 1: REQ-197 (later than REQ-196, both in scope) decides that the body is HTML and sent in one part, and REQ-196 itself prescribed the "one line in the adapter" change. The adapter's `text: message.body` contradicts it. The tests for consumers of mail.ts (`test_UAT_FC_REQ-196_` plus AC2275, AC2276, AC2277, AC2278 and AC2286) are dependency tests. trust_boundary false: the change only moves which provider field carries an already-rendered body, and no escaping, sanitising or marking logic changes.

## Resolution ladder (REQ-938)
- Batch 0 — decided at **rung 1**. REQ-197 ("The body is HTML, and it is one part", request-704fe21e.md:123) supersedes REQ-196's plain-text adapter shape, and REQ-196 anticipated exactly this one-line adapter change. Rung 2 agrees on the html field: the reference sends `html: message.body` at mail.ts:391. Its extra derived `text` part comes from REQ-205, which is out of scope, so it is not adopted. Rung 3 is not needed. AC-2281's test stands, and the FC_REQ-196 test's `text:` payload assertion is the superseded one.
---
uid: report-9179b6e2
id: REPORT-11394
type: report
title: 'Reconciliation Review: commits (BUNDLE-40)'
created_by: xgd
created_at: '2026-11-08T09:59:19.666383+00:00'
updated_at: '2026-11-08T09:59:19.666383+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-c0301347
  anchor_uid: bundle-c0301347
  overrides_audited: 2
  trust_boundary_overrides: 0
  failing_items:
  - 2
  - 3
  - 4
  - 5
  - 6
  supersession_gaps:
  - ac: AC-1492
    ac_uid: acceptance_criterion-535253fa
    owning_story: story-e07c589b (STORY-128)
    authored_by: request-13a5e206 (REQ-162)
    superseded_by_uid: request-68718201 (REQ-208)
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-c0301347
**Stories Reviewed**: 7 (story-7d255580, story-58b2cec4, story-a58a0974, story-3cf3d57b, story-4cabde9a, story-39c992d3, story-d2bee21c)

## Behavior Inventory

About 45 behaviours across six features: mail text part and sender, looking surface on the Worker plus its budget, priming as configuration, image describer session, image generation, and drawing geometry.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Derived text part, href invariant, refusal of a body with no derivable text | Covered | story-7d255580 | AC-2369, AC-2370, AC-2281 |
| 2 | Per-template from, MAIL_FROM fallback with display name, resolved once, modal read-only, route ignores POSTed from | Covered | story-7d255580 | AC-2371, AC-2279, AC-2286; minor evidence gaps below |
| 3 | Looking surface per business: private bucket, /preview renderer, own origin, adoption | Partial | story-58b2cec4 | AC-2372: capture_site adoption on the Worker is never exercised |
| 4 | No browser or no private bucket: session still opens, no looking ops | Partial (claim false in code) | story-58b2cec4 | AC-2024: no BLOBS means the session never opens (router.ts:216 calls ticketStoreFor, which throws at tickets.ts:562); the UAT hides this by injecting deps.tickets |
| 5 | 40-look per-session budget at the lease | Covered | story-58b2cec4 | AC-2373; CLI-unaffected and no-ceiling-in-overview claims unasserted |
| 6 | Content blocks reach the model as images through the Toolbox on both hosts | Partial | story-58b2cec4 | AC-2031: base64 absent from text, audit, gating and the Worker host are unasserted |
| 7 | Priming and reminders read from priming.json, PrimingConfigError at start-up | Partial | story-a58a0974 | AC-2374: 'placeholder left as written' untested; refusal not shown through openSession; prose check is source inspection |
| 8 | One trailing cache boundary, entry drop, 60k budget, empty product tier | Covered | story-a58a0974 | AC-2375, AC-2376, AC-2107, AC-2109 |
| 9 | Priming names no document ids (BUG-65) | Partial | story-3cf3d57b | AC-2377 omits 'renaming or retitling breaks nothing'; STORY-149 has no current scoped quality run |
| 10 | Image describer is a tool-less, unprimed session per item, closed afterwards; distinct registration | Partial | story-4cabde9a | AC-2097: 'closed afterwards', media type and model id would survive a broken implementation; AC-2378 is good |
| 11 | create_image, optional key, no key means no tool, aiConfigured untouched, deploy hook | Covered | story-39c992d3 | AC-2381, AC-2382, AC-2392 |
| 12 | Model never learns the vendor | Partial (code contradicts intent) | story-39c992d3 | Material body records 'Provider: openai / Model: ...' (ai-imagegen toolbox.js:757-758) and is indexed into the session KB (imagegen.ts:260) |
| 13 | Material record complete from first visible moment; scoped store; origin=generated; cap of 10 | Partial | story-39c992d3 | AC-2383 only reads after generation finishes; AC-2391 tool-result channel unasserted |
| 14 | Assistant does not generate what the client already has and says what it made, as a draft | Uncovered | — | Intent 'How it behaves'; no AC and no Reconciliation Decision |
| 15 | Anchor vocabulary, measure_drawing, relate, solve, assert, browserless refusal, authoring rules | Partial | story-d2bee21c | AC-2393, AC-2403 claims false at the model's operations; AC-2397, AC-2401, AC-2402 proven only on hand-written fixtures |
| 16 | Measurement caps (200 nodes / 120 glyphs) with truncation warnings; unreadable nodes omitted | Uncovered | — | measure-svg.ts:117-120, 282, 341, 349; contradicts AC-2398 'never simply missing' |
| 17 | Measurer shares the fidelity surface's browser source (host-core.ts:582, 595) | Uncovered | — | In Technical Context only |

## Ungrounded Stories

| Story | Claim | Issue |
|-------|-------|-------|
| story-58b2cec4 | AC-2024: a deployment without the private bucket still opens a session | Intent says this (REQ-206), but the code refuses earlier on the transcript store. The story absorbs the claim without flagging the divergence, and the UAT injects a ticket store to pass |
| story-d2bee21c | AC-2393: a misspelt anchor is refused with a message listing the valid names | True only for the library call anchorValue. relate, solve and assert return the generic message at measure-core.ts:129-135, because parseAnchorRef returns null for an unknown name (anchors.ts:116) |
| story-d2bee21c | AC-2403: an unevaluable recorded relation is reported with a why | parseRelation (anchors.ts:331) silently drops a relation-shaped comment with a misspelt anchor |

## Supersession (Step 4c)

AC-1492 (acceptance_criterion-535253fa) is owned by story-e07c589b (STORY-128) and was authored by REQ-162 (request-13a5e206). It closes 'where it came from' to uploaded, captured, fetched or taken from a site. REQ-208 (request-68718201) adds `origin: generated` without ambiguity (tickets.ts:89). AC-1492 is still active, so it should be set to `status: superseded` with `superseded_by_uid: request-68718201`. A replacement AC including `generated` can sit under story-39c992d3. Every other check is clean: AC-2337 is already superseded by REQ-205 and replaced by AC-2409, and AC-2107/AC-2109 were edited in place with a recorded decision.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Outgoing Mail (upgrade) | story-7d255580 | ✓ (AC-2369, 2370, 2371 added; 2279, 2281, 2282, 2286 modified) |
| 2. Looking surface (upgrade) | story-58b2cec4 | ✓ (AC-2372, 2373 added; 2024, 2031 modified) |
| 3. Session priming (upgrade) | story-a58a0974, story-3cf3d57b | ✓ (AC-2374 to 2377 added; 2107, 2109 modified) |
| 4. Material description (upgrade) | story-4cabde9a | ✓ (AC-2378 added; 2097 modified) |
| 5. Generated pictures (feature) | story-39c992d3 | ✓ (AC-2380 to 2392) |
| 6. Drawing geometry (feature) | story-d2bee21c | ✓ (AC-2393 to 2408) |

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

- **report-483291fe** (code_frozen, imagegen.ts, rung 1) passes all items:
  - Item 1: only the named file was touched.
  - Item 2: regression report-7fec4747 shows 224 passed, 0 failed, after the change.
  - Item 3: it is consistent with REQ-208 and AC-2380.
  - Item 4: it is composed in imageSurface() as instructed.
  - Item 5: the final diff records trust_boundary_touched false and mismatch false.
  - Item 6: the behaviour added is what REQ-208 demands.
  - Notes, not findings:
    - Attempt 0's regex-escaping version matched the trust-boundary patterns, and attempt 1 was rewritten with replaceIgnoringCase. That is behaviour-equivalent and touches no untrusted-content marking, but the rewrite changed the pattern result rather than the substance.
    - The scrub covers tool errors only. The vendor still reaches the model through the material body (gap 5a below), which the override's scope did not name.
- **report-7519d965** (code_frozen, ai.ts, rung 2) passes all items.
  - The in-loop conformance (report-7680e43e) failed items 4 and 6 on the test edits. Commit 6fcf97c2dc then reverted the out-of-scope REQ-146 edit, and the planner's later ruling (report-625f7bf5) dropped the REQ-146 test from validation.
  - That REQ-146 failure was already on main: `error: string` sits at main router.ts:1051.
  - The remaining `systemText` helper in tests/support/scripted-model-client.ts is not unused, as the conformance check claimed. The in-scope REQ-207 UAT imports it (tests/test_UAT_FC_REQ-207_image_describer_session.test.ts:35) and has done so since its source commit 9b2511cc93, and the helper never came across in the cherry-pick. It is the minimal test-support addition an in-scope test needs, outside code_frozen's scope (item 1).
  - The net production diff is ai.ts only, rung-2 consistent and demanded by AC-2097 and AC-2378.
  - Note: REQ-146's test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed still fails on both main and this branch. That is a pre-existing false positive for a different owner, raised separately.

## Judgment Calls

- Item 1 (mail) passes. Its minor evidence gaps are included in the gap list below as low-cost hardening, not as the cause of the FAIL.
- Fakes at external boundaries are accepted throughout: scripted model client, fake browser via the launch seam, Resend fetch, OpenAI HTTP, and the wrangler stub.
- Reading wrangler.toml and priming.json as data the product loads is accepted where it is paired with an assertion on assembled or sent output.
- Browser-backed REQ-209 cases skip when no Chromium can launch. The scoped run (report-7fec4747) shows they executed.
- REQ-207's web search is out of scope (step 1 only) and correctly unclaimed.
- Dropping @anthropic-ai/sdk is a packaging fact in Technical Context, not an AC. Accepted.

## Gap list (for fix_reconciliation_review)

1. **Item 1, story-7d255580, minor**
   - (a) AC-2371 'not token-substituted' has no test. Send an invite whose template `from` contains a literal `{{cta_url}}` and assert the sent and recorded from equal the raw string (tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts:310-413).
   - (b) The forged-from route test asserts the record only (line 411). Also assert the delivered message's from via the local capture.
2. **Item 2, story-58b2cec4**
   - (a) AC-2024: either change the code so a Worker without BLOBS still opens a session, or narrow AC-2024. If narrowing, record a Reconciliation Decision flagging the divergence from REQ-206 ('no BLOBS means no chat at all, per REQ-160, so the looking-surface BLOBS check is defence in depth'). Drop the deps.tickets injection at tests/reconciliation-assistant-looking-surface-business.workers.test.ts:481-482, or assert the real outcome.
   - (b) AC-2031 (tests/reconciliation-assistant-looking-surface.test.ts:697-722) needs four assertions: no text block contains the base64, a Toolbox audit record exists for screenshot, a non-picture tool result (list_pages) stays a string, and an invalid argument is refused as text. Add a Worker twin through route().
   - (c) AC-2372: drive capture_site through a turn on the Worker and assert adoption happened, rather than calling plantCapture plus factory.adoptCapture directly (business.workers.test.ts:236,258). Also assert the 'not written up' fallback, and that an outside-address shot goes over the network (log.continued, not log.fulfilled).
   - (d) AC-2373: assert the fidelity declaration and overview contain no ceiling (40, BUDGET or ceiling), and that the Node/CLI host makes 41 looks without a refusal.
3. **Item 3, story-a58a0974 and story-3cf3d57b**
   - (a) AC-2374 'a placeholder with no value is left as written' (roles.ts:213-217) is untested. Add a test, or move the clause to Reconciliation Decisions.
   - (b) AC-2374: add an openSession case where a selected provider is unregistered. Expect a PrimingConfigError naming km-landscape and zero model requests. Today four of the five shapes call lib.rolesFromMapping directly (tests/reconciliation-assistant-session-priming.test.ts:~283-333).
   - (c) AC-2374's 'no prose in source' check greps .ts files (session-priming.test.ts:197-202, 250-256), which is source inspection. Rest the AC on the behavioural assertion that the model receives exactly the declared text, and record 'not a TS constant' as a structural decision.
   - (d) AC-2377 should add BUG-65's 'renaming or retitling a document breaks nothing', with a rebuild that retitles a fixture document. Assert the new title appears, the old one is gone, and priming.json is unchanged (tests/reconciliation-assistant-priming-names-no-documents.test.ts:229-290).
   - (e) AC-2375's 'no separate guard edits a string afterwards' cannot fail. Drop it, or move it to Reconciliation Decisions.
   - (f) Run scoped quality for story-3cf3d57b. Its latest scoped report, report-930875ca from 2026-09-19, ran 0 tests and predates AC-2376 and AC-2377.
4. **Item 4, story-4cabde9a, AC-2097**
   - (a) 'Closed afterwards, including on failure': deleting closeSession from the finally at ai.ts:219 passes every UAT, because each call uses a fresh id (ai.ts:210). Inject observable junctions (e.g. lib.memoryJunctions()) and assert no session remains after a success and after a failure. Otherwise reword the AC.
   - (b) Media type: use a JPEG or WebP second image and assert the block's media_type equals it exactly (tests/reconciliation-material-description-session.workers.test.ts:155-165).
   - (c) Assert description_model equals the model field of the request the fake received (lines 171-178).
5. **Item 5, story-39c992d3**
   - (a) AC-2380 / REQ-208 property 1 ('the model never learns which vendor drew the image') is contradicted by the code. The material body written by the plugin carries 'Provider: <vendor>' and 'Model: <id>' (ai-imagegen toolbox.js:757-758), and imagegen.ts:260 indexes it into the session's knowledge base. Scrub those lines in generatedMaterialStore.create (description_model already records the model), and extend AC-2380's UAT to search knowledge after a generation and assert no vendor or model name. Make the vendor match case-insensitive (tests/reconciliation-consultant-image-generation.workers.test.ts:321), and have a refusal double echo the vendor so vendorless() is exercised beyond the shape path.
   - (b) Uncovered intent: 'the assistant does not generate what the client already has, and says what it made and why, as a draft' (REQ-208 'How it behaves'). Add an AC with evidence, or a Reconciliation Decision stating it is left to model judgement.
   - (c) AC-2391: assert toolResults(client) does not contain the key, and run the image-echo case without the model-call failure so its assertion stands alone (lines 600-619).
   - (d) AC-2383 'from its first visible moment': create without attach, read /api/material through route(), and assert kind, description_status and description_model are already present.
   - (e) Supersede AC-1492, as described under Supersession above.
6. **Item 6, story-d2bee21c**
   - (a) AC-2393: relate, solve and assert must return the list of valid anchor names for a misspelt anchor (measure-core.ts:129-135, anchors.ts:116), asserted through ops.relate (tests/test_reconciliation_measure_drawing.test.ts:445-447). Otherwise narrow the AC.
   - (b) AC-2403: report a relation-shaped comment with a bad anchor, with a why, instead of dropping it in parseRelation (anchors.ts:331, 352-353), and add the misspelt case. Otherwise narrow the AC and record the decision.
   - (c) AC-2401 and AC-2402: add Chromium cases that exercise measureScript's scale, skew and attrs (measure-svg.ts:289-294). Solve under scale(2) and assert relate is about 0 after the write; solve under rotate(10) and on x="1 2 3" and assert the refusals.
   - (d) AC-2397: exercise the production browserMeasurer (measure-core.ts:67-81) against the site's /preview/<slug>/draft/ page, or at minimum use a scripted driver asserting the URL it opens and that it closes. Today the test's own setContent page is used (:337-352).
   - (e) Add an AC and test that measure_drawing shares the fidelity surface's browser source (host-core.ts:582, 595): usable when deps.fidelity is present, refusing when it is absent.
   - (f) Document and test the 200-node and 120-glyph caps with their truncation warnings, plus the omission of unreadable nodes (measure-svg.ts:117-120, 282, 341, 349). Reconcile the latter with AC-2398's 'never simply missing'.
   - (g) AC-2407: read the write_image description from the tool list the model client is given (client.seen[0].tools), not from L1_DECLARATION (:922).

## Verdict

FAIL. Coverage gaps and evidence gaps found:

- Divergences absorbed without a flag:
  - AC-2024: no-bucket session.
  - AC-2380 / REQ-208: the vendor reaches the model through the indexed material body.
  - AC-2393 and AC-2403: refusal and reporting claims false at the operations the model calls.
- Uncovered intent: REQ-208's 'do not regenerate what the client has, report it as a draft'.
- Uncovered code behaviour: measurement caps and omissions, and the shared browser source.
- ACs whose UATs a broken implementation would pass: AC-2031, AC-2372, AC-2373, AC-2374, AC-2097, AC-2383, AC-2391, AC-2401, AC-2402, AC-2397.
- One active AC unambiguously superseded but not marked: AC-1492, superseded by REQ-208.

All six plan items produced stories, and both overrides pass the audit. The fix loop should work from the gap list above.

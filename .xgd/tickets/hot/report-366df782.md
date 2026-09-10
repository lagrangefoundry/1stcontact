---
uid: report-366df782
id: REPORT-3806
type: report
title: 'UAT Coverage: AI Site Assistant: Per-Site Conversations'
created_by: xgd
created_at: '2026-09-10T22:23:43.115788+00:00'
updated_at: '2026-09-10T22:23:43.115788+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-7e4714b7
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: AI Site Assistant: Per-Site Conversations

**Result**: PASS
**AC verdicts**: 23 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-e37a6b4a. Capability capability-7e4714b7 (CAP-90,
`ai_site_assistant`), one story (STORY-103 / story-a58a0974, `story_kind =
upgrade`), 23 active ACs, 28 AC-named UATs across five suites.

**Why this is a PASS, stated up front.** The three violations REPORT-3803 raised
(AC-1317 / AC-1318 / AC-1319 — the knowledge UATs erroring against the shared
`@lagrangefoundry/ai-knowledge` package as installed, one of them because
`host.ts:160` still called a `KnowledgeDocs.open` that upstream had removed) are
closed. So are its two warnings (AC-1057's junction bound, which had no case that
could stand inside a turn; and the AC-1405 local-host leg). The evidence was
re-derived from scratch in this call, not inherited: every one of the 23 ACs was
read against the intent ledger, and every one of the 28 test bodies was read.

**The capability aggregate was stale, and that was the only remaining defect.**
`uat_coverage` on CAP-90 read `fail`, written at 21:47:27. The 23 AC values and
the story value were written *after* it — the last AC at 22:10:56, the story at
22:03:32 — by the fix stage that closed the violations. The aggregate was never
recomputed. It now reads `pass`.

## What was executed, and what was not

| Suite | Result here |
|---|---|
| `reconciliation-assistant-conversation-artifact` | **3/3 pass** (executed) |
| `reconciliation-assistant-conversation-knowledge` | **4/4 pass** (executed) |
| `reconciliation-assistant-conversation` | not runnable — `EPERM: listen 0.0.0.0` |
| `reconciliation-assistant-conversation-continuity.workers` | not runnable — `EPERM: listen 127.0.0.1` |
| `reconciliation-assistant-conversation-deployed.workers` | not runnable — `EPERM: listen 127.0.0.1` |

`npm test -- <files>` was run for all five. The two that need no listening socket
pass; the other three cannot start under this sandbox — `startBuilder` binds a
port and the workerd projects bind a loopback port, and both are refused by the
sandbox, not by the tests. This is an environment limit and not a coverage
finding: the immediately preceding fix call (REPORT-3805) ran all five in an
environment that permitted sockets and recorded **28/28**. The 21 verdicts on
those three suites here are therefore reading-based, corroborated by that
execution record.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 (request-58b6a329) | free_and_reconciled | 2026-08-07 | Builder chat panel: AI session, declared tool surface, per-site sessions. Original `{slug, text}` turn and browser-held site identity | YES (superseded in part) |
| REQ-123 (request-488d874b) | free_and_reconciled | 2026-08-07 | The 1st contact system KB — corpus as a release artefact above tenancy | YES |
| REQ-126 (request-d9407f80) | free_and_reconciled | 2026-08-08 | L1 control surface API: declared schemas, error taxonomy, addressing. Withdrew the per-call path/hint from the refusal the assistant sees | YES |
| REQ-127 (request-22a6521a) | free_and_reconciled | 2026-08-08 | L1 tooling over the control surface. **Withdrew REQ-122's `{slug, text}` turn**, and withdrew its own earlier declared-scope-predicate clause; the binding is located in the session | YES (retiring) |
| REQ-143 (request-18a48d63) | free_and_reconciled | 2026-08-15 | The Cloudflare SiteStore: definitions in D1, bytes in R2 | YES |
| REQ-146 (request-0cdfdc5b) | free_and_reconciled | 2026-08-15 | The AI host moves into workerd; the transcript reconciles with REQ-143 rather than adding a store | YES |
| REQ-149 (request-554ac441) | free_and_reconciled | 2026-08-17 | Publish in the cloud; carries the deploy-secret follow-up that governs the model key | YES |
| BUG-38 (bug-a98fb3b0) | free_and_reconciled | 2026-08-24 | Every turn failed in the cloud. Deletes the per-process registry; resolution moves to account-scoped durable storage | YES (amending AC-1055) |
| BUG-39 (bug-23d1ec27) | bundled → BUNDLE-22 `free_and_reconciled` | 2026-08-24 | The model double must speak the streaming wire protocol the backend consumes | YES |
| REQ-158 / REQ-159 / REQ-160 | draft | 2026-08-28…30 | KB in the Worker, tenant-scoped corpus, session seeding | NO (not yet active) |
| REQ-161 / REQ-163…166 | draft | 2026-08-31 | Library tab, ingestion, corpus export, projected reference, capture-to-ticket | NO (not yet active) |

No intent later than BUG-38/BUG-39 retires any behavior this story claims. The
four draft REQs (158–160, plus the 161–166 group) would *extend* the knowledge
half; none of them is active, and the story body claims none of their behavior.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-103 | REQ-122, REQ-123, REQ-126, REQ-127, REQ-143, REQ-146, REQ-149, BUG-38, BUG-39 | aligned | Every behavior in the body traces to a reconciled intent or to a recorded `## Reconciliation Decisions` entry. The two supersessions (REQ-127 over REQ-122's turn shape; BUG-38 over AC-1055's authority test) are stated in Technical Context and the ACs follow the later intent, not the earlier |
| STORY-103 (intent-silent points) | — | aligned (reconciliation-decided) | Nine points are intent-silent and carry a dated `## Reconciliation Decisions` entry (BUNDLE-20 on 2026-08-31, BUNDLE-21 on 2026-08-31): "stored through the site's store" replacing "stored with the workspace"; the stored form as a separate portability claim; the junction's cost stated inside AC-1057; redaction as an absence at the boundary; the import-graph guard as its own criterion; the deploy-secret guard carried here rather than under publish; the capability answer's local-transport asymmetry (flagged to CAP-85, neither claimed nor denied here); the cross-process turn as its own criterion rather than folded into AC-1055; and the per-origin shape of a refusal. These are decisions, not gaps — not re-opened |

## AC-Level Verdicts

All 23 active, all `pass`. Each is exercised through a real entry point with a
single double at the model (or, in the knowledge suite, a second at the embedding
model, named through the production `LAGRANGE_KM_EMBEDDER` seam).

| AC | Test(s) | Entry point exercised |
|---|---|---|
| AC-1051 | `..._capability_answer_names_the_role_and_readiness_without_a_conversation` | real `GET /api/ai/roles` on a real `startBuilder`; invariance re-checked after a turn really wrote a transcript |
| AC-1052 | `..._opening_answers_with_an_identifier_the_turns_so_far_and_readiness` | real `POST /api/ai/session`, re-opened for identity and replay |
| AC-1053 | `..._naming_a_site_or_omitting_a_value_is_refused_as_malformed` | four malformed bodies posted verbatim; asserts both that the omission is named and that a supplied value is *not* |
| AC-1054 | `..._a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft` | real tool loop → real `editL1Set`; the draft on disk is the evidence, the stream is secondary |
| AC-1055 | `..._an_identifier_is_answered_only_when_it_names_a_site_this_account_holds` + `..._the_streaming_origin_refuses_in_channel_ahead_of_the_completion` | six refusals + a second real workspace for the account-scoped refusal + the one that resolves, on the status-code origin; the streaming origin's in-channel refusal in workerd |
| AC-1056 | `..._each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns` | two live conversations; cross-checks both drafts and both transcripts in both directions |
| AC-1057 | `..._turns_persist_under_the_workspace_and_are_replayed_after_a_restart`, `..._losing_the_host_mid_turn_costs_that_turn_and_not_the_conversation`, `..._turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart` | restart-and-replay on both hosts; store deleted to prove there is no second copy; a stalling model to stand inside a turn and read the archive mid-flight |
| AC-1058 | `..._only_granted_site_operations_are_offered_none_touching_files_or_naming_a_site` | offered set asserted **equal** to the real toolbox projection, not hand-listed; no `slug` on any schema |
| AC-1059 | `..._a_refused_operation_returns_a_named_refusal_into_the_same_turn` | a real `NOT_FOUND` from the real write path, fed back into the same turn; draft byte-identical |
| AC-1060 | `..._a_missing_credential_is_explained_without_losing_the_conversation` | `ANTHROPIC_API_KEY` really removed; history intact and length-checked |
| AC-1061 | `..._a_failure_after_streaming_begins_arrives_in_the_stream_before_one_completion` | the model client throws; assertion is on the framed SSE body and the single terminal `done` |
| AC-1317 | `..._knowledge_is_offered_beside_the_site_operations_and_audited_like_an_edit` | real corpus, real index, real cosine search, real audit sink; composition asserted as an equality; one session identity across both surfaces |
| AC-1318 | `..._the_grant_is_the_read_set_and_names_one_kb_on_both_scope_axes` | expectation **derived from the declaration**, so an upstream change is caught rather than noticed; off-grant search really refused |
| AC-1319 | `..._priming_carries_the_map_then_the_purpose_then_the_manual` | observes `seen[0].system` from a real turn through `nodeDeps` + `knowledgeDeps` — the mirroring defect REPORT-3803 named is gone; body prose asserted absent |
| AC-1320 | `..._an_unbuilt_kb_is_silent_and_an_unopenable_one_is_reported` + `..._the_deployed_host_offers_its_site_operations_and_reports_nothing_absent` | both hosts; the two situations distinguished on the origin's real error output |
| AC-1404 | `..._a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store` | whole turn in workerd against real D1/R2; change read back through a handle the host never saw |
| AC-1405 | `..._a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable` + `..._a_transcript_from_the_deployed_host_replays_on_the_local_host` | both directions; the local leg's fixture is written out literally rather than round-tripped through this host's own writer |
| AC-1406 | `..._the_artifacts_import_graph_carries_no_filesystem_module_or_store` | real import-graph walk, with planted offenders proving the discriminator discriminates and a reached-set check proving the walk left this repo |
| AC-1407 | `..._the_library_travels_in_the_artifact_and_a_missing_one_fails_the_build` | the bundled module really imported and its symbols inspected; the build's refusal exercised through the resolver seam; stage ordering read out of `bin/build` |
| AC-1408 | `..._a_credential_survives_neither_an_error_envelope_nor_a_failing_turns_stream` | a metacharacter-laden key on both paths; a decoy proves the defence is not shape-guessing |
| AC-1409 | `..._no_request_address_can_name_a_transcript_or_the_assistants_record` | five real probes, with a non-vacuous positive control that an in-region address *does* reach a site file |
| AC-1410 | `..._the_deploy_asks_the_deployment_and_rehearses_the_same_decision` | the real hook run under `bash` against a wrangler stub; seven states incl. the dry-run rehearsal; value never printed |
| AC-1456 | `..._a_turn_runs_on_a_process_that_never_opened_the_session` | in workerd, with per-request process discard; accumulation asserted from the model's own side as well as from the replay |

## Story-Level Verdict — independent of the AC roll-up

`pass`. Read against the body rather than against the AC list: every behavioral
promise in the Description has a criterion behind it — asking what the assistant
is (AC-1051), opening (AC-1052), running a turn (AC-1054), binding (AC-1053 +
AC-1058), priming and the corpus (AC-1317…AC-1320), continuity including the
cross-process claim (AC-1057, AC-1405, AC-1456), where the conversation runs
(AC-1404…AC-1407), and each of the five distinct honest-failure paths (AC-1055,
AC-1059, AC-1060, AC-1061, AC-1320) plus the credential absence the paragraph
closes on (AC-1408). The two claims that live only in the body — "no request
address can name the transcript" and "the model key's lifecycle" — are AC-1409
and AC-1410. Nothing in the body is uncovered, and nothing in the body describes
behavior a reconciled intent retired.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | resolved | capability | CAP-90 | field-write | `uat_coverage` read `fail` (written 21:47:27) while all 23 ACs and STORY-103 had been written `pass` at 22:01–22:10. A stale aggregate, not a real gap | Done in this call — set to `pass` |

No violations. No warnings. No `needs_review`, blocking or defaulted.

## Notes for the Editor

Nothing to fix. Two things worth carrying forward rather than acting on:

1. **`.xgd/uat_index.json` is empty** (`acs: {}`), so the index-based test lookup
   this prompt prescribes returns nothing for all 23 ACs. It is an index-builder
   artifact — the names in these suites are vitest `it(...)` strings inside
   `describe` blocks, and the indexer's anchored `^test_UAT_` match does not
   reach them. Every AC in this capability *does* have a correctly named test;
   they were found by grep over `tests/**`. Worth repairing at the tool level, or
   any downstream stage reading that index will conclude this capability has zero
   coverage.

2. **Three of the five suites cannot execute in this sandbox** (`EPERM: listen`).
   That is stable and known, and it means a check running here can only *read*
   21 of the 28 UATs. The immediately preceding fix call executed all 28. If a
   future round needs executed evidence for AC-1051…AC-1061, AC-1404…AC-1409 or
   AC-1456, it needs a sandbox that permits a listening socket — no change to the
   tests will help.

3. **The assistant library is not pinned by this checkout** (Technical Context
   says so, and REPORT-3803's three violations were exactly that risk landing).
   The AC-1318 and AC-1317 tests now derive their expectations from the
   declaration rather than from a hand-written census, so the next upstream move
   fails loudly here instead of silently. That is the right shape; no action.

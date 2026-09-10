---
uid: report-0c0a10a3
id: REPORT-3800
type: report
title: 'Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations (level=uat)'
created_by: xgd
created_at: '2026-09-10T21:20:27.255944+00:00'
updated_at: '2026-09-10T21:20:27.255944+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-7e4714b7
  level: uat
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: capability-7e4714b7 (CAP-90,
`ai_site_assistant`). Level `uat`, so the **AC bodies are the working reference**;
the intent ledger was re-read to confirm status (below) but no AC was found
internally inconsistent enough to force escalation to intent text.

Note on `previous_attempt_count = 1`: the only prior `capability_validation`
report at **level=uat** for this capability is REPORT-2070 (2026-08-16, PASS over
*eleven* ACs). It predates the BUNDLE-20 / BUNDLE-21 reconciliation of 2026-08-31
that added AC-1317…AC-1320, AC-1404…AC-1410 and AC-1456 and rewrote AC-1055 and
AC-1057, so it is not evidence about the tree checked here. What ran immediately
before this call is the 2026-09-10 story cycle (REPORT-3795 → fix REPORT-3796 →
REPORT-3798 PASS) and the ac cycle (REPORT-3799, PASS, 2 warnings). The ACs
themselves were last touched 2026-08-31 (`updated_at` on all 23), so today's
story-body repairs introduced no fresh AC→UAT drift.

## Cumulative Intent Considered

Statuses re-read this call from the ticket store; they agree with REPORT-3799.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 (request-58b6a329) | free_and_reconciled | 2026-08-07 | Created the capability: one session per site, declared-tools-only, capability/open/turn routes, transcript storage, layered priming, failure reported not swallowed | YES |
| REQ-123 (request-488d874b) | free_and_reconciled | 2026-08-07 | System KB reaches the session read-only from the *same* toolbox; map-first priming; degradation-not-failure | YES |
| REQ-126 (request-d9407f80) | free_and_reconciled | 2026-08-08 | Control surface as data; source of the recorded refusal-specificity divergence | YES (context) |
| REQ-127 (request-22a6521a) | free_and_reconciled | 2026-08-08 | Withdrew REQ-122's `{slug, text}` turn and its own scope-predicate clause; binding located in the session | YES (supersedes) |
| REQ-143 (request-18a48d63) | free_and_reconciled | 2026-08-15 | Cloudflare SiteStore (D1 + R2) — the store the transcript is written through | YES (upstream) |
| REQ-146 (request-0cdfdc5b) | free_and_reconciled | 2026-08-15 | Host into workerd: turn on the deployed host, resume, durable audit, redaction, build-time bundling + loud build failure, no-fs import graph | YES |
| REQ-149 (request-554ac441) | free_and_reconciled | 2026-08-17 | Deploy-secret guard: ask the deployment, not the shell | YES |
| BUG-38 (bug-a98fb3b0) | free_and_reconciled | 2026-08-24 | Deleted the per-process registry; resolution made durable and account-scoped | YES (supersedes AC-1055's earlier verification) |
| BUG-39 (bug-23d1ec27) | bundled | 2026-08-24 | The model double must speak the streaming wire contract | imminent — **landed** in the harness (`tests/support/scripted-model-client.ts`) |
| REQ-158 / REQ-159 / REQ-160 | draft | 2026-08-28→30 | KB in the Worker; tenant-scoped corpus; session seeding | NO (not active) — this is *why* the deployed host's corpus absence is the ordinary state AC-1320 describes |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |

No Step 2.5 case arose: no AC in this tree names a delivery-vehicle ticket, and
every ticket the story body cites is `free_and_reconciled`.

## Alignment Ledger

One story, **STORY-103** (`story-a58a0974`, `story_kind = upgrade`), 23 active
ACs, 24 AC-named UATs across five suites. Every AC has at least one substantive
test — none is a structural/AST stand-in for behaviour that could have been
driven (AC-1406 and AC-1407 are static/artifact assertions *because their own
criteria demand it*: a passing turn is explicitly excluded as evidence there, and
both walks prove non-vacuity by planting an offender).

**Evidence validity**: one double per suite, and it is the external network
boundary — the Anthropic client, speaking the real streaming wire protocol
(`content_block_start/_delta/_stop`) the backend consumes, per BUG-39. The
knowledge suite additionally stands in the embedding model through the
production `LAGRANGE_KM_EMBEDDER` seam, which the story body already records as a
stated evidence caveat. No internal component is mocked in any suite: session
manager, role assembly, tool loop, Toolbox gating/audit, `edit.ts` writes, SSE
framing, D1/R2 store and on-disk transcripts are all real.

| Element | UAT | Outcome |
|---|---|---|
| AC-1051 capability answer without a conversation | `test_UAT_AC1051_…` (reconciliation-assistant-conversation.test.ts:182) | aligned — `GET /api/ai/roles` asserts the one role, ready, no reason, no session storage created, and invariance across a real turn |
| AC-1052 open answers id + turns + readiness | `…AC1052_…` (:226) | aligned — empty open is a 200; re-open returns the same id and both turns in order, attributed |
| AC-1053 turn addressed to a conversation | `…AC1053_…` (:253) | aligned — the retired `{slug, text}` shape plus both omissions all 400/JSON, each naming the missing value and *not* naming the supplied one; model never called, draft byte-identical |
| AC-1054 streams, one completion, change in draft | `…AC1054_…` (:294) | aligned — real `set_l1` read back off disk, activity event names the operation, exactly one `done` and it is last |
| AC-1055 identifier naming no site this account holds | `…AC1055_an_identifier_is_answered_only_when…` (:340) **and** `…AC1055_the_streaming_origin_refuses_in_channel…` (continuity.workers:265) | aligned — all five refusal shapes 404/JSON (explicitly not event-stream) plus the account-scoped refusal against a second workspace, *and* the derivable-form identifier resolving; the workers half covers the origin that always streams. Two tests, two origin shapes the criterion names — not a duplicate |
| AC-1056 two sites are two conversations | `…AC1056_…` (:450) | aligned — distinct ids, a turn in each, cross-checked drafts and cross-checked transcripts |
| AC-1057 stored through the site's store, replayed | `…AC1057_…` (:483) | **partial** — local host only; see finding 2 |
| AC-1058 every operation granted, no site, no path | `…AC1058_…` (:517) | aligned — offered names asserted *equal* to the surface's own projection, filesystem tools absent, no `slug` property on any schema, priming names the site and carries `## Not available` |
| AC-1059 refusal handed back inside the turn | `…AC1059_…` (:568) | aligned — `NOT_FOUND` + a correction in the activity output, the refusal present in the model's *next* request, draft byte-identical, one completion |
| AC-1060 assistant that cannot run is explained | `…AC1060_…` (:596) | aligned — key removed, open still 200 with both turns, `ready:false`, error names `ANTHROPIC_API_KEY`, capability answer agrees |
| AC-1061 failure after streaming begins | `…AC1061_…` (:633) | aligned — 200 event-stream, failure prose inside it, exactly one terminal `done` |
| AC-1317 corpus on the same granted surface | `…AC1317_…` (knowledge.test.ts:242) | aligned — composition asserted as an equality against the site-only surface, real ranked search, `untrusted` provenance both declared and on the returned bytes, one audit trail with one session identity for search and edit |
| AC-1318 read-only grant, one declaration, both axes | `…AC1318_…` (:324) | aligned — the three read tools asserted as an equality, `scope.document === scope.kb`, an ungranted kb refused with none of the corpus |
| AC-1319 map, then purpose, then manual | `…AC1319_…` (:371) | aligned — territories and routed uids present, document bodies absent, manual verbatim, order asserted on content *and* headings |
| AC-1320 unbuilt is silent on either host; unopenable is reported | `…AC1320_…` (:415) | **gap** — the deployed-host leg is not exercised anywhere; see finding 1 |
| AC-1404 whole turn on the deployed host from the deploy secret | `…AC1404_…` (deployed.workers:236) | aligned — real workerd, real D1/R2, change read back through an independent store handle; credential-absent open still replays turns and reports not-ready (see info finding 4) |
| AC-1405 one language-neutral stored form | `…AC1405_…` (deployed.workers:299) | **partial** — form and byte-for-byte re-serialisation proven; the cross-host read is simulated in-runtime; see finding 3 |
| AC-1406 no filesystem-backed reach into the artifact | `…AC1406_…` (artifact.test.ts:203) | aligned — import walk over the real entry, type-only edges correctly excluded, three planted controls prove the walk discriminates, and the walk is shown to enter the shared library and to stop short of its file-backed exports |
| AC-1407 library bundled at build time or no artifact | `…AC1407_…` (artifact.test.ts:279) | aligned — library symbols loaded from the resolved artifact, generated shim carries the absolute path, zero runtime-resolution offenders (with a planted control), refusal is a `CommandError` with exit 6 naming the install command, and `bin/build` orders preflight before emit |
| AC-1408 no credential in log, envelope or stream | `…AC1408_…` (deployed.workers:367) | aligned — regex-hostile key, both leak paths driven with the value embedded by a throw from below, marker present, surrounding prose intact, decoy untouched |
| AC-1409 transcripts outside the addressable region | `…AC1409_…` (deployed.workers:439) | aligned — both artifacts shown to exist and to sit outside `draft/`, a positive control proves the probe machinery reaches a real site file, five traversal-bearing probes all refused, storage unchanged |
| AC-1410 deploy secret decided by asking the deployment | `…AC1410_…` (artifact.test.ts:445) | aligned — all four states, both rehearsals of the failing states, overwrite-on-rotation, value never printed, visitor-bytes deployment exits before consulting the store |
| AC-1456 a turn on a process that never opened the session | `…AC1456_…` (continuity.workers:181) | aligned — cold process between every request, the turn answered by the assistant, the first exchange carried into the second process's request, re-open on a third process replays all four turns in order |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1320 (acceptance_criterion-ceeb657c) | uat-add | The AC's title says the ordinary state is silent **"on either host"**, and its Verification demands, in its own sentence, "Open a conversation on the deployed host and observe the same three things — operations offered, no knowledge operation, no error — so that absence there is demonstrated to be the ordinary state and not a suppressed failure." The only test, `test_UAT_AC1320_an_unbuilt_kb_is_silent_and_an_unopenable_one_is_reported` (`tests/reconciliation-assistant-conversation-knowledge.test.ts:415`), runs entirely in the Node host: it drives `openSession`/`streamPrompt` from `tools/generate/src/cli/ai/host` against a workspace `corpusDir()`. No workers-project test asserts any of the three observations — `rg -i knowledge` over `apps/control-app/` returns nothing and no `tests/*.workers.test.ts` mentions a knowledge tool. The deployed leg is structurally true (REQ-158, the KB-in-the-Worker intent, is `draft`) but is nowhere demonstrated, which is exactly the "suppressed failure vs ordinary state" distinction the criterion exists to make observable. | Add a leg to `tests/reconciliation-assistant-conversation-continuity.workers.test.ts` (or the deployed suite): run one turn through `/api/ai/prompt` with the shared streaming double, read `seen[0].tools`, assert `set_l1` and `describe_page` are offered, assert no tool named `KnowledgeSearch` / `KnowledgeChunkSearch` / `KnowledgeGet` is offered, and assert a `console.error` spy captured no line matching `/knowledge base/i`. |
| 2 | warning | consistency | AC-1057 (acceptance_criterion-aecd6a53) | uat-edit | The criterion's Verification says "Do this on both hosts — the operator's local one and the deployed one — since the store, not the host, is what the replay comes from." `test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart` (`tests/reconciliation-assistant-conversation.test.ts:483`) covers only the local host. The property *is* evidenced in-tree on the deployed host — `test_UAT_AC1404_…` (`…-deployed.workers.test.ts:281-292`) discards both host caches and re-opens to a replay out of R2, and `test_UAT_AC1456_…` (`…-continuity.workers.test.ts:234-246`) re-opens on a third process — so this is mis-allocated evidence, not a missing property. | Either add a deployed-host replay leg under AC-1057's own test name in the workers suite, or narrow AC-1057's Verification to the local host and let the deployed replay stand under AC-1404/AC-1456 (an `ac-edit`); the first is preferable since the criterion's whole point is that the replay is a property of the store rather than of either host. |
| 3 | warning | consistency | AC-1405 (acceptance_criterion-f53db14b) | uat-edit | The criterion asks for a cross-runtime read in both directions: "read that same stored transcript with the host that runs locally… Do the reverse — write with the local host, read with the deployed one." `test_UAT_AC1405_a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable` (`…-deployed.workers.test.ts:299`) proves the stored form thoroughly (header shape, absence of storage-particular keys, `xgd-chat` attribution, and `archive.load(...).toFile() === stored` byte-for-byte) but exercises portability by re-filing the same bytes under a second site **inside the same runtime** (`:348-360`). Neither direction of the host-to-host hop is executed. | In the Node suite, write the deployed-form bytes (the `<!-- xgd-session … --> <!-- xgd-chat … -->` file produced by the library serialiser) into `sessionsDir({ cwd })` under a site's derived id and assert `open()` replays the turns with their original text and attribution — that closes the deployed→local direction without needing a cross-project fixture. |
| 4 | info | consistency | AC-1404 (acceptance_criterion-a4905fba) | — | The AC's negative half says the open "still reports that a turn cannot be run **and why**"; the test asserts `expect(cold.error).toBeTruthy()` (`…-deployed.workers.test.ts:292`) rather than that the reason names the missing credential. The naming *is* asserted on the local host under AC-1060 (`…conversation.test.ts:613`). Not raised as a warning because the observable the criterion is centrally about — the conversation surviving a credential-less deployment — is asserted in full. | Optional: tighten to `expect(cold.error).toContain('ANTHROPIC_API_KEY')` when this file is next touched. |
| 5 | info | exclusivity | AC-1055 (acceptance_criterion-7b488315) | — | Two UATs share the AC number across two suites. This is correct, not duplication: the criterion states the refusal in two shapes ("a plain not-found answer" / "the origin's own explanatory message followed by the completion") and BUNDLE-21's reconciliation decision in the story body formalises the per-origin split. The two tests assert different shapes on different runtimes. | none |

## Notes for the Editor

- **Only one thing blocks this level**: finding 1. It is a ~15-line addition to an
  existing workers suite, not new production code — the deployed host already
  offers no knowledge operation (there is no knowledge reference anywhere under
  `apps/control-app/`), so the test should pass the moment it is written. If it
  does not, the finding becomes a `code-issue` and should be re-filed as one.
- **A pattern, not three separate slips.** Findings 1, 2 and 3 are the same
  shape: a criterion rewritten on 2026-08-31 to hold *on both hosts* (BUNDLE-20's
  "the property that holds in both hosts" decision), paired with a test written
  against the host that criterion originally lived on. AC-1320, AC-1057 and
  AC-1405 are the three ACs carrying that phrasing, and all three are covered on
  one side. Worth checking as a class rather than one at a time.
- **Test hygiene, not alignment**: `test_UAT_AC1320_…`
  (`tests/reconciliation-assistant-conversation-knowledge.test.ts:432-518`)
  mutates the *repository's own* `corpusDir()` — it renames `corpus/index` aside
  and restores it in `finally`. A crashed or killed run leaves the checkout's KB
  index displaced to `index.uat-ac1320-aside`. Not a finding here, but if a
  fixer touches this file it is worth moving that case onto a temporary corpus
  root.
- **What this check did not do**: it assessed whether each test *exercises* its
  AC, not whether the suite currently passes. Execution is REPORT-2075's subject
  (`uat_coverage = pass` on the capability and on AC-1051…AC-1061); no test was
  run in this call.

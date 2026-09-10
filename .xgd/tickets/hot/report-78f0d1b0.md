---
uid: report-78f0d1b0
id: REPORT-3802
type: report
title: 'Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations (level=uat)'
created_by: xgd
created_at: '2026-09-10T21:34:21.902663+00:00'
updated_at: '2026-09-10T21:34:21.902663+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-7e4714b7
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: capability-7e4714b7 (CAP-90,
`ai_site_assistant`). Level `uat`, so the **AC bodies are the working reference**.
The intent ledger was re-read from the ticket store this call to confirm status;
no AC was found internally inconsistent enough to force escalation to intent
text, and no Step 2.5 case arose (no AC or story passage in this tree names a
delivery-vehicle ticket that is `abandoned` / `deprecated` / `wont_fix`).

**On `previous_attempt_count = 2`.** The immediately preceding cycle at this level
is REPORT-3800 (`report-0c0a10a3`, 2026-09-10 21:20, FAIL — 1 violation, 2
warnings, 2 info) followed by the fix REPORT-3801 (`report-d0ee83a0`, 21:29, 6
fixes, 0 violations remaining). This call **re-derived the tree from the ticket
store and re-read every test body** rather than trusting that fix report; the
three repairs it claims are verified present in the working tree and committed
(`bed39723aa`), and each was assessed on its own merits below. The older
REPORT-2070 (2026-08-16, PASS over *eleven* ACs) predates the 2026-08-31
BUNDLE-20 / BUNDLE-21 reconciliation and is not evidence about the 23-AC tree
checked here.

The ACs were last touched 2026-08-31 (`updated_at` on all 23); STORY-103's body
was last touched 2026-09-10 20:57, before both the ac cycle (REPORT-3799, PASS)
and this level's first pass, so no fresh AC→UAT drift was introduced after the
findings above were raised.

## Cumulative Intent Considered

Statuses re-read this call.

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
| BUG-39 (bug-23d1ec27) | bundled | 2026-08-24 | The model double must speak the streaming wire contract | imminent — **landed**: `tests/support/scripted-model-client.ts`, imported by the Node suites |
| BUNDLE-17 (bundle-e59210c5) | free_and_reconciled | 2026-08-10 | STORY-103's `intent_uid` | YES |
| BUNDLE-21 (bundle-78f4e2fe) | free_and_reconciled | 2026-08-26 | STORY-103's `updated_by` (carries BUG-38) | YES |
| REQ-158 / REQ-159 / REQ-160 | draft | 2026-08-28→30 | KB in the Worker; tenant-scoped corpus; session seeding | NO (not active) — this is *why* the deployed host's corpus absence is the ordinary state AC-1320 describes |

## Alignment Ledger

One story, **STORY-103** (`story-a58a0974`, `story_kind = upgrade`), 23 active
ACs, **27** AC-named UATs across five suites. Every AC has at least one
substantive UAT.

**Evidence validity.** One double per suite and it is the external network
boundary — the Anthropic client, speaking the real streaming wire protocol
(`content_block_start` / `_delta` / `_stop`) the backend consumes, per BUG-39.
The knowledge suite additionally stands in the embedding model through the
production `LAGRANGE_KM_EMBEDDER` seam, which STORY-103's body already records as
a stated evidence caveat. No internal component is mocked in any suite: session
manager, role assembly, tool loop, Toolbox gating / provenance / audit, `edit.ts`
writes, SSE framing, D1 + R2 store and on-disk transcripts are all real. AC-1406,
AC-1407 and AC-1410 are static / artifact / subprocess assertions **because their
own criteria demand it** — a passing turn is explicitly excluded as evidence for
AC-1406, and all three prove non-vacuity by planting an offender or a positive
control.

| Element | UAT(s) | Outcome |
|---|---|---|
| AC-1051 capability answer without a conversation | `…AC1051_…` (conversation.test.ts:188) | aligned — `GET /api/ai/roles` asserts the one role, ready, no reason, no session storage created, and invariance across a real turn |
| AC-1052 open answers id + turns + readiness | `…AC1052_…` (:232) | aligned — empty open is a 200; re-open returns the same id and both turns in order, attributed |
| AC-1053 turn addressed to a conversation | `…AC1053_…` (:259) | aligned — the retired `{slug, text}` shape plus both omissions all 400/JSON, each naming the missing value and *not* the supplied one; model never reached, draft byte-identical |
| AC-1054 streams, one completion, change in draft | `…AC1054_…` (:300) | aligned — real `set_l1` read back off disk, activity event names the operation, exactly one `done` and it is last |
| AC-1055 identifier naming no site this account holds | `…AC1055_an_identifier_is_answered_only_when…` (:346) **and** `…AC1055_the_streaming_origin_refuses_in_channel…` (continuity.workers:369) | aligned — six refusal shapes 404/JSON (asserted *not* event-stream) plus the account-scoped refusal against a second workspace, plus the derivable form resolving; the workers half covers the origin that always streams. Two origin shapes the criterion names — not a duplicate |
| AC-1056 two sites are two conversations | `…AC1056_…` (:456) | aligned — distinct ids, a turn in each, cross-checked drafts and cross-checked transcripts |
| AC-1057 stored through the site's store, replayed | `…AC1057_turns_persist_under_the_workspace…` (:489) **and** `…AC1057_turns_persist_through_the_deployed_store…` (deployed.workers:321) | **aligned (repaired this cycle)** — both hosts now carry the restart-and-replay the criterion asks for over two entirely different stores, and each ends with the delete-and-reopen that makes the replay a statement about *where* the turns live. See info finding 1 |
| AC-1058 every operation granted, no site, no path | `…AC1058_…` (:621) | aligned — offered names asserted *equal* to the surface's own projection, filesystem tools absent by name and by pattern, no `slug` on any schema, priming names the site and carries `## Not available` |
| AC-1059 refusal handed back inside the turn | `…AC1059_…` (:672) | aligned — `NOT_FOUND` + a correction in the activity output, the refusal present in the model's *next* request, draft byte-identical, one completion |
| AC-1060 assistant that cannot run is explained | `…AC1060_…` (:700) | aligned — key removed, open still 200 with both turns, `ready:false`, error names `ANTHROPIC_API_KEY` in operator prose, capability answer agrees |
| AC-1061 failure after streaming begins | `…AC1061_…` (:737) | aligned — 200 event-stream, failure prose inside it, exactly one terminal `done` and it is last |
| AC-1317 corpus on the same granted surface | `…AC1317_…` (knowledge.test.ts:242) | aligned — composition asserted as an equality against the site-only surface, real ranked search, `untrusted` both declared and on the returned bytes, one audit trail with one session identity for search and edit |
| AC-1318 read-only grant, one declaration, both axes | `…AC1318_…` (:324) | aligned — the three read tools asserted as an equality, `scope.document === scope.kb`, an ungranted kb refused with none of the corpus |
| AC-1319 map, then purpose, then manual | `…AC1319_…` (:371) | aligned — territories and routed uids present, document bodies absent, manual verbatim, order asserted on content *and* headings |
| AC-1320 unbuilt is silent on either host; unopenable is reported | `…AC1320_an_unbuilt_kb_is_silent…` (:415) **and** `…AC1320_the_deployed_host_offers_its_site_operations…` (continuity.workers:293) | **aligned (repaired this cycle)** — the deployed leg observes all three things the criterion names on a real turn in workerd: site operations offered, no knowledge operation by declared name or by `/knowledge/i` sweep, and a `console.error` spy held across the open *and* the turn capturing no `/knowledge base/i` line |
| AC-1404 whole turn on the deployed host from the deploy secret | `…AC1404_…` (deployed.workers:242) | aligned — real workerd, real D1/R2, change read back through an independent store handle; the credential-absent open replays both turns and its reason now names `ANTHROPIC_API_KEY` (deployed.workers:299), closing the prior cycle's info finding |
| AC-1405 one language-neutral stored form | `…AC1405_a_transcript_is_the_neutral_session_file…` (deployed.workers:369) **and** `…AC1405_a_transcript_from_the_deployed_host_replays_on_the_local_host…` (conversation.test.ts:544) | **aligned (repaired this cycle)** — the stored form proven byte-for-byte (`archive.load(id).toFile() === stored`, no storage-particular header key), and the deployed→local hop now executed against bytes this host never wrote, replayed *and continued*, with the continuation written back in the same form. See info finding 2 |
| AC-1406 no filesystem-backed reach into the artifact | `…AC1406_…` (artifact.test.ts:203) | aligned — import walk over the real entry, type-only edges excluded, three planted controls prove the walk discriminates, and the walk is shown to enter the shared library's Cloudflare rung and to stop short of its file-backed exports |
| AC-1407 library bundled at build time or no artifact | `…AC1407_…` (artifact.test.ts:279) | aligned — library symbols loaded from the resolved artifact, generated shim carries the absolute path, zero runtime-resolution offenders (with a planted control), refusal is a `CommandError` with exit 6 naming the install command, and `bin/build` orders preflight before assets before emit |
| AC-1408 no credential in log, envelope or stream | `…AC1408_…` (deployed.workers:437) | aligned — regex-hostile key, both leak paths driven with the value embedded by a throw from below, marker present, surrounding prose intact, decoy untouched |
| AC-1409 transcripts outside the addressable region | `…AC1409_…` (deployed.workers:509) | aligned — both artifacts shown to exist and to sit outside `draft/`, a positive control proves the probe machinery reaches a real site file, five traversal-bearing probes all refused, storage unchanged |
| AC-1410 deploy secret decided by asking the deployment | `…AC1410_…` (artifact.test.ts:445) | aligned — all four states, four rehearsals including both failing ones, overwrite-on-rotation, value never printed on any path, visitor-bytes deployment exits before consulting the store |
| AC-1456 a turn on a process that never opened the session | `…AC1456_…` (continuity.workers:186) | aligned — cold process between every request, the turn answered by the assistant and not by "no longer open", the first exchange carried into the second process's request, re-open on a fourth process replays all four turns in order |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-1057 (`acceptance_criterion-aecd6a53`) | — | The criterion carries a clause its own Verification does not ask for: "the tier in front of that store holds only the turn in flight and is drained into the store as the turn runs, so losing the host mid-turn costs that turn and never the conversation." No UAT interrupts a turn to observe that bound. It is not raised as a warning because the AC's *Verification* section — the observable the criterion itself nominates — is fully covered on both hosts, and the junction's memory-backing is separately asserted at AC-1406 (`artifact.test.ts:270-272`: `junction_file.js` and `file_archive.js` are unreachable from the shipped artifact). Recorded so a future cycle does not re-derive it. | none |
| 2 | info | consistency | AC-1405 (`acceptance_criterion-f53db14b`) | — | The two directions are evidenced asymmetrically, deliberately. Deployed→local is *executed*: `conversation.test.ts:556-614` writes bytes this host never produced into `sessionsDir({ cwd })` under `sessionIdFor(OTHER)` and replays, continues and re-writes them. Local→deployed is *composed* rather than executed: the local host's write-back is asserted to be the same form with no host-particular header key (:604-614), and the deployed host's real output is asserted to be exactly the library serialiser's bytes (`deployed.workers:409-411`), so the two meet at the contract rather than at a byte comparison. This is precisely the remedy the prior cycle's finding 3 proposed and is sound; the residual — a hand-authored fixture drifting from real deployed bytes — is bounded by the deployed suite's `toFile() === stored` equality and its foreign-key sweep. | none |
| 3 | info | exclusivity | AC-1055, AC-1057, AC-1320, AC-1405 | — | Four ACs now carry two AC-named UATs each. None is a duplicate: in every case the criterion states its property over **two hosts** (AC-1057, AC-1320), **two origin shapes** (AC-1055) or **two directions** (AC-1405) in its own text, and the pair runs on different runtimes against different stores. Neither member of any pair could be folded into the other's vitest project. | none |
| 4 | info | coverage | AC-1058 (`acceptance_criterion-24fae61d`) | — | AC-1058's Verification extends its no-site / no-path rule to "any knowledge operations present". Its own UAT runs on a workspace with no corpus, so the knowledge half is asserted next door at `knowledge.test.ts:269-277` (no `slug`, no `path`, no `file` on any of the three knowledge schemas; `kb` and `uid` present). Correctly allocated — the property is proven in-tree, on the only fixture where knowledge operations exist. | none |

## Notes for the Editor

- **Nothing to fix at this level.** All four findings are `info`; the ledger above
  is the artifact.
- **The prior cycle's three repairs were verified independently, not accepted on
  report.** `test_UAT_AC1320_the_deployed_host_offers_its_site_operations_and_reports_nothing_absent`
  (continuity.workers:293), `test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart`
  (deployed.workers:321) and `test_UAT_AC1405_a_transcript_from_the_deployed_host_replays_on_the_local_host`
  (conversation.test.ts:544) were each read in full. Each makes the observations
  its criterion nominates, each asserts on what a real turn *carried* rather than
  on the open alone where the criterion is about what the assistant was offered,
  and each of the two continuity legs ends with the negative half (delete the
  stored conversation, re-open to empty) that turns a replay into a statement
  about where the turns live. The AC-1404 info item from the prior cycle was also
  closed (`toBeTruthy()` → `toContain('ANTHROPIC_API_KEY')`, deployed.workers:299).
- **The cross-host pattern the prior cycle identified is now closed as a class.**
  AC-1320, AC-1057 and AC-1405 were the three criteria rewritten on 2026-08-31 to
  hold *on both hosts* while paired with a test written against one; all three now
  carry both sides.
- **Test hygiene, still open, still not a finding.**
  `test_UAT_AC1320_an_unbuilt_kb_is_silent_and_an_unopenable_one_is_reported`
  (`tests/reconciliation-assistant-conversation-knowledge.test.ts:427-429, 469,
  516-518`) still renames the *repository's own* `corpus/index` aside and restores
  it in a `finally`. A crashed or killed run leaves the checkout's KB index
  displaced to `index.uat-ac1320-aside`. Worth moving onto a temporary corpus root
  whenever that file is next opened for another reason — it was correctly left
  alone by the last fix call, which had no other reason to touch it.
- **What this check did not do.** It assessed whether each test *exercises* its
  AC, not whether the suites currently pass; no test was run in this call.
  Execution is the `check_uat_coverage` stage's subject. Note that AC-1320 and
  AC-1405 still carry no `uat_coverage` value, and AC-1317/AC-1318/AC-1319 and
  AC-1404…AC-1456 likewise — only AC-1051…AC-1061 carry `uat_coverage: pass`,
  from REPORT-2075 (2026-08-16). That field is owned downstream and was
  deliberately not set here.

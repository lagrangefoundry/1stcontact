---
uid: report-8c3c08f8
id: REPORT-2070
type: report
title: 'Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations (level=uat)'
created_by: xgd
created_at: '2026-08-16T05:04:12.397329+00:00'
updated_at: '2026-08-16T05:04:12.397329+00:00'
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

Anchor report: report-7ef6a9ea. Capability: capability-7e4714b7 (CAP-90,
`ai_site_assistant`). Level: `uat` — ACs are the working reference; intent
history was consulted only to confirm the two supersessions the story body
already records.

## Cumulative Intent Considered

The capability has one story (STORY-103 / story-a58a0974, `story_kind=feature`,
status `completed`) whose `fields.intent_uid` is **bundle-e59210c5**
(BUNDLE-17, status `free_and_reconciled`, completed 2026-08-10,
`merged_at_commit` 0198704b7e29db3c53cf569070042cec0eb467bc). The bundle carries
eight source requests; the ones bearing on this capability are below. The
individual REQ tickets are not resident in this regression worktree's ticket
store, so their text was read from the bundle body, which embeds each request in
full.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 | in bundle-e59210c5 (free_and_reconciled) | 2026-08-10 | Chat panel backed by a per-site AI session; declared tool surface (no filesystem tool, no HTML/CSS/JS write); persisted per-site transcript; failures reported not swallowed; three routes `roles` / `session` / `prompt`; site binding structural (closed-over slug, derived session id) | YES (partly superseded) |
| REQ-126 | in bundle-e59210c5 (free_and_reconciled) | 2026-08-10 | L1 control surface as a declared Toolbox (`l1-surface.json`, `toolbox.ts`, `instances.json`); grant narrows the surface; site binding stays construction-time — no `slug` parameter on any operation; error taxonomy promoted to the surface | YES |
| REQ-127 | in bundle-e59210c5 (free_and_reconciled) | 2026-08-10 | **Withdrew** REQ-122's `{slug, text}` turn and the browser-held site identity, and **withdrew its own** "site binding becomes a declared scope predicate" clause; binding is *located* in the session; `POST /api/ai/prompt` takes `{sessionId, text}`; an id the host did not mint is refused rather than treated as a free-form key; `POST /api/ai/session {slug}` is the only place a site becomes a session; transcript storage moved under the workspace | YES (supersedes REQ-122) |
| REQ-119, REQ-121, REQ-128, REQ-129, REQ-130 | in bundle-e59210c5 (free_and_reconciled) | 2026-08-10 | Request-time render, and other plan items of the same bundle; no asks landing on this capability's conversation host | YES (not addressed to this capability) |

Two supersessions are already recorded verbatim in the STORY-103 body
("Intent supersession within this bundle", "Known divergence, recorded not
absorbed") and the AC set follows the later, amended intent. No AC asserts the
withdrawn `{slug, text}` turn shape, the withdrawn scope predicate, or the
per-call path/hint REQ-126 stopped delivering to the model.

## Alignment Ledger

One story, eleven active ACs (`kind=behavior`, `regression_only=False`), eleven
UATs — all in `tests/reconciliation-assistant-conversation.test.ts`, all driving
real HTTP against a real `startBuilder` origin with a single double at the
Anthropic client (an external network boundary, permitted by the thin-mock
strategy). Every other participant — session manager, role assembly, tool loop,
`L1Toolbox`, `edit.ts` writes, SSE projection, on-disk transcripts — is real,
and every assertion reads a real consequence (draft bytes on disk, transcript
files under the workspace, HTTP status, frames on the wire).

| Element | UAT | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1051 (acceptance_criterion-fe61861f) — capability answer without a conversation | `test_UAT_AC1051_capability_answer_names_the_role_and_readiness_without_a_conversation` (:209) | REQ-122 | aligned — `GET /api/ai/roles`, asserts the one role, ready, no reason, and that no conversation storage came into existence |
| AC-1052 (acceptance_criterion-15d1c12f) — opening answers id + turns + readiness | `test_UAT_AC1052_opening_answers_with_an_identifier_the_turns_so_far_and_readiness` (:230) | REQ-122, REQ-127 | aligned — empty-turn open is a 200, then re-open returns the same id and both turns in order with attribution |
| AC-1053 (acceptance_criterion-33328c06) — a turn addresses a conversation, not a site | `test_UAT_AC1053_naming_a_site_or_omitting_a_value_is_refused_as_malformed` (:257) | REQ-127 | aligned — sends the superseded `{slug, text}` shape plus both omissions; 400 + JSON naming the missing value, model never called, draft byte-identical, conversation neither started nor extended |
| AC-1054 (acceptance_criterion-5df35b3c) — site-changing turn streams and lands in the draft | `test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft` (:288) | REQ-122, REQ-126 | aligned — real `set_l1` through `editL1Set`, headline read back off disk, activity event names the operation, exactly one terminal `done` and it is last |
| AC-1055 (acceptance_criterion-7b488315) — an id the origin never issued | `test_UAT_AC1055_an_identifier_the_origin_never_issued_is_refused_before_anything_is_streamed` (:311) | REQ-127 | aligned — both the derivable `site-<slug>` form and a traversal-bearing fabrication get 404 JSON (explicitly not `event-stream`); no model call, no transcript storage, both drafts unchanged |
| AC-1056 (acceptance_criterion-f06d0451) — two sites are two conversations | `test_UAT_AC1056_each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns` (:346) | REQ-122, REQ-126 | aligned — distinct ids, a turn in each, cross-checks that the other draft is untouched, and each re-opened transcript contains its own text and not the other's |
| AC-1057 (acceptance_criterion-aecd6a53) — stored with the workspace, replayed after restart | `test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart` (:379) | REQ-127 | aligned — asserts the store path is under the workspace cwd (`storage/chat`, per `host.ts:138`), reads the stored bytes, discards in-memory state, replays both turns, then removes the store to demonstrate that is where it lived |
| AC-1058 (acceptance_criterion-24fae61d) — only granted operations, priming assembled from them | `test_UAT_AC1058_only_granted_site_operations_are_offered_none_touching_files_or_naming_a_site` (:413) | REQ-126, REQ-127 | aligned — offered tool names compared against `createL1Toolbox(...).schemas()` (the real grant projection, not a restated list), absence of file/glob/grep/shell tools, no `slug` in any input schema, and the assembled system prompt naming the site plus its generated "What you can do" / "Not available" sections |
| AC-1059 (acceptance_criterion-b982a7e0) — a refusal comes back inside the turn | `test_UAT_AC1059_a_refused_operation_returns_a_named_refusal_into_the_same_turn` (:459) | REQ-122 (as amended by REQ-126) | aligned — asserts the named class (`NOT_FOUND`) and a stated correction, that the refusal appears in the model's next request, that the same turn ran on to one completion, and that the draft is byte-identical. Correctly asserts the property the intent is about and does **not** claim the per-call path/hint REQ-126 stopped delivering |
| AC-1060 (acceptance_criterion-99c540d7) — an assistant that cannot run | `test_UAT_AC1060_a_missing_credential_is_explained_without_losing_the_conversation` (:487) | REQ-122, REQ-127 | aligned — holds a real conversation, then removes `ANTHROPIC_API_KEY` and discards in-memory state; open still succeeds with both stored turns, `ready:false`, an operator-readable reason naming the credential, and the capability answer reports the same unreadiness while still naming the role |
| AC-1061 (acceptance_criterion-ef29a3b6) — failure after streaming has begun | `test_UAT_AC1061_a_failure_after_streaming_begins_arrives_in_the_stream_before_one_completion` (:524) | REQ-122 | aligned — model call throws once the response is committed; asserts a 200 `text/event-stream`, the failure in readable text inside the stream, and exactly one terminal completion last |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | AC-1051 | — | Every active AC has exactly one substantive UAT; no AC is left with only a structural/AST-shaped check. All eleven exercise the real routes and read real consequences | none |
| 2 | info | consistency | AC-1051 | — | AC-1051's clause "the answer is the same whether or not any conversation has ever been opened" is not asserted inside `test_UAT_AC1051_*`, which runs on a fresh origin as the AC's own Verification prescribes. The clause is nonetheless exercised: `test_UAT_AC1060_*` queries `/api/ai/roles` after a real conversation exists and asserts the role is still named. Not a gap | none |
| 3 | info | consistency | AC-1055 | — | AC-1055's "held over from before a restart" case is covered in substance by the `site-<slug>` derivable-id case, which is precisely the id a pre-restart client would be holding — `sessionIdFor` derives it (`host.ts:127`) but the host answers only for ids in `minted` (`host.ts:165`) | none |
| 4 | info | exclusivity | AC-1052 / AC-1057, AC-1051 / AC-1060 | — | Two near-neighbour pairs were checked and are not duplicates. AC-1052 proves re-open returns the same conversation with the host still warm; AC-1057 proves replay after in-memory state is discarded and pins the storage location. AC-1051 and AC-1060 both call `/api/ai/roles` but assert opposite readiness states for different reasons | none |
| 5 | info | consistency | STORY-103 | — | The two intent supersessions in this bundle (REQ-127 withdrawing REQ-122's `{slug, text}` turn and its own scope-predicate clause; REQ-126 removing per-call path/hint from what reaches the model) are followed by the AC set and by the tests. `test_UAT_AC1053_*` sends the withdrawn `{slug, text}` shape expressly to prove it is now refused | none |

## Notes for the Editor

Nothing to repair at this level.

Two observations worth carrying forward rather than acting on:

- **Evidence validity was the main thing checked here, and it holds.** The suite's
  own header states the one double and why, and the claim survives inspection:
  `setModelClient` (`host.ts:102`) is the only seam in the module, the tool
  surface under test is produced by the real `createL1Toolbox`, and the
  site-changing assertions read `storage/sites/<slug>/draft/pages/home.json` off
  disk rather than trusting the stream. AC-1058 in particular avoids the usual
  failure mode: it derives the expected tool list from the production grant
  instead of hardcoding one that could drift.
- **The UATs could not be executed in this session** — running the suite was not
  permitted by the session's tool policy, so this is a static alignment check.
  Pass/fail of the tests themselves belongs to the regression run; nothing here
  asserts they currently pass, only that each one exercises the behaviour its AC
  claims.
- **Test-file naming.** All eleven live in `tests/reconciliation-assistant-conversation.test.ts`
  despite STORY-103 carrying `story_kind=feature`. The `reconciliation-` prefix
  is a file-naming convention question, not an alignment defect, and no finding
  is raised for it.

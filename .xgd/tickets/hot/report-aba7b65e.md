---
uid: report-aba7b65e
id: REPORT-3795
type: report
title: 'Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations (level=story)'
created_by: xgd
created_at: '2026-09-10T20:55:18.781449+00:00'
updated_at: '2026-09-10T20:55:18.781449+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-7e4714b7
  level: story
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Note on `previous_attempt_count = 1`: no prior `capability_validation` report exists for
`capability-7e4714b7` in this regression (REPORT-3555, 2026-09-09). The last three
(REPORT-2068 / 2069 / 2070, all `pass`, 2026-08-16) predate the story body's own
BUNDLE-20 / BUNDLE-21 reconciliation of 2026-08-31, so they are not evidence about the
body being checked here. This assessment was made fresh against the current body.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 | free_and_reconciled | 2026-08-07 | Created the capability: one session per site, declared-tools-only, three transport routes, transcript storage, three-layer priming, failures reported not swallowed | YES |
| REQ-123 | free_and_reconciled | 2026-08-07 | The system KB reaches the session: `KnowledgeToolbox` granted read-only from the *same* toolbox, landscape-first priming, degradation-not-failure | YES |
| REQ-126 | free_and_reconciled | 2026-08-08 | The control surface as data (out of scope here); source of the recorded refusal-specificity divergence | YES (context) |
| REQ-127 | free_and_reconciled | 2026-08-08 | Withdrew REQ-122's `{slug, text}` turn **and its own** scope-predicate clause; located the binding in the session; folded in the transcript-archive migration | YES (supersedes) |
| REQ-131 | free_and_reconciled | 2026-08-11 | The per-turn reminder carries the change signal — owned by CAP-99 / STORY-115, not here | YES (elsewhere) |
| REQ-146 | free_and_reconciled | 2026-08-15 | The host moves into workerd: AC1–AC7 (turn on the deployed host, resume, durable audit, redaction, bundled library, no-fs import graph, publish unreachable) | YES |
| REQ-149 | free_and_reconciled | 2026-08-17 | Follow-up: the deploy-secret guard asks the deployment, not the shell (its AC13) | YES |
| BUG-38 | free_and_reconciled | 2026-08-24 | Deleted the per-process `minted` registry; resolution made durable and account-scoped via `SiteStore.hasDraft` | YES (supersedes AC-1055's earlier verification) |
| BUG-39 | bundled | 2026-08-24 | The model double must speak the streaming contract, transcribed in exactly one place | imminent |
| REQ-158 / REQ-159 / REQ-160 | draft | 2026-08-28→31 | KB in the Worker, tenant-scoped corpus, session seeding & turn reminders | NO (not yet active) |
| REQ-134 | abandoned | 2026-08-12 | — | NO |

Retirements walked: REQ-127 retired REQ-122's site-named turn and REQ-122's
`storage/chat` answer was in turn superseded by REQ-146's store-backed archive;
BUG-38 retired REQ-127's "an id this process minted" authority test. All three
retirements are correctly recorded in the story body's *Intent supersession* and
*Reconciliation Decisions* sections.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-103 (`story-a58a0974`, upgrade) | REQ-122, REQ-123, REQ-126, REQ-127, REQ-146, REQ-149, BUG-38, BUG-39 (imminent) | aligned on **coverage** and **exclusivity**; three **consistency** defects in the body (findings 1–3) |

**Coverage — verified, no gaps.** Every reconciled/imminent ask is expressed:

- REQ-122 → AC-1051 / 1052 / 1053 / 1054 / 1056 / 1059 / 1060 / 1061; its priming layer 3
  (the per-turn reminder) is expressed under CAP-99 / STORY-115, which is where REQ-131
  put it — `host-core.ts:225,451-455,499` attributes it to REQ-131 and keeps `reminders`
  a channel distinct from the three priming tiers, so the story body's "map → role →
  manual" ordering is not contradicted by it.
- REQ-123 → AC-1317 / 1318 / 1319 / 1320.
- REQ-127 → AC-1053, AC-1055, AC-1058.
- REQ-146 AC1→AC-1404, AC2→AC-1057, AC3→CAP-92's AC-1411 (audit durability, correctly
  out of scope here per the capability body), AC4→AC-1408, AC5→AC-1407, AC6→AC-1406,
  AC7→CAP-92's AC-1074 (withholding an operation from a grant). Its stored-form and
  addressability consequences → AC-1405, AC-1409.
- REQ-149 → AC-1410.
- BUG-38 → AC-1055 (restated) + AC-1456.
- BUG-39 → test-harness correctness; creates no durable behavioural intent, and the
  story body's *Recorded caveat on evidence* / edge-runtime-double paragraphs already
  name the streaming double. Correctly absent from the criteria.

**Exclusivity — clean.** One story in the capability, so no intra-capability overlap.
The nearest cross-capability seam (the per-turn reminder, CAP-99) is principled: its
*content* is the change journal's, not this capability's priming.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-103, body lines 174–179 | story-body-edit | Technical Context asserts "**this repo has no tenancy yet**" and "nothing tenant-scoped is claimed or built by this story". Both are false. REQ-143 (free_and_reconciled, 2026-08-15) built the account-scoped D1/R2 store (STORY-121, "Scoped To One Account"), and REQ-146 (free_and_reconciled) partitioned *this story's own* transcripts and audit by tenant — `apps/control-app/src/ai.ts:77` (`chat/${this.tenantId}/${sessionId}.md`), `:81`, `:145` (`audit/${tenantId}/…`), `:189-197`. BUG-38 (free_and_reconciled) then made session resolution itself account-scoped. The paragraph is carried verbatim from REQ-123's 2026-08-07 world, when that claim was true. It also contradicts the same body at lines 57 ("resolved against durable, account-scoped storage"), 224–228 ("one the account's own store holds"), and criteria AC-1055, AC-1409, AC-1456. | Narrow the claim to the corpus: the system KB is a release artefact that takes the scope parameters and does not vary by them, so identical query text yields identical results for every account, and per-tenant knowledge bases can be added later without revisiting this wiring. Delete "and this repo has no tenancy yet" and "nothing tenant-scoped is claimed or built by this story"; if a contrast is wanted, state that the *conversation* is account-scoped and its transcript tenant-partitioned (REQ-143 / REQ-146 / BUG-38) while the *corpus* is not. |
| 2 | warning | consistency | STORY-103, body lines 81 and 110 | story-body-edit | Both cite "the structured edit capability (**CAP-87** / story-37a3921b)". The pair names two different capabilities: `story-37a3921b` is STORY-100 under `capability-f753cecd` = **CAP-86** ("Structured Copy Editing: One Validated, Atomic Write Path"), which is the capability meant. **CAP-87** is `capability-12fee326` ("In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture") — a different out-of-scope neighbour, so a reader following the human ID lands on the wrong one. | Replace `CAP-87` with `CAP-86` at both sites; `story-37a3921b` is already correct. |
| 3 | warning | consistency | STORY-103, body lines 52–55 vs 261–268 | story-body-edit | The in-scope bullet claims that, across the two hosts, "what a turn is, what it may reach, where the transcript lives and **how a failure is reported** are the same either way". The BUNDLE-21 reconciliation decision 60 lines later states the opposite for the refusal path: "The shape of a refusal is stated **per origin** rather than as one shape… the one that answers a turn with a status code refuses as a plain not-found answer, the one that answers every turn as a stream delivers the refusal as its own message ahead of the completion", and notes the criterion had previously been written as though only the first origin existed. Left as-is, the unqualified bullet is the sentence an AC author reads, and it re-manufactures exactly the single-shape drift AC-1055 was just repaired out of. | Qualify line 54 to the property that actually holds on both — a failure is reported honestly and never dressed as the assistant having tried, *in the shape each origin's answer takes* — and let the Reconciliation Decisions paragraph carry the per-origin detail. |

## Notes for the Editor

- **All three findings are body-text repairs to STORY-103 alone.** No AC needs adding,
  editing or deprecating, and no test or production code is implicated. Coverage and
  exclusivity both pass; do not open ACs off the back of this report.
- **Finding 1 is the load-bearing one.** The false clause is not merely stale — it
  actively denies a property three of this story's own criteria assert (AC-1055,
  AC-1409, AC-1456). Repair it by *narrowing the subject to the corpus*, not by deleting
  the paragraph: the reason it exists (why per-tenant knowledge bases can be added later
  without revisiting this wiring) is still a live and useful record from REQ-123.
- **Watch the neighbouring paragraph when editing.** Lines 160–172 ("one conversation
  host per isolate", "that cache is a cache of hosts, not of conversations") are accurate
  against `apps/control-app/src/ai.ts:180-186` and `router.ts:484-503` and were checked;
  they use "tenant" correctly and must not be swept up in a find-and-replace aimed at
  finding 1.
- **Two body claims were spot-checked and are correct — leave them alone.** (a) The
  recorded asymmetry that the capability answer (AC-1051) is served by the operator's
  local transport and not the deployed route table: `apps/control-app/src/router.ts`
  declares only `/api/ai/session` (:487) and `/api/ai/prompt` (:503) — no `/api/ai/roles`.
  (b) Transcripts operator-local and excluded from version control in the filesystem host:
  `host.ts:83,141,169` (`sessionsDir` → `FileArchive`) with `/storage/chat/` in
  `.gitignore:158`.
- **One live-but-unenforced item to keep in view, not to fix.** BUG-39 is `bundled`
  (imminent, not yet reconciled). Its own body flags the REQ-127 / AC-1055 "derivable is
  not the same as issued" conflict as "flagged for the operator to decide" — that
  decision has since been taken and is recorded in this story's BUNDLE-21 reconciliation
  (AC-1055's earlier verification is deliberately the accepted case now). No action; the
  ledger records it so a future check does not re-litigate it.
- **REQ-158 / REQ-159 / REQ-160 are `draft` and were excluded.** They would materially
  change the knowledge and priming criteria (KB in the Worker, tenant-scoped corpus,
  two-KB priming and turn reminders). Today the body's "the deployed edge runtime is a
  third instance of the *ordinary* state — the corpus bridge is bound to the operator's
  filesystem" is correct precisely because they have not landed. Expect this paragraph
  and AC-1320 to move when they do.

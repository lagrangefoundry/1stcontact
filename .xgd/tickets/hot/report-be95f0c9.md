---
uid: report-be95f0c9
id: REPORT-3798
type: report
title: 'Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations (level=story)'
created_by: xgd
created_at: '2026-09-10T21:06:59.930839+00:00'
updated_at: '2026-09-10T21:06:59.930839+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-7e4714b7
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Note on `previous_attempt_count = 2`. The prior check is REPORT-3795
(`report-aba7b65e`, 2026-09-10T20:55Z, FAIL, 1 violation + 2 warnings) and the fix is
REPORT-3796 (`report-7c608777`, 20:58Z, 4 body mutations). STORY-103's
`last_field_updated` is `body` at 20:57:19Z — between the two — so the fix did land after
the check that motivated it. **All three prior findings are independently re-verified as
repaired in the current body** (see *Prior-attempt verification* below). This assessment
was otherwise made fresh against the current body and the intent ledger, not carried over.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 (`request-58b6a329`) | free_and_reconciled | 2026-08-07 | Created the capability: a session per site, declared-tools-only, three routes (`/api/ai/roles`, `/session`, `/prompt`), transcript storage, three-layer priming ("one hand-written"), failures reported not swallowed | YES |
| REQ-123 (`request-488d874b`) | free_and_reconciled | 2026-08-07 | The system KB reaches the session: `KnowledgeToolbox` granted read-only from the *same* Toolbox, scoped to the system KB on both axes, landscape-first priming, degradation-not-failure; §7 "the system KB sits above tenancy" | YES |
| REQ-126 (`request-d9407f80`) | free_and_reconciled | 2026-08-08 | The control surface as data (owned by CAP-92); source of `provenance: untrusted` (§4) and of the recorded refusal-specificity divergence | YES (context) |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | 2026-08-08 | Withdrew REQ-122's `{slug, text}` turn **and its own** scope-predicate clause; located the binding in the session; folded in the transcript-archive migration (`FileArchive`, explicit `logDir`) | YES (supersedes) |
| REQ-131 (`request-5d3bf630`) | free_and_reconciled | 2026-08-11 | The per-turn reminder carries the change signal — landed under CAP-99 / STORY-115 (`capability-702b7c02`), not here | YES (elsewhere) |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-143 (`request-18a48d63`) | free_and_reconciled | 2026-08-15 | The account-scoped D1/R2 site store the transcript is written through (CAP-101 / STORY-121) | YES (substrate) |
| REQ-146 (`request-0cdfdc5b`) | free_and_reconciled | 2026-08-15 | The host moves into workerd: AC1–AC7; the transcript "reconciles with REQ-143 rather than adding a store"; transcripts/audit outside `draft/`; the one-host-per-isolate deviation stated in its own §"What landed" | YES |
| REQ-149 (`request-554ac441`) | free_and_reconciled | 2026-08-17 | Follow-up AC13: the deploy asks the deployment whether the secret is in place rather than the shell | YES |
| BUG-38 (`bug-a98fb3b0`) | free_and_reconciled | 2026-08-24 | Deleted the per-isolate `minted` registry; resolution made durable and account-scoped via `SiteStore.hasDraft` | YES (supersedes AC-1055's earlier verification) |
| BUG-39 (`bug-23d1ec27`) | bundled | 2026-08-24 | The model double must speak the streaming contract | imminent |
| REQ-162 (`request-13a5e206`) | free_and_reconciled | 2026-08-31 | Product ticket store + chat schemas in the TypePack — but **chat-session migration into the store is explicitly out of scope** (body §"Out of scope" and §"Not done here") | YES (no ask against this capability) |
| REQ-158 / REQ-159 / REQ-160 | draft | 2026-08-28→31 | KB in the Worker, tenant-scoped corpus, session seeding & turn reminders | NO (not yet active) |

**Retirements walked.** REQ-127 retired REQ-122's site-named turn; REQ-122's
`storage/chat` answer was superseded by REQ-146's store-backed archive; BUG-38 retired
REQ-127's "an id this process minted" authority test. All three are correctly recorded in
the body's *Intent supersession* and *Reconciliation Decisions* sections.

**REQ-162 checked, not assumed.** It is the only reconciled intent after BUNDLE-21, and it
merges the chat schemas into the product TypePack — which would make this story's continuity
criteria stale if it had moved the transcript. It did not: its body puts "Migrating existing
chat sessions into the store" out of scope ("Chat currently lives elsewhere") and repeats it
under *Not done here*. Verified against the code: `apps/control-app/src/ai.ts:197` still
builds `archive: new R2TranscriptArchive(env.SITES, tenantId)`, and the only reference to
`TicketSessionArchive`/`chat_transcript` in the tree is a comment in
`apps/control-app/src/tickets.ts:155-156` describing the schemas. The `chat_transcript`
comment in REQ-162's evidence line is a TypePack-validation fixture, not the live path.
AC-1057 is current.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-103 (`story-a58a0974`, `upgrade`) | REQ-122, REQ-123, REQ-126, REQ-127, REQ-143, REQ-146, REQ-149, BUG-38, BUG-39 (imminent) | **coverage** and **exclusivity** aligned, no gaps; one **consistency** defect in the body (finding 1) |

**Coverage — verified, no gaps.** Every reconciled/imminent ask is expressed in the tree:

- REQ-122 → AC-1051 (roles), AC-1052 (open), AC-1053 / AC-1054 (turn), AC-1056 (per-site
  isolation), AC-1057 (transcript), AC-1058 (declared tools), AC-1059 / AC-1060 / AC-1061
  (failure). Its priming layer 3 (the per-turn reminder) is expressed under CAP-99 /
  STORY-115 where REQ-131 put it; `host-core.ts:451-455` keeps `reminders` a channel
  distinct from the priming tiers, so the body's "map → role → manual" ordering is not
  contradicted by it.
- REQ-123 → AC-1317 (same granted surface, gated, untrusted, audited), AC-1318 (read-only,
  both axes from one declaration), AC-1319 (map + manual, in order), AC-1320 (degradation).
- REQ-127 → AC-1053, AC-1055, AC-1058.
- REQ-146 AC1→AC-1404, AC2→AC-1057, AC3→CAP-92's AC-1411 (`story-93905de4`, audit
  durability — correctly out of scope per the capability body), AC4→AC-1408, AC5→AC-1407,
  AC6→AC-1406, AC7→CAP-92's AC-1074 (withholding an operation from a grant). Its
  stored-form and addressability consequences → AC-1405, AC-1409.
- REQ-149 AC13 → AC-1410.
- BUG-38 → AC-1055 (restated) + AC-1456.
- BUG-39 → evidence-shape only; creates no durable behavioural intent. The body's
  *Recorded caveat on evidence* and edge-runtime-double paragraphs already name the
  streaming double. Correctly absent from the criteria.

Both cross-capability landings were confirmed to exist rather than assumed: AC-1411 and
AC-1074 are both under `story-93905de4` (STORY-105, `capability-00e77e55`), and STORY-115
is under `capability-702b7c02`. No intent in the ledger is orphaned.

**Exclusivity — clean.** One story in the capability, so no intra-capability overlap. Every
neighbour the body names out of scope was confirmed to be a genuinely distinct owner:
STORY-104 (`story-7f437d57`, the pane), STORY-105 (`story-93905de4`, the control surface),
STORY-117 (`story-c4f329d3`, building the KB), STORY-121 (`capability-c4c7a854` = CAP-101,
the store), STORY-99 (`story-e674c60a`, the origin). Both neighbours that reference this
story do so as a dependency, not as overlapping ownership.

**Every ID/UID pair in the body was re-verified**, since one was wrong last round:
CAP-86 / `story-37a3921b` (= STORY-100 under `capability-f753cecd` = CAP-86) ✓;
CAP-85 / `story-e674c60a` (= STORY-99 under `capability-a994b8f3` = CAP-85) ✓;
STORY-117 / `story-c4f329d3` ✓; `capability-c4c7a854` = CAP-101, which is STORY-121's
capability ✓. All four correct.

## Prior-attempt verification

| Prior finding | Claim | State in the current body |
|---|---|---|
| 1 (violation) | "this repo has no tenancy yet" / "nothing tenant-scoped is claimed or built by this story" — false | **Repaired.** Neither clause occurs. The paragraph now reads "The system knowledge base sits above tenancy; the conversation does not", narrows the invariance claim to the corpus ("identical query text yields identical results for every account" — matching REQ-123's own "identical query text yields identical results across every tenant"), and states the contrast: the conversation is account-scoped and tenant-partitioned through the site's own store (REQ-143 / REQ-146), resolved against that account's storage (BUG-38). |
| 2 (warning) | `CAP-87` cited where CAP-86 was meant, twice | **Repaired.** `CAP-87` occurs zero times; both sites read `CAP-86 / story-37a3921b`, verified correct above. |
| 3 (warning) | In-scope bullet claimed "how a failure is reported" is "the same either way", contradicting the per-origin BUNDLE-21 decision | **Repaired.** The bullet now reads "A failure is reported honestly on both — never dressed as the assistant having tried — in the shape that origin's own answer takes; the shapes themselves differ, and are stated per origin under *Reconciliation Decisions* below." |

The guardrail paragraphs the prior report told the editor to leave alone are intact and
still accurate: "one conversation host per isolate" matches REQ-146's own §"What landed"
("The chat host is one per isolate, not per request… on these two routes only"), and "that
cache is a cache of hosts, not of conversations" matches BUG-38's fix as written.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-103, *Description* → In scope, bullet "What the assistant is told about itself, and what it can look up" | story-body-edit | The bullet opens "the priming is generated rather than hand-written". REQ-122 (free_and_reconciled, 2026-08-07) §"Priming: three layers, **one hand-written**" designs the opposite for the layer this bullet is named after: layer 1 is "**The system preamble** (`ai/roles.ts`) — who the assistant is and how it works", hand-written deliberately, and it "deliberately does not enumerate the tools". The code agrees: `tools/generate/src/cli/ai/roles.ts:38` `CARETAKER_SYSTEM` is hand-authored prose, and `host-core.ts:443-446` enters it as the **first** priming entry, ahead of the generated documents. The clause is wrong exactly where it is load-bearing — the bullet's subject is "what the assistant is told about itself", which is the hand-written preamble's job, while what is actually generated is the tool inventory and the corpus map. The body's own *Technical Context* states it correctly 90 lines later ("Neither **document** is hand-authored prose **about the tools**"), so the body contradicts itself and the unqualified summary is the sentence an AC author reads first. | Narrow the clause to its real subject: what the assistant is told about its *tools and the corpus* is generated rather than hand-written — the manual projected from the operations actually granted, the map generated from the corpus. Leave the hand-written role preamble standing as REQ-122 designed it, and consider naming it explicitly as the deliberately-authored tier so a future AC author does not read the bullet as a prohibition on it. No AC changes: AC-1319 is already worded precisely and is not affected. |
| 2 | info | — | STORY-103 `fields.updated_by` | — | The field holds the scalar `"bundle-78f4e2fe"` (BUNDLE-21) alone, while the body records reconciliation decisions from BUNDLE-20 (`bundle-b3b7c399` — REQ-143 / REQ-146 / REQ-149) as well. Neighbouring stories carry lists (STORY-105 `["bundle-b3b7c399"]`, STORY-121 `["bundle-78f4e2fe","request-13a5e206"]`), so the field is a list elsewhere in this store. Recorded, not raised as a warning: scalar `updated_by` is common across this store (STORY-99, STORY-100), which points at a write path that overwrites rather than appends — a tooling behaviour, not matrix drift. The body's own provenance is complete and correct. | none — ledger entry so a future check reading only the fields knows BUNDLE-20 touched this story |

## Notes for the Editor

- **This level passes.** The single finding is a warning and may be repaired
  opportunistically; it does not block. No AC needs adding, editing or deprecating, no
  test or production code is implicated, and coverage and exclusivity both pass cleanly —
  do not open ACs off the back of this report.
- **Finding 1 is the same *shape* as the prior round's finding 3, in a different bullet.**
  Both are unqualified summary sentences in the *In scope* list that a precise paragraph in
  *Technical Context* later contradicts. If a fourth attempt is spent here, the durable
  repair is to read the In-scope bullets as a set against the Technical Context paragraphs
  they summarise, rather than patching one sentence at a time. No other bullet was found
  to have this defect on this pass — the other six were each checked against their
  paragraph.
- **Two body claims were spot-checked against code and are correct — leave them alone.**
  (a) The *Recorded caveat on evidence* ("a stand-in embedding model at the single model
  boundary"): `tests/reconciliation-assistant-conversation-knowledge.test.ts:51-59` states
  exactly this, one stand-in named through the `LAGRANGE_KM_EMBEDDER` seam, everything else
  real. Note this does **not** contradict REQ-123 §4's "No local stand-in embedder" — that
  is a statement about the shipped product's embedder, not about test doubles at an
  external boundary. (b) `provenance: untrusted` in AC-1317 traces to REQ-126 §4 and is
  present in `tools/generate/src/cli/ai/l1-surface.json` on every read op.
- **BUG-39 is `bundled` (imminent, not reconciled).** Its body flags the REQ-127 / AC-1055
  "derivable is not the same as issued" conflict as operator-pending; that decision has
  since been taken and is recorded in this story's BUNDLE-21 reconciliation (AC-1055's
  earlier verification is deliberately the accepted case now). No action — recorded so a
  future check does not re-litigate it.
- **REQ-158 / REQ-159 / REQ-160 remain `draft` and were excluded.** They would materially
  change the knowledge and priming criteria. In particular REQ-159 makes the corpus itself
  tenant-scoped, which is precisely the claim the last fix narrowed to "the corpus does not
  vary by account" — so the *system knowledge base sits above tenancy* paragraph and
  AC-1320 will both need revisiting when they land.

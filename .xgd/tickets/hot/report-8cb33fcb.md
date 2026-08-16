---
uid: report-8cb33fcb
id: REPORT-2069
type: report
title: 'Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations (level=ac)'
created_by: xgd
created_at: '2026-08-16T04:59:30.759515+00:00'
updated_at: '2026-08-16T04:59:30.759515+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-7e4714b7
  level: ac
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Anchor report: report-7ef6a9ea. Capability: capability-7e4714b7 (CAP-90).
Matrix at this level: one story — STORY-103 (story-a58a0974, `story_kind=feature`,
status `completed`) — carrying 11 ACs, AC-1051 … AC-1061, all `active`, none
deprecated. Being a `feature` story, ACs are expected and present.

The story-level cycle for this capability ran first and passed:
**report-77dee8aa (REPORT-2068, level=story, PASS, 0 violations / 4 warnings)**.
Per the level cascade, STORY-103's body is the working reference here; the intent
ledger was consulted only where the story body is silent or where an AC clause
makes a claim the body does not (findings 1–3).

## Cumulative Intent Considered

Reproduced from the story-level ledger (report-77dee8aa) and re-verified against
the tickets; STORY-103's `intent_uid` is `bundle-e59210c5` (BUNDLE-17,
`free_and_reconciled`, merged `0198704b7e29db3c53cf569070042cec0eb467bc`).

| Intent ID | UID | Status | When | Asked / changed (as it bears on the AC layer) | Counts? |
|---|---|---|---|---|---|
| REQ-122 | request-58b6a329 | free_and_reconciled | 2026-08-07 | Founding intent: three routes (`/api/ai/roles`, `/api/ai/session`, `/api/ai/prompt`); one session per site, persisted and replayed; structural site binding; **priming in three layers** (preamble, generated manual via `ContextSource`, per-turn reminder never written to the transcript); refusals correctable within the turn; missing key explained without losing the transcript; mid-turn failure inside the stream. | YES |
| REQ-126 | request-d9407f80 | free_and_reconciled | 2026-08-08 | Built the control surface (CAP-92). Consequence here: per-call `path`/`hint` no longer reach the model — the Toolbox renders the declared error-class meaning. | YES (side effect) |
| REQ-127 | request-22a6521a | free_and_reconciled | 2026-08-08 | Amends REQ-122: withdraws `{slug, text}` and its own scope-predicate clause; `/api/ai/prompt` takes `{sessionId, text}`; an unminted id is refused, not treated as a key; `/api/ai/session {slug}` is the only place a site becomes a session; transcript-archive migration puts both tiers under the workspace. | YES |
| REQ-131 | request-5d3bf630 | ready_to_reconcile | 2026-08-11 | Part 3 lands here: draft-counter change signal carried in the per-turn reminder (its AC 9). | imminent — flagged, NOT to be authored yet |
| REQ-123 | request-488d874b | free_coded | 2026-08-07 | System KB would replace the priming `ContextSource`. Verified still absent at HEAD (`tools/generate/src/cli/ai/host.ts:251-260` primes from `{documents: () => [box.manual()]}`). | pending — flagged, not enforced |
| REQ-146 | request-0cdfdc5b | draft | 2026-08-15 | Would move the AI host into workerd. | NO (draft) |

Other BUNDLE-17 sources (REQ-119, REQ-121, REQ-128, REQ-129, REQ-130) resolve to
other capabilities and make no ask against CAP-90's AC layer.

## Alignment Ledger

Each AC against the story-body clause it serves, and the intent behind it.

| Element | Intents aligned to | Story-body clause served | Outcome |
|---|---|---|---|
| AC-1051 (asking what the assistant is) | REQ-122 (`GET /api/ai/roles`) | In scope → "Asking what the assistant is" | aligned in substance; one over-claiming clause (finding 2) |
| AC-1052 (opening a conversation for a named site) | REQ-122, REQ-127 (`/api/ai/session {slug}` is the only place a site becomes a session) | In scope → "Opening a conversation for a site" | aligned — identifier, ordered/attributed turns, readiness+reason, empty-is-normal, and re-open-is-same-conversation all present |
| AC-1053 (a turn names a conversation, not a site) | REQ-127 (supersedes REQ-122's `{slug, text}`) | In scope → "Running a turn" / "Binding" | aligned on the withdrawal; one over-claiming clause (finding 3) |
| AC-1054 (activity + text streamed, exactly one completion, change in the draft) | REQ-122 | In scope → "Running a turn" | aligned |
| AC-1055 (an identifier the origin never issued is refused) | REQ-127 ("an id it did not mint is refused") | In scope → "Honest failure" (4th clause) | aligned — and turns REQ-122's *withdrawn* derived-id scheme into a negative assertion ("including one matching the form the origin itself would produce") |
| AC-1056 (two sites are two conversations) | REQ-122 | In scope → "Binding" / "Continuity" | aligned |
| AC-1057 (stored with the workspace, replayed after restart) | REQ-122, REQ-127 (`logDir` explicit, both tiers under `sessionsDir`) | In scope → "Continuity" | aligned — "not in a machine-wide location shared across checkouts" is exactly REQ-127's fold-in |
| AC-1058 (only granted operations; no filesystem; no site parameter; priming from the grant) | REQ-122 §Priming (layers 1–2), REQ-127 | In scope → "Binding"; Description → "what the assistant is told about itself" | partial — priming layer 3 (the per-turn reminder, and that it never enters the transcript) unexpressed (finding 1) |
| AC-1059 (a refusal the assistant can correct within the turn) | REQ-122, REQ-126, REQ-127 | In scope → "Honest failure" (1st clause) | aligned — asserts the class-level property only, matching the story's "Known divergence, recorded not absorbed" note; correctly does NOT claim the per-call path/hint REQ-126 removed |
| AC-1060 (an assistant that cannot run, explained without losing the conversation) | REQ-122 | In scope → "Honest failure" (2nd clause); "Continuity" → "never sacrificed to report an unrelated failure" | aligned |
| AC-1061 (failure after streaming begins delivered inside the stream) | REQ-122 | In scope → "Honest failure" (5th clause) | aligned |
| — (no element) | REQ-131 Part 3 / its AC 9 | — | gap, imminent — correctly absent; do not author before reconcile |

**Coverage of the story body is complete.** Every in-scope clause of STORY-103
has at least one AC, and every AC traces to a clause: asking (1051), opening
(1052), running a turn (1053, 1054), binding (1053, 1056, 1058), continuity
(1052, 1057, 1060), honest failure (1055, 1059, 1060, 1061). No AC describes
behaviour a reconciled intent retired.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-1058 | ac-edit | REQ-122 §Priming (reconciled) specifies **three** layers; AC-1058 expresses two — "assembled from the operations it was actually granted" (layer 2) and "its priming names the site it is working on". The third — a short reminder **re-applied every turn** through the system channel and **never written to the transcript** — is unexpressed anywhere in the AC layer, although it exists in code (`tools/generate/src/cli/ai/roles.ts:93` `caretakerReminder`, applied at `tools/generate/src/cli/ai/host.ts:261`) and is what makes AC-1058's own "names the site it is working on" true. This is the AC-layer half of story-level finding 2 in report-77dee8aa (which repairs the story body). | Extend AC-1058's criterion with the reminder as a named layer: a short per-turn reminder, re-applied on every turn, naming the site under work, that never becomes part of the transcript the operator is shown. Add the transcript-exclusion assertion to its Verification. Do **not** add REQ-131's change signal — that is `ready_to_reconcile` and belongs to its reconcile. |
| 2 | warning | consistency | AC-1051 | ac-edit | The criterion's closing clause — "The answer is the same whether or not any conversation has ever been opened" — is not true of the answer as delivered, and is not a claim STORY-103's body makes. `aiStatus` returns `{roles, backends, ready, error?}` (`tools/generate/src/cli/ai/host.ts:397-410`), and `backends` is `lib.availableBackends()` over a **global** registry that gains `claude+site:<slug>` when a conversation is opened (`host.ts:231` via `siteBackendName`, `host.ts:115`). Role and readiness are invariant; the payload is not. AC-1051's own Verification never checks the clause (it only drives a fresh origin), so nothing at the UAT layer can catch the over-claim. | Narrow the clause to what is both intended and true: "The role it names and whether it can run do not depend on any conversation having been opened, and asking creates none." |
| 3 | warning | consistency | AC-1053 | ac-edit | The criterion says a malformed turn is refused "— identifying which value is missing —". The origin answers a single fixed string, `'sessionId and text are required'` (`tools/generate/src/cli/builder.ts:325-327`), which names both required values without distinguishing which one was absent. AC-1053's own Verification asks only that "the refusal names the missing conversation identifier", so the criterion over-claims relative both to the implementation and to its own verification. | Reword to "…is refused as a malformed request naming the values a turn requires, before any turn begins." The substantive property (refused before anything begins, draft byte-identical) is unaffected. |
| 4 | info | exclusivity | AC-1051 + AC-1060 | — | Both criteria speak about the capability answer reporting unreadiness with a reason. This is a division of cases, not a duplicate: AC-1051 owns the shape of the answer and verifies the ready path; AC-1060 owns the unready path end-to-end (transcript preserved, credential named, capability answer agreeing). No repair. | none |
| 5 | info | exclusivity | AC-1053 + AC-1055 | — | Adjacent but disjoint failure classes, and correctly so: AC-1053 is a malformed request (no conversation named → 400, `builder.ts:325`); AC-1055 is a well-formed request naming an id the host never minted (→ 404 before any event, `host.ts:390`, `builder.ts:198-205`). Different trigger, different answer, different evidence. No repair. | none |
| 6 | info | consistency | AC-1059 | — | Correct handling of the REQ-126 divergence: the criterion asserts "a named failure class and a statement of what to do instead" and stops there, rather than restating REQ-122's per-call "code, path and hint". This matches the story's Technical Context note and the code (`toolbox.ts` renders the declared class meaning). No repair. | none |
| 7 | info | coverage | — (no element) | — | Nothing in the AC layer says what opening a conversation for a slug the origin does not host should do; `openSession` mints an id first (`host.ts:351`) and any failure surfaces as `ready: false` with whatever message the Toolbox construction produced. Not scored as a gap: no reconciled intent, the capability body and STORY-103 are all silent on unknown sites, so there is no intent for the matrix to be drifting from. Recorded so a future check does not re-derive it. | none |

## Notes for the Editor

- **Nothing here is a violation, and no AC needs deprecating.** All three
  warnings are expression precision inside an AC body; none changes what the
  capability claims to do, and none blocks the level.

- **Findings 2 and 3 are the same shape.** In both, an AC's criterion carries a
  clause stronger than (a) the story body, (b) the implementation, and (c) the
  AC's own Verification section. That third point is what makes them worth
  repairing at this level rather than leaving to the UAT cycle: a clause no
  verification exercises cannot be caught downstream, so the AC text is the only
  place the drift is visible.

- **Finding 1 should be repaired together with story-level finding 2 of
  report-77dee8aa**, in that order — the story bullet first, then AC-1058 —
  because the AC is meant to express a story clause that does not exist yet. Both
  are against already-reconciled REQ-122, so this is not front-running an intent.

- **Do not author REQ-131 or REQ-123 behaviour.** REQ-131 (`ready_to_reconcile`)
  extends exactly the reminder seam finding 1 names, and REQ-123 (`free_coded`)
  replaces the `ContextSource` behind layer 2. Both are still pending; adding
  their asks now would create drift in the opposite direction. Repairing finding
  1 now is what reduces REQ-131's reconcile to one added AC.

- **AC-1055 is worth preserving verbatim through any future edit.** Its clause
  "including one matching the form the origin itself would produce for a site" is
  the matrix's only record that REQ-122's derived-id addressing was withdrawn by
  REQ-127; softened to a generic "an unknown identifier", the withdrawal would
  stop being visible in the matrix at all.

---
uid: report-77dee8aa
id: REPORT-2068
type: report
title: 'Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations (level=story)'
created_by: xgd
created_at: '2026-08-16T04:50:41.547173+00:00'
updated_at: '2026-08-16T04:50:41.547173+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-7e4714b7
  level: story
  violations: 0
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: AI Site Assistant: Per-Site Conversations
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 4
**Needs review**: 0

Anchor report: report-7ef6a9ea. Capability: capability-7e4714b7 (CAP-90).
Matrix at this level: one story, STORY-103 (story-a58a0974, `story_kind=feature`,
status `completed`), carrying 11 active ACs (AC-1051 … AC-1061).

## Cumulative Intent Considered

STORY-103's `intent_uid` is `bundle-e59210c5` (BUNDLE-17, `free_and_reconciled`,
merged at `0198704b7e29db3c53cf569070042cec0eb467bc`). The bundle carries eight
source requests; three of them touch this capability. Two later requests touch it
and are not yet reconciled. Ordered chronologically by `created_at`:

| Intent ID | UID | Status | When | Asked / changed (as it bears on CAP-90) | Counts? |
|---|---|---|---|---|---|
| REQ-122 | request-58b6a329 | free_and_reconciled | 2026-08-07 | Founding intent. Three routes on the builder origin (`/api/ai/roles`, `/api/ai/session`, `/api/ai/prompt`); one session per site, persisted and replayed; site binding structural (tools close over the slug, derived session id); priming in three layers (system preamble, generated tool manual via `ContextSource`, per-turn reminder never written to the transcript); failures reported not swallowed (refused tool correctable within the turn, missing API key explained without losing the transcript, mid-turn failure delivered inside the stream); transcripts stored beside the store. Non-goals: KB retrieval, structural L1 edits. | YES |
| REQ-126 | request-d9407f80 | free_and_reconciled | 2026-08-08 | Built the L1 control surface (CAP-92's subject). Its consequence *here*: per-call `path`/`hint` no longer reach the model — the Toolbox renders the declared error-class meaning instead. | YES (side effect) |
| REQ-127 | request-22a6521a | free_and_reconciled | 2026-08-08 | Amends REQ-122. **Withdraws** its own scope-predicate clause (a `slug` parameter would re-open an error class that does not exist) and **withdraws** REQ-122's `{slug, text}` turn shape: the binding is *located* in the session. `/api/ai/prompt` takes `{sessionId, text}`; an id the host did not mint is refused rather than treated as a free-form key; `/api/ai/session {slug}` is the only place a site becomes a session. Folds in the upstream transcript-archive migration (`FileStore`→`FileArchive`, `getSession` not `resume`, `logDir` passed explicitly so both tiers sit under the workspace rather than `~/.xgd/sessions/live`). | YES |
| REQ-131 | request-5d3bf630 | ready_to_reconcile | 2026-08-11 | Draft change journal. Part 3 lands **in this capability**: the host records the draft counter at each turn boundary and, when it differs, `caretakerReminder()` carries a line saying the site changed and how many edits landed (its AC 9). Parts 1–2 land in the write path / control surface. | imminent — flagged, not enforced |
| REQ-123 | request-488d874b | free_coded | 2026-08-07 | System KB. Its §3 wiring makes `KnowledgeDocs` the chat session's priming `ContextSource` — i.e. it replaces what REQ-122 deliberately left as "role preamble plus generated manual until a corpus exists". Not yet reconciled; verified absent from main (`tools/generate/src/cli/ai/host.ts:191-195` still records the KB as arriving later through that seam). | pending — flagged, not enforced |
| REQ-146 | request-0cdfdc5b | draft | 2026-08-15 | "The AI host and publish move into workerd" — would relocate this capability's runtime. | NO (draft) |

Other requests in BUNDLE-17 (REQ-119, REQ-121, REQ-128, REQ-129, REQ-130) resolve
to CAP-85/86/87/93/94 and make no ask against this capability.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-103 (story-a58a0974) | REQ-122, REQ-126 (consequence), REQ-127 | aligned on substance. Body follows the *later*, amended intent throughout: a turn is addressed to a conversation (REQ-127) rather than `{slug, text}` (REQ-122, withdrawn); the binding is located in the session rather than declared as a scope predicate (REQ-127's own withdrawal); the transcript-archive migration's observable consequence (both tiers under the workspace) is what the continuity clause is written against. Both supersessions are recorded explicitly in Technical Context rather than silently absorbed. Four cross-reference / coverage warnings below. |
| AC-1051 (asking what the assistant is) | REQ-122 `GET /api/ai/roles` | aligned |
| AC-1052 (opening a conversation for a named site) | REQ-122, REQ-127 (`/api/ai/session {slug}` is the only place a site becomes a session) | aligned |
| AC-1053 (a turn names a conversation, not a site) | REQ-127 (supersedes REQ-122's `{slug, text}`) | aligned — encodes the withdrawal correctly |
| AC-1054 (streamed activity + text, exactly one completion, change in the draft) | REQ-122 | aligned |
| AC-1055 (an identifier the origin never issued is refused) | REQ-127 ("an id it did not mint is refused") | aligned — and explicitly covers an id "matching the form the origin itself would produce for a site", which is precisely REQ-122's now-superseded derived id |
| AC-1056 (two sites are two conversations) | REQ-122 | aligned |
| AC-1057 (stored with the workspace, replayed after restart) | REQ-122, REQ-127 (`logDir` explicit; "not in a machine-wide location shared across checkouts") | aligned |
| AC-1058 (only granted operations; no filesystem; no site parameter; priming from the grant) | REQ-122 §Priming (layers 1–2), REQ-127 | partial — covers the preamble/manual/absences and that priming names the site; the **per-turn reminder** as its own layer, and its property of never entering the transcript, are unexpressed (warning 2) |
| AC-1059 (a refusal the assistant can correct within the turn) | REQ-122, REQ-126, REQ-127 | aligned — asserts the class-level property (named failure class + what to do instead) and does not claim the per-call `path`/`hint` REQ-126 removed. The story records this as a known divergence rather than restating REQ-122's original wording. Correct handling. |
| AC-1060 (an assistant that cannot run, explained without losing the conversation) | REQ-122 ("read before the backend is touched and returned alongside the reason it is frozen"; `ANTHROPIC_API_KEY` requirement) | aligned |
| AC-1061 (failure after streaming begins delivered inside the stream) | REQ-122 ("a stream that simply stops leaves the panel spinning forever") | aligned |
| — (no element) | REQ-131 Part 3 / its AC 9 | gap, imminent (warning 3) |
| — (no element) | REQ-123 §3 wiring | pending, correctly absent today (info) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-103 | story-body-edit | Body cites "CAP-87 / story-37a3921b" **twice** (Out of scope → "The write path"; Technical Context → "the same validated, atomic write path the command line and the click-to-edit modal use"). The pairing is wrong: story-37a3921b is STORY-100, whose `capability_uid` is capability-f753cecd = **CAP-86, "Structured Copy Editing: One Validated, Atomic Write Path"**. capability-12fee326 (CAP-87) is "In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture" — the gesture, not the write path. CAP-92's STORY-105 names CAP-86 for this same dependency. | Replace both occurrences of "CAP-87 / story-37a3921b" with "CAP-86 / story-37a3921b (STORY-100)". Behaviour statements are correct; only the capability label is wrong. |
| 2 | warning | coverage | STORY-103 | story-body-edit | Priming is one of five scope bullets on capability-7e4714b7 ("what the assistant is told about who it is and what it can reach, assembled from the operations it was actually granted"), and REQ-122 §Priming specifies **three** layers: the system preamble, the generated manual through the `ContextSource` seam, and the per-turn reminder "re-applied every turn through the backend's system channel, never written to the transcript". STORY-103's in-scope list has no priming bullet at all — priming appears only in the Description's opening sentence ("what the assistant is told about itself"). AC-1058 carries layers 1–2 plus "its priming names the site it is working on"; nothing states the reminder is per-turn or that it stays out of the transcript. Not a false claim — an omission that leaves REQ-122 §Priming under-expressed at the story level. | Add an in-scope bullet: priming is three layers — a role preamble, a manual projected from the granted operations (never hand-maintained beside them), and a short per-turn reminder that is re-applied every turn and never becomes part of the transcript the operator sees. |
| 3 | warning | coverage | STORY-103 | story-body-edit (deferred to REQ-131 reconcile) | REQ-131 (ready_to_reconcile, 2026-08-11) Part 3 places behaviour squarely in this capability: the host holds the draft counter across turn boundaries and the per-turn reminder carries a change signal when it differs; its AC 9 is "a session whose site changed between turns receives the signal in its reminder; one whose site did not, does not". No element of CAP-90's story tree expresses the reminder as a per-turn mechanism, so REQ-131's ask has nowhere to land. Imminent, not yet enforced — do NOT author this behaviour into the matrix ahead of reconciliation. | On REQ-131 reconcile, extend the priming bullet added by finding 2 with the change-signal, and add an AC for its AC 9. Fixing finding 2 now is what makes that a one-line extension instead of a new scope bullet. |
| 4 | warning | consistency | STORY-103 | story-body-edit | Body defers scope to "plan item 6 of this bundle" (twice) and "plan item 5" for the sibling work. Those plan items are now real matrix elements — CAP-92 / STORY-105 (story-93905de4, "See everything an assistant can do to my site declared in one place…") and CAP-91 / STORY-104 (story-7f437d57, "See the conversation about the site I am looking at…"). A bundle-relative plan index is not resolvable by a later reader, and the story already uses UID citation for its other cross-references. | Replace "plan item 6 of this bundle" with "CAP-92 / story-93905de4" and "plan item 5" with "CAP-91 / story-7f437d57" (both in Out of scope; the second recurs in Dependencies). |
| 5 | info | consistency | STORY-103 / AC-1059 | — | The "Known divergence, recorded not absorbed" note is correct and load-bearing: REQ-122 said a refusal returns "code, path and hint"; REQ-126 removed the per-call path and hint from what reaches the model (REQ-127's fold-in section records the three REQ-122 host assertions being updated to it). AC-1059 asserts only the class-level property. Note that REQ-127's own "Unchanged and demonstrably so" paragraph still says refusals "carry code and hint" — that paragraph is superseded within the same ticket by its "Folded in" section. The matrix follows the later text. No repair. | none |
| 6 | info | exclusivity | STORY-103 vs STORY-104 / STORY-105 | — | No overlap. CAP-91's STORY-104 excludes "the routes, the session lifecycle, where the transcript is stored, how the assistant is primed, and what the stream carries"; CAP-92's STORY-105 excludes "the conversation that consumes the surface, its transport and its persistence (CAP-90)". The one adjacency — AC-1058's "priming … assembled from the operations it was actually granted" vs STORY-105's "Self-documentation" bullet — is a division of the same intent, not a duplication: STORY-105 owns *that the manual is a projection*, AC-1058 owns *that this session is primed with it*. Within CAP-90 there is a single story, so intra-capability exclusivity is vacuous. | none |
| 7 | info | coverage | STORY-103 | — | REQ-123 (free_coded) §3 makes `KnowledgeDocs` the chat session's priming source, which would supersede REQ-122's non-goal that STORY-103's Out of scope currently records ("priming is the role preamble plus the generated manual until a corpus exists; no retrieval is claimed here"). Verified against main: `tools/generate/src/cli/ai/host.ts:191-195` and `:260` still prime from `{documents: () => [box.manual()]}` and record the KB as arriving through that seam later. The story is correct as of the reconciled ledger. No repair now. | none |

## Notes for the Editor

- **Nothing here is a violation.** Every reconciled intent's ask is expressed
  somewhere in the story tree, no element describes behaviour a reconciled intent
  retired, and the two supersessions in this capability's history (REQ-122's turn
  shape, REQ-127's own scope-predicate clause) are both correctly encoded — most
  visibly in AC-1055, which turns the *withdrawn* derived-id scheme into a
  negative assertion. All four warnings are cross-reference or expression
  precision, not drift in what the capability claims to do.

- **Findings 2 and 3 are one thread.** The per-turn reminder exists in the code
  (`tools/generate/src/cli/ai/roles.ts:93` `caretakerReminder`, applied at
  `host.ts:261`) and in REQ-122's intent, but has no home in the story body. It
  is also the exact seam REQ-131 extends and the exact seam REQ-123 replaces —
  two pending intents both landing on an unexpressed part of the matrix. Adding
  the priming bullet now (finding 2, against already-reconciled REQ-122) is what
  keeps both of those reconciles to a sentence each.

- **Do not repair findings 3 and 7 now.** REQ-131 is `ready_to_reconcile` and
  REQ-123 is `free_coded`; authoring their behaviour into the matrix before
  reconciliation would create the drift this check exists to detect, in the
  opposite direction.

- **One phrasing worth watching, deliberately not raised as a finding.** The
  Binding bullet says "Nothing above the host names a site", while the Opening
  bullet says naming a site is how a conversation begins — and REQ-127 explicitly
  keeps `app.js` naming the slug on a site change. Read together the meaning is
  unambiguous (nothing above the host names a site *when running a turn*), and
  the capability body states it precisely ("a turn names a conversation the host
  issued rather than a site or a free-form key"). If the body is being edited for
  findings 1/2/4 anyway, tightening the Binding bullet to "no turn above the host
  names a site" costs nothing.

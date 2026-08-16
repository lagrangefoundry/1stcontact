---
uid: report-6a3ffea2
id: REPORT-2071
type: report
title: 'UAT Coverage: AI Site Assistant: Per-Site Conversations'
created_by: xgd
created_at: '2026-08-16T05:10:11.723936+00:00'
updated_at: '2026-08-16T05:10:11.723936+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-7e4714b7
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: AI Site Assistant: Per-Site Conversations

**Result**: FAIL
**AC verdicts**: 10 pass, 1 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 0 pass, 1 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

Anchor report: report-7ef6a9ea. Capability capability-7e4714b7 (CAP-90,
`ai_site_assistant`). One story (STORY-103 / story-a58a0974, `story_kind=feature`,
status `completed`), eleven active ACs (AC-1051…AC-1061, all `kind=behavior`,
`regression_only=false`), eleven UATs — one per AC, all in
`tests/reconciliation-assistant-conversation.test.ts`.

**Test execution was not available in this session** (`npx vitest` / `npm test`
denied by the session's permission mode). Every verdict below is therefore a
judgment of what each UAT *observes* — read against the production code it drives
— not a report of a green run. The finding below was established by reading the
route handler, not by watching a test fail.

## Cumulative Intent Considered

STORY-103's `fields.intent_uid` is **bundle-e59210c5** (BUNDLE-17, status
`free_and_reconciled`, completed 2026-08-10, `merged_at_commit`
`0198704b7e29db3c53cf569070042cec0eb467bc`). It carries eight source requests,
embedded in full in the bundle body; the individual REQ tickets are not resident
in this regression worktree's ticket store, so their text was read there.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 | in bundle-e59210c5 (`free_and_reconciled`) | 2026-08-10 | Chat panel on a per-site AI session; declared tool surface (no filesystem tool, no HTML/CSS/JS write); persisted per-site transcript; failures reported not swallowed; three routes `roles` / `session` / `prompt`; site binding structural (closed-over slug, derived session id) | YES (partly superseded) |
| REQ-126 | in bundle-e59210c5 (`free_and_reconciled`) | 2026-08-10 | L1 control surface as declared Toolbox (`l1-surface.json`, `toolbox.ts`, `instances.json`); grant narrows the surface; binding stays construction-time — no `slug` parameter on any operation; error taxonomy promoted to the surface | YES |
| REQ-127 | in bundle-e59210c5 (`free_and_reconciled`) | 2026-08-10 | **Withdrew** REQ-122's `{slug, text}` turn and the browser-held site identity, and **withdrew its own** "binding becomes a declared scope predicate" clause; binding is *located* in the session; `POST /api/ai/prompt` takes `{sessionId, text}`; an id the host did not mint is refused rather than treated as a free-form key; `POST /api/ai/session {slug}` is the only place a site becomes a session; transcripts moved under the workspace | YES (supersedes REQ-122) |
| REQ-119, REQ-121, REQ-128, REQ-129, REQ-130 | in bundle-e59210c5 (`free_and_reconciled`) | 2026-08-10 | Request-time render, copy-edit modal, background image picker, verbatim `get_l1`/`set_l1`, beyond-L1 authoring — other plan items of the same bundle | YES (none addressed to this capability's conversation host) |

Both supersessions are recorded verbatim in the STORY-103 body ("Intent
supersession within this bundle"; "Known divergence, recorded not absorbed"), and
the AC set follows the later, amended intent. Checked explicitly: **no AC asserts
retired behavior** — none claims the withdrawn `{slug, text}` turn shape (AC-1053
asserts it is *refused*), none claims the withdrawn scope predicate, and AC-1059
asserts the named refusal class rather than the per-call path/hint REQ-126 stopped
delivering. No AC is unsupported by the ledger; no `deprecated` or `needs_review`
verdict was warranted.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-103 (story-a58a0974) | REQ-122, REQ-126, REQ-127 | aligned, one coverage gap | Body matches cumulative intent, including both recorded supersessions. Verdict `fail` is a coverage gap inside its own AC set (finding 1), not staleness. |

## Evidence quality (why ten of eleven pass)

All eleven UATs drive real HTTP against a real `startBuilder` origin. The single
double is the Anthropic client, injected through `setModelClient` — documented in
`tools/generate/src/cli/ai/host.ts:85-95` as "a TEST SEAM, and the only one this
module has", at the genuine network boundary and therefore permitted by the
thin-mock strategy. Verified as production code, not test scaffolding:

- `sessionsDir` (`host.ts:138`), `sessionIdFor` (`host.ts:127`) and `resetAiHost`
  (`host.ts:414`, clears `managers` + `minted`) are real, so AC-1057's
  "stored with the workspace" and "restart" assertions read real consequences.
- The host builds its tool list from `createL1Toolbox(slug, opts, …)`
  (`host.ts:214`) and `box.schemas()` (`host.ts:227`) — the same projection
  AC-1058's UAT compares against, so that assertion tracks the real grant rather
  than a restated list.
- The three routes are real (`builder.ts:304`, `:309`, `:323`).

Assertions read consequences, not calls: draft bytes on disk, transcript files
under the workspace cwd, HTTP status and content-type, and frames on the wire.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | uat | AC-1053 (acceptance_criterion-33328c06) | uat-edit (+ likely code-fix) | AC-1053 requires a malformed turn to be refused "identifying which value is missing". `builder.ts:326` answers every malformed case with the **constant** `{ error: 'sessionId and text are required' }`, which contains both tokens. The UAT's per-case check (`tests/reconciliation-assistant-conversation.test.ts:278`, `expect(error).toContain(names)` with `names` = `'sessionId'`/`'text'`) therefore **passes unconditionally** — it would pass just as well against an implementation that named the wrong missing value, or named neither specifically. The clause is undiscriminated. | Make the assertion discriminating: assert the refusal names the *missing* value and **not** the supplied one (e.g. for `{sessionId}` with no text, `error` mentions `text` and not `sessionId`). That will require `builder.ts:325-327` to report the specific missing field rather than a constant — flagged because the fix is likely in production code, not only in the test. |
| 2 | warning | uat | AC-1051 (acceptance_criterion-fe61861f) | uat-edit | AC-1051's criterion says the capability answer "is the same whether or not any conversation has ever been opened". The UAT (`:209`) only queries a fresh origin with no conversation. The invariance is exercised in the *not-ready* state by AC-1060 (`:511`), never in the ready state. | Optional strengthening: after speaking a turn, re-query `GET /api/ai/roles` and assert the answer is unchanged. The AC's own Verification section prescribes only the fresh-origin check, which the UAT does satisfy — hence warning, not violation. |
| 3 | warning | story | STORY-103 (story-a58a0974) | none — visibility only | REQ-122 and REQ-127 both state a refused call returns its code, **path and hint** to the model. Since REQ-126 the per-call path and hint no longer reach it; the story body records this as "a loss of specificity it did not choose", raised upstream, and AC-1059 deliberately asserts only the named class plus a stated correction. | **No edit required.** Recorded so the divergence stays visible rather than fading into the matrix. Authoring an AC/UAT for the intent's literal wording would demand a test of behavior the intent itself acknowledges as not delivered. |

## Notes for the Editor

- **Only finding 1 blocks.** Ten of eleven ACs are covered by UATs that would
  genuinely fail against a wrong implementation; the story body is aligned with
  cumulative intent and needs no edit. The story and capability `uat_coverage`
  verdicts are `fail` solely to carry finding 1 up the aggregate.
- **Finding 1 is a two-sided fix.** Tightening only the test will turn it red,
  because the origin does not currently identify which value is missing. Expect
  the editor to touch `builder.ts:325-327` (split the two checks, name the field)
  and then the UAT. Nothing else in the AC-1053 case needs changing — its other
  assertions (400 rather than a stream, `application/json`, model never called,
  draft byte-identical, conversation neither started nor extended) are strong and
  already discriminating.
- **This run could not execute the suite** (permission mode). A regression run
  should confirm the ten `pass` verdicts correspond to a green file; nothing here
  claims they were observed passing.
- **The prior alignment report (report-8c3c08f8) overstated AC-1053** as "400 +
  JSON naming the missing value". It names both values, always. Worth knowing if
  that report is used as a source elsewhere.

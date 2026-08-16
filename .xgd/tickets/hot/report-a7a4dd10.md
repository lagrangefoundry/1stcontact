---
uid: report-a7a4dd10
id: REPORT-2073
type: report
title: 'UAT Coverage: AI Site Assistant: Per-Site Conversations'
created_by: xgd
created_at: '2026-08-16T05:23:49.295258+00:00'
updated_at: '2026-08-16T05:23:49.295258+00:00'
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
`ai_site_assistant`). One story (STORY-103 / story-a58a0974, `story_kind=feature`),
eleven active ACs (AC-1051…AC-1061, all `kind=behavior`, `regression_only=false`),
eleven UATs — one per AC, all in `tests/reconciliation-assistant-conversation.test.ts`.

This is **attempt 2**. Attempt 1's coverage report (report-6a3ffea2) raised one
violation and two warnings; the fix session (report-bf743c18) applied all three and
set AC-1053 and STORY-103 to `pass`. This round re-judges the matrix independently
against the amended code and tests.

> **Execution was again unavailable.** `npx vitest run` and
> `./node_modules/.bin/vitest run` were both denied by this session's permission mode
> (as was `node -e`, and any read outside the worktree). Every verdict below is a
> judgment of what each UAT *observes*, read against the production code it drives —
> **not a report of a green run**. Nothing here claims a test was seen to pass or fail.
> The `@lagrangefoundry/ai` library these routes load lives in the out-of-repo shared
> store (`webui.ts` §"THE CONSUMPTION ROUTE") and is unreadable from this worktree, so
> finding 1 is grounded in the host's own comments about that library rather than in
> its source.

## Cumulative Intent Considered

STORY-103's `fields.intent_uid` is **bundle-e59210c5** (BUNDLE-17, status
`free_and_reconciled`, completed 2026-08-10, `merged_at_commit`
`0198704b7e29db3c53cf569070042cec0eb467bc`). It carries eight source requests whose
text is embedded in the bundle body; no individual `requirement` ticket is resident in
this worktree's store (`xgd ticket list --type requirement` → 0 items), so the bundle
body is the ledger. No later intent in the store touches this capability.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 | in bundle-e59210c5 (`free_and_reconciled`) | 2026-08-10 | Per-site AI session behind three routes (`roles` / `session` / `prompt`); declared tool surface with no filesystem tool; persisted per-site transcript; failures reported, never swallowed; site binding structural (closed-over slug, derived session id) | YES (partly superseded) |
| REQ-126 | in bundle-e59210c5 (`free_and_reconciled`) | 2026-08-10 | L1 control surface as a declared Toolbox (`l1-surface.json`, `toolbox.ts`, `instances.json`); the grant narrows the surface; binding stays construction-time — no `slug` parameter on any operation; error taxonomy promoted to the surface | YES |
| REQ-127 | in bundle-e59210c5 (`free_and_reconciled`) | 2026-08-10 | **Withdrew** REQ-122's `{slug, text}` turn and the browser-held site identity, and **withdrew its own** "binding becomes a declared scope predicate" clause; the binding is *located* in the session; `POST /api/ai/prompt` takes `{sessionId, text}`; an id the host never issued is refused rather than treated as a free-form key; transcripts moved under the workspace | YES (supersedes REQ-122) |
| REQ-119, REQ-121, REQ-128, REQ-129, REQ-130 | in bundle-e59210c5 (`free_and_reconciled`) | 2026-08-10 | Request-time render, copy-edit modal, background image picker, verbatim `get_l1`/`set_l1`, beyond-L1 authoring — other plan items of the same bundle, none addressed to the conversation host | YES |

Both supersessions are recorded verbatim in the STORY-103 body ("Intent supersession
within this bundle"; "Known divergence, recorded not absorbed"), and the AC set follows
the later, amended intent. Re-checked this round: **no AC asserts retired behavior** —
none claims the withdrawn `{slug, text}` turn shape (AC-1053 asserts it is *refused*),
none claims the withdrawn scope predicate, and AC-1059 asserts the named refusal class
rather than the per-call path/hint REQ-126 stopped delivering. No AC is unsupported by
the ledger, so no `deprecated` or `needs_review` verdict is warranted.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-103 (story-a58a0974) | REQ-122, REQ-126, REQ-127 (via bundle-e59210c5) | aligned, one evidence defect | Body matches cumulative intent, including both recorded supersessions; **no story-body edit is required**. The `fail` verdict carries finding 1 up the aggregate, nothing else. |

## Evidence quality (why ten of eleven are `pass`)

All eleven UATs drive real HTTP against a real `startBuilder` origin. The single double
is the Anthropic client, injected through `setModelClient` — documented at
`tools/generate/src/cli/ai/host.ts:82-95` as "A TEST SEAM, and the only one this module
has", sitting at the genuine network boundary and therefore permitted by the thin-mock
strategy. Everything the assertions read is a consequence produced by real machinery:
draft bytes on disk (`headline()` / `draftBytes()`), transcript files under the
workspace cwd, HTTP status and content-type, and SSE frames on the wire.

Re-verified this round as production code, not test scaffolding: `sessionsDir`
(`host.ts:138`), `sessionIdFor` (`host.ts:127`), `resetAiHost` (`host.ts:414`, clearing
`managers` + `minted`), the grant projection `createL1Toolbox(...).schemas()`
(`host.ts:214-230`) that AC-1058 compares against, and the three routes
(`builder.ts:304`, `:309`, `:323`).

**Attempt 1's blocking finding is genuinely closed.** `builder.ts:329-335` now builds a
`missing` list from two independent checks and emits `sessionId is required` /
`text is required` / `sessionId and text are required`. Traced against AC-1053's four
cases (`tests/reconciliation-assistant-conversation.test.ts:277-300`), each
`toContain(missing)` / `not.toContain(supplied)` pair is now discriminating: `{slug,
text}` and `{text}` produce a message containing `sessionId` and not `text`;
`{sessionId}` produces one containing `text` and not `sessionId`; `{}` names both. The
old constant would fail three of the four. AC-1053 → `pass`.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | uat | AC-1051 (acceptance_criterion-fe61861f) | uat-edit | The invariance assertion added by attempt 1 (`tests/reconciliation-assistant-conversation.test.ts:232-234`) compares the **whole** `/api/ai/roles` payload before and after a real turn — `expect(await after.json()).toEqual(status)`. That payload includes `backends`, which `aiStatus` fills from `lib.availableBackends()` (`host.ts:407`). The fix session's stated basis was that "`aiStatus` closes over no session state"; true, but `availableBackends()` reads the AI library's **global backend registry**, and running a turn writes to it: `build()` calls `lib.registerBackend(siteBackendName(slug), …)` (`host.ts:231`), i.e. `claude+site:studio`. `host.ts:26-29` states the registry is global and per-site names exist precisely because of it, and `toolbox.ts:88-89` notes the library root "self-registers the provider backends" into that same registry. So the value very probably gains an entry across the turn and the comparison fails — and even if the library's `availableBackends()` happens to report something narrower, the assertion claims an invariance over a global registry that **the AC does not claim and the design does not guarantee**. It was added without any run behind it. | Narrow the comparison to the fields the criterion is about: capture `const { roles, ready, error } = status` before, and after the turn assert `toEqual({ roles: ['caretaker'], ready: true, error: undefined })` (or compare the three fields individually). Those three are provably invariant here — with `modelClient` injected, `aiStatus` never constructs a backend and returns `[CARETAKER_ROLE]` plus `ready: true`. Leave every other assertion in the case untouched; the fresh-origin half is correct and discriminating. |
| 2 | warning | uat | AC-1055 (acceptance_criterion-7b488315) | uat-edit | AC-1055's criterion covers three kinds of unissued identifier — invented, guessed/derivable, and "held over from before a restart". The UAT (`:336-343`) exercises the first two only. The third is the one a real browser produces (an id cached across an origin restart), and `resetAiHost()` clearing `minted` (`host.ts:414`) is exactly what makes it a miss. | Optional strengthening: open a conversation, `resetAiHost()`, then POST the previously issued id and assert the same 404 + JSON refusal. The AC's own Verification section prescribes only cases (a) and (b), which the UAT does satisfy — hence warning, not violation. |
| 3 | warning | story | STORY-103 (story-a58a0974) | none — visibility only | REQ-122 and REQ-127 both state that a refused operation returns its code, **path and hint** to the model. Since REQ-126 the per-call path and hint no longer reach it; the story body records this as "a loss of specificity it did not choose", raised upstream, and AC-1059 deliberately asserts only the named class plus a stated correction. | **No edit required.** Carried forward from report-6a3ffea2 so the divergence stays visible rather than fading into the matrix. Authoring an AC/UAT for the intent's literal wording would demand a test of behavior the intent itself records as not delivered. |

## Notes for the Editor

- **One finding blocks, and it is one line.** Ten of eleven ACs are covered by UATs
  that would genuinely fail against a wrong implementation, and the story body needs no
  edit. STORY-103 and the capability read `fail` solely to carry finding 1 upward.
- **Finding 1 is test-only.** Unlike attempt 1's finding, no production change is
  implied — `builder.ts` and `host.ts` are right; the assertion over-reaches. Do **not**
  weaken AC-1051's criterion to match: the invariance clause is real and worth proving,
  just over the role/readiness/reason the AC names rather than over the library's
  backend registry.
- **The pattern worth learning from.** Both rounds of trouble came from assertions
  written blind against an out-of-repo library (`@lagrangefoundry/ai`). When a UAT must
  assert on a value that library produces, prefer the fields this repo's own code
  computes (`roles`, `ready`, `error`, built in `host.ts:400-410`) over ones it merely
  forwards (`backends`).
- **Still no run.** Three consecutive sessions (alignment, fix attempt 1, this one) have
  been unable to execute `vitest`. Nothing in the matrix now rests on an observed green
  file. The regression stage that can execute should be treated as the first real
  confirmation of all eleven `test_UAT_AC105x/106x` cases, and finding 1 is precisely
  the case most likely to surface there.
- **Duplicate coverage, not a defect.** `tests/test_UAT_FC_REQ-122_chat_host.test.ts`
  covers much of the same ground and is *not* stale — it uses the REQ-127
  `{sessionId, text}` turn shape and opens a session first (`:100-128`). Recorded so a
  future pass does not mistake it for drift; consolidating the two is optional and out
  of scope here.

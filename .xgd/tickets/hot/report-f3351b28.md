---
uid: report-f3351b28
id: REPORT-2075
type: report
title: 'UAT Coverage: AI Site Assistant: Per-Site Conversations'
created_by: xgd
created_at: '2026-08-16T05:47:49.181102+00:00'
updated_at: '2026-08-16T05:47:49.181102+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-7e4714b7
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: AI Site Assistant: Per-Site Conversations

**Result**: PASS
**AC verdicts**: 11 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-7ef6a9ea. Capability capability-7e4714b7 (CAP-90,
`ai_site_assistant`). One story (STORY-103 / story-a58a0974, `story_kind=feature`),
eleven active ACs (AC-1051…AC-1061, all `kind=behavior`, `regression_only=false`),
eleven UATs — one per AC, all in `tests/reconciliation-assistant-conversation.test.ts`.

This is **attempt 3**. Attempt 2 (report-a7a4dd10) raised one violation (AC-1051,
`uat-edit`) and two warnings; the fix session (report-eebbff11) applied both
`uat-edit` findings and left the story body untouched, as directed. This round
re-judges the matrix independently against the amended tests.

> **Execution was unavailable — the fifth consecutive session.**
> `./node_modules/.bin/vitest run tests/reconciliation-assistant-conversation.test.ts`
> was denied by this session's permission mode, as were `grep` and shell `for` loops
> and heredocs. **Nothing below claims a test was seen to pass.** Each verdict is a
> judgment of what the UAT *observes*, read against the production code it drives,
> with every claim cited to `file:line` in this worktree. See "Notes for the Editor"
> — this is now a standing condition on this capability, not a footnote.

## Cumulative Intent Considered

STORY-103's `fields.intent_uid` is **bundle-e59210c5** (BUNDLE-17,
`free_and_reconciled`, completed 2026-08-10, `merged_at_commit`
`0198704b7e29db3c53cf569070042cec0eb467bc`). Its eight source requests ARE resident in
this store as `request` tickets (attempt 2 reported them absent — it searched
`--type requirement`; the type is `request`, and `xgd ticket get REQ-127` resolves to
`request-22a6521a`). Each was read directly this round rather than only through the
bundle body.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 | free_and_reconciled | 2026-08-07 | Per-site AI session behind three routes (`roles` / `session` / `prompt`); declared tool surface with no filesystem tool; persisted per-site transcript; failures reported, never swallowed | YES (partly superseded) |
| REQ-126 | free_and_reconciled | 2026-08-08 | L1 control surface as a declared Toolbox; the grant narrows the surface; binding stays construction-time — no `slug` parameter on any operation; error taxonomy promoted to the surface | YES |
| REQ-127 | free_and_reconciled | 2026-08-08 | **Withdrew** REQ-122's `{slug, text}` turn and the browser-held site identity, and **withdrew its own** "binding becomes a declared scope predicate" clause; binding is *located* in the session; `POST /api/ai/prompt` takes `{sessionId, text}`; an id the host never issued is refused; transcripts moved under the workspace | YES (supersedes REQ-122) |
| REQ-119, REQ-121, REQ-128, REQ-129, REQ-130 | free_and_reconciled | 2026-08-07…09 | Request-time render, copy-edit modal, background image picker, verbatim `get_l1`/`set_l1`, beyond-L1 authoring — other plan items of the same bundle, none addressed to the conversation host | YES (no effect here) |
| REQ-131 | ready_to_reconcile | 2026-08-11 | Draft change journal; part of it pushes "has anything changed since I last looked" into the **per-turn reminder**, which is inside this capability's priming scope | **imminent, but not landed — see below** |
| REQ-141 | ready_to_reconcile | 2026-08-15 | Workers-runtime test project (UATs inside workerd) — test infrastructure, no behavioral claim here | imminent, no effect |
| REQ-146 | draft | 2026-08-15 | AI host and publish move into workerd | NO (draft — not yet active) |

**REQ-131 has no matrix consequence this round, and this is a positive finding rather
than an omission.** Its implementation commit `ceed377a0` is *not* an ancestor of HEAD
(`git merge-base --is-ancestor` → false); this regression branch is cut from main and
the code is still on `xgd-working`. Confirmed in the source, not just the graph:
`host.ts` contains no journal or counter (`journal` × 0, `counter` × 0), and
`tools/generate/src/cli/edit.ts` likewise (`journal` × 0, `counter` × 0). The story
body therefore correctly does *not* describe it, and no UAT could cover it. It will
enter the matrix through its own reconciliation, where the split between the journal
itself (structured edit / control surface) and the reminder push (this capability)
gets decided. Recorded here so the next round does not re-derive it.

Both REQ-122 → REQ-127 supersessions are recorded verbatim in the STORY-103 body
("Intent supersession within this bundle"; "Known divergence, recorded not absorbed").
Re-checked this round: **no AC asserts retired behavior** — none claims the withdrawn
`{slug, text}` turn (AC-1053 asserts it is *refused*), none claims the withdrawn scope
predicate, and AC-1059 asserts the named refusal class rather than the per-call
path/hint REQ-126 stopped delivering. No AC is unsupported by the ledger, so no
`deprecated` or `needs_review` verdict is warranted.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-103 (story-a58a0974) | REQ-122, REQ-126, REQ-127 (via bundle-e59210c5) | aligned | Body matches cumulative intent including both recorded supersessions; correctly silent on REQ-131, which has not landed on main. **No story-body edit required.** |

## Evidence Basis — why these UATs count

The suite drives **real HTTP against a real `startBuilder`** on a real temp workspace
seeded by the real `cmdNew`: real session manager, real role assembly, real toolbox,
real `editL1Set` writes, real SSE framing, real on-disk transcripts. Exactly one
double exists — the Anthropic client, injected through `setModelClient`
(`host.ts:235`, the `client` seam the AI library is written to have injected). That is
the external network boundary, which is the one place TEST-STRATEGY.md's thin-mock
rule permits. Every consequence asserted is produced by real machinery: the draft on
disk, the transcript under the workspace, the status code, the frames on the wire.

Route and handler behaviour was read against the tests rather than assumed:

- `builder.ts:304-339` — the three routes; `/api/ai/session` is the only one naming a
  site; `/api/ai/prompt` names each missing value individually (`missing` array,
  `builder.ts:329-335`), which is what makes AC-1053's "names the omission, and not
  the value that *was* supplied" assertion discriminating rather than decorative.
- `builder.ts:177-215` — `streamTurn` writes headers lazily, so an
  `UnknownSessionError` before the first frame becomes a 404 JSON refusal
  (AC-1055) while any later failure becomes in-stream prose + one `done` (AC-1061).
- `host.ts:344-365` — `openSession` reads the transcript *before* touching the
  backend, which is exactly the property AC-1060 asserts (history survives a missing
  credential).
- `host.ts:389-390` — lookup is the in-memory `minted` map with no on-disk fallback,
  which is why AC-1055's held-over-across-restart case is a genuine third case and not
  a restatement of the derivable-id case.

Compile-sanity was checked in lieu of a run: every symbol the test imports resolves to
a real export with a compatible signature (`startBuilder`, `BuilderHandle`,
`resetAiHost`, `sessionsDir`, `setModelClient`, `createL1Toolbox` — whose third
parameter is defaulted, so the test's two-argument call is valid — and `cmdNew`), and
the file is inside vitest's `include` glob (`tests/**/*.test.ts`,
`vitest.config.mts`), so it is collected rather than silently skipped.

## AC-by-AC

| AC | Verdict | What makes it substantive |
|---|---|---|
| AC-1051 | pass | Fresh origin: `roles=['caretaker']`, `ready`, no reason, and no sessions dir — then the same three fields re-checked after a *real* turn that provably writes a transcript. Attempt 2's over-broad payload comparison is correctly narrowed. |
| AC-1052 | pass | Empty conversation is a 200 with an id and no turns; after a turn, re-opening returns the *same* id and both turns in order with attribution. |
| AC-1053 | pass | Four malformed shapes including the withdrawn `{slug, text}`; each refusal must name the omission *and not* the supplied value; then nothing reached the model, draft byte-identical, conversation still empty. |
| AC-1054 | pass | The draft on disk carries the change (real `editL1Set`), plus an activity event naming `set_l1`, the assistant's text, and exactly one terminal `done`. |
| AC-1055 | pass | Three unissued-id classes — derivable, path-traversal, held-over-across-restart — each 404 JSON and explicitly *not* an event stream; no store, no model call, both sites untouched. |
| AC-1056 | pass | Two live conversations, distinct ids, neither request naming a site; each turn moves only its own draft, and each transcript excludes the other's text. |
| AC-1057 | pass | Store path asserted to be under `cwd`; restart via `resetAiHost` replays both turns; deleting the store yields an empty conversation — which is what proves *that* is where it lived. |
| AC-1058 | pass | Offered tools compared against the toolbox's own `schemas()` (a projection, not a second list); no file/glob/grep/shell tool; no operation declares a `slug`; priming names the site and carries the generated manual's sections. |
| AC-1059 | pass | A real `NOT_FOUND` from the real write path, asserted to reach the model's *next* request (`client.seen[1].messages`), with the draft byte-identical and the turn continuing to one completion. |
| AC-1060 | pass | Real conversation, then key removed and host reset: `ready:false`, operator-readable reason naming `ANTHROPIC_API_KEY`, both turns still returned, and `/api/ai/roles` agreeing while still naming the role. |
| AC-1061 | pass | Model throws; response is a well-formed 200 event-stream carrying the failure as prose and exactly one terminal `done`. (See warning 2.) |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | ac | AC-1051 | ac-edit | The criterion says "The answer is the same whether or not any conversation has ever been opened", but the payload provably is *not* the same: `aiStatus` forwards `backends` from the AI library's global registry (`host.ts:407`) and taking a turn registers `claude+site:<slug>` into it (`host.ts:231`). Attempt 2 correctly narrowed the *assertion* to the three fields the criterion enumerates and correctly refused to weaken the criterion to match the test — but that leaves the AC's wording broader than both the test and the code. | Tighten the invariance clause to name what it means: "the role on offer, whether a turn can be run, and the reason when it cannot are the same…". Do **not** change the test; it already asserts exactly this. |
| 2 | warning | uat | AC-1061 | uat-edit | The double throws on its *first* call, so `started` is still false when `streamTurn`'s catch runs (`builder.ts:183-210`). The asserted outcome is right, but the criterion's scenario — failure *after* streaming has begun, "the point at which a refusal status is no longer available" — is reached only by shared-code-path inference, not by a frame having actually been emitted. | Script the client to emit text on call 1 and throw on call 2, so a frame is on the wire before the failure. Keep every existing assertion. |
| 3 | warning | process | capability | tooling | Five consecutive sessions on this capability have been unable to execute the suite. The session grants `Bash(pytest:*)` and `Bash(python -m pytest:*)` — a Python test runner — to a TypeScript/vitest project, so no verdict here or in attempts 1–2 rests on an observed run. | Not an editor action. Add a vitest invocation to the `check_uat_coverage` / `fix_uat_coverage` allowlists (e.g. `Bash(./node_modules/.bin/vitest:*)` or `Bash(pnpm test:*)`). Flagged for the operator, not filed as a TODO. |

## Notes for the Editor

**Nothing here requires a fix pass.** Zero violations and zero needs_review; all three
findings are warnings, which do not affect pass/fail. If a fix session runs anyway, it
should treat findings 1 and 2 as independent one-line touch-ups — finding 1 edits an
*AC body* (not a test), finding 2 edits a *test* (not an AC). Attempt 2's instinct on
AC-1051 was right and should not be reversed: when a criterion and its test disagree
about reach, the test is narrowed to the criterion's substance and the criterion is
then made to say what it actually means — the criterion is never widened to bless
whatever the code happens to emit.

**Two things worth carrying forward so attempt 4, if any, does not re-derive them.**
First, the intent tickets for this bundle are type `request`, not `requirement`; the
bundle body is a convenience copy, not the only ledger. Second, REQ-131 is the one
imminent intent that touches this capability's priming scope, and it is *not* in this
branch — the check is `git merge-base --is-ancestor ceed377a0 HEAD`, which fails.
Both facts are cheap to re-check and expensive to guess at.

**The standing risk on this capability is evidence, not coverage.** The UAT set is
unusually strong — real origin, real writes, real transcripts, one double at the
network boundary — and it has now been read carefully three times. What has never
happened is running it. Three readings do not substitute for one green run, and the
permission gap in finding 3 is the only thing preventing it.

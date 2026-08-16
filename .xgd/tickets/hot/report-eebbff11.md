---
uid: report-eebbff11
id: REPORT-2074
type: report
title: 'Fix UAT Coverage: AI Site Assistant: Per-Site Conversations — attempt 2'
created_by: xgd
created_at: '2026-08-16T05:38:34.175602+00:00'
updated_at: '2026-08-16T05:38:34.175602+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-7e4714b7
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-7ef6a9ea
---

# Fix UAT Coverage: AI Site Assistant: Per-Site Conversations

**Attempt**: 2
**Fixes applied**: 2
**Violations remaining**: 0
**Needs more work**: false

Coverage check report `report-a7a4dd10` raised one violation (finding 1, `uat-edit`,
AC-1051) and two warnings (finding 2, `uat-edit`, AC-1055; finding 3, `story`,
STORY-103 — explicitly *no edit required*). Both `uat-edit` findings are applied.
Finding 3 is carried forward untouched, as the assessor directed.

All edits are confined to `tests/reconciliation-assistant-conversation.test.ts`.
**No production code and no story or AC body was changed** — the assessor's ledger
records the story body as aligned with cumulative intent, and I found nothing to
contradict that.

> **Execution was unavailable again — the fourth consecutive session.**
> `./node_modules/.bin/vitest --version` and `./node_modules/.bin/tsc --noEmit` were
> both denied by this session's permission mode, as was `git diff`. **Nothing below
> claims a test was seen to pass.** Each edit was instead justified by reading the
> production code it drives, and every fact the new assertions depend on is cited to
> a specific `file:line` in this repo. This is stated plainly because it is the
> standing risk on this capability, not a footnote.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1051 | Narrowed the post-turn invariance comparison from the whole `/api/ai/roles` payload to the three fields the criterion names; set `uat_coverage=pass` |
| 2 | uat-edit | AC-1055 | Added the third unissued-identifier case (id held over across a restart); AC was already `pass`, strengthened in place |
| 3 | none | STORY-103 | No edit, per assessor. Set `uat_coverage=pass` — it read `fail` only to carry finding 1 upward |

### Finding 1 (violation) — AC-1051

`test_UAT_AC1051_...:232-234` compared the entire payload across a real turn
(`expect(await after.json()).toEqual(status)`). Confirmed the assessor's diagnosis
against source rather than assuming it:

- `aiStatus` returns `backends: lib.availableBackends()` — `host.ts:407`.
- `build()` writes to that registry: `lib.registerBackend(siteBackendName(slug), …)`
  — `host.ts:231`, i.e. `claude+site:studio`.
- The registry is global by design and per-site names exist *because* of it —
  `host.ts:26-29`.

So the payload very probably gains an entry across the turn. Replaced with a
comparison over `roles` / `ready` / `error`, each provably invariant here: with
`modelClient` injected, `aiStatus` never constructs a backend (`host.ts:405`) and
returns `[CARETAKER_ROLE]` with `ready: true`. Every other assertion in the case,
including the discriminating fresh-origin half, is untouched.

Per the assessor's explicit instruction, **AC-1051's criterion was not weakened** to
match the test. The invariance clause remains as written; only the assertion's reach
was corrected.

### Finding 2 (warning) — AC-1055

Appended the "held over from before a restart" case, kept **last** in the test because
it opens a conversation and the pre-existing assertions at `:358` require
`sessionsDir` not to exist.

Verified before writing it — this is the same class of assertion that failed in
attempts 1 and 2, so it was grounded in this repo's code, not inferred:

- `sessionIdFor(slug)` returns `site-${slug}` — `host.ts:127-129`. The held-over id is
  therefore the *same string* as the already-covered derivable case, reached the other
  way: genuinely issued, then orphaned by a restart.
- Lookup is the in-memory `minted` map, and the miss throws with no disk fallback:
  `const slug = minted.get(...); if (!slug) throw new UnknownSessionError(sessionId)`
  — `host.ts:389-390`. The transcript left on disk cannot resurrect the id.
- `resetAiHost()` clears both `managers` and `minted` — `host.ts:414-416` — leaving
  state equivalent to the fresh origin the neighbouring case already exercises.
- The 404 + JSON refusal mapping is already proven for this exact string by case (a)
  of the same test, so the new case adds prior state, not an unproven mapping.

`client.seen` stays at 0: `open()` posts to `session`, which does not consume the
scripted client — the same assumption AC-1053's case already rests on.

## Code Edits (if any)

None. Both fixes are test-only, as the assessor's finding 1 note anticipated
(`builder.ts` and `host.ts` are correct).

## needs_review Items Forwarded

None. No finding was categorized `needs_review`.

## Notes for the Next Pass

- **Nothing in this capability rests on an observed green run.** Four sessions —
  alignment, fix attempt 1, coverage attempt 2, and this one — have been unable to
  execute `vitest`. The regression stage that *can* execute should be treated as the
  first real confirmation of all eleven `test_UAT_AC105x/106x` cases. The two cases
  touched here are the ones to read first if that run is red.
- **The recurring failure mode is now explicitly guarded.** Both prior rounds of
  trouble came from assertions written blind against the out-of-repo
  `@lagrangefoundry/ai` library. The replacement assertion deliberately reads only
  fields this repo computes (`host.ts:400-410`) and carries an inline comment saying
  why `backends` is excluded, so a future editor does not "restore" the broader
  comparison believing it was an oversight.
- **Finding 3 remains open by design** — REQ-122/REQ-127's per-call path and hint have
  not reached the model since REQ-126. Recorded in the STORY-103 body and deliberately
  not converted into an AC, since that would demand a test of behavior the intent
  itself records as undelivered.
- **Duplicate coverage in `tests/test_UAT_FC_REQ-122_chat_host.test.ts` is unchanged**
  and still not stale; consolidation remains out of scope.

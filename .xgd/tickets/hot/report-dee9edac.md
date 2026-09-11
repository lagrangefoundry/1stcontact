---
uid: report-dee9edac
id: REPORT-3865
type: report
title: 'Fix Page Authoring Through The Control Surface: Read & Replace The Element
  Tree (story) — attempt 2'
created_by: xgd
created_at: '2026-09-11T02:05:05.010169+00:00'
updated_at: '2026-09-11T02:05:05.010169+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-fe236246
  level: story
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Page Authoring Through The Control Surface: Read & Replace The Element Tree (story)

**Attempt**: 2
**Fixes applied this call**: 3
**Violations remaining**: 0 (at level=story)
**Needs more work**: false

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-106 (`story-189fc1ac`) | Rewrote the first "Divergences and known limits" bullet. The stale claim ("Refusal specificity is degraded for this caller … a refusal names *what to do* rather than *which field*") is replaced by a restatement with lineage: it *was* a limit under REQ-129, the upstream fix has landed, and a refused `set_l1` now names the offending pointer as well as the strategy. Section header adjusted to "(the first has since been closed upstream)". Everything else in the body preserved verbatim. |
| 2 | code-issue (comment-only) | `tools/generate/src/cli/edit.ts:800-808` | Retitled the `UPSTREAM FINDING` block on `editL1Set` to `UPSTREAM FINDING, CLOSED` and added the resolution: `renderHostError` appends the host detail for any code not setting `host_detail: false`, the flag is opt-out, and our `SCHEMA_INVALID` does not opt out. No executable change. |
| 3 | uat-edit (comment-only) | `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:381-385` | Replaced the "until it lands" comment inside `test_UAT_FC_REQ_129_a_refusal_is_correctable_within_the_turn` with the closed state, and left an explicit marker that asserting the pointer is a strengthening of AC-1090 not yet made. Assertions unchanged. |

Finding 1 was the only `violation`. Findings 2–5 were `info` with resolution "none" and required no mutation; I re-read each and agree with the assessor's disposition.

## Verification — the finding was confirmed empirically, not just re-read

The report flagged its own decisive evidence as unreproducible-in-principle (it lives in `node_modules/@lagrangefoundry/ai`, whose `package.json` declares `version: 0.0.0`, and is unpinned in the lockfile). I did not take it on trust:

1. **In-repo half, re-read.** `edit.ts:215-226` — `validateOrThrow` throws `CommandError{code:'SCHEMA_INVALID', path:<pointer>, message:'<pointer>: <reason>'}`. `l1-surface.json:124-126` — `SCHEMA_INVALID` declares no `host_detail`, so it does not opt out.
2. **Upstream half, re-read in the installed copy.** `declaration.js:448,463` — `hostDetail: flag(where, declared, 'host_detail', true)`, documented as opt-out. `runtime.js:454-461` — `describeFailure` takes `detail` from `error.message`. `runtime.js:487-494` — `renderHostError` appends `` The host reports: ${detail}``. `runtime.js:549-558` — `usableDetail` is *stronger* than the report claimed: line 556 returns the bare `path` even when the message adds nothing, so the offending field survives independently of the message text.
3. **Executed.** I temporarily added `expect(answer).toMatch(/fontSizePx/)` to `test_UAT_FC_REQ_129_a_refusal_is_correctable_within_the_turn` and ran the file: **13/13 passed**, so the refusal really does now carry the offending field name. The probe was then reverted and the file re-run: **13/13 passed** again. (Both runs emit a benign wrangler `EPERM` log-write warning; it is a sandbox artifact, not a failure.)

So the rewritten bullet asserts behaviour that has been observed, not inferred — which matters, because replacing a stale false limit with a *new* false claim would have been the worse outcome.

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/cli/edit.ts` | 800-814 | Comment only, no executable change. Same evidence chain as finding 1 (items 1–3 above). The comment asserted a live upstream gap that the executed probe disproves. |
| `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts` | 377-390 | Comment only, no assertion change. Same chain. Test file re-run after the edit: 13/13 pass. |

## Deliberately Not Done This Call

**AC-1090 (`acceptance_criterion-4bd36a69`) still carries the stale "Known limit, deliberately recorded" paragraph.** The assessor routed this explicitly: *"That is an `ac-edit` cascade, for the ac-level cycle, not for this one."* I honoured that routing rather than pre-empting it, and there is a substantive reason beyond obedience: strengthening the criterion to assert the field name requires the matching `uat-edit` in the same breath, or the AC's `uat_coverage: pass` would momentarily overstate what its test proves. Splitting that pair across levels is what the ac/uat cycles are for.

**Useful input for that cycle, established here:** the strengthened form of AC-1090 would pass *today* — the probe in item 3 above is precisely the assertion the strengthened criterion needs, and it was green against current code. So the ac-level edit is a pure matrix/test change with no code work behind it.

The story body now points forward at that outstanding edit ("strengthening it to assert the field name is an outstanding matrix edit, not a missing behaviour"), so the matrix is internally consistent at this call boundary: the story records the limit as closed and names the AC as lagging, rather than the story and the AC both asserting something false.

## needs_review Items Forwarded

None. No finding in report-491a72d5 was categorized `needs_review`.

## Note on Durability

Per the assessor's own caveat, and confirmed by this session: `@lagrangefoundry/ai` is unpinned, so the behaviour the rewritten bullet now asserts rests on an installed copy that can change with no commit and no failing test in this repo. The bullet is worded to survive that (it records the fix as landed upstream rather than pinning a version), but a future cycle that finds the refusal has lost its pointer again should treat it as upstream regression, not matrix drift.

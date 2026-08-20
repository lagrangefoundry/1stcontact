---
uid: report-aa53c15a
id: REPORT-2467
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (ac) — attempt 2'
created_by: xgd
created_at: '2026-08-20T16:06:32.729002+00:00'
updated_at: '2026-08-20T16:06:32.729002+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: ac
  fixes_applied: 1
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (ac)

**Attempt**: 2
**Fixes applied this call**: 1
**Violations remaining**: 0
**Needs more work**: false

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1329 (`acceptance_criterion-ae2c7f77`) | Narrowed the fourth bullet and the Verification to the runtime axis only; dropped the store clauses. Added an explicit scoping paragraph naming AC-1325 as the owner of the store axis and AC-1321 as the reason it must not be widened. |

### Detail

The report's single violation was a narrowing, not a rewrite, and it was applied as
such.

**Criterion, fourth bullet.** Removed `or which store it was given` and the
`or store-dependent` half of the expectation clause. It now reads:

> No assertion is conditioned on which runtime it runs in: a file routed to the
> Workers runtime asserts exactly what it would assert in the filesystem runtime,
> and the split introduced no runtime-dependent expectation. Routing decides where
> a test runs, never what it claims.

**Verification.** Removed `or on which store it was handed`; the final clause now
resolves against the runtime axis (`the same one under either runtime`) rather than
dangling on a removed second axis.

**Preserved verbatim**, as the report's Notes for the Editor directed: the first
three bullets, and the whole paragraph demoting the failing-set comparison to a
one-time reconciliation measurement. That half of REPORT-2465's rewrite was correct.

**Added** a short scoping paragraph, so a later pass does not re-broaden the
criterion the way REPORT-2465 did when answering the re-verifiability warning:

> This criterion is about the routing axis only. Whether a store is observable from
> an assertion is a separate claim, carried by AC-1325 and scoped there to the body
> of editing assertions — a scoping this criterion must not widen, because the
> port's totality claim (AC-1321) includes one question only the filesystem-backed
> adapter can be asked.

## Findings Not Actioned, and Why

| Finding | Severity | Disposition |
|---|---|---|
| 2 — AC-1321 enumeration | info | Already resolved and verified by the assessor against `memory-store.ts` / `journal-model.ts`. No action. |
| 3 — AC-1354 naming sites | info | Already resolved and verified. No action. |
| 4 — AC-1354 vs AC-1324/1326/1327 exclusivity | info | Recorded by the assessor as non-duplication. No action. |
| 5 — AC-1353 / AC-1354 have no `test_UAT_AC13xx_*` | info | Explicitly a **uat-level** item ("none at this level"). Deliberately left for the uat cycle. |
| 6 — worktree predates BUNDLE-19 | info | Environmental, not drift. See verification note below. |

## Verification

No test or code was changed, so no suite was run — and none could be: this worktree's
HEAD predates BUNDLE-19's merge and contains none of the port modules (report finding 6).
The tests AC-1329 describes do not exist here.

What I did verify, rather than take on the report's word, is the code fact the
narrowing turns on — read from `origin/main`, since the worktree cannot host it:

- `tests/reconciliation-site-storage-port.test.ts:187` — `if (cwd !== null)` guards
  the two assertions at `:189–190` (`hasDraft('empty-dir')` false,
  `readSiteJson('empty-dir')` null), under the comment "Only askable of the adapter
  that has directories at all."
- `tests/support/site-factory.ts:45` — `cwd: string | null` on the shared handle,
  documented as "a test that reaches for this cannot run on both backends, and should
  say so"; `:123` filesystem backend gets a real dir, `:137` memory backend gets
  `cwd: null`.

So `cwd` is the backend discriminator by construction, and AC-1329's removed clause
did forbid precisely the assertion AC-1321 requires. The narrowing is correct and the
contradiction is gone.

Per the report's explicit instruction, I did **not** resolve this by editing AC-1321's
"a directory that exists but holds no definition" clause or by deleting the
`if (cwd !== null)` branch. The over-broad AC was the wrong element, not the sibling it
collided with.

## Parallel Edits Considered

I checked STORY-118's body for the same over-broad claim, since an ac-edit that leaves
the parent story asserting the deprecated form would leave the matrix inconsistent at
this call boundary. It does not carry it: the In-scope bullet reads "Two live stores …
with identical **observable behaviour for the same starting site**", which is AC-1325's
scoped claim, not AC-1329's unscoped one. No story-body-edit was needed.

## Code Edits (if any)

None this call.

## needs_review Items Forwarded

None. The one violation was categorized `ac-edit` with an explicit suggested edit, and
was applied.

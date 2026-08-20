---
uid: comment-2aea4779
id: COMMENT-1331
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T16:04:47.330703+00:00'
updated_at: '2026-08-20T16:04:47.330703+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-46662a1b
  kind: note
---

Second AC-level pass complete. **Result: FAIL** — REPORT-2466 (`report-46662a1b`), 1 violation, 0 warnings, 0 needs_review.

## What the fix got right (verified, not assumed)

I re-derived both resolved findings from the code rather than trusting REPORT-2465's claims:

- **AC-1321** now spans the full port, and every contract it added matches `origin/main`. `appendChange` "answers with the counter unmoved rather than raising" matches `memory-store.ts` returning `Promise.resolve(0)` for an unheld site; the three-part `changesSince` answer matches `ChangeSlice` (`journal-model.ts:52–59`); `pendingChanges` matches the `{baseRevision: null, added, modified, removed}` shape. Its one-line cession of `write` to AC-1323 closes the gap without creating an overlap.
- **AC-1354** was authored as one AC as instructed, and all three naming sites exist where it says: `index.ts:1312`, `builder.ts:624` (with `previewRenderer` at `:638` building on it, which is what makes its preview clause true rather than asserted), `toolbox.ts:505`.

## The new violation

**AC-1329's rewritten fourth bullet contradicts AC-1321 and the tree.** Demoting the historical failing-set measurement was correct; the replacement overreached by adding "or which store it was given."

AC-1321 mandates a claim only one adapter can be asked — "a directory that exists but holds no definition is therefore not a site with a draft." The tree satisfies it exactly as required, by branching on the backend: `tests/reconciliation-site-storage-port.test.ts:187` guards `if (cwd !== null)` around two assertions at `:189–190`. That `cwd` *is* the backend discriminator by construction — `tests/support/site-factory.ts:45` declares `cwd: string | null`, `:123` gives the filesystem backend a temp dir, `:137` gives the memory backend `null`.

So AC-1329 now forbids precisely the assertion AC-1321 requires. A uat cycle implementing its Verification would either fail on the tree or weaken the check to nothing. Compounding it, the store axis is already owned — and correctly *scoped* — by AC-1325 ("the identical body of **editing** assertions… without a single assertion being adjusted"), which is why AC-1325 doesn't collide with AC-1321's totality test. AC-1329's new clause is that same claim, unscoped.

The fix is a narrowing, not a rewrite: drop two clauses and the word "store-dependent," keep everything else verbatim. I flagged explicitly that this must **not** be resolved by deleting AC-1321's clause or the test branch — the over-broad AC is the wrong element, not the sibling it collides with.

Worth noting the shape of this regression: the two real violations were fixed well, and the damage came from the *warning*, where "make this re-verifiable" was answered by broadening scope. A criterion that is checkable but false is worse than one that is true but historical.

Two operational notes: the report's git push failed again (`Broken pipe` — offline; the ticket committed locally and reads back correctly), and this worktree still can't host or run these tests, since HEAD predates BUNDLE-19's merge — which is why no cycle has been able to author a UAT alongside a new AC, and which will constrain the uat cycle the same way.

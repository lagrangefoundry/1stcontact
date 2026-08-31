---
uid: comment-5fadeea3
id: COMMENT-510
type: comment
title: Comment on bundle BUNDLE-5
created_by: xgd
created_at: '2026-07-24T22:34:14.052263+00:00'
updated_at: '2026-07-24T22:34:14.052263+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bundle-d9c2e655
  kind: note
---

**BUG-863 stale-commit recovery — FLAGGED FOR MANUAL REVIEW (not auto-repaired)**

BUNDLE-5 ("REQ-51 + REQ-52 + REQ-53 + REQ-54 + REQ-55 + 2 more", REQ-51..57)
has 14 commits in `fields.commits`. 13 of them are stale (no longer ancestors
of `main` or `xgd-working`); 1 was already recovered separately via patch-id
match. Investigation (BUG-863) found unique commit-message matches for all
13 stale SHAs, and **all 13 are confirmed ancestors of `main`**:

| Original (stale) | Re-authored (current, on main) |
|---|---|
| 34f3cb52c994 | 4c5027132cb4 |
| cf0ab084be07 | d1464aae3523 |
| 3cd464e762d0 | 5afbb8ea3f03 |
| 4b0282b44e0d | 2e508dd368e0 |
| 1f625dff4fb8 | 6ebb1f235e8b |
| 46db8574c318 | 3d339ad0c837 |
| dc41e246f24a | 774f0bf974d5 |
| 1798632d8109 | 4eaf051eab27 |
| 8f27664f65c1 | 86f71aa2a634 |
| a0376a210a98 | 784ab3963a0c |
| 259c6b6c3987 | b9cbaaf6acb2 |
| ef6f6b1508f6 | ff8da934181d |
| 13b5a5123bff | 825a95c87ee6 |

A deep content investigation (independent of the SHA matching above) confirms
the REQ-51..57 capability set (object-grouped fidelity reports, exact-match
values-diff, the text-markup block-document model with tables/headings/code/
nested lists, theme subscales) is alive and still evolving in the current
tree — see `packages/framework/src/modules/text-markup.ts`,
`tools/generate/src/cli/capture/values-diff.ts`, `packages/framework/src/tokens/css.ts`,
and the `tests/req5{1,2,3,4,6,7}-*.test.ts` files. Only the hero/services-grid
component-specific slices (part of REQ-52 and REQ-56 phases 2/3) were later
deleted by an unrelated, later architectural pivot (commit `47aba343`,
"strip semantic layout modules; L1 is the layout substrate") — that is a
legitimate supersession, not lost work.

**Why this was NOT auto-repaired like the other 39 phantom tickets**: unlike
a single-owner request/bug ticket, a `bundle` ticket has dispatcher-specific
semantics I'm not fully confident are safe to mutate directly (cherry-pick
window computation, `merged_at_commit`/`orphan_commits` bookkeeping, and a
known open bug — BUG-809 — where a bundle whose cherry-pick window resolves
to zero pending commits can crash `story_loop` instead of exiting cleanly).
Since all 13 corrected SHAs are *already on main*, naively rewriting
`fields.commits` and leaving `status=ready_to_reconcile` would hand the live
dispatcher a bundle with nothing left to cherry-pick — exactly the shape
BUG-809 crashes on. Given real uncertainty about the safe mechanical action
here, this is flagged rather than guessed at.

**Recommended manual disposition** (operator decision): since all 13
commits are already on `main`, BUNDLE-5's own reconcile has nothing left to
do. Likely correct action is to abandon/archive this bundle ticket (its
content already reached main via other historical bundles/reconciles) and,
separately, correct the 7 member tickets' (REQ-51..57, currently
`status=bundled`, `bundled_in` presumably `bundle-d9c2e655`) status directly —
though those 7 are outside BUG-863's literal scope (they are not
`ready_to_reconcile`/`free_coded`).

See BUG-863 (xgendev-main) for full recovery methodology.

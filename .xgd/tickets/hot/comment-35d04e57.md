---
uid: comment-35d04e57
id: COMMENT-4035
type: comment
title: Comment on bug BUG-156
created_by: xgd
created_at: '2026-09-27T00:37:04.896919+00:00'
updated_at: '2026-09-27T00:55:00.533907+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c02e37c3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "46cba1c3-3a2d-40ef-949a-b8e60751e946",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="63bdd850-6339-4436-a954-56b3b0954413-user" -->

<!-- xgd-chat role="user" ts="2026-09-27T00:35:56.976509+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="63bdd850-6339-4436-a954-56b3b0954413-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-27T00:54:59.723708+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

The ticket body is thorough and the design is clear. One decision I'll make and record rather than block on, then I'll proceed.

Reproduced exactly: `REF-l1` on disk is 27,868 chars; rendered from the current schema it is 32,911. Now implementing.

Now the computation in `kbSkew`:

Now `kbSkewError` and `requireCoherentKb`:

Now update the BUG-48 test literal that constructs a `KbSkew` by hand:

Now the UAT suite:

Now the regression scope — the KB suites and typecheck:

Regression scope is clean (identical failure set to baseline). Now updating the ticket body so every UAT is motivated by it:

Now the version bump and commit:

Now merge back into `xgd-working` under the lock:

Version 0.2.389 was claimed by BUG-155 concurrently. Re-bumping:

Done. BUG-156 is at `free_coded` with both commits recorded.

## What changed

`kbSkew` gained a third list beside `missing` and `stale`: **`outdated`** — projections whose rendered output differs from the text the bundle holds.

- **Computed inside `kbSkew`, not beside it.** `requireCoherentKb` refuses on it and `kbEnsure` triggers on it through the one call they already share, so the build stage and the shipping step cannot come to disagree about what "behind" means. `1c assets` refuses an outdated projection too, in the same words.
- **No new rebuild mechanism.** `kbEnsure`'s existing catch runs `runKbBuild`, whose first step is `writeProjections`; a rewritten file is newer than the manifest, which is already the trigger. The existing no-credential refusal covers the new trigger unchanged.
- **Presence stays BUG-48's axis.** Only a projection the corpus actually carries is checked — a corpus that never meant to hold the projected namespace is coherent, not stale, for lacking it. That narrower rule is also what lets every existing KB suite bring its own corpus.
- The refusal opens with its own sentence (the corpus failing its source is a different subject from the index failing the corpus), and the nothing-to-do line now claims only what it checked: *"…and 3 projection(s) match their source — nothing to build."*

## Evidence

Six UATs in `tests/test_UAT_FC_BUG-156_a_projection_is_current.test.ts`, real index builds with only the two model seams and the ticketing CLI stubbed. I verified teeth by disabling the comparison: the three behavioural UATs fail with exactly the observed symptom (`'current'`, `outdated: []`).

The live defect is now caught on the real tree — before the change `1c kb ensure` printed "the index covers all 12 corpus document(s) — nothing to build":

```
A projected reference in this corpus no longer matches the declarations it is
rendered from, so this bundle would ship a document that is retrievable,
confident and wrong.

  OUTDATED projections (1) — rendered from source that has moved since the file was written:
    REF-l1
```

Nothing was written; `REF-l1.md` is untouched at its 09-24 stamp.

KB regression scope (17 files): identical failure set to the baseline — 4 files fail at collection or on named tests for pre-existing reasons (missing `src/generated/*` in a fresh worktree, a BUG-49 message-wording drift). `tools/generate` typechecks clean.

## Two things worth your attention

1. **Separate pre-existing defect, left alone.** `l1VocabularyGaps` reports 45 gaps against the *current* `l1/schema.ts` — the projection **generator** has fallen behind what REQ-329/330/331 added, independently of any file on disk. Four tests in `test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts` fail on a clean tree because of it. That's `projectL1Vocabulary` needing to render the new structural rules, not a currency question. Recorded in the ticket body under "Out of scope, found while here" — say the word if you want it folded in or filed.

2. **Version race.** 0.2.389 was claimed by BUG-155 mid-session, so there are two commits on this ticket: the fix, and a follow-up bump to 0.2.390 that carries the version claim as the tip.

<!-- xgd-chat-end -->
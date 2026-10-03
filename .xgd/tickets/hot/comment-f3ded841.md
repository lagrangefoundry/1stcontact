---
uid: comment-f3ded841
id: COMMENT-4862
type: comment
title: Comment on bug BUG-187
created_by: xgd
created_at: '2026-10-03T22:33:02.381067+00:00'
updated_at: '2026-10-03T23:03:44.291814+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-332d305f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9394bd89-c062-4bcc-ab61-c8b0adf2885b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5aee582c-0d24-48e7-a886-426b5b6cf11e-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T22:31:13.646538+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5aee582c-0d24-48e7-a886-426b5b6cf11e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T23:03:42.604004+00:00" -->
#### Claude
I'm reading the values-diff comparator to work out how each of the three items fits into it.

Still investigating: now reading how the extractor captures `zIndex` and whether there's an existing hook for comparing overlapping pairs.

I've found where the comparator pairs elements. Next I'm reading the arrangement pass, since a pairwise paint-order check would sit right beside it.

I'm reading how text runs pick their box (`ownRun ? renderedTextBox(el) : textNodeBox(n)`), which is where Item 3 lives.

Design is settled. Next I'll record the scope on the ticket, then cut the branch. First, a check of which existing tests depend on the per-element zIndex delta:

Now updating the ticket with the scope I've settled on, before touching code.

xgd was upgraded mid-session (0.17.144 → 0.17.147) and now fails trying to write back main's config — a known failure mode. I'll use the no-write-back shim from memory.

Ticket scoped and set to `free_coding`. Cutting the branch:

Baseline run of the affected existing suites first, so I know what's already red:

Baseline is green (94/94). Now the extractor: adding `paintStackOf` next to `zIndexOf`.

Now writing the code. Types first (types.ts: a `PaintLevel` type next to `ClipAncestor`, plus the field on ElementGeometry):

Now the in-page `paintStackOf` function, placed right after `establishesStackingContext`:

Now Item 3 — the `ownRun` test in the run loop:

Now plumbing through `sections.ts` (capture bundle) and the value-axes table:

Now the comparator. Adding the field to `ValueElement` and replacing the per-element zIndex compare:

Now the comparator edits. First the module-level helpers, replacing `paintRank`:

Now the pair collection and the paint-order pass itself:

Fixing a card-rebuild interaction: the arrangement pass rebuilds a card without updating `own`, so a later rebuild would drop its delta. Making both passes accumulate:

Now reporting the flat-level fallback in `unmeasuredAxes`:

Typecheck is clean. Item 2: the no-op-clip normaliser in `mask-geometry.ts`:

Schema bump to 16, with the two new axes:

Now updating the two pinned tests whose behaviour this ticket supersedes. Checking their helpers first:

Now writing the BUG-187 UAT file. Checking the barrel exports first:

9/10 pass (the `getComputedStyle(elt, pseudoElt)` noise is jsdom's, and the extractor tolerates it). Let me see what the flat fallback actually reports:

All 10 pass. Now updating the BUG-179 item 4 and REQ-48 item 2 tests to the pairwise contract:

The REQ-51 failure is about an image card's `border` param, which my change doesn't touch. Checking it against clean `xgd-working` in the main checkout:

Pre-existing on clean working — not mine. Everything else in the 188-file sweep passes. Lint/typecheck next:

Phase 1 reapplied. Now values-diff.ts, mask-geometry.ts and schema.ts:

Now the three test-file updates:

Everything reapplied. Checkpointing with a local WIP commit (to be amended into the final commit) so it can't be lost again, then re-verifying:

Restored and verified: tsc is clean and the same 104 pass. Now the evidence replay, writing to a file because vitest is swallowing console output here:

Same result as before: only the pre-existing REQ-51 failure. Now the version bump. Checking the project's convention:

Finalising the work commit. The repo's free-coding doc says no LLM attribution trailer, and project instructions take precedence over the default, so I'm leaving it off:

Now updating the ticket body to record what actually landed (appending, preserving the existing content):

Another session landed changes to `mask-geometry.ts` and `values-diff.ts` on xgd-working in the meantime. Inspecting the conflicts:

REQ-371 already has UATs for the no-op clip, so I'm removing my duplicate Item 2 tests. Checking whether REQ-371 touched the schema number too:

REQ-371's message also mentions "a backdrop's zIndex is not a dropped axis". Checking what it changed in values-diff, since it may interact with my zIndex rewrite:

REQ-371's fold change is about dropped-axis accounting, which is orthogonal to this, so no interaction. Removing my duplicate Item 2 tests and finishing the merge:

Merge is clean: 109 pass and tsc is clean. Re-running the wide sweep on the merged tree, since REQ-371 also changed fold and capture code:

Now the bump + fast-forward + move-to-free-coded loop (I still hold the merge lock):

Ticket is current. Last step: tear down the merged branch and release the lock (run bare, without any prefix, per the sandbox exclusion):

BUG-187 is done and parked at `free_coded`, but its main fix won't remove the six false HIGH deltas until the reference is re-captured. The commits are `353f04a8` (the fix) and `552f39ef` (version 0.2.461), both on `xgd-working`. The branch is cleaned up and the lock released.

**Item 1 — z-index.** Comparing raw z-index numbers pairwise wouldn't have fixed this page. Zyro's section background sits at z 13 in one stacking context and the text at 14 → 1 in another, so "13 > 1" still puts the background over text that is visibly on top of it.
- **Capture:** every element now records its full stacking chain (`paintStack`). The capture schema goes from 15 to 16.
- **Comparison:** the old per-element `z:13 vs z:0` check is gone. For every two matched elements that overlap on both sides, each side says which one paints on top. A delta is reported only when the two sides disagree, as `above "X"` / `below "Y"`.
- **Old bundles:** a capture without the chain falls back to the old single number. The report says so, under `unmeasuredAxes`.
- **Tests I changed:** this deliberately overrides BUG-179 item 4 and REQ-48 item 2, so I updated those two pinned tests. I also changed the calibration's seeded z-order defect, because `z:99` no longer reorders anything.

**Item 2 — `inset(0px)` read as a mask.** Another ticket, REQ-371, landed the same fix while I was working. I dropped my duplicate at merge so there's only one version of the rule. This ticket ships no mask change, and the ticket body says so.

**Item 3 — the "F" text node.** A text node whose element also holds a nested run is now measured by its own range. "F" comes out at its glyph size (about 11×22) on both sides instead of the whole paragraph.

**Testing:**
- 8 new UATs run the real extractor in jsdom over a Zyro-shaped reference and a flat reproduction. They produce exactly one z-index delta (the scrim under the photo) and no background-vs-text deltas.
- 188 related test files pass. The one failure, `req51-object-grouped-report`, fails the same way on clean `xgd-working`.
- Replaying the stored iteration-1 diff gives `mask` 3 → 0. The six background z-index deltas remain on that replay, because both stored manifests predate the chain. Re-capture the reference to get the "only the scrim inversion remains" result, and Item 3's fix:
  ```
  1c capture page https://www.hearingzone510.com/
  ```

**Things you should know:**
- **My mistake:** partway through, a command I ran started with `git checkout -- .`, which wiped all my uncommitted edits. I re-applied every edit, committed a checkpoint, and re-ran the full verification before merging.
- **xgd config:** xgd upgraded mid-session (0.17.144 → .147). It now fails on every command because it tries to add `ticketing.commits.lock_retry_budget_ms` to main's `.xgd/config.yaml` and the sandbox blocks that write. I worked around it for this session. The lasting fix is to add that key through `xgd quality config` or the dashboard.

<!-- xgd-chat-end -->
---
uid: comment-1484c6f5
id: COMMENT-3949
type: comment
title: Comment on bug BUG-148
created_by: xgd
created_at: '2026-09-25T23:18:54.901847+00:00'
updated_at: '2026-09-25T23:34:32.020077+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c78f4cdd
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a769d362-23ae-4268-8cbe-e148362acceb",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6ad8ec8e-eacc-416b-a418-58046275c844-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T23:17:51.543342+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6ad8ec8e-eacc-416b-a418-58046275c844-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T23:34:31.500587+00:00" -->
#### Claude
The ticket is fully specified and I have the evidence reproduced. One judgement call is delegated to me by the ticket itself (product ranking vs. an `ofNode` floor) — I've checked both against the committed `regions.json` and they agree on all 12 regions; I'll take the product, since it has no magic constant and makes the doc comment true without a special case. Proceeding.

Now the core change — the ranking rule and the band-paint filter.

Good — I'm in the worktree. Now the edits:

Now the ranking rule, the band filter, and the single definition site for `isBandPaint`:

Now point `values-diff.ts` at the shared definition:

Clean. Now update the BUG-99 UAT whose ordering assertion this ticket supersedes, and write the BUG-148 UATs.

Now update the ticket body to record what landed (including the two decisions the ticket delegated), then commit.

Now version bump and commit on the branch.

Done. BUG-148 is at `free_coded`, commit `3f78c1e` merged into `xgd-working`, branch cleaned.

**What landed** — both issues, in `tools/generate/src/cli/perceptual-core.ts`:

**Issue 1 (the lead order).** `regionNodeLeads` now ranks by `ofRegion × ofNode` descending, tie-broken by `ofRegion` then `ofNode`. I took the product over the `ofNode`-floor alternative the ticket offered: both give the identical top lead on all twelve regions of the round, and the product needs no constant to tune and no special case for sections. The score is computed from the **rounded** `overlap` pair the record carries, so the order is re-derivable from `regions.json` without re-running the diff. The doc comment now records that the old `ofNode` tie-break was *unreachable* for a run that isn't block-aligned, and why.

This supersedes BUG-99's asserted `ofRegion`-descending order — that suite's ordering assertion is the rule this ticket records as wrong, so I replaced it and annotated why. Every other claim BUG-99 pins is unchanged and passing.

**Issue 2 (the asymmetric lists).** The lead resolver skips an element that is its band's own paint, so a band reaches a region as `kind: "section"` on both sides or not at all — nothing is suppressed, the band is still there one place down. Rather than duplicate the predicate, I **moved** `isBandPaint` out of `capture/values-diff.ts` into the import-free core and exported it, with `values-diff.ts` importing it back: one definition site for the two readers that must not double-count band paint, and the core is the only module both can reach (it may not import the capture library). Behaviour is unchanged; only its parameter types are now structural.

**Evidence.** Five UATs in `tests/test_UAT_FC_BUG-148_region_lead_order.test.ts`, including one driven from the round's own two manifests and twelve region boxes — carried as a fixture, since the artifact directory is scratch and not in the repo. It asserts the ticket's own measure directly: no region leads with `ofNode ≤ 0.02` on either side (it was 9 of 12), both sides lead with the same element, and no `generic` aggregate appears as a lead. A fifth composes the ranking with `buildDigest`, because the harm was in the digest line, not in `regions.json`.

Regression scope green: the values-diff/gate/band-surface suites that depend on `isBandPaint` and the unpaired tally, the repro-console digest suites, `naming`, and the workerd `REQ-156 fidelity in workerd` suite — which mattered here, since the core gained a dependant rather than a dependency.

One thing I did not do: regenerating the round's own `regions.json` needs a browser. The fixture proves the fix over the same inputs, but the live digest won't show the new order until the next round on that page.

<!-- xgd-chat-end -->
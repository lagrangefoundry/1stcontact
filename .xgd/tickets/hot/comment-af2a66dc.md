---
uid: comment-af2a66dc
id: COMMENT-3054
type: comment
title: Comment on bug BUG-112
created_by: xgd
created_at: '2026-09-18T03:35:02.391971+00:00'
updated_at: '2026-09-18T04:01:52.511597+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-84ed4e40
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ebf651c8-ba70-49f9-b5a7-44015823626b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c1ccb838-460a-4ee2-924d-93da93d9b194-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T03:34:17.538975+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c1ccb838-460a-4ee2-924d-93da93d9b194-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T04:01:52.102532+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now the gate CLI:

Confirmed the ticket's facts against the real bundle. Cutting the branch.

Now implementing. First the L1 language axis:

Now the evaluator and the new probe:

Now the on-sample probe and the gate function:

Now gate-core — surfacing the findings in the verdict:

Now `cmdL1Gate` — pass the served document:

Now the CLI report and the AI tool surface:

Now the UATs:

All 8 pass. Now the regression scope:

Now a wider sweep for anything else that depends on the gate's verdict:

Now confirm the remaining 6 failures are pre-existing (environment, not mine) by running them against the untouched main checkout:

Green. Bumping the version and committing:

Now update the ticket body to record what was built, before committing:

Now merging back under the lock, with the version bump as the tip:

All green. Committing the bump and fast-forwarding:

BUG-112 is `free_coded` at `0.2.261`, merged into `xgd-working`, branch cleaned.

## What landed

**Probe (d) — the on-sample envelope.** `onSampleProbe(doc)` evaluates a document at the *captured* widths, unperturbed. The three envelope probes now share one `envelopeAt(doc, widths, scale)` helper; off-sample (500/900) and content-robustness (2.5×) are behaviourally unchanged.

**The gate grades three documents, not two.** `acceptanceGate` (renamed from `threeProbeGate` — four probes) takes a new `served` parameter alongside `recovered`. `cmdL1Gate` passes `served: base`, named, because that is what `1c repro` writes to disk. Whether *that* is the right document is BUG-113's question; this ticket only makes the gate grade whatever is served.

**The verdict names what collided.** `GateReport.layout` carries `LayoutCollision` findings in the same `{kind, detail}` shape a coverage finding has, so the CLI report, `check_fidelity`, and an AI round's brief all carry them with no new format. The `structural-failure` diagnosis names the pairs and widths; the next step names both ways out.

**`stacked: true`** on every node kind — the declared stacking intent, exempting any pair it takes part in. `true` is its only legal value; `false` is refused, because absent has to keep meaning "nobody has chosen."

Evidence: 8 UATs in `tests/test_UAT_FC_BUG-112_on_sample_layout_gate.test.ts`, both rails demonstrated, plus the full `node` project sweep (only the pre-existing worktree/webui failures, confirmed against the main checkout).

## Two things you should know

**1. BUG-113 is in flight and partly contradicts this ticket's acceptance.** Its ticket body (written while I was implementing) reports that the five gigabytealchemy collisions are an artefact of the evaluator's *estimated* text height — the oracle's own element boxes for those pairs do not overlap — and that BUG-113 replaces the estimate with the oracle's measurement, taking the base to zero overlaps at every captured width. I verified the estimate/oracle discrepancy independently before writing any code; it's real.

So the acceptance line "it must fail and name the five colliding pairs at 1280" is only true until BUG-113 lands. Rather than pin `5` and make this UAT a trap for its sibling, the real-bundle UAT pins the property the ticket's *title* names — nothing computed is discarded: every finding the probe reports reaches the verdict, at the width it was found at, and a non-empty list is always a structural failure. Both rails are carried by synthetic fixtures that don't depend on the estimator being wrong. BUG-113 also re-points the off-sample/content-robustness probes at a *composed* served document, which overlaps this area — whoever merges second will have a conflict to resolve in `probes.ts`/`gate-core.ts`.

**2. I superseded one REQ-88 assertion.** `test_UAT_FC_REQ-88_l1_gate_surfaces_and_recovers_pinned_residual` asserted `report.pass === true` on the grounds that recovery closes the content-robustness residual. That fixture's *served* base overruns its own body copy at 320 and 375px, unperturbed — it always did; there was no probe that looked. The UAT still pins that the residual is surfaced and that recovery closes it, and now also pins that the gate does not pass. BUG-113's body declares the same supersession independently.

One decision worth flagging: I deliberately did **not** auto-mark `stacked` in the fold from oracle evidence. On `faelan.com` the hero title overlaps the hero `image`, and because the renderer paints in document order with no z-index, the image paints *over* the title — silencing that because "the reference stacked there" would certify a page whose headline is invisible. So `faelan.com` will now go red on that pair, correctly, naming a real fold gap.

<!-- xgd-chat-end -->
---
uid: comment-561123fd
id: COMMENT-3039
type: comment
title: Comment on bug BUG-99
created_by: xgd
created_at: '2026-09-17T23:04:49.758462+00:00'
updated_at: '2026-09-17T23:27:38.273054+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a4b32c4e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e0391564-0454-47e5-a71c-6ec802b3a10a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5434713b-d715-461b-9682-77e6afb483d3-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T23:02:32.104026+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5434713b-d715-461b-9682-77e6afb483d3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T23:27:37.671734+00:00" -->
#### Claude
I've read the ticket and traced the engine. Before implementing, one finding that changes the scope materially.

Ticket scoped. Cutting the branch.

Now the core: the pure lead resolver.

Now wire it through `perceptual.ts`.

Now `fidelity.ts`: expose the manifests the value eye already computed.

Now `gate.ts` — reorder so the value eye runs first and feeds its manifests to the perceptual eye.

Now the digest — add the leads beside the geometry it already prints.

Now fix the fixture that caused the false ticket.

Now the UAT suite.

Now writing the UAT suite.

Now the round brief — say what a region record carries, so a future round reads it instead of the crop.

Works end-to-end on real stored artifacts — every region on that page resolves to a form-field placeholder, which reads as a diagnosis without opening a single PNG. Cleaning up the scratch test.

Now merging back under the lock, then bumping and claiming in one shot (the version gate races otherwise).

Done — landed on `xgd-working`, ticket at `free_coded`.

## The finding you should know about first

**BUG-99's evidence was a test fixture, not engine output.** Every byte the round quoted — `meanDiff: 12.5`, the `{id, crops}` region record, the `values-diff.json` line, `gate.json` verbatim — is written by the fake `1c gate` in `tests/test_UAT_FC_REQ-254_reproduction_console.test.ts`. The round was pointed at a sandbox backed by that stub.

The real `regions.json` has carried `bbox`, `score`, `meanDiff` and `area` per region, score-ranked, since REQ-38. I verified it against a run on disk (`repro-gigabytealchemy-ai/iteration-1`). So two of the ticket's three proposed changes already existed.

I didn't stop on that — I built the third, which is the one that mattered.

## What landed

**Region → node leads.** Each region now carries `nodes: {ref[], actual[]}` — the manifest elements and section bands whose boxes intersect its bbox, best-first, each with verbatim text, role, its own box, and two overlap fractions. Both sides, because the asymmetry is the signal: a lead on `ref` and nothing on `actual` is something we failed to draw.

Run against the real gigabytealchemy artifacts, all ten regions resolve to form-field placeholders — `"Your message"`, `"Your email"` — so the diagnosis reads off the text without opening a PNG. That is the ticket's own "turns a region from a pointer into a lead", and it's what makes DOC-19's transcribe-don't-reconstruct rule followable.

It's pure arithmetic over data `1c gate` already wrote, lives in the workerd-safe core with no new import, and is **optional** — no manifest, no `nodes`, so `1c diff` on loose PNGs is untouched. `1c gate` now runs the value eye first and hands both manifests over.

**Ranking stays `score`, not the `area` the ticket asked for.** Score ranks a large-faint region alongside a small-intense one; area alone promotes a big pale wash over a small hard mismatch. I added `rankedBy` to the report so the order is stated rather than assumed, and `area` is still carried if you want that order.

**The fixture now carries the real shape.** A fixture that carries less than its subject isn't a smaller fixture — it's a false statement about the artifact, and it cost a round. The brief also gained a table of what a region record carries and an instruction to check the instrument before diagnosing from it, citing this as the worked example.

**Surfaced where a round reads:** the console captions each triptych with its geometry and best lead, the digest prints the leads, `formatDiffReport` shows them per region.

## Verification

- 9 new UATs in `test_UAT_FC_BUG-99_region_node_leads.test.ts`, all passing; console suite extended and passing.
- Full sweep: 543/553 files pass. 11 failures — 3 are pre-existing on the main checkout (`bug32-webui-scope-rebrand`, `req51-object-grouped-report`, `BUG-67 backend settings`), and the other 8 were a fresh-worktree artifact that cleared after `./bin/1c assets`. None touch this change.
- Clean typecheck across `tools/`.

One thing worth your call: `check_fidelity` on the AI fidelity surface still returns only a region *count* to the model, not geometry or leads. Extending it would change a declared tool schema, so I left it out of scope — say the word if you want a ticket for it.

<!-- xgd-chat-end -->
---
uid: request-cd8a8c9e
id: REQ-323
type: request
title: 'repro console: the controls and the progress report at one end'
created_by: EPIC-12
created_at: '2026-09-25T21:37:20.771961+00:00'
updated_at: '2026-09-25T23:02:12.989967+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 3
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4df16ee9
---

## The problem

The control the operator presses and the report of what it did are at opposite
ends of the page. Document order today (`page.ts:730-750`):

```
address box + [recapture]        ← a control, at the TOP
status line                      ← the progress report, at the TOP
notice / captured-already / filings
Iteration 1 … Iteration N        ← newest at the bottom
⏸ [the implementation has landed] ← a control, at the BOTTOM
[recapture] [clear history]       ← controls, at the BOTTOM
```

So the loop is worked at the bottom of the page and read at the top of it. You
press [recapture] under the newest iteration, and then you have to travel to the
other end of the document to find out what is happening. Whichever end you are
looking at, the other one is off-screen. That is the defect — not the ordering of
the list, and not which end things live at.

**The invariant: the control and the progress report must be adjacent.**

## What changes

The iteration list is **not** reversed and the continuation group **keeps the
position [[BUG-120]] gave it** — after the last iteration. BUG-120's reasoning
holds and is not being revisited: position is the claim, and a control rendered
below the list reads "this acts on the list" where the same control beside the
address box reads "this starts something".

What moves is everything else the operator touches or reads, down to join it.
New document order:

```
notice / captured-already / filings   ← read-once context, stays at the top
Iteration 1 … Iteration N             ← ascending, UNCHANGED
⏸ [the implementation has landed]
[recapture] [clear history]
address box + [recapture] + its effect line
status line
```

1. The `status` line moves from above the list to the very bottom, directly
   under the control cluster. This is the fix: the line that says what is
   happening is beside the button that made it happen.
2. The address row and its `effect restart` sentence move down with it, because
   they are a control too and the ask is that the controls be at ONE end. On a
   blank console this is invisible — there are no iterations between top and
   bottom — so [[REQ-254]] requirement 2's blank page (a text box, a button, and
   nothing else) is unchanged by construction.
3. `notice` ([[BUG-114]]) and `filings` ([[REQ-276]]) stay above the list. They
   are facts about the checkout and about the whole loop, read once on arrival,
   not progress and not controls. Their existing doc comments justify that
   position and remain true.
4. `captured already` stays where it is: it only renders when no site is loaded,
   so it never competes with the list.

## A press must land the operator at the control end

This is the part that makes the move actually work, and it is not optional.

Every press redirects `303 → /` with no fragment (`console.ts:1948-1949`, and
every `seeOther('/')` call site). A bare `/` lands the browser at the TOP of the
document. Move the controls and the status line to the bottom without changing
that, and the complaint inverts rather than resolves: every press would return
the operator to a top of the page that now has nothing actionable on it.

So the redirect must carry the operator back to the cluster. Give the control
cluster an `id` and redirect to `/#<id>` from the presses that act on the chain —
`/recapture`, `/clear`, the hold release, and the AI round. A fragment is the
right mechanism because it needs no script, survives a manual reload, and leaves
the `303`-instead-of-`200` property that stops a reload re-running the round
(`console.ts:1945-1947`) exactly as it is.

Routes that are not a press on the chain — the trailing-slash redirect at
`console.ts:1793` serving artifacts — keep their current targets.

## Prose that becomes false

- `[clear history]` says the iterations "above are moved aside" (`page.ts:631`).
  Still true and now more so.
- the restart effect line says it "appends the next iteration to the chain
  below" (`page.ts:740`). Now false — with the address row at the bottom the
  chain is above it. Reword to name the position rather than the direction.

## One prior UAT is deliberately superseded

`tests/test_UAT_FC_BUG-120_continuation_affordance.test.ts:245` asserts
`indexOf('placeholder="site address"') < indexOf('<h2>Iteration 1</h2>')` — the
address row above the history. That inverts, and the amendment must say it is a
deliberate supersession rather than a fix.

What BUG-120 is actually about is untouched and every other assertion in that
file must stay green, including line 247 (`<section class="continue">` after the
history), which this ticket deliberately preserves. The address row stays
**outside** the continuation group, as BUG-120 requires — it moves to the same
end of the page, not into the group.

[[REQ-254]]'s ordering assertion (`…REQ-254…:389`, Iteration 1 before Iteration
3) is NOT affected: the list stays ascending.

## Not affected

The transcript auto-scroll (`page.ts:347-349`) keys on the per-iteration `<pre>`
element's own `scrollTop`/`scrollHeight`, not page scroll. The poller's
`disabled`/`data-inert` recomputation (`page.ts:335-338`) keys on `data-held`
attributes, not on position. Neither cares where anything is rendered.

## Testable at the end

`test_UAT_FC_REQ-323_*`:

1. After three iterations, the page still renders Iteration 1 before Iteration 2
   before Iteration 3 — the list is not reversed.
2. No control and no progress report is rendered before the list: the `status`
   paragraph, the address `<input>`, the `⏸` block and
   `<section class="continue">` all appear AFTER the last `<h2>Iteration`.
3. The `status` paragraph is adjacent to the control cluster — no iteration
   section renders between them.
4. The continuation group is still after the last iteration, and the address row
   is still outside that group (BUG-120's surviving claims).
5. A press on `/recapture`, `/clear` and the hold release each redirect to a
   location carrying the control cluster's fragment, and the cluster renders with
   that `id`.
6. With no site loaded the page is unchanged from today: a text box, a button,
   and nothing between them and the top.
7. The restart effect sentence contains no direction word the new order makes
   false.

Plus: the amended BUG-120 assertion passes in its new direction and every other
assertion in that file still passes.
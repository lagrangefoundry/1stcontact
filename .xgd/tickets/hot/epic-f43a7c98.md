---
uid: epic-f43a7c98
id: EPIC-24
type: epic
title: 'Builder sessions: what may run in parallel — scopes, a draft-edit guard, and
  concurrent delegation'
created_by: EPIC-19
created_at: '2026-10-04T00:43:37.633034+00:00'
updated_at: '2026-10-04T00:43:37.633034+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-95bc3b15
---

## Intent

Let the consultant run builder sessions **in parallel** where that's safe, and **never** where it isn't, so long turns get shorter without builders ever overwriting each other's work. The rules about what may run concurrently are explicit, enforced by the system, and visible to the consultant. They are never left to the model's judgement on the day.

## Why

Charlie's Plumbing 2 had consultant turns of 17, 28 and 10 minutes, mostly builder sessions queued end to end. The consultant told the client *"I'll start with the first services section to set the pattern, and redo the page's opening in parallel"*, and that wasn't true. (EPIC-19, 2026-10-03.)

## Where we are today, verified

- **Nothing runs in parallel.** The framework's tool loop runs a response's tool calls strictly in order: `await executor.run(...)` inside the loop over parsed calls (`lagrange-framework/components/ai/js/src/backends/api_tools.js` ~L1149). Charlie 2's builder sessions in turn `fb07ba94` finished at 23:21, 23:22, 23:26, 23:28 and 23:29, one at a time.
- **The consultant doesn't know that.** Neither the builder-session (`Delegate`) tool's description nor the priming says whether builder sessions run in sequence or in parallel, so it assumed.
- **Draft edits have no concurrency guard at all.** `set_l1` replaces a whole element subtree from a copy the caller read earlier ("read the element first… send the whole thing back — anything you leave out is gone"). No expected version is sent, so the last write silently wins. Two builders editing overlapping subtrees would lose work with no error.
- **Every address is regenerated on each write.** `set_l1`'s own contract says *"every address on the page is regenerated. Never carry an address across your own edit."* A second builder writing the same page therefore invalidates the first builder's addresses mid-session, even when their sections don't overlap.
- **`site_revision_claims` doesn't help.** It reserves *publish* revision ids (REQ-266) and isn't involved in draft edits.

So "different sections of one page" is **not** safe today, even in principle. The only units that are plausibly independent now are **different pages**, and even they share site-level state: palette, text styles, fonts, assets, navigation, header and footer.

## What this epic has to decide and build

1. **A model of scopes.** Name what a builder session is allowed to touch: one page, one section of a page, site-level style (palette, text styles, fonts), shared components (header, footer, navigation), and assets. State which pairs of scopes can run concurrently. The starting point, to be challenged: different pages may overlap with each other, while anything site-level or shared runs alone.
2. **Each builder session declares its scope, and the system enforces it.** A session is given a scope when it starts and its write tools refuse anything outside it, with a clear refusal. This is enforced by the tools, not asked for in the brief. That also makes scope a useful guard on builders even when nothing runs in parallel.
3. **A draft-edit concurrency guard.** Writes carry the version they were read at, and a stale write is refused rather than silently winning. This is worth having even without parallelism, because the client editing in the builder and a builder session can already collide.
4. **Stable addressing, or per-section isolation,** if parallel work within one page is ever to be allowed. Addresses that get regenerated across a page make same-page concurrency unsafe by construction. This needs either addresses that survive other writes, or one owner per page at a time.
5. **Concurrent execution in the framework.** Tools declared safe to overlap (the builder-session tool) run concurrently when the model requests several in one response, up to a cap on how many at once. Overlapping scopes are refused before the work starts, not discovered afterwards. This is lagrange-framework work, filed there as a child.
6. **The consultant's manual tells the truth.** Until parallel work exists, the builder-session description says sessions run one at a time. Once it exists, it says what may overlap and why. The consultant must never again promise parallel work the system can't do.
7. **Visibility.** The client and the operator can see what is running: which builder sessions, on which scope, and how long each has been going. This ties in with the cadence work (status before a build, milestones).
8. **Spend and limits.** Running in parallel moves the same cost into a shorter window. Cap how many sessions run at once with API rate limits and turn spend in mind, and record each session's cost as before.

## Order of work

The guard (3) and the scope model with enforcement (1–2) come first. They make sequential work safer immediately and are the precondition for everything else. Then concurrent execution limited to **different pages** (5). Same-page sections (4) come last, and only if the scope model says they can be made safe.

## Children

To be filed as the design settles. The immediate stop-gap, telling the consultant that builder sessions run one at a time, is a description and prompt change and needs no ticket.

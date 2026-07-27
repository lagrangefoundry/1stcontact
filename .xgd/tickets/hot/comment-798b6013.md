---
uid: comment-798b6013
id: COMMENT-529
type: comment
title: Comment on request REQ-100
created_by: xgd
created_at: '2026-07-27T19:59:10.917179+00:00'
updated_at: '2026-07-27T20:26:24.969248+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f522d726
  kind: chat_transcript
---

<!-- xgd-turn id="4c59a569-93ec-46c1-a801-1e1708a7f5aa-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T19:59:08.892861+00:00" -->
#### You
Please free-code this ticket

<!-- xgd-turn id="4c59a569-93ec-46c1-a801-1e1708a7f5aa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-27T20:07:04.745478+00:00" -->
#### Claude
I'll start by reading the ticket and understanding the current state.

The ticket carries an explicit hold: *don't implement until xgd.dev §2–5 are authored to L1-exhaustion*. Let me check whether that precondition is met before touching code.

There's already an `l1TransitionSchema`. Let me read the schema and renderer carefully.

REQ-99 (the companion interaction-state ticket) has landed — the easing/duration vocabulary already exists. Let me read the relevant code and the xgd.dev site state.

The precondition is not met — `home.json` has only `nav` + `hero`; §2–5 don't exist. Let me gather the design context before deciding how to proceed.

Confirmed: `home.json` has only `nav` + `hero`. The ticket's hold — *"Do not implement until xgd.dev sections 2–5 are authored to L1-exhaustion"* — is unmet, and its acceptance criterion requires naming the section that demanded each axis. So the authoring comes first. Let me read the existing hero to learn the design language.

Now I understand the design language. Let me check the tooling and test setup before authoring.

Let me study the REQ-99 implementation and test — this ticket must share its vocabulary.

Now let me understand the render document entry point and how client JS reaches the page.

I have the full picture. Now let me read the node-kind schemas so I author §2–5 correctly.

Now I'll author §2–5. Let me check how `grid` renders first, since responsive column counts matter.

Now I'll author §2–5 of xgd.dev. This is site config (exempt from free-coding ceremony) and is the evidence-gathering step the ticket mandates.

Rendered. Now let me screenshot it at three widths to judge the result.Both viewports hold. The authoring face works — and now the gap is precise and demonstrable. Let me record the evidence, then read the renderer internals.

Now I have a precise design. Let me check whether the validator needs to know about new axes.

Now I'll implement. Starting with the schema — the typed reveal axis, sharing REQ-99's easing vocabulary.

Now add `reveal` to every node kind and `staggerMs` to containers.

Now `staggerMs` on the container interface:

Now the type exports and validator bounds:

Good — `export *` covers it. Now the validator envelope bounds:

<!-- xgd-turn id="9250f37b-3ccb-4c23-b764-d89a9802347f-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T20:12:52.749771+00:00" -->
#### You
Please free code this

<!-- xgd-turn id="9250f37b-3ccb-4c23-b764-d89a9802347f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-27T20:26:24.934361+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me survey the current state of the work.

All 7 REQ-100 UATs pass. Now the regression scope — the L1 substrate and REQ-99 (whose transition emission this refactored).

Full suite green (120 files, 844 tests). Now a typecheck — green vitest doesn't imply type-clean across packages.

The worked example is wired up (40 reveals, 10 staggers). Let me verify it renders and validates end-to-end.

The CSS strings are pinned by tests, but the load-bearing claim — *fails visible*, and reduced-motion — is a runtime property. Let me verify it in a real browser.

Scenarios 2 and 3 — the two safety properties — pass. Scenario 1 needs diagnosis; let me get per-node detail rather than guess.

All 12 unsettled nodes have `h=0` — they're the visibility-paired duplicate subtrees (the mobile variants, `display:none` at 1440px). My probe counted hidden nodes as revealing. Let me confirm that reading and test the mirror case at mobile width.

All four scenarios pass — the earlier failure was my probe counting `display:none` nodes, not a defect. Let me tidy up and check what belongs in the commit.

The 8th test pins a `bottom < 0` clause. Let me check the current script — my earlier diff read predates these edits.

The script now has a `bottom<0` clause — closing exactly the jump-scroll gap my diagnostic surfaced. Let me re-render and verify that path specifically.

The jump case genuinely fails — 16 nodes stay invisible. The `bottom<0` clause can't fire: a node that goes from "below the viewport" to "above" it never changes intersection ratio, so the observer delivers **no entry at all**. The UAT passes only because it hand-fires a synthetic entry the browser never actually sends.

Let me confirm that diagnosis before fixing.

Confirmed — during the jump only 7 entries arrive and **zero** have a negative bottom. The clause is dead code in a real browser.

The fix: expand the observer root upward so any node that has risen above the viewport counts as intersecting. Let me read the current script region.

Now the constant, placed with the other reveal constants:

Now the UAT that vouched for the dead clause needs to test the real contract instead.

Now the real test — re-render and re-run the browser verification, including the jump case that exposed the bug.

All five pass — and critically, below-fold nodes still hold their pre-state (23/23), so the wider root didn't collapse the reveal into "everything visible". Now the full regression.

All green. Cleaning up the throwaway investigation script, then version bump and commit.

A concurrent edit had already bumped to 0.0.212 (along with the 8th test and the `bottom<0` clause); mine takes it to 0.0.213. Let me stage precisely — excluding `CLAUDE.md`, which belongs to REQ-96 and isn't my change.

Something changed underneath me. Let me check the log.

A concurrent session committed REQ-100 while I was verifying. Let me see exactly what landed and whether my fix is in it.

My `rootMargin` fix rode into that commit (line 491). Let me verify the corrected test also landed, and check the leftovers.

The corrected test landed; the PNGs are unreferenced operator source material, not REQ-100's. Let me unstage those, revert my redundant second version bump (the commit already carries 0.0.212), and restore the verify script that the commit swept in.

Clean. The REQ-100 work is entirely in `3cc01cede` at 0.0.212. Let me confirm the state and check what the concurrent session already wrote to the ticket.

Ticket is already at `free_coded` with the commit recorded. Let me check whether the body describes the superseded `bottom<0` approach or the `rootMargin` fix that actually shipped.

The body already documents the fix and the finding. Let me read it in full to verify accuracy before I sign off.

The body is accurate — and it references `bin/verify_req100_reveal.mjs`, confirming restoring it was right. One last check that the committed script is my final version with the jump scenario.

Done. REQ-100 is committed and at `free_coded`.

## What shipped

`3cc01cede` — `feat(l1): typed scroll-reveal and stagger axes [FREE-CODED]`, version 0.0.212.

L1 gained two typed axes — `reveal` (`yPx`, `fromOpacity`, `durationMs`, `delayMs`, `easing`) on any node, and `staggerMs` on containers — compiling to a gated pre-state rule plus one renderer-owned IntersectionObserver. Easing reuses REQ-99's `l1EasingSchema` rather than minting a second vocabulary. The worked example is xgd.dev §2–§5, which is what the ticket's hold required before implementing.

## The substantive finding this session

The prior state had a defect that the unit tests actively concealed. The script settled already-passed nodes via a `boundingClientRect.bottom < 0` check inside the observer callback, and a UAT vouched for it by hand-firing a synthetic entry with `bottom: -120`.

A real browser never sends that entry. I instrumented the observer on the actual page: jumping to the foot delivered **7 entries, none with a negative bottom, 16 bands left dark** — laid out, occupying space, invisible. A node going from below the viewport to above it in one jump holds an intersection ratio of 0 throughout, so no entry is generated and no callback clause can run.

Fixed by widening the observer root upward (`rootMargin: '200000px 0px -8% 0px'`) so those nodes become genuine intersections — declarative, no scroll listener. The UAT now pins the root's *geometry* rather than a callback branch, because that's the part a stub can honestly verify.

Verification: 5 browser scenarios pass (desktop scroll-through, mobile paired-subtree, jump-to-foot, JS disabled, `prefers-reduced-motion`), with below-fold nodes still correctly holding pre-state at 23/23 — confirming the wider root didn't collapse the reveal into "always visible". Full suite 120 files / 845 tests green; typecheck clean across all five packages.

## Two things I left alone — your call

- **`CLAUDE.md` is modified but uncommitted.** It's a REQ-96 doc edit (DOC-25 §10, control-node composition) from an earlier session, not mine. Documentation is exempt from ceremony so it can be committed directly, but I didn't want to claim a change I can't vouch for.
- **`storage/sites/xgd/import/` is untracked** — six Gemini-generated PNGs, unreferenced by `home.json` or `site.json`. I left them out rather than adding several MB of unused binaries to a tracked tree.

One note on process: a concurrent session was committing this ticket while I was verifying. My `rootMargin` fix and corrected UAT landed in its commit, so the result is correct and single-commit — but that was luck, not coordination. Worth knowing if two sessions were open on REQ-100.

<!-- xgd-chat-end -->